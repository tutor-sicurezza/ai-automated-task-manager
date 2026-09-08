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
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'org'
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [organization, setOrganization] = useState<AuthOrganization | null>(null);
  const [orgRole, setOrgRole] = useState<UserRole | 'owner' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const runBootstrap = async (currentUser: User) => {
    const displayName =
      (currentUser.user_metadata?.full_name as string | undefined) ||
      currentUser.email?.split('@')[0] ||
      'Utente';

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    let resolvedProfile = existingProfile;

    if (!resolvedProfile) {
      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: currentUser.id,
          email: currentUser.email,
          full_name: displayName,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            currentUser.id
          )}`,
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);
      resolvedProfile = inserted;
    }

    setProfile(resolvedProfile as AuthProfile);

    // Organizzazione: prima quella di cui e' gia' membro
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

    // Puo' esistere gia' un'organizzazione di cui e' proprietario ma senza
    // riga di membership (bootstrap interrotto a meta'): riusiamola.
    const { data: ownedOrg } = await supabase
      .from('organizations')
      .select('id, name, slug, owner_id')
      .eq('owner_id', currentUser.id)
      .limit(1)
      .maybeSingle();

    let newOrg = ownedOrg;

    if (!newOrg) {
      const orgName = `${displayName} Workspace`;
      const { data: created, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: `${slugify(orgName)}-${currentUser.id.slice(0, 8)}`,
          owner_id: currentUser.id,
        })
        .select()
        .single();

      if (orgError) {
        // 23505 = slug duplicato: un altro bootstrap concorrente ha gia' creato
        // l'organizzazione. Non e' un errore, rileggiamo la sua.
        const { data: raced } = await supabase
          .from('organizations')
          .select('id, name, slug, owner_id')
          .eq('owner_id', currentUser.id)
          .limit(1)
          .maybeSingle();

        if (!raced) throw new Error(orgError.message);
        newOrg = raced;
      } else {
        newOrg = created;
      }
    }

    if (!newOrg) throw new Error('Impossibile creare o recuperare l\'organizzazione');

    // upsert invece di insert: se un bootstrap concorrente ha gia' creato la
    // membership, il vincolo unique (organization_id, user_id) non deve
    // trasformarsi in un errore visibile all'utente.
    const { error: memberError } = await supabase
      .from('organization_members')
      .upsert(
        {
          organization_id: newOrg.id,
          user_id: currentUser.id,
          role: 'owner',
        },
        { onConflict: 'organization_id,user_id', ignoreDuplicates: true }
      );

    if (memberError) throw new Error(memberError.message);

    setOrganization(newOrg as AuthOrganization);
    setOrgRole('owner');
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

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      return {
        error: signUpError?.message ?? null,
        // Se il progetto richiede conferma email, session e' null
        needsConfirmation: !signUpError && !data.session,
      };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
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
        signUp,
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
