import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, Check, Terminal } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useTranslation } from '@/contexts/LanguageContext';
import type { Task } from '@/lib/types';

/**
 * Completare con Claude via CLI
 *
 * Questo componente prepara il comando CLI per eseguire un task usando
 * Claude direttamente dal terminale, senza interfaccia web.
 *
 * È complementare a `EseguiConClaude`:
 * - EseguiConClaude: per browser, MCP connector, interattivo
 * - CompleteWithCLIButton: per terminale, automatizzabile, batch
 */

interface CompleteWithCLIButtonProps {
  task: Task;
}

function Copiabile({
  etichetta,
  valore,
}: {
  etichetta: string;
  valore: string;
}) {
  const { t } = useTranslation();
  const [copiato, setCopiato] = useState(false);

  const copia = async () => {
    try {
      await navigator.clipboard.writeText(valore);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2000);
    } catch {
      toast.error(t('Could not copy. Select the text and copy it manually.'));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{etichetta}</span>
        <Button size="sm" variant="outline" onClick={copia}>
          {copiato ? (
            <Check className="mr-2 h-4 w-4" weight="bold" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copiato ? t('Copied') : t('Copy')}
        </Button>
      </div>
      <pre className="max-h-64 overflow-auto rounded-md border bg-muted p-3 text-xs whitespace-pre-wrap font-mono">
        {valore}
      </pre>
    </div>
  );
}

export function CompleteWithCLIButton({ task }: CompleteWithCLIButtonProps) {
  const { t } = useTranslation();
  const [aperto, setAperto] = useState(false);

  // Comando CLI per completare il task
  const comandoCompleta = `taskflow complete-task ${task.id.slice(0, 8)}`;

  // Comando con salvataggio
  const comandoSalva = `taskflow complete-task ${task.id.slice(0, 8)} --save`;

  // Setup iniziale (una volta)
  const comandoSetup = `# Prima volta sola\ntaskflow accedi`;

  const istruzioni = `# Prerequisiti
1. Installa il CLI tool (eseguire una volta):
   npm install -g taskflow
   # oppure se non fatto: npm install

2. Accedi a TaskFlow (eseguire una volta):
   ${comandoSetup}

3. Imposta ANTHROPIC_API_KEY:
   # Su macOS/Linux:
   export ANTHROPIC_API_KEY="sk-ant-..."

   # Su Windows PowerShell:
   $env:ANTHROPIC_API_KEY = "sk-ant-..."

# Eseguire il task
${comandoCompleta}

# Con salvataggio del risultato:
${comandoSalva}

# Opzioni avanzate
taskflow complete-task ${task.id.slice(0, 8)} \\
  --model claude-3-opus-20250219 \\
  --max-tokens 4096 \\
  --save \\
  --verbose

# Aiuto
taskflow help`;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAperto(true)}>
        <Terminal className="mr-2 h-4 w-4" />
        {t('Complete via CLI')}
      </Button>

      <Dialog open={aperto} onOpenChange={setAperto}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{t('Complete via CLI')}</DialogTitle>
            <DialogDescription>
              {t(
                'Work on this task from your terminal using Claude. Perfect for automation and batch processing.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold">{t('Quick start')}</h3>
              <Copiabile
                etichetta={t('Run this from terminal')}
                valore={comandoCompleta}
              />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">{t('Save result to file')}</h3>
              <Copiabile
                etichetta={t('Save output as JSON')}
                valore={comandoSalva}
              />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">{t('Full setup')}</h3>
              <Copiabile
                etichetta={t('Complete setup instructions')}
                valore={istruzioni}
              />
            </div>

            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs dark:border-blue-800 dark:bg-blue-950">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                {t('How it works')}
              </p>
              <ul className="mt-2 space-y-1 text-blue-800 dark:text-blue-200">
                <li>• {t('Fetches this task from TaskFlow API')}</li>
                <li>• {t('Sends task details to Claude API')}</li>
                <li>• {t('Displays Claude\'s response in terminal')}</li>
                <li>• {t('Optionally updates TaskFlow when done')}</li>
              </ul>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                {t('Requirements')}
              </p>
              <ul className="mt-2 space-y-1 text-amber-800 dark:text-amber-200">
                <li>• Node.js 18+ and npm</li>
                <li>• ANTHROPIC_API_KEY environment variable</li>
                <li>• TaskFlow CLI installed globally or locally</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
