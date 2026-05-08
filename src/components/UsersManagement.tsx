import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PencilSimple, Trash, UserPlus, Users, MagnifyingGlass, Briefcase, Buildings, EnvelopeSimple, Phone, CheckCircle, XCircle, UserCircle } from '@phosphor-icons/react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [activeTab, setActiveTab] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    avatar: '',
    email: '',
    department: '',
    phone: '',
    status: 'active' as 'active' | 'inactive',
  });

  const departments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(emp => {
      if (emp.department) depts.add(emp.department);
    });
    return Array.from(depts).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    let filtered = [...employees];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(query) ||
        emp.role.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query) ||
        emp.department?.toLowerCase().includes(query)
      );
    }

    if (filterDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === filterDepartment);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(emp => emp.status === filterStatus);
    }

    if (activeTab !== 'all') {
      if (activeTab === 'active') {
        filtered = filtered.filter(emp => emp.status === 'active');
      } else if (activeTab === 'inactive') {
        filtered = filtered.filter(emp => emp.status === 'inactive');
      }
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, searchQuery, filterDepartment, filterStatus, activeTab]);

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'active').length;
    const inactive = employees.filter(e => e.status === 'inactive').length;
    const withTasks = Array.from(taskCounts.values()).filter(count => count > 0).length;
    
    return { total, active, inactive, withTasks };
  }, [employees, taskCounts]);

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      avatar: '',
      email: '',
      department: '',
      phone: '',
      status: 'active',
    });
  };

  const handleAddEmployee = () => {
    if (!formData.name.trim() || !formData.role.trim()) {
      toast.error('Name and role are required');
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const avatarUrl = formData.avatar.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`;

    onAddEmployee({
      name: formData.name.trim(),
      role: formData.role.trim(),
      avatar: avatarUrl,
      email: formData.email.trim() || undefined,
      department: formData.department.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      status: formData.status,
      joinedDate: new Date().toISOString(),
    });

    resetForm();
    setAddDialogOpen(false);
  };

  const handleEditEmployee = () => {
    if (!editingEmployee) return;
    
    if (!formData.name.trim() || !formData.role.trim()) {
      toast.error('Name and role are required');
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const avatarUrl = formData.avatar.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`;

    onEditEmployee(editingEmployee.id, {
      name: formData.name.trim(),
      role: formData.role.trim(),
      avatar: avatarUrl,
      email: formData.email.trim() || undefined,
      department: formData.department.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      status: formData.status,
      joinedDate: editingEmployee.joinedDate,
    });

    resetForm();
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
      email: employee.email || '',
      department: employee.department || '',
      phone: employee.phone || '',
      status: employee.status,
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

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Users className="mr-2 h-5 w-5" weight="bold" />
        Manage Users
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">User Management</DialogTitle>
            <DialogDescription>
              Manage your team members, roles, and departments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <UserCircle className="w-5 h-5 text-primary" weight="bold" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">Total Users</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="w-5 h-5 text-green-600" weight="bold" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{stats.active}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <XCircle className="w-5 h-5 text-muted-foreground" weight="bold" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{stats.inactive}</div>
                    <div className="text-xs text-muted-foreground">Inactive</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/50">
                    <Briefcase className="w-5 h-5 text-accent-foreground" weight="bold" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">{stats.withTasks}</div>
                    <div className="text-xs text-muted-foreground">With Tasks</div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" weight="bold" />
                <Input
                  placeholder="Search by name, role, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setAddDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" weight="bold" />
                Add User
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All ({employees.length})</TabsTrigger>
                <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
                <TabsTrigger value="inactive">Inactive ({stats.inactive})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" weight="light" />
                    <h3 className="text-lg font-medium mb-2">
                      {employees.length === 0 ? 'No team members yet' : 'No users found'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {employees.length === 0 
                        ? 'Add your first team member to get started'
                        : 'Try adjusting your search or filters'}
                    </p>
                    {employees.length === 0 && (
                      <Button onClick={() => setAddDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" weight="bold" />
                        Add User
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredEmployees.map((employee) => {
                      const taskCount = taskCounts.get(employee.id) || 0;
                      return (
                        <Card key={employee.id} className="p-4 hover:bg-accent/50 transition-colors">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 border-2 border-background flex-shrink-0">
                              <AvatarImage src={employee.avatar} alt={employee.name} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(employee.name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-base truncate">{employee.name}</h4>
                                    <Badge variant={employee.status === 'active' ? 'default' : 'secondary'} className="flex-shrink-0">
                                      {employee.status === 'active' ? (
                                        <CheckCircle className="w-3 h-3 mr-1" weight="fill" />
                                      ) : (
                                        <XCircle className="w-3 h-3 mr-1" weight="fill" />
                                      )}
                                      {employee.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    <Briefcase className="w-4 h-4 flex-shrink-0" weight="bold" />
                                    <span className="truncate">{employee.role}</span>
                                  </div>
                                  {employee.department && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                      <Buildings className="w-4 h-4 flex-shrink-0" weight="bold" />
                                      <span className="truncate">{employee.department}</span>
                                    </div>
                                  )}
                                  {employee.email && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                      <EnvelopeSimple className="w-4 h-4 flex-shrink-0" weight="bold" />
                                      <span className="truncate">{employee.email}</span>
                                    </div>
                                  )}
                                  {employee.phone && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Phone className="w-4 h-4 flex-shrink-0" weight="bold" />
                                      <span>{employee.phone}</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                  <div className="text-right">
                                    <div className="text-lg font-semibold">{taskCount}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {taskCount === 1 ? 'task' : 'tasks'}
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Joined {formatDate(employee.joinedDate)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 flex-shrink-0">
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
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your team
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="add-name">Full Name *</Label>
              <Input
                id="add-name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-role">Job Title *</Label>
              <Input
                id="add-role"
                placeholder="Senior Developer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-department">Department</Label>
              <Input
                id="add-department"
                placeholder="Engineering"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email Address</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-phone">Phone Number</Label>
              <Input
                id="add-phone"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}>
                <SelectTrigger id="add-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="add-avatar">Avatar URL</Label>
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
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddEmployee}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setEditingEmployee(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member information
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Job Title *</Label>
              <Input
                id="edit-role"
                placeholder="Senior Developer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                placeholder="Engineering"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
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
              resetForm();
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
