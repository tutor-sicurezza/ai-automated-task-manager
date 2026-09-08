export const runtime = 'edge';

import { createSupabaseAdminClient, getAuthenticatedUser, jsonResponse, withErrors } from '../_lib/supabase.js';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const fetch = withErrors(async (request: Request) => {
  const user = await getAuthenticatedUser(request);
  const admin = createSupabaseAdminClient();

  if (request.method === 'GET') {
    const { data, error } = await admin
      .from('organization_members')
      .select('role, organizations(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return jsonResponse({ error: error.message }, { status: 500 });
    }

    return jsonResponse({ tenants: data ?? [] });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return jsonResponse({ error: 'Tenant name is required' }, { status: 400 });
    }

    const slug = typeof body.slug === 'string' && body.slug.trim()
      ? slugify(body.slug)
      : slugify(name);

    const { data: organization, error: organizationError } = await admin
      .from('organizations')
      .insert({
        name,
        slug,
        owner_id: user.id,
      })
      .select('*')
      .single();

    if (organizationError) {
      return jsonResponse({ error: organizationError.message }, { status: 500 });
    }

    const { error: membershipError } = await admin.from('organization_members').insert({
      organization_id: organization.id,
      user_id: user.id,
      role: 'owner',
    });

    if (membershipError) {
      return jsonResponse({ error: membershipError.message }, { status: 500 });
    }

    return jsonResponse({ tenant: organization }, { status: 201 });
  }

  return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
});
