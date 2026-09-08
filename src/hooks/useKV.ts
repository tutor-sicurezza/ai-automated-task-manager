import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Rimpiazzo drop-in di `useKV` di @github/spark, con persistenza su Supabase.
 *
 * Stessa firma dell'originale:
 *   const [value, setValue, deleteValue] = useKV<T>(key, initialValue)
 *
 * Instradamento:
 *   - chiavi per-utente  -> public.user_state (RLS: solo il proprietario)
 *   - tutto il resto     -> public.app_state  (RLS: membri dell'organizzazione)
 */

/** Chiavi il cui valore appartiene al singolo utente, non all'organizzazione. */
const PER_USER_KEYS = new Set([
  'has-completed-welcome',
  'has-seen-launch-announcement',
]);

const PER_USER_PREFIXES = ['notification-preferences-'];

function isPerUserKey(key: string) {
  return (
    PER_USER_KEYS.has(key) || PER_USER_PREFIXES.some((p) => key.startsWith(p))
  );
}

/**
 * Lo store di modulo e' indicizzato per SCOPE + chiave, non per sola chiave.
 *
 * Indicizzarlo per sola chiave causava una fuga di dati fra organizzazioni:
 * dopo un logout la cache sopravviveva, e al login successivo `loaded` faceva
 * saltare la rilettura. L'utente entrante vedeva i dati di quello uscente e,
 * alla prima modifica, li riscriveva nella PROPRIA riga di app_state,
 * distruggendo i suoi. Con lo scope nella chiave la collisione non e' piu'
 * rappresentabile, indipendentemente da chi si ricordi di svuotare la cache.
 */
function scopedKey(scopeId: string, key: string) {
  return `${scopeId}:${key}`;
}

type Listener = (value: unknown) => void;

const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener>>();
/** Chiavi gia' caricate dal server, per non rifare la fetch a ogni mount. */
const loaded = new Set<string>();
/** Scritture in sospeso (debounce non ancora scaduto), per poterle forzare. */
const pendingWrites = new Map<string, () => Promise<void>>();

function subscribe(cacheKey: string, fn: Listener) {
  if (!listeners.has(cacheKey)) listeners.set(cacheKey, new Set());
  listeners.get(cacheKey)!.add(fn);
  return () => {
    listeners.get(cacheKey)?.delete(fn);
  };
}

function broadcast(cacheKey: string, value: unknown) {
  cache.set(cacheKey, value);
  listeners.get(cacheKey)?.forEach((fn) => fn(value));
}

/** Forza subito tutte le scritture ancora in attesa del debounce. */
export async function flushKVWrites() {
  const writes = Array.from(pendingWrites.values());
  pendingWrites.clear();
  await Promise.all(writes.map((w) => w()));
}

/** Svuota lo store: chiamata al logout da AuthContext. */
export function resetKVCache() {
  cache.clear();
  loaded.clear();
  pendingWrites.clear();
  listeners.forEach((set) => set.forEach((fn) => fn(undefined)));
}

// Una modifica fatta e subito seguita dalla chiusura della scheda andrebbe
// persa: il debounce di 400ms non fa in tempo a scadere. `pagehide` copre
// chiusura, reload e navigazione; `visibilitychange` copre il passaggio in
// background su mobile, dove `pagehide` non sempre arriva.
if (typeof window !== 'undefined') {
  const flushOnLeave = () => {
    void flushKVWrites();
  };
  window.addEventListener('pagehide', flushOnLeave);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushOnLeave();
  });
}

export function useKV<T = string>(
  key: string,
  initialValue?: T
): readonly [T | undefined, (newValue: T | ((oldValue?: T) => T)) => void, () => void] {
  const { user, organization } = useAuth();
  const perUser = isPerUserKey(key);
  const scopeId = perUser ? user?.id : organization?.id;
  const cacheKey = scopeId ? scopedKey(scopeId, key) : null;

  // `initialValue` e' spesso un letterale (`[]`, `{}`) ricreato a ogni render.
  // Tenuto in un ref, altrimenti finirebbe nelle dipendenze dell'effetto di
  // caricamento e ogni render annullerebbe e rilancerebbe la fetch.
  const initialRef = useRef(initialValue);

  const [value, setValue] = useState<T | undefined>(() =>
    cacheKey && cache.has(cacheKey) ? (cache.get(cacheKey) as T) : initialValue
  );

  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<T | undefined>(value);
  latest.current = value;

  // Sincronizzazione fra componenti che condividono la stessa chiave
  useEffect(() => {
    if (!cacheKey) return;
    return subscribe(cacheKey, (v) => setValue(v as T | undefined));
  }, [cacheKey]);

  // Caricamento iniziale dal database
  useEffect(() => {
    if (!scopeId || !cacheKey || loaded.has(cacheKey)) return;
    let cancelled = false;

    (async () => {
      const query = perUser
        ? supabase
            .from('user_state')
            .select('value')
            .eq('user_id', scopeId)
            .eq('key', key)
            .maybeSingle()
        : supabase
            .from('app_state')
            .select('value')
            .eq('organization_id', scopeId)
            .eq('key', key)
            .maybeSingle();

      const { data, error } = await query;
      if (cancelled) return;

      if (error) {
        console.error(`[useKV] lettura fallita per "${key}":`, error.message);
        return;
      }

      loaded.add(cacheKey);

      // Se nel frattempo l'utente ha gia' modificato qualcosa, il valore letto
      // dal server e' vecchio: sovrascriverlo cancellerebbe una modifica non
      // ancora salvata.
      if (pendingWrites.has(cacheKey)) return;

      if (data && data.value !== null && data.value !== undefined) {
        broadcast(cacheKey, data.value as T);
      } else if (initialRef.current !== undefined && !cache.has(cacheKey)) {
        // Nessun valore salvato: teniamo il default in memoria senza scrivere,
        // cosi' non creiamo righe inutili finche' l'utente non modifica nulla.
        broadcast(cacheKey, initialRef.current);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [key, cacheKey, scopeId, perUser]);

  const persist = useCallback(
    (next: T) => {
      if (!scopeId || !cacheKey) return;

      const write = async () => {
        pendingWrites.delete(cacheKey);
        const now = new Date().toISOString();

        const { error } = perUser
          ? await supabase.from('user_state').upsert(
              { user_id: scopeId, key, value: next, updated_at: now },
              { onConflict: 'user_id,key' }
            )
          : await supabase.from('app_state').upsert(
              {
                organization_id: scopeId,
                key,
                value: next,
                updated_at: now,
                updated_by: user?.id ?? null,
              },
              { onConflict: 'organization_id,key' }
            );

        if (error) {
          console.error(`[useKV] scrittura fallita per "${key}":`, error.message);
        }
      };

      if (writeTimer.current) clearTimeout(writeTimer.current);
      pendingWrites.set(cacheKey, write);
      writeTimer.current = setTimeout(() => {
        writeTimer.current = null;
        void write();
      }, 400);
    },
    [key, cacheKey, scopeId, perUser, user?.id]
  );

  const update = useCallback(
    (newValue: T | ((oldValue?: T) => T)) => {
      // L'updater funzionale DEVE partire dallo store di modulo, non da
      // `latest.current`: quest'ultimo si aggiorna solo al render successivo,
      // quindi due update consecutivi nello stesso handler leggerebbero
      // entrambi il valore precedente e il secondo annullerebbe il primo.
      // Succedeva davvero: completando un task, addActivity() sovrascriveva
      // il cambio di stato appena applicato e il task restava "not-started".
      const base =
        cacheKey && cache.has(cacheKey) ? (cache.get(cacheKey) as T) : latest.current;

      const resolved =
        typeof newValue === 'function'
          ? (newValue as (oldValue?: T) => T)(base)
          : newValue;

      if (cacheKey) broadcast(cacheKey, resolved);
      persist(resolved);
    },
    [cacheKey, persist]
  );

  const remove = useCallback(() => {
    if (!scopeId || !cacheKey) return;
    broadcast(cacheKey, undefined);
    loaded.delete(cacheKey);
    pendingWrites.delete(cacheKey);

    void (perUser
      ? supabase.from('user_state').delete().eq('user_id', scopeId).eq('key', key)
      : supabase
          .from('app_state')
          .delete()
          .eq('organization_id', scopeId)
          .eq('key', key));
  }, [key, cacheKey, scopeId, perUser]);

  // Smontando il componente il debounce verrebbe semplicemente annullato e la
  // modifica persa (cambiare tab entro 400ms bastava). Qui lo si forza invece.
  useEffect(
    () => () => {
      if (writeTimer.current) {
        clearTimeout(writeTimer.current);
        writeTimer.current = null;
        void flushKVWrites();
      }
    },
    []
  );

  return [value, update, remove] as const;
}
