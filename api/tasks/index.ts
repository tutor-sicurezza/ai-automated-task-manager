export const runtime = 'edge';

import { createSupabaseAdminClient, ensureTenantMembership, getAuthenticatedUser, jsonResponse, withErrors } from '../_lib/supabase.js';

export const fetch = withErrors(async (request: Request) => {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    return jsonResponse({ error: 'tenantId is required' }, { status: 400 });
  }

  const user = await getAuthenticatedUser(request);
  await ensureTenantMembership(user.id, tenantId);

  const admin = createSupabaseAdminClient();

  if (request.method === 'GET') {
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');

    let query = admin
      .from('tasks')
      .select('*')
      .eq('organization_id', tenantId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) {
      return jsonResponse({ error: error.message }, { status: 500 });
    }

    return jsonResponse({ tasks: data ?? [] });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === 'string' ? body.title.trim() : '';

    if (!title) {
      return jsonResponse({ error: 'Task title is required' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('tasks')
      .insert({
        organization_id: tenantId,
        title,
        description: typeof body.description === 'string' ? body.description : '',
        assignee_id: typeof body.assigneeId === 'string' && body.assigneeId ? body.assigneeId : null,
        priority: body.priority === 'high' || body.priority === 'medium' || body.priority === 'low' ? body.priority : 'medium',
        status: body.status === 'completed' || body.status === 'in-progress' ? body.status : 'not-started',
        due_date: typeof body.dueDate === 'string' ? body.dueDate : new Date().toISOString(),
        created_by: user.id,
      })
      .select('*')
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, { status: 500 });
    }

    return jsonResponse({ task: data }, { status: 201 });
  }

  return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
});
