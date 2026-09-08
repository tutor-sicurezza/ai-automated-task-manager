export const runtime = 'edge';

import { createSupabaseAdminClient, ensureTenantAdmin, ensureTenantMembership, getAuthenticatedUser, jsonResponse, withErrors } from '../../_lib/supabase.js';

export const fetch = withErrors(async (request: Request) => {
  const user = await getAuthenticatedUser(request);

  // Il routing generato da Vercel riscrive questa rotta come
  //   /api/tenants/[tenantId]/members?tenantId=$1
  // quindi l'id arriva in query string. Il fallback legge il segmento di path
  // nel caso la rotta venga invocata direttamente.
  const url = new URL(request.url);
  const tenantId =
    url.searchParams.get('tenantId') ??
    url.pathname.split('/').filter(Boolean).at(-2) ??
    '';

  if (!tenantId) {
    return jsonResponse({ error: 'tenantId mancante' }, { status: 400 });
  }

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
    // Aggiungere membri o assegnare ruoli e' un'operazione amministrativa.
    // Senza questo controllo un 'member' poteva promuoversi da solo: gli
    // handler usano il client service role, che ignora le policy RLS.
    await ensureTenantAdmin(user.id, tenantId);

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
});
