import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { flushKVWrites, resetKVCache } from '@/hooks/useKV';
import type { UserRole } from '@/lib/types';

export interface AuthProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  departments: string[];
  status: 'active' | 'inactive';
  team_lead: boolean;
  custom_permissions: unknown | null;
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  organization: AuthOrganization | null;
  /** Ruolo dell'utente NELL'organizzazione corrente, letto da organization_members. */
  orgRole: UserRole | 'owner' | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Invia il link di reimpostazione all'indirizzo indicato. */
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  /** Imposta una nuova password per la sessione di recupero in corso. */
  setPassword: (password: string) => Promise<{ error: string | null }>;
  /** Vero mentre e' in corso un recupero password aperto dal link email. */
  recovering: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [organization, setOrganization] = useState<AuthOrganization | null>(null);
  const [orgRole, setOrgRole] = useState<UserRole | 'owner' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /**
   * Supabase apre il link di recupero come una sessione normale ed emette
   * l'evento PASSWORD_RECOVERY. Senza intercettarlo, l'utente entrerebbe
   * nell'applicazione senza che gli venga mai chiesta la nuova password —
   * cioe' il link diventerebbe un accesso permanente via email.
   */
  const [recovering, setRecovering] = useState(false);

  const user = session?.user ?? null;

  /**
   * Bootstrap in corso, per utente. Al mount sia refresh() sia l'evento
   * INITIAL_SESSION di onAuthStateChange vogliono inizializzare: senza questo
   * guard partirebbero due creazioni di organizzazione in parallelo e la
   * seconda fallirebbe sullo slug duplicato.
   */
  const inFlight = useRef<Map<string, Promise<void>>>(new Map());

  /**
   * Assicura che l'utente autenticato abbia un profilo e appartenga a
   * un'organizzazione. Al primo accesso ne crea una e vi si iscrive come owner
   * (la policy "org owner can bootstrap members" della 0002 lo consente).
   */
  const bootstrap = useCallback((currentUser: User) => {
    const existing = inFlight.current.get(currentUser.id);
    if (existing) return existing;

    const run = runBootstrap(currentUser).finally(() => {
      inFlight.current.delete(currentUser.id);
    });
    inFlight.current.set(currentUser.id, run);
    return run;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Risolve profilo, organizzazione e ruolo dell'utente autenticato.
   *
   * Qui, prima, un utente senza membership si vedeva CREARE al volo
   * un'organizzazione di cui diventava owner. Unito al fatto che la
   * registrazione pubblica non era stata disattivata su Supabase, chiunque
   * conoscesse la chiave anon (che sta nel bundle, quindi chiunque) poteva
   * registrarsi e ottenere il proprio spazio di lavoro sul progetto altrui.
   *
   * Gli account li crea l'amministratore (POST /api/tenants/<id>/members), che
   * inserisce sia il profilo sia la membership. Chi arriva qui senza
   * membership non e' stato censito: non gli si costruisce nulla, resta senza
   * organizzazione e l'interfaccia glielo dice.
   *
   * ATTENZIONE: questo chiude il percorso applicativo, non l'endpoint. Il
   * blocco della registrazione va fatto ANCHE su Supabase
   * (Authentication -> Sign In / Providers -> "Allow new users to sign up"),
   * altrimenti resta possibile creare account chiamando /auth/v1/signup
   * direttamente — semplicemente non serviranno piu' a nulla.
   */
  const runBootstrap = async (currentUser: User) => {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    setProfile((existingProfile as AuthProfile | null) ?? null);

    const { data: membership } = await supabase
      .from('organization_members')
      .select('role, organization_id, organizations(id, name, slug, owner_id)')
      .eq('user_id', currentUser.id)
      .limit(1)
      .maybeSingle();

    if (membership?.organizations) {
      setOrganization(membership.organizations as unknown as AuthOrganization);
      setOrgRole(membership.role as UserRole | 'owner');
      return;
    }

    setOrganization(null);
    setOrgRole(null);
  };

  const refresh = useCallback(async () => {
    const {
      data: { session: current },
    } = await supabase.auth.getSession();
    setSession(current);

    if (!current?.user) {
      setProfile(null);
      setOrganization(null);
      setOrgRole(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      await bootstrap(current.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore di inizializzazione');
    } finally {
      setLoading(false);
    }
  }, [bootstrap]);

  useEffect(() => {
    void refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (_event === 'PASSWORD_RECOVERY') setRecovering(true);
      setSession(nextSession);
      if (!nextSession?.user) {
        setProfile(null);
        setOrganization(null);
        setOrgRole(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      bootstrap(nextSession.user)
        .catch((e) =>
          setError(e instanceof Error ? e.message : 'Errore di inizializzazione')
        )
        .finally(() => setLoading(false));
    });

    return () => subscription.unsubscribe();
  }, [refresh, bootstrap]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: signInError?.message ?? null };
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: window.location.origin }
    );
    return { error: resetError?.message ?? null };
  }, []);

  const setPassword = useCallback(async (password: string) => {
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (!updateError) setRecovering(false);
    return { error: updateError?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    // Le modifiche ancora nel debounce di useKV andrebbero perse uscendo.
    await flushKVWrites();
    await supabase.auth.signOut();
    // Lo store di useKV e' gia' indicizzato per organizzazione, quindi l'utente
    // entrante non puo' leggere i dati di quello uscente; lo svuotiamo comunque
    // per non tenere in memoria dati di una sessione conclusa.
    resetKVCache();
    setProfile(null);
    setOrganization(null);
    setOrgRole(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        organization,
        orgRole,
        loading,
        error,
        signIn,
        requestPasswordReset,
        setPassword,
        recovering,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  return ctx;
}
