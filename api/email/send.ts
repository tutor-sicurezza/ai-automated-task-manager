export const runtime = 'edge';

import { createSupabaseAdminClient, ensureTenantMembership, getAuthenticatedUser, jsonResponse } from '../_lib/supabase';
import { getRequiredEnv } from '../_lib/env';

export default async function handler(request: Request) {
  const { resendApiKey } = getRequiredEnv();

  if (!resendApiKey) {
    return jsonResponse({ error: 'RESEND_API_KEY is not configured' }, { status: 503 });
  }

  const user = await getAuthenticatedUser(request);
  const body = await request.json().catch(() => ({}));
  const tenantId = typeof body.tenantId === 'string' ? body.tenantId : '';

  if (!tenantId) {
    return jsonResponse({ error: 'tenantId is required' }, { status: 400 });
  }

  await ensureTenantMembership(user.id, tenantId);

  const to = typeof body.to === 'string' ? body.to.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const html = typeof body.htmlContent === 'string' ? body.htmlContent : '';
  const text = typeof body.textContent === 'string' ? body.textContent : '';

  if (!to || !subject || (!html && !text)) {
    return jsonResponse({ error: 'to, subject, and textContent/htmlContent are required' }, { status: 400 });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: body.from || 'TaskFlow <no-reply@taskflow.local>',
      to: [to],
      subject,
      html: html || undefined,
      text: text || undefined,
      tags: [
        { name: 'tenant_id', value: tenantId },
        { name: 'sent_by', value: user.id },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return jsonResponse({ error: 'Email send failed', details: payload }, { status: response.status });
  }

  const admin = createSupabaseAdminClient();
  await admin.from('email_delivery_logs').insert({
    organization_id: tenantId,
    user_id: body.userId || user.id,
    recipient_email: to,
    subject,
    provider: 'resend',
    status: 'sent',
    provider_message_id: payload?.id || null,
  });

  return jsonResponse({ ok: true, providerResponse: payload }, { status: 201 });
}
