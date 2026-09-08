export const runtime = 'edge';

import { createSupabaseAdminClient, ensureTenantAdmin, ensureTenantMembership, getAuthenticatedUser, jsonResponse, withErrors } from '../../_lib/supabase.js';

export const fetch = withErrors(async (request: Request) => {
  const user = await getAuthenticatedUser(request);

  // Il routing generato da Vercel riscrive questa rotta come
  //   /api/tenants/[tenantId]/members?tenantId=$1
  // quindi l'id arriva in query string. Il fallback legge il segmento di path
  // nel caso la rotta venga invocata direttamente.
  const url = new URL(request.url);
  // Indicizzazione esplicita invece di .at(-2): Vercel compila le funzioni di
  // api/ con il tsconfig.json di root, che ha target ES2020, dove
  // Array.prototype.at non esiste. Il nostro tsconfig.api.json usa ES2022 e
  // quindi non intercettava l'errore — il build passava in locale e falliva
  // sulla piattaforma.
  const segments = url.pathname.split('/').filter(Boolean);
  const tenantId =
    url.searchParams.get('tenantId') ??
    (segments.length >= 2 ? segments[segments.length - 2] : '') ??
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
    const callerMembership = await ensureTenantAdmin(user.id, tenantId);

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role =
      body.role === 'owner' || body.role === 'admin' || body.role === 'member'
        ? body.role
        : 'member';

    // Solo il proprietario puo' conferire la proprieta'. Senza questo controllo
    // un 'admin' poteva assegnare 'owner' a se stesso e poi declassare il vero
    // proprietario a 'member': l'upsert su (organization_id, user_id) aggiorna
    // una membership esistente, non crea solo inviti. Presa di controllo
    // completa dell'organizzazione partendo da admin.
    if (role === 'owner' && callerMembership.role !== 'owner') {
      return jsonResponse(
        { error: 'Solo il proprietario puo assegnare il ruolo owner' },
        { status: 403 }
      );
    }

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

    let memberId = profile?.id;
    let createdPassword: string | null = null;

    if (!profile) {
      // L'utente non esiste ancora: lo crea l'amministratore.
      // Questo e' l'UNICO percorso di creazione account previsto — la
      // registrazione autonoma va disattivata in Supabase (Authentication ->
      // Sign In / Providers -> "Allow new users to sign up").
      const fullName =
        typeof body.fullName === 'string' && body.fullName.trim()
          ? body.fullName.trim()
          : email.split('@')[0];

      // Password temporanea: finche' non e' configurato un provider email,
      // non esiste modo di recapitarla, quindi viene restituita all'admin
      // nella risposta perche' la consegni lui.
      // Costante tipizzata a parte: `body` e' `any`, quindi assegnare
      // direttamente a createdPassword (string | null) non restringe il tipo e
      // password: string | null non e' accettato da createUser.
      const password: string =
        typeof body.password === 'string' && body.password.length >= 8
          ? body.password
          : `Tf-${crypto.randomUUID().slice(0, 12)}!`;

      createdPassword = password;

      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

      if (createError || !created?.user) {
        return jsonResponse(
          { error: createError?.message ?? 'Creazione utente fallita' },
          { status: 500 }
        );
      }

      memberId = created.user.id;

      const { error: insertProfileError } = await admin.from('profiles').insert({
        id: memberId,
        email,
        full_name: fullName,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(memberId)}`,
      });

      if (insertProfileError) {
        return jsonResponse({ error: insertProfileError.message }, { status: 500 });
      }
    }

    // L'upsert aggiorna una membership esistente: senza questo controllo un
    // 'admin' potrebbe declassare il proprietario, che perderebbe i privilegi
    // e non potrebbe piu' annullare la modifica.
    const { data: targetMembership } = await admin
      .from('organization_members')
      .select('role')
      .eq('organization_id', tenantId)
      .eq('user_id', memberId)
      .maybeSingle();

    if (
      targetMembership?.role === 'owner' &&
      callerMembership.role !== 'owner'
    ) {
      return jsonResponse(
        { error: 'Solo il proprietario puo modificare il proprio ruolo' },
        { status: 403 }
      );
    }

    const { data, error } = await admin
      .from('organization_members')
      .upsert(
        {
          organization_id: tenantId,
          user_id: memberId,
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

    // temporaryPassword compare solo quando l'account e' stato appena creato.
    return jsonResponse(
      createdPassword
        ? { member: data, temporaryPassword: createdPassword }
        : { member: data },
      { status: 201 }
    );
  }

  return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
});
