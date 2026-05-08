import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PencilSimple, Trash, UserPlus, Users } from '@phosphor-icons/react';
import { Employee } from '@/lib/types';
import { toast } from 'sonner';

interface UsersManagementProps {
  employees: Employee[];
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onEditEmployee: (id: string, updates: Omit<Employee, 'id'>) => void;
  onDeleteEmployee: (id: string) => void;
  taskCounts: Map<string, number>;
}

export function UsersManagement({ employees, onAddEmployee, onEditEmployee, onDeleteEmployee, taskCounts }: UsersManagementProps) {
  const [open, setOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    avatar: '',
  });

  const handleAddEmployee = () => {
    if (!formData.name.trim() || !formData.role.trim()) {
      toast.error('Name and role are required');
      return;
    }

    const avatarUrl = formData.avatar.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`;

    onAddEmployee({
      name: formData.name.trim(),
      role: formData.role.trim(),
      avatar: avatarUrl,
    });

    setFormData({ name: '', role: '', avatar: '' });
    setAddDialogOpen(false);
  };

  const handleEditEmployee = () => {
    if (!editingEmployee) return;
    
    if (!formData.name.trim() || !formData.role.trim()) {
      toast.error('Name and role are required');
      return;
    }

    const avatarUrl = formData.avatar.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`;

    onEditEmployee(editingEmployee.id, {
      name: formData.name.trim(),
      role: formData.role.trim(),
      avatar: avatarUrl,
    });

    setFormData({ name: '', role: '', avatar: '' });
    setEditingEmployee(null);
    setEditDialogOpen(false);
  };

  const handleDeleteEmployee = () => {
    if (!deletingEmployee) return;
    
    onDeleteEmployee(deletingEmployee.id);
    setDeletingEmployee(null);
    setDeleteDialogOpen(false);
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      role: employee.role,
      avatar: employee.avatar,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (employee: Employee) => {
    setDeletingEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Users className="mr-2 h-5 w-5" weight="bold" />
        Manage Users
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">User Management</DialogTitle>
            <DialogDescription>
              Add, edit, or remove team members from your workspace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Team Members</h3>
                <p className="text-2xl font-semibold">{employees.length}</p>
              </div>
              <Button onClick={() => setAddDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" weight="bold" />
                Add User
              </Button>
            </div>

            <div className="grid gap-3">
              {employees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" weight="light" />
                  <h3 className="text-lg font-medium mb-2">No team members yet</h3>
                  <p className="text-muted-foreground mb-4">Add your first team member to get started</p>
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" weight="bold" />
                    Add User
                  </Button>
                </div>
              ) : (
                employees.map((employee) => {
                  const taskCount = taskCounts.get(employee.id) || 0;
                  return (
                    <Card key={employee.id} className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-12 w-12 border-2 border-background">
                            <AvatarImage src={employee.avatar} alt={employee.name} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(employee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{employee.name}</h4>
                            <p className="text-sm text-muted-foreground truncate">{employee.role}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{taskCount}</div>
                            <div className="text-xs text-muted-foreground">
                              {taskCount === 1 ? 'task' : 'tasks'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(employee)}
                          >
                            <PencilSimple className="h-4 w-4" weight="bold" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(employee)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash className="h-4 w-4" weight="bold" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-role">Role *</Label>
              <Input
                id="add-role"
                placeholder="Senior Developer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-avatar">Avatar URL (optional)</Label>
              <Input
                id="add-avatar"
                placeholder="https://example.com/avatar.jpg"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to auto-generate an avatar
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddDialogOpen(false);
              setFormData({ name: '', role: '', avatar: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddEmployee}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role *</Label>
              <Input
                id="edit-role"
                placeholder="Senior Developer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-avatar">Avatar URL</Label>
              <Input
                id="edit-avatar"
                placeholder="https://example.com/avatar.jpg"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setEditingEmployee(null);
              setFormData({ name: '', role: '', avatar: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditEmployee}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deletingEmployee?.name}</strong> from your team?
              {taskCounts.get(deletingEmployee?.id || '') ? (
                <span className="block mt-2 text-amber-600 dark:text-amber-500 font-medium">
                  ⚠️ This user has {taskCounts.get(deletingEmployee?.id || '')} assigned task(s). Those tasks will become unassigned.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setDeletingEmployee(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
