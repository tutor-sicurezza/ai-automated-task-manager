/**
 * Custom hook for completing tasks with Claude AI assistance.
 *
 * Handles:
 * - API communication with the completion endpoint
 * - Rate limiting and error handling
 * - Loading states and user feedback via toast notifications
 * - Integration with the main useTasks hook for state updates
 *
 * Usage:
 * ```tsx
 * const { completeTask, isLoading } = useCompleteTask();
 * const handleClick = () => {
 *   completeTask(task, organization.id, customPrompt);
 * };
 * ```
 */

import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Task } from '@/lib/types';

export interface CompleteTaskOptions {
  /** Custom prompt/instructions for Claude (optional) */
  customPrompt?: string;
  /** Whether to show a success toast (default: true) */
  showToast?: boolean;
}

export interface CompleteTaskResult {
  success: boolean;
  taskId: string;
  completionNotes?: string;
  model?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
  error?: string;
}

/**
 * Custom hook for task completion with Claude AI.
 *
 * Returns:
 * - `completeTask`: async function to complete a task
 * - `isLoading`: boolean indicating if a request is in progress
 * - `lastError`: last error message (if any)
 * - `completedTaskId`: ID of the last successfully completed task
 */
export function useCompleteTask() {
  const { organization } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [completedTaskId, setCompletedTaskId] = useState<string | null>(null);

  const completeTask = useCallback(
    async (
      task: Task,
      tenantId: string,
      options: CompleteTaskOptions = {}
    ): Promise<CompleteTaskResult> => {
      const { customPrompt, showToast = true } = options;

      // Validate prerequisites
      if (!tenantId) {
        const error = 'No organization selected';
        setLastError(error);
        if (showToast) {
          toast.error(error);
        }
        return { success: false, taskId: task.id, error };
      }

      if (task.status === 'completed') {
        const error = 'Task is already completed';
        setLastError(error);
        if (showToast) {
          toast.info(error);
        }
        return { success: false, taskId: task.id, error };
      }

      // Get authentication token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        const error = 'Session expired. Please log in again.';
        setLastError(error);
        if (showToast) {
          toast.error(error);
        }
        return { success: false, taskId: task.id, error };
      }

      setIsLoading(true);
      setLastError(null);

      try {
        // Call the completion endpoint
        const response = await fetch('/api/tasks/complete-with-claude', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            tenantId,
            taskId: task.id,
            taskTitle: task.title,
            taskDescription: task.description,
            customPrompt,
            targetStatus: 'completed',
          }),
        });

        const result = (await response.json()) as Partial<CompleteTaskResult>;

        if (!response.ok) {
          const errorMessage =
            result.error === 'limite_richieste_superato'
              ? 'You have reached your completion limit this hour. Please try again later.'
              : result.error === 'ai_non_configurata'
                ? 'AI features are not configured. Please contact your administrator.'
                : result.error === 'ai_chiave_non_valida'
                  ? 'AI configuration is invalid. Please contact your administrator.'
                  : result.error || 'Failed to complete task';

          setLastError(errorMessage);
          if (showToast) {
            toast.error(errorMessage);
          }

          return {
            success: false,
            taskId: task.id,
            error: errorMessage,
          };
        }

        if (!result.success) {
          const errorMessage = result.error || 'Unknown error occurred';
          setLastError(errorMessage);
          if (showToast) {
            toast.error(errorMessage);
          }
          return { success: false, taskId: task.id, error: errorMessage };
        }

        // Success
        setCompletedTaskId(task.id);
        setLastError(null);

        if (showToast) {
          toast.success(
            `Task "${task.title}" completed with AI assistance`,
            {
              description: result.completionNotes?.substring(0, 100),
            }
          );
        }

        return {
          success: true,
          taskId: result.taskId || task.id,
          completionNotes: result.completionNotes,
          model: result.model,
          tokensUsed: result.tokensUsed,
        };
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred';
        setLastError(errorMessage);
        if (showToast) {
          toast.error(errorMessage);
        }
        return {
          success: false,
          taskId: task.id,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    completeTask,
    isLoading,
    lastError,
    completedTaskId,
  };
}

/**
 * Hook to check if AI completion features are available.
 *
 * Usage:
 * ```tsx
 * const { isAvailable, isChecking } = useAICompletionAvailable();
 * ```
 */
export function useAICompletionAvailable() {
  const { organization } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkAvailability = useCallback(async () => {
    if (!organization?.id) {
      setIsAvailable(false);
      setIsChecking(false);
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setIsAvailable(false);
        setIsChecking(false);
        return;
      }

      // Check if AI is configured by attempting a HEAD request
      const response = await fetch('/api/ai/complete', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = (await response.json()) as { available?: boolean };
      setIsAvailable(data.available === true);
    } catch {
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  }, [organization?.id]);

  // Check availability on mount and when organization changes
  React.useEffect(() => {
    setIsChecking(true);
    void checkAvailability();
  }, [checkAvailability]);

  return {
    isAvailable,
    isChecking,
  };
}

// Import React for useEffect
import React from 'react';
