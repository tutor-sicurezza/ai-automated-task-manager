/**
 * React component: Complete Task with Claude AI Button
 *
 * Provides a dropdown menu to complete tasks with Claude AI assistance.
 * Features:
 * - Dropdown menu with completion options
 * - Custom prompt input dialog
 * - Loading states and accessibility features
 * - Toast notifications for user feedback
 *
 * Usage:
 * ```tsx
 * <CompleteWithClaudeButton
 *   task={task}
 *   tenantId={organization.id}
 *   onComplete={(result) => {
 *     // Handle completion result
 *     setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
 *   }}
 * />
 * ```
 */

import { useState } from 'react';
import { Sparkles, CaretDown } from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Task } from '@/lib/types';
import { useCompleteTask, useAICompletionAvailable } from '@/hooks/useCompleteTask';

interface CompleteWithClaudeButtonProps {
  /** The task to complete */
  task: Task;
  /** Organization ID (tenant) */
  tenantId: string;
  /** Callback when task completion is successful */
  onComplete?: (result: any) => void;
  /** Additional CSS class */
  className?: string;
  /** Variant for button styling */
  variant?: 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Dropdown button to complete a task with Claude AI assistance.
 *
 * Offers two completion modes:
 * 1. Quick Complete - AI generates completion notes from task title/description
 * 2. Complete with Custom Prompt - User provides additional context for Claude
 */
export function CompleteWithClaudeButton({
  task,
  tenantId,
  onComplete,
  className,
  variant = 'default',
  size = 'sm',
}: CompleteWithClaudeButtonProps) {
  const { completeTask, isLoading } = useCompleteTask();
  const { isAvailable, isChecking } = useAICompletionAvailable();
  const [showCustomPromptDialog, setShowCustomPromptDialog] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Don't show button if task is already completed or AI is not available
  if (task.status === 'completed' || !isAvailable || isChecking) {
    return null;
  }

  const handleQuickComplete = async () => {
    const result = await completeTask(task, tenantId, {
      showToast: true,
    });

    if (result.success && onComplete) {
      onComplete(result);
    }
  };

  const handleCustomPromptComplete = async () => {
    if (!customPrompt.trim()) {
      return;
    }

    const result = await completeTask(task, tenantId, {
      customPrompt: customPrompt.trim(),
      showToast: true,
    });

    if (result.success) {
      setCustomPrompt('');
      setShowCustomPromptDialog(false);
      if (onComplete) {
        onComplete(result);
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isLoading}
            className={className}
            aria-label="Complete task with Claude AI"
            title="Complete task with Claude AI assistance"
          >
            <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
            Complete with AI
            <CaretDown className="w-3 h-3 ml-1" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {/* Quick Complete Option */}
          <DropdownMenuItem onClick={handleQuickComplete} disabled={isLoading}>
            <div className="flex flex-col gap-1">
              <span className="font-medium">Quick Complete</span>
              <span className="text-xs text-muted-foreground">
                AI generates completion notes from task details
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Custom Prompt Option */}
          <DropdownMenuItem
            onClick={() => setShowCustomPromptDialog(true)}
            disabled={isLoading}
          >
            <div className="flex flex-col gap-1">
              <span className="font-medium">Complete with Custom Prompt</span>
              <span className="text-xs text-muted-foreground">
                Provide additional context for AI
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Prompt Dialog */}
      <Dialog open={showCustomPromptDialog} onOpenChange={setShowCustomPromptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete with Custom Prompt</DialogTitle>
            <DialogDescription>
              Provide additional context or instructions for Claude to generate more specific
              completion notes for "{task.title}".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-prompt">
                Additional Context
                <span className="text-destructive ml-1" aria-label="required">
                  *
                </span>
              </Label>
              <Textarea
                id="custom-prompt"
                placeholder="e.g., 'Completed with Q1 deliverables included. Follow-up meeting scheduled for next month.'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={isLoading}
                className="min-h-[100px]"
                aria-describedby="prompt-help"
              />
              <p id="prompt-help" className="text-xs text-muted-foreground">
                Provide any additional details about what was accomplished or deliverables
                completed.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCustomPromptDialog(false);
                setCustomPrompt('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCustomPromptComplete}
              disabled={isLoading || !customPrompt.trim()}
              aria-busy={isLoading}
            >
              {isLoading ? 'Completing...' : 'Complete Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Convenience hook to check if the button should be visible
 */
export function useShowCompleteWithClaudeButton() {
  const { isAvailable, isChecking } = useAICompletionAvailable();
  return !isChecking && isAvailable;
}

/**
 * Standalone version for use in task cards or lists
 */
export function CompleteWithClaudeCompactButton({
  task,
  tenantId,
  onComplete,
}: Omit<CompleteWithClaudeButtonProps, 'variant' | 'size'>) {
  return (
    <CompleteWithClaudeButton
      task={task}
      tenantId={tenantId}
      onComplete={onComplete}
      variant="secondary"
      size="sm"
      className="w-full"
    />
  );
}
