import { createClient } from '@supabase/supabase-js';
import { getRequiredEnv } from './env';

export function createSupabaseAdminClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getRequiredEnv();

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseAuthClient(accessToken: string) {
  const { supabaseUrl, supabaseAnonKey } = getRequiredEnv();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    throw new Response(JSON.stringify({ error: 'Missing authorization token' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const client = createSupabaseAuthClient(token);
  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  return data.user;
}

export async function ensureTenantMembership(userId: string, tenantId: string) {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from('organization_members')
    .select('organization_id, role')
    .eq('organization_id', tenantId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!data) {
    throw new Response(JSON.stringify({ error: 'You do not belong to this tenant' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });
  }

  return data;
}

export function jsonResponse(payload: unknown, init?: ResponseInit) {
  return Response.json(payload, init);
}
