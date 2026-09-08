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
 *
 * Store condiviso a livello di modulo: due componenti che usano la stessa
 * chiave (es. 'departments' in DepartmentManagement e DepartmentColorLegend)
 * restano sincronizzati, come accadeva col KV di Spark.
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

type Listener = (value: unknown) => void;

const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener>>();
/** Chiavi gia' caricate dal server, per non rifare la fetch a ogni mount. */
const loaded = new Set<string>();

function subscribe(key: string, fn: Listener) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(fn);
  return () => {
    listeners.get(key)?.delete(fn);
  };
}

function broadcast(key: string, value: unknown) {
  cache.set(key, value);
  listeners.get(key)?.forEach((fn) => fn(value));
}

/** Svuota lo store: da chiamare al logout o al cambio di organizzazione. */
export function resetKVCache() {
  cache.clear();
  loaded.clear();
  listeners.forEach((set, key) => set.forEach((fn) => fn(cache.get(key))));
}

export function useKV<T = string>(
  key: string,
  initialValue?: T
): readonly [T | undefined, (newValue: T | ((oldValue?: T) => T)) => void, () => void] {
  const { user, organization } = useAuth();
  const perUser = isPerUserKey(key);
  const scopeId = perUser ? user?.id : organization?.id;

  const [value, setValue] = useState<T | undefined>(
    () => (cache.has(key) ? (cache.get(key) as T) : initialValue)
  );

  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<T | undefined>(value);
  latest.current = value;

  // Sincronizzazione fra componenti che condividono la stessa chiave
  useEffect(() => subscribe(key, (v) => setValue(v as T | undefined)), [key]);

  // Caricamento iniziale dal database
  useEffect(() => {
    if (!scopeId || loaded.has(key)) return;
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

      loaded.add(key);
      if (data && data.value !== null && data.value !== undefined) {
        broadcast(key, data.value as T);
      } else if (initialValue !== undefined && !cache.has(key)) {
        // Nessun valore salvato: teniamo il default in memoria senza scrivere,
        // cosi' non creiamo righe inutili finche' l'utente non modifica nulla.
        broadcast(key, initialValue);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [key, scopeId, perUser, initialValue]);

  const persist = useCallback(
    (next: T) => {
      if (!scopeId) return;

      if (writeTimer.current) clearTimeout(writeTimer.current);
      writeTimer.current = setTimeout(async () => {
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
      }, 400);
    },
    [key, scopeId, perUser, user?.id]
  );

  const update = useCallback(
    (newValue: T | ((oldValue?: T) => T)) => {
      const resolved =
        typeof newValue === 'function'
          ? (newValue as (oldValue?: T) => T)(latest.current)
          : newValue;

      broadcast(key, resolved);
      persist(resolved);
    },
    [key, persist]
  );

  const remove = useCallback(() => {
    if (!scopeId) return;
    broadcast(key, undefined);
    loaded.delete(key);

    void (perUser
      ? supabase.from('user_state').delete().eq('user_id', scopeId).eq('key', key)
      : supabase
          .from('app_state')
          .delete()
          .eq('organization_id', scopeId)
          .eq('key', key));
  }, [key, scopeId, perUser]);

  useEffect(
    () => () => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
    },
    []
  );

  return [value, update, remove] as const;
}
