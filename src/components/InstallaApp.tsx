import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadSimple, X } from '@phosphor-icons/react';
import { useTranslation } from '@/contexts/LanguageContext';

/**
 * Banner «Installa l'app».
 *
 * Segue il pattern standard delle PWA installabili, invece di inventarne uno:
 *
 *  - il browser (solo Chromium: Chrome, Edge, Brave…) emette
 *    `beforeinstallprompt` quando l'app e' installabile e NON lo e' gia'. Lo si
 *    intercetta, si blocca il mini-infobar predefinito e si tiene l'evento da
 *    parte per lanciarlo noi al click — e' l'unico modo di avere un bottone
 *    "Installa" dentro la pagina, perche' il prompt nativo va invocato da un
 *    gesto dell'utente.
 *  - a installazione avvenuta il banner non ha piu' senso e sparisce: lo dice
 *    l'evento `appinstalled`, e in piu' al caricamento si controlla se l'app e'
 *    gia' aperta in modalita' standalone (display-mode), cosi' chi la apre
 *    dall'icona non lo vede mai.
 *  - chi lo chiude non lo rivede per due settimane. Un invito, non un assillo.
 *
 * Su Safari/iOS `beforeinstallprompt` non esiste: li' il banner semplicemente
 * non compare. L'installazione e' "Aggiungi alla schermata Home" dal menu di
 * condivisione — un gesto manuale che nessuna pagina puo' automatizzare, e
 * promettere un bottone che non puo' funzionare sarebbe peggio del silenzio.
 */

interface EventoInstallazione extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const CHIAVE_RINVIO = 'taskflow.installBannerRinviato';
const GIORNI_RINVIO = 14;

function rinviatoDiRecente(): boolean {
  try {
    const salvato = window.localStorage.getItem(CHIAVE_RINVIO);
    if (!salvato) return false;
    const quando = Number(salvato);
    if (!Number.isFinite(quando)) return false;
    return Date.now() - quando < GIORNI_RINVIO * 24 * 60 * 60 * 1000;
  } catch {
    // localStorage inaccessibile (finestra privata): si tratta come "mai
    // rinviato", che al massimo mostra il banner una volta di piu'.
    return false;
  }
}

function giaInstallata(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  // Flag non standard che Safari/iOS espone quando gira come app aggiunta.
  return (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function InstallaApp() {
  const { t } = useTranslation();
  const [evento, setEvento] = useState<EventoInstallazione | null>(null);
  const [visibile, setVisibile] = useState(false);

  useEffect(() => {
    // Gia' installata o rinviata di recente: non si registra nemmeno
    // l'ascoltatore, cosi' il banner non puo' comparire.
    if (giaInstallata() || rinviatoDiRecente()) return;

    const alPrompt = (e: Event) => {
      // Senza preventDefault alcuni browser mostrano comunque il loro
      // mini-infobar, e ci si ritroverebbe due inviti invece di uno.
      e.preventDefault();
      setEvento(e as EventoInstallazione);
      setVisibile(true);
    };

    const allInstallazione = () => {
      setVisibile(false);
      setEvento(null);
      try {
        // Installata: un eventuale "rinvio" non serve piu'.
        window.localStorage.removeItem(CHIAVE_RINVIO);
      } catch {
        /* niente */
      }
    };

    window.addEventListener('beforeinstallprompt', alPrompt);
    window.addEventListener('appinstalled', allInstallazione);
    return () => {
      window.removeEventListener('beforeinstallprompt', alPrompt);
      window.removeEventListener('appinstalled', allInstallazione);
    };
  }, []);

  if (!visibile || !evento) return null;

  const rinvia = () => {
    setVisibile(false);
    try {
      window.localStorage.setItem(CHIAVE_RINVIO, String(Date.now()));
    } catch {
      /* niente: resta nascosto per questa sessione */
    }
  };

  const installa = async () => {
    await evento.prompt();
    const scelta = await evento.userChoice;
    // L'evento e' monouso: dopo prompt() non si puo' riusare, quindi si butta.
    setEvento(null);
    // Se accetta, ci pensa `appinstalled` a chiudere; se rifiuta, lo si rinvia
    // come una chiusura, per non riproporlo subito.
    if (scelta.outcome === 'accepted') setVisibile(false);
    else rinvia();
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-b bg-primary/10 px-4 py-2 text-sm">
      <DownloadSimple className="h-4 w-4 shrink-0 text-primary" weight="bold" />
      <span className="text-center">
        {t('Install this app on your desktop for faster access.')}
      </span>
      <Button size="sm" onClick={installa}>
        <DownloadSimple className="mr-2 h-4 w-4" />
        {t('Install')}
      </Button>
      <Button size="sm" variant="ghost" onClick={rinvia} aria-label={t('Close')}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
