import { describe, expect, it } from 'vitest';
import type { Employee, Task } from '@/lib/types';
import { normalizeActionableSuggestions } from '@/lib/aiAssistantSuggestions';

const tasks: Pick<Task, 'id'>[] = [{ id: 'task-1' }, { id: 'task-2' }];
const employees: Pick<Employee, 'id' | 'status'>[] = [
  { id: 'emp-active', status: 'active' },
  { id: 'emp-inactive', status: 'inactive' },
];

describe('normalizeActionableSuggestions', () => {
  it('returns an empty array for invalid payloads', () => {
    expect(normalizeActionableSuggestions(null, tasks, employees)).toEqual([]);
    expect(normalizeActionableSuggestions({}, tasks, employees)).toEqual([]);
    expect(normalizeActionableSuggestions({ suggestions: 'nope' }, tasks, employees)).toEqual(
      []
    );
  });

  it('keeps only valid actionable suggestions', () => {
    const payload = {
      suggestions: [
        {
          type: 'reassign',
          title: ' Reassign API task ',
          description: ' Move it to the available engineer ',
          action: { taskId: 'task-1', newAssigneeId: 'emp-active' },
        },
        {
          type: 'reassign',
          title: 'Invalid employee',
          description: 'Should be dropped',
          action: { taskId: 'task-1', newAssigneeId: 'emp-inactive' },
        },
        {
          type: 'priority_change',
          title: 'Raise priority',
          description: 'Urgent customer issue',
          action: { taskId: 'task-2', newPriority: 'high' },
        },
        {
          type: 'insight',
          title: 'Not actionable',
          description: 'Should not appear',
        },
      ],
    };

    expect(normalizeActionableSuggestions(payload, tasks, employees)).toEqual([
      {
        type: 'reassign',
        title: 'Reassign API task',
        description: 'Move it to the available engineer',
        action: { taskId: 'task-1', newAssigneeId: 'emp-active' },
      },
      {
        type: 'priority_change',
        title: 'Raise priority',
        description: 'Urgent customer issue',
        action: { taskId: 'task-2', newPriority: 'high' },
      },
    ]);
  });

  it('normalizes create-task suggestions and drops incomplete ones', () => {
    const payload = {
      suggestions: [
        {
          type: 'create_task',
          title: 'Create QA follow-up',
          description: 'Track post-release verification',
          action: {
            taskData: {
              title: ' QA follow-up ',
              description: 'Verify the hotfix in production',
              assigneeId: 'emp-active',
              priority: 'medium',
              dueDate: '',
            },
          },
        },
        {
          type: 'create_task',
          title: 'Broken create',
          description: 'Missing taskData title',
          action: {
            taskData: {
              title: '   ',
              description: 'No usable title',
              assigneeId: null,
              priority: 'medium',
              dueDate: null,
            },
          },
        },
      ],
    };

    expect(normalizeActionableSuggestions(payload, tasks, employees)).toEqual([
      {
        type: 'create_task',
        title: 'Create QA follow-up',
        description: 'Track post-release verification',
        action: {
          taskData: {
            title: 'QA follow-up',
            description: 'Verify the hotfix in production',
            assigneeId: 'emp-active',
            priority: 'medium',
            dueDate: null,
          },
        },
      },
    ]);
  });
});
