import type { DeroghePermessi, Employee, UserRole } from '@/lib/types';

/**
 * Chi sta guardando, e con quali permessi.
 *
 * Sta qui e non dentro App.tsx perche' e' la decisione che regge l'intera
 * interfaccia: da cosa restituisce questa funzione dipendono i comandi che
 * compaiono a schermo. Finche' viveva in un `useMemo` dentro un componente da
 * tremila righe non era verificabile, e proprio quella riga era stata la falla:
 * i permessi personalizzati venivano presi dall'array `employees` dello stato
 * applicativo, che ogni membro puo' riscrivere per intero con il proprio token.
 * Un dipendente si concedeva `tasks.edit_any` da solo e l'interfaccia gli
 * credeva.
 *
 * Ora la fonte e' `profiles.custom_permissions`, che il trigger della
 * migrazione 0018 rende non modificabile dal proprio profilo e che scrive solo
 * la rotta dei membri, da amministratore.
 */

/** Il database ha un ruolo 'owner' in piu' rispetto al tipo UserRole della UI. */
export function ruoloInterfaccia(orgRole: string | null | undefined): UserRole {
  switch (orgRole) {
    case 'owner':
    case 'admin':
      return 'admin';
    case 'manager':
      return 'manager';
    case 'viewer':
      return 'viewer';
    default:
      return 'member';
  }
}

/**
 * Le deroghe ai permessi, cosi' come stanno sul database.
 *
 * Il valore e' jsonb e potrebbe contenere qualunque cosa: si accetta solo un
 * oggetto, tutto il resto vale come "nessuna deroga". La forma fine la
 * garantisce la rotta che scrive (api/_lib/permessiPersonalizzati.ts).
 */
export function derogheDalProfilo(valore: unknown): DeroghePermessi | undefined {
  if (!valore || typeof valore !== 'object' || Array.isArray(valore)) return undefined;
  return Object.keys(valore).length > 0 ? (valore as DeroghePermessi) : undefined;
}

/** Il profilo letto all'accesso, nei soli campi che servono qui. */
export interface ProfiloPerDipendente {
  job_title?: string | null;
  email?: string | null;
  departments?: string[] | null;
  status?: 'active' | 'inactive' | null;
  team_lead?: boolean | null;
  custom_permissions?: unknown;
}

export interface IngressoDipendenteCorrente {
  userId: string;
  /** Nome e immagine gia' risolti dal chiamante (profilo, oppure email). */
  nome: string;
  avatar: string;
  emailAccesso?: string;
  profilo: ProfiloPerDipendente | null | undefined;
  /** Il ruolo NELL'organizzazione corrente, letto da organization_members. */
  orgRole: string | null | undefined;
  /** L'anagrafica applicativa: comoda, ma non e' una fonte di autorizzazione. */
  employees: Employee[] | null | undefined;
  /** Data di creazione dell'account, per la voce "membro dal". */
  creatoIl?: string | null;
}

export function dipendenteCorrente({
  userId,
  nome,
  avatar,
  emailAccesso,
  profilo,
  orgRole,
  employees,
  creatoIl,
}: IngressoDipendenteCorrente): Employee {
  /*
    Le deroghe vengono SEMPRE dal profilo, mai dalla copia in `employees`.

    E' una sostituzione e non una fusione: se il profilo non ne ha, chi guarda
    non ne ha, anche quando l'array ne porta. L'array arriva da una chiave che
    ogni membro puo' riscrivere, quindi in fatto di permessi non ha voce.
  */
  const deroghe = derogheDalProfilo(profilo?.custom_permissions);

  const esistente = (employees || []).find((e) => e.id === userId);
  if (esistente) return { ...esistente, customPermissions: deroghe };

  return {
    id: userId,
    name: nome,
    avatar,
    role: profilo?.job_title || 'User',
    userRole: ruoloInterfaccia(orgRole),
    email: profilo?.email ?? emailAccesso ?? undefined,
    departments: profilo?.departments ?? [],
    department: profilo?.departments?.[0],
    status: profilo?.status ?? 'active',
    joinedDate: creatoIl ?? new Date().toISOString(),
    teamLead: profilo?.team_lead ?? false,
    customPermissions: deroghe,
  };
}
