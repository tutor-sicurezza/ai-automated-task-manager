export const runtime = 'edge';

import { createSupabaseAdminClient, ensureTenantMembership, getAuthenticatedUser, jsonResponse } from '../../_lib/supabase';

export default async function handler(request: Request, context: { params: { tenantId: string } }) {
  const user = await getAuthenticatedUser(request);
  const tenantId = context.params.tenantId;
  const admin = createSupabaseAdminClient();

  await ensureTenantMembership(user.id, tenantId);

  if (request.method === 'GET') {
    const { data, error } = await admin
      .from('organization_members')
      .select('id, role, created_at, users:profiles(id, full_name, avatar_url, email)')
      .eq('organization_id', tenantId)
      .order('created_at', { ascending: true });

    if (error) {
      return jsonResponse({ error: error.message }, { status: 500 });
    }

    return jsonResponse({ members: data ?? [] });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role = body.role === 'owner' || body.role === 'admin' || body.role === 'member' ? body.role : 'member';

    if (!email) {
      return jsonResponse({ error: 'Email is required' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      return jsonResponse({ error: profileError.message }, { status: 500 });
    }

    if (!profile) {
      return jsonResponse({
        error: 'User profile not found yet. Invite flow should be wired to auth before adding members.',
      }, { status: 404 });
    }

    const { data, error } = await admin
      .from('organization_members')
      .upsert(
        {
          organization_id: tenantId,
          user_id: profile.id,
          role,
        },
        {
          onConflict: 'organization_id,user_id',
        }
      )
      .select('*')
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, { status: 500 });
    }

    return jsonResponse({ member: data }, { status: 201 });
  }

  return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
}
