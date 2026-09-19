import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkle, Copy, Check, Terminal } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { generateTaskMarkdown, getInstallationCommands } from '@/utils/generateTaskMarkdown';
import type { Task } from '@/lib/types';

/**
 * CompleteWithDesktopButton — Method 2: Complete via Claude Desktop (MCP Connector)
 *
 * Questo componente facilita l'uso di Claude Desktop con il connettore MCP TaskFlow.
 * Offre:
 * 1. Istruzioni di installazione
 * 2. Il prompt pronto da copiare
 * 3. Link alla documentazione
 */

interface CompleteWithDesktopButtonProps {
  task: Task;
  tuttiITask?: Task[];
}

function CopyableBlock({
  label,
  value,
  monospace = false,
}: {
  label: string;
  value: string;
  monospace?: boolean;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('Could not copy. Select the text and copy it manually.'));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Button size="sm" variant="outline" onClick={copy}>
          {copied ? (
            <Check className="mr-2 h-4 w-4" weight="bold" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? t('Copied') : t('Copy')}
        </Button>
      </div>
      <pre
        className={`max-h-64 overflow-auto rounded-md border bg-muted p-3 text-xs whitespace-pre-wrap ${
          monospace ? 'font-mono' : ''
        }`}
      >
        {value}
      </pre>
    </div>
  );
}

export function CompleteWithDesktopButton({
  task,
  tuttiITask,
}: CompleteWithDesktopButtonProps) {
  const { organization, organizations } = useAuth();
  const organizzazione = organization?.name ?? null;
  const idOrganizzazione = organization?.id ?? null;
  const piuOrganizzazioni = (organizations?.length ?? 0) > 1;
  const { t } = useTranslation();
  const [aperto, setAperto] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAperto(true)}>
        <Sparkle className="mr-2 h-4 w-4" weight="fill" />
        {t('Complete with Claude')}
      </Button>

      <Dialog open={aperto} onOpenChange={setAperto}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{t('Complete task with Claude Desktop')}</DialogTitle>
            <DialogDescription>
              {t(
                'Use the MCP Connector to work with Claude. If you haven\'t installed it yet, follow the setup instructions.'
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="setup">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">{t('Setup')}</TabsTrigger>
              <TabsTrigger value="use">{t('Use')}</TabsTrigger>
              <TabsTrigger value="learn">{t('Learn')}</TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-4 pt-4">
              <div className="space-y-3">
                <p className="text-sm font-medium">Step 1: Login</p>
                <CopyableBlock
                  label={t('Run once from the repository')}
                  value={`node scripts/taskflow.mjs accedi`}
                  monospace
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Step 2: Install Connector</p>
                <CopyableBlock
                  label={t('Then install the connector')}
                  value={getInstallationCommands(piuOrganizzazioni ? idOrganizzazione : null)}
                  monospace
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Step 3: Restart Claude</p>
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-900">
                    {t('Restart Claude Desktop completely for the connector to appear.')}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Use Tab */}
            <TabsContent value="use" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                {t(
                  'Once installed, copy the prompt below and paste it into Claude Desktop. The MCP Connector will handle the rest.'
                )}
              </p>

              <div className="space-y-3">
                <p className="text-sm font-medium">{t('Your task:')}</p>
                <div className="rounded-md border bg-muted p-3 text-xs">
                  <p className="font-semibold">{task.title}</p>
                  <p className="mt-1 text-muted-foreground">{task.id.slice(0, 8)}</p>
                </div>
              </div>

              <CopyableBlock
                label={t('Paste this into Claude')}
                value={generateTaskMarkdown(task, { organizzazione, tuttiITask })}
              />

              <div className="text-xs text-muted-foreground space-y-1">
                <p>{t('Claude will:')}</p>
                <ul className="list-inside space-y-0.5 ml-2">
                  <li>• {t('Read the full task details')}</li>
                  <li>• {t('Work on completing it')}</li>
                  <li>• {t('Mark it complete in TaskFlow')}</li>
                </ul>
              </div>
            </TabsContent>

            {/* Learn Tab */}
            <TabsContent value="learn" className="space-y-4 pt-4">
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold mb-2">{t('What is the MCP Connector?')}</p>
                  <p className="text-muted-foreground">
                    {t(
                      'The MCP Connector lets Claude Desktop read your tasks from TaskFlow and write back the results. It uses your login session — Claude cannot do anything you couldn\'t do yourself.'
                    )}
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-2">{t('How does it work?')}</p>
                  <ul className="space-y-1 text-muted-foreground list-inside">
                    <li>• {t('Runs on your computer, not a server')}</li>
                    <li>• {t('Uses your TaskFlow login credentials')}</li>
                    <li>• {t('Respects all database rules and permissions')}</li>
                    <li>• {t('No service keys or additional configuration')}</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-2">{t('Available tools in Claude:')}</p>
                  <ul className="space-y-1 text-muted-foreground list-inside text-xs font-mono">
                    <li>• list-tasks() — {t('See your open tasks')}</li>
                    <li>• read-task(id) — {t('Get full task details')}</li>
                    <li>• complete-task(id, note?) — {t('Mark task complete')}</li>
                    <li>• add-note(id, text) — {t('Add a comment')}</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-2">{t('Permissions')}</p>
                  <p className="text-muted-foreground">
                    {t(
                      'The connector operates with your exact permissions. If you can\'t complete a task here, Claude can\'t do it either.'
                    )}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
