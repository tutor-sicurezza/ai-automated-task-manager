export const runtime = 'edge';

import { createSupabaseAdminClient, ensureTenantMembership, getAuthenticatedUser, jsonResponse } from '../_lib/supabase';

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get('tenantId');

  if (!tenantId) {
    return jsonResponse({ error: 'tenantId is required' }, { status: 400 });
  }

  const user = await getAuthenticatedUser(request);
  await ensureTenantMembership(user.id, tenantId);

  const admin = createSupabaseAdminClient();

  if (request.method === 'GET') {
    const recipientId = url.searchParams.get('userId') || user.id;

    const { data, error } = await admin
      .from('notifications')
      .select('*')
      .eq('organization_id', tenantId)
      .eq('user_id', recipientId)
      .order('created_at', { ascending: false });

    if (error) {
      return jsonResponse({ error: error.message }, { status: 500 });
    }

    return jsonResponse({ notifications: data ?? [] });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const recipientId = typeof body.userId === 'string' ? body.userId : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const type = typeof body.type === 'string' ? body.type : 'task_updated';

    if (!recipientId || !message) {
      return jsonResponse({ error: 'userId and message are required' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('notifications')
      .insert({
        organization_id: tenantId,
        user_id: recipientId,
        task_id: body.taskId || null,
        task_title: typeof body.taskTitle === 'string' ? body.taskTitle : null,
        type,
        message,
        action_by: user.id,
        read: false,
      })
      .select('*')
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, { status: 500 });
    }

    return jsonResponse({ notification: data }, { status: 201 });
  }

  return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
}
