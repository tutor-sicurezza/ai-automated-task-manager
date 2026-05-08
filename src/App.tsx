import { useState, useMemo, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, FunnelSimple, ArrowsDownUp, CheckCircle, CheckSquare, Square, Trash, X, PlayCircle, Circle } from '@phosphor-icons/react';
import { TaskCard } from '@/components/TaskCard';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { TaskDetailsDialog } from '@/components/TaskDetailsDialog';
import { UsersManagement } from '@/components/UsersManagement';
import { Task, Employee, TaskStatus, TaskPriority, TaskActivity, TaskComment, TaskAttachment } from '@/lib/types';
import { Toaster, toast } from 'sonner';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [tasks, setTasks] = useKV<Task[]>('tasks', []);
  const [employees, setEmployees] = useKV<Employee[]>('employees', []);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | TaskStatus>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | TaskPriority>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status'>('dueDate');
  const [activeTab, setActiveTab] = useState('all');
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar: string } | null>(null);

  useEffect(() => {
    if (employees && employees.length > 0) {
      const needsMigration = employees.some(emp => !emp.status || !emp.joinedDate);
      if (needsMigration) {
        setEmployees((currentEmployees) =>
          (currentEmployees || []).map(emp => ({
            ...emp,
            status: emp.status || 'active',
            joinedDate: emp.joinedDate || new Date().toISOString(),
          }))
        );
      }
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await window.spark.user();
        if (user) {
          setCurrentUser({
            id: user.id.toString(),
            name: user.login || 'User',
            avatar: user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
          });
        }
      } catch (error) {
        setCurrentUser({
          id: 'demo-user',
          name: 'Demo User',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        });
      }
    };
    loadUser();
  }, []);

  const addActivity = (taskId: string, type: TaskActivity['type'], oldValue?: string, newValue?: string, details?: string) => {
    if (!currentUser) return;

    const activity: TaskActivity = {
      id: `activity-${Date.now()}`,
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      type,
      oldValue,
      newValue,
      details,
      createdAt: new Date().toISOString(),
    };

    setTasks((currentTasks) =>
      (currentTasks || []).map(task => {
        if (task.id === taskId) {
          const activities = task.activities || [];
          return { ...task, activities: [...activities, activity] };
        }
        return task;
      })
    );
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'comments' | 'activities'>) => {
    if (!currentUser) return;

    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      status: 'not-started',
      createdAt: new Date().toISOString(),
      comments: [],
      activities: [{
        id: `activity-${Date.now()}`,
        taskId: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        type: 'created',
        createdAt: new Date().toISOString(),
      }],
    };
    
    setTasks((currentTasks) => [...(currentTasks || []), newTask]);
    toast.success('Task created successfully!');
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    const task = (tasks || []).find(t => t.id === taskId);
    if (!task) return;

    const oldStatus = task.status;
    const wasCompleted = oldStatus === 'completed';
    const isNowCompleted = status === 'completed';
    
    setTasks((currentTasks) =>
      (currentTasks || []).map(task =>
        task.id === taskId ? { ...task, status } : task
      )
    );
    
    addActivity(taskId, 'status_changed', oldStatus.replace('-', ' '), status.replace('-', ' '));
    
    if (!wasCompleted && isNowCompleted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success('Task completed! 🎉');
    }
  };

  const handleAssigneeChange = (taskId: string, assigneeId: string | null) => {
    const task = (tasks || []).find(t => t.id === taskId);
    if (!task) return;

    const oldAssignee = task.assigneeId ? (employees || []).find(e => e.id === task.assigneeId)?.name : 'Unassigned';
    const newAssignee = assigneeId ? (employees || []).find(e => e.id === assigneeId)?.name : 'Unassigned';

    setTasks((currentTasks) =>
      (currentTasks || []).map(task =>
        task.id === taskId ? { ...task, assigneeId } : task
      )
    );

    addActivity(taskId, 'assignee_changed', oldAssignee, newAssignee);
    toast.success('Task reassigned successfully!');
  };

  const handleEditTask = (taskId: string) => {
    const task = (tasks || []).find(t => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setEditDialogOpen(true);
    }
  };

  const handleViewDetails = (taskId: string) => {
    const task = (tasks || []).find(t => t.id === taskId);
    if (task) {
      setViewingTask(task);
      setDetailsDialogOpen(true);
    }
  };

  const handleUpdateTask = (taskId: string, updates: {
    title: string;
    description: string;
    assigneeId: string | null;
    priority: TaskPriority;
    dueDate: string;
  }) => {
    const task = (tasks || []).find(t => t.id === taskId);
    if (!task) return;

    if (task.title !== updates.title) {
      addActivity(taskId, 'title_changed');
    }
    if (task.description !== updates.description) {
      addActivity(taskId, 'description_changed');
    }
    if (task.priority !== updates.priority) {
      addActivity(taskId, 'priority_changed', task.priority, updates.priority);
    }
    if (task.assigneeId !== updates.assigneeId) {
      const oldAssignee = task.assigneeId ? (employees || []).find(e => e.id === task.assigneeId)?.name : 'Unassigned';
      const newAssignee = updates.assigneeId ? (employees || []).find(e => e.id === updates.assigneeId)?.name : 'Unassigned';
      addActivity(taskId, 'assignee_changed', oldAssignee, newAssignee);
    }
    if (task.dueDate !== updates.dueDate) {
      addActivity(taskId, 'due_date_changed',
        new Date(task.dueDate).toLocaleDateString(),
        new Date(updates.dueDate).toLocaleDateString()
      );
    }

    setTasks((currentTasks) =>
      (currentTasks || []).map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
    toast.success('Task updated successfully!');
  };

  const handleAddComment = (taskId: string, content: string) => {
    if (!currentUser) return;

    const comment: TaskComment = {
      id: `comment-${Date.now()}`,
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content,
      createdAt: new Date().toISOString(),
    };

    setTasks((currentTasks) =>
      (currentTasks || []).map(task => {
        if (task.id === taskId) {
          const comments = task.comments || [];
          return { ...task, comments: [...comments, comment] };
        }
        return task;
      })
    );

    addActivity(taskId, 'comment_added', undefined, undefined, content);
    toast.success('Comment added!');
  };

  const handleAddAttachment = async (taskId: string, file: File) => {
    if (!currentUser) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const attachment: TaskAttachment = {
        id: `attachment-${Date.now()}`,
        taskId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileData: reader.result as string,
        uploadedBy: currentUser.id,
        uploadedByName: currentUser.name,
        uploadedByAvatar: currentUser.avatar,
        uploadedAt: new Date().toISOString(),
      };

      setTasks((currentTasks) =>
        (currentTasks || []).map(task => {
          if (task.id === taskId) {
            const attachments = task.attachments || [];
            return { ...task, attachments: [...attachments, attachment] };
          }
          return task;
        })
      );

      addActivity(taskId, 'attachment_added', undefined, undefined, file.name);
      toast.success('File attached successfully!');
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteAttachment = (taskId: string, attachmentId: string) => {
    const task = (tasks || []).find(t => t.id === taskId);
    if (!task) return;

    const attachment = task.attachments?.find(a => a.id === attachmentId);
    if (!attachment) return;

    setTasks((currentTasks) =>
      (currentTasks || []).map(task => {
        if (task.id === taskId) {
          const attachments = task.attachments || [];
          return { ...task, attachments: attachments.filter(a => a.id !== attachmentId) };
        }
        return task;
      })
    );

    addActivity(taskId, 'attachment_removed', undefined, undefined, attachment.fileName);
    toast.success('Attachment removed');
  };

  const handleDeleteTask = (taskId: string) => {
    setDeleteTaskId(taskId);
  };

  const confirmDelete = () => {
    if (deleteTaskId) {
      setTasks((currentTasks) => (currentTasks || []).filter(task => task.id !== deleteTaskId));
      toast.success('Task deleted');
      setDeleteTaskId(null);
    }
  };

  const handleToggleBulkMode = () => {
    setBulkMode(!bulkMode);
    setSelectedTasks(new Set());
  };

  const handleToggleTaskSelect = (taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const visibleTaskIds = filteredAndSortedTasks.map(t => t.id);
    setSelectedTasks(new Set(visibleTaskIds));
  };

  const handleDeselectAll = () => {
    setSelectedTasks(new Set());
  };

  const handleBulkComplete = () => {
    if (selectedTasks.size === 0) return;
    
    const completedCount = Array.from(selectedTasks).filter(taskId => {
      const task = (tasks || []).find(t => t.id === taskId);
      return task?.status !== 'completed';
    }).length;

    selectedTasks.forEach(taskId => {
      const task = (tasks || []).find(t => t.id === taskId);
      if (task && task.status !== 'completed') {
        addActivity(taskId, 'status_changed', task.status.replace('-', ' '), 'completed');
      }
    });

    setTasks((currentTasks) =>
      (currentTasks || []).map(task =>
        selectedTasks.has(task.id) ? { ...task, status: 'completed' as TaskStatus } : task
      )
    );
    
    if (completedCount > 0) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      toast.success(`${completedCount} task${completedCount > 1 ? 's' : ''} marked as complete! 🎉`);
    }
    
    setSelectedTasks(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedTasks.size === 0) return;
    
    setTasks((currentTasks) => 
      (currentTasks || []).filter(task => !selectedTasks.has(task.id))
    );
    
    toast.success(`${selectedTasks.size} task${selectedTasks.size > 1 ? 's' : ''} deleted`);
    setSelectedTasks(new Set());
  };

  const handleBulkStatusChange = (status: TaskStatus) => {
    if (selectedTasks.size === 0) return;
    
    const changedCount = Array.from(selectedTasks).filter(taskId => {
      const task = (tasks || []).find(t => t.id === taskId);
      return task?.status !== status;
    }).length;

    selectedTasks.forEach(taskId => {
      const task = (tasks || []).find(t => t.id === taskId);
      if (task && task.status !== status) {
        addActivity(taskId, 'status_changed', task.status.replace('-', ' '), status.replace('-', ' '));
      }
    });

    setTasks((currentTasks) =>
      (currentTasks || []).map(task =>
        selectedTasks.has(task.id) ? { ...task, status } : task
      )
    );
    
    if (changedCount > 0) {
      const statusLabels: Record<TaskStatus, string> = {
        'not-started': 'Not Started',
        'in-progress': 'In Progress',
        'completed': 'Completed'
      };
      toast.success(`${changedCount} task${changedCount > 1 ? 's' : ''} set to ${statusLabels[status]}`);
    }
    
    setSelectedTasks(new Set());
  };

  const handleAddEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: Date.now().toString(),
      status: employeeData.status || 'active',
      joinedDate: employeeData.joinedDate || new Date().toISOString(),
    };
    
    setEmployees((currentEmployees) => [...(currentEmployees || []), newEmployee]);
    toast.success('Team member added successfully!');
  };

  const handleEditEmployee = (id: string, updates: Omit<Employee, 'id'>) => {
    setEmployees((currentEmployees) =>
      (currentEmployees || []).map(employee =>
        employee.id === id ? { ...employee, ...updates } : employee
      )
    );
    toast.success('Team member updated successfully!');
  };

  const handleDeleteEmployee = (id: string) => {
    setTasks((currentTasks) =>
      (currentTasks || []).map(task =>
        task.assigneeId === id ? { ...task, assigneeId: null } : task
      )
    );
    
    setEmployees((currentEmployees) =>
      (currentEmployees || []).filter(employee => employee.id !== id)
    );
    
    toast.success('Team member removed');
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...(tasks || [])];

    if (activeTab !== 'all') {
      if (activeTab === 'unassigned') {
        filtered = filtered.filter(task => !task.assigneeId);
      } else {
        filtered = filtered.filter(task => task.assigneeId === activeTab);
      }
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority': {
          const priorityOrder: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case 'status': {
          const statusOrder: Record<TaskStatus, number> = { 'not-started': 0, 'in-progress': 1, completed: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [tasks, activeTab, filterStatus, filterPriority, sortBy]);

  const stats = useMemo(() => {
    const taskList = tasks || [];
    const total = taskList.length;
    const completed = taskList.filter(t => t.status === 'completed').length;
    const inProgress = taskList.filter(t => t.status === 'in-progress').length;
    const overdue = taskList.filter(t => 
      new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length;

    return { total, completed, inProgress, overdue };
  }, [tasks]);

  const tabEmployees = useMemo(() => {
    const employeeMap = new Map<string, { employee: Employee; taskCount: number }>();
    
    (employees || []).forEach(emp => {
      employeeMap.set(emp.id, { employee: emp, taskCount: 0 });
    });

    (tasks || []).forEach(task => {
      if (task.assigneeId && employeeMap.has(task.assigneeId)) {
        const entry = employeeMap.get(task.assigneeId)!;
        entry.taskCount++;
      }
    });

    return Array.from(employeeMap.values());
  }, [employees, tasks]);

  const unassignedCount = (tasks || []).filter(t => !t.assigneeId).length;

  const taskCountsByEmployee = useMemo(() => {
    const countMap = new Map<string, number>();
    (tasks || []).forEach(task => {
      if (task.assigneeId) {
        countMap.set(task.assigneeId, (countMap.get(task.assigneeId) || 0) + 1);
      }
    });
    return countMap;
  }, [tasks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-muted/30">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
                TaskFlow
              </h1>
              <p className="text-muted-foreground">
                Manage your team's work efficiently
              </p>
            </div>
            <div className="flex items-center gap-2">
              <UsersManagement
                employees={employees || []}
                onAddEmployee={handleAddEmployee}
                onEditEmployee={handleEditEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                taskCounts={taskCountsByEmployee}
              />
              <Button 
                variant={bulkMode ? "secondary" : "outline"} 
                onClick={handleToggleBulkMode}
                className="w-full sm:w-auto"
              >
                <CheckSquare className="mr-2 h-5 w-5" weight={bulkMode ? "fill" : "regular"} />
                {bulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
              </Button>
              <Button size="lg" onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-5 w-5" weight="bold" />
                Add Task
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-card rounded-lg p-4 border">
              <div className="text-2xl font-semibold mb-1">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
            <div className="bg-card rounded-lg p-4 border">
              <div className="text-2xl font-semibold mb-1 text-primary">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="bg-card rounded-lg p-4 border">
              <div className="text-2xl font-semibold mb-1 text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="bg-card rounded-lg p-4 border">
              <div className="text-2xl font-semibold mb-1 text-destructive">{stats.overdue}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <FunnelSimple className="w-4 h-4 text-muted-foreground" weight="bold" />
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <FunnelSimple className="w-4 h-4 text-muted-foreground" weight="bold" />
              <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as typeof filterPriority)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <ArrowsDownUp className="w-4 h-4 text-muted-foreground" weight="bold" />
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <AnimatePresence>
            {bulkMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-4 overflow-hidden"
              >
                <div className="bg-primary/10 border-2 border-primary rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
                    <span className="text-sm font-medium">
                      {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSelectAll}
                        disabled={selectedTasks.size === filteredAndSortedTasks.length}
                      >
                        <CheckSquare className="mr-1 h-4 w-4" weight="bold" />
                        Select All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeselectAll}
                        disabled={selectedTasks.size === 0}
                      >
                        <Square className="mr-1 h-4 w-4" weight="bold" />
                        Deselect All
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleBulkComplete}
                      disabled={selectedTasks.size === 0}
                      className="flex-1 sm:flex-none"
                    >
                      <CheckCircle className="mr-1 h-4 w-4" weight="bold" />
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleBulkStatusChange('in-progress')}
                      disabled={selectedTasks.size === 0}
                      className="flex-1 sm:flex-none"
                    >
                      <PlayCircle className="mr-1 h-4 w-4" weight="bold" />
                      In Progress
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkStatusChange('not-started')}
                      disabled={selectedTasks.size === 0}
                      className="flex-1 sm:flex-none"
                    >
                      <Circle className="mr-1 h-4 w-4" weight="bold" />
                      Not Started
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBulkDelete}
                      disabled={selectedTasks.size === 0}
                      className="flex-1 sm:flex-none"
                    >
                      <Trash className="mr-1 h-4 w-4" weight="bold" />
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleToggleBulkMode}
                    >
                      <X className="h-4 w-4" weight="bold" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                All Tasks ({(tasks || []).length})
              </TabsTrigger>
              {tabEmployees.map(({ employee, taskCount }) => (
                <TabsTrigger key={employee.id} value={employee.id} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {employee.name} ({taskCount})
                </TabsTrigger>
              ))}
              <TabsTrigger value="unassigned" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Unassigned ({unassignedCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {filteredAndSortedTasks.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" weight="light" />
                  <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                  <p className="text-muted-foreground mb-4">
                    {(tasks || []).length === 0
                      ? 'Get started by creating your first task'
                      : 'Try adjusting your filters'}
                  </p>
                  {(tasks || []).length === 0 && (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Task
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredAndSortedTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      employees={employees || []}
                      onStatusChange={handleStatusChange}
                      onAssigneeChange={handleAssigneeChange}
                      onEdit={handleEditTask}
                      onViewDetails={handleViewDetails}
                      onDelete={handleDeleteTask}
                      bulkMode={bulkMode}
                      isSelected={selectedTasks.has(task.id)}
                      onToggleSelect={handleToggleTaskSelect}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        employees={employees || []}
        onCreateTask={handleCreateTask}
      />

      <EditTaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        employees={employees || []}
        task={editingTask}
        onEditTask={handleUpdateTask}
      />

      <TaskDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        task={viewingTask}
        employees={employees || []}
        currentUser={currentUser}
        onAddComment={handleAddComment}
        onAddAttachment={handleAddAttachment}
        onDeleteAttachment={handleDeleteAttachment}
      />

      <AlertDialog open={!!deleteTaskId} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task from your workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
