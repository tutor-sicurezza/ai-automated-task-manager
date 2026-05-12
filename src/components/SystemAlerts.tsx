import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Warning, CheckCircle, Info, Fire } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface SystemAlert {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'urgent';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface SystemAlertsProps {
  alerts: SystemAlert[];
  onDismiss: (id: string) => void;
}

const getAlertStyles = (type: SystemAlert['type']) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
        icon: <CheckCircle className="h-5 w-5 text-green-600" weight="fill" />,
        accent: 'bg-green-600',
      };
    case 'warning':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
        icon: <Warning className="h-5 w-5 text-amber-600" weight="fill" />,
        accent: 'bg-amber-600',
      };
    case 'error':
      return {
        bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
        icon: <Warning className="h-5 w-5 text-red-600" weight="fill" />,
        accent: 'bg-red-600',
      };
    case 'urgent':
      return {
        bg: 'bg-destructive/10 border-destructive',
        icon: <Fire className="h-5 w-5 text-destructive" weight="fill" />,
        accent: 'bg-destructive animate-pulse',
      };
    default:
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
        icon: <Info className="h-5 w-5 text-blue-600" weight="fill" />,
        accent: 'bg-blue-600',
      };
  }
};

export function SystemAlerts({ alerts, onDismiss }: SystemAlertsProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => (
          <SystemAlertItem
            key={alert.id}
            alert={alert}
            styles={getAlertStyles(alert.type)}
            onDismiss={() => onDismiss(alert.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface SystemAlertItemProps {
  alert: SystemAlert;
  styles: ReturnType<typeof getAlertStyles>;
  onDismiss: () => void;
}

function SystemAlertItem({ alert, styles, onDismiss }: SystemAlertItemProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!alert.persistent && alert.duration) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (alert.duration! / 100));
          if (newProgress <= 0) {
            clearInterval(interval);
            onDismiss();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [alert.duration, alert.persistent, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className="pointer-events-auto"
    >
      <div className={cn('border rounded-lg shadow-lg overflow-hidden', styles.bg)}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {styles.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold mb-1">{alert.title}</h4>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
              {alert.action && (
                <button
                  onClick={alert.action.onClick}
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  {alert.action.label}
                </button>
              )}
            </div>
            {!alert.persistent && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" weight="bold" />
              </button>
            )}
          </div>
        </div>
        {!alert.persistent && alert.duration && (
          <div className="h-1 bg-black/10 dark:bg-white/10">
            <motion.div
              className={cn('h-full', styles.accent)}
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function useSystemAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  const addAlert = (alert: Omit<SystemAlert, 'id'>) => {
    const id = `alert-${Date.now()}-${Math.random()}`;
    const newAlert: SystemAlert = {
      ...alert,
      id,
      duration: alert.duration || 5000,
    };
    setAlerts((prev) => [...prev, newAlert]);
    return id;
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  return {
    alerts,
    addAlert,
    dismissAlert,
    clearAllAlerts,
  };
}
