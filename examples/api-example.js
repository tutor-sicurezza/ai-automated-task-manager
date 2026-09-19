/**
 * AI AUTOMATED TASK MANAGER — API Examples
 *
 * This file demonstrates how to use the REST API from JavaScript/Node.js
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login failed:', error.message);
    return null;
  }

  console.log('Logged in as:', data.user.email);
  return data.session.access_token;
}

async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Logout failed:', error);
}

// ============================================================================
// TASKS
// ============================================================================

async function listTasks(filters = {}) {
  let query = supabase
    .from('tasks')
    .select('*');

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters.department_id) {
    query = query.eq('department_id', filters.department_id);
  }
  if (filters.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }

  // Sorting
  query = query.order(filters.order_by || 'created_at', {
    ascending: filters.ascending !== false,
  });

  const { data, error } = await query.limit(filters.limit || 25);

  if (error) {
    console.error('Failed to fetch tasks:', error.message);
    return [];
  }

  return data;
}

async function getTask(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) {
    console.error('Failed to fetch task:', error.message);
    return null;
  }

  return data;
}

async function createTask(taskData) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      title: taskData.title,
      description: taskData.description || '',
      status: 'todo',
      priority: taskData.priority || 'normal',
      assigned_to: taskData.assigned_to || null,
      department_id: taskData.department_id,
      due_date: taskData.due_date || null,
      labels: taskData.labels || [],
      approval_required: taskData.approval_required || false,
      recurrence: taskData.recurrence || null,
    }])
    .select()
    .single();

  if (error) {
    console.error('Failed to create task:', error.message);
    return null;
  }

  console.log('Task created:', data.id);
  return data;
}

async function updateTask(taskId, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update task:', error.message);
    return null;
  }

  console.log('Task updated:', taskId);
  return data;
}

async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Failed to delete task:', error.message);
    return false;
  }

  console.log('Task deleted:', taskId);
  return true;
}

// ============================================================================
// COMMENTS
// ============================================================================

async function listComments(taskId) {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch comments:', error.message);
    return [];
  }

  return data;
}

async function addComment(taskId, content, attachments = []) {
  const { data, error } = await supabase
    .from('task_comments')
    .insert([{
      task_id: taskId,
      content,
      attachments,
    }])
    .select()
    .single();

  if (error) {
    console.error('Failed to add comment:', error.message);
    return null;
  }

  console.log('Comment added to task:', taskId);
  return data;
}

// ============================================================================
// APPROVALS
// ============================================================================

async function requestApproval(taskId, requiredRole, description) {
  const { data, error } = await supabase
    .from('approvals')
    .insert([{
      task_id: taskId,
      required_role: requiredRole,
      description,
      status: 'pending',
    }])
    .select()
    .single();

  if (error) {
    console.error('Failed to request approval:', error.message);
    return null;
  }

  console.log('Approval requested for task:', taskId);
  return data;
}

async function approveTask(approvalId, comment = '') {
  const { data, error } = await supabase
    .from('approvals')
    .update({
      status: 'approved',
      comment,
      approved_at: new Date().toISOString(),
    })
    .eq('id', approvalId)
    .select()
    .single();

  if (error) {
    console.error('Failed to approve task:', error.message);
    return null;
  }

  console.log('Task approved');
  return data;
}

async function rejectTask(approvalId, comment = '') {
  const { data, error } = await supabase
    .from('approvals')
    .update({
      status: 'rejected',
      comment,
      rejected_at: new Date().toISOString(),
    })
    .eq('id', approvalId)
    .select()
    .single();

  if (error) {
    console.error('Failed to reject task:', error.message);
    return null;
  }

  console.log('Task rejected');
  return data;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

async function listNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Failed to fetch notifications:', error.message);
    return [];
  }

  return data;
}

async function markNotificationRead(notificationId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) {
    console.error('Failed to mark notification as read:', error.message);
    return null;
  }

  return data;
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

async function main() {
  try {
    // 1. Login
    await login('user@example.com', 'password');

    // 2. List tasks
    const tasks = await listTasks({
      status: 'todo',
      priority: 'urgent',
      limit: 10,
    });
    console.log('Your tasks:', tasks);

    // 3. Create a new task
    if (tasks[0]?.department_id) {
      const newTask = await createTask({
        title: 'New API task',
        description: 'Created via API example',
        priority: 'high',
        department_id: tasks[0].department_id,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      });

      if (newTask) {
        // 4. Add a comment
        await addComment(newTask.id, 'This task was created via API');

        // 5. Update task status
        await updateTask(newTask.id, {
          status: 'in_progress',
        });

        // 6. Get updated task
        const updated = await getTask(newTask.id);
        console.log('Updated task:', updated);

        // 7. List comments
        const comments = await listComments(newTask.id);
        console.log('Task comments:', comments);
      }
    }

    // 8. List notifications
    const notifications = await listNotifications();
    console.log('Unread notifications:', notifications.filter(n => !n.read_at));

    // 9. Mark notification as read
    if (notifications[0]) {
      await markNotificationRead(notifications[0].id);
    }

    // 10. Logout
    await logout();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export functions for use in other modules
module.exports = {
  login,
  logout,
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  listComments,
  addComment,
  requestApproval,
  approveTask,
  rejectTask,
  listNotifications,
  markNotificationRead,
};
