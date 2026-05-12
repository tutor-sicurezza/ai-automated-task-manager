export const runtime = 'edge';

import { createSupabaseAdminClient, ensureTenantMembership, getAuthenticatedUser, jsonResponse } from '../_lib/supabase';
import { getRequiredEnv } from '../_lib/env';

async function sendViaSendGrid(
  apiKey: string,
  to: string,
  subject: string,
  html: string,
  text: string,
  from: string,
  tenantId: string,
  userId: string
) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }],
          custom_args: {
            tenant_id: tenantId,
            sent_by: userId,
          },
        },
      ],
      from: {
        email: from.includes('<') ? from.match(/<(.+)>/)?.[1] || from : from,
        name: from.includes('<') ? from.split('<')[0].trim() : 'TaskFlow',
      },
      subject,
      content: [
        ...(text ? [{ type: 'text/plain', value: text }] : []),
        ...(html ? [{ type: 'text/html', value: html }] : []),
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error: ${response.status} ${errorText}`);
  }

  const messageId = response.headers.get('X-Message-Id');
  return { id: messageId, provider: 'sendgrid' };
}

async function sendViaResend(
  apiKey: string,
  to: string,
  subject: string,
  html: string,
  text: string,
  from: string,
  tenantId: string,
  userId: string
) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: html || undefined,
      text: text || undefined,
      tags: [
        { name: 'tenant_id', value: tenantId },
        { name: 'sent_by', value: userId },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Resend API error: ${response.status} ${JSON.stringify(payload)}`);
  }

  return { id: payload?.id, provider: 'resend' };
}

export default async function handler(request: Request) {
  const { resendApiKey, sendgridApiKey } = getRequiredEnv();

  if (!resendApiKey && !sendgridApiKey) {
    return jsonResponse(
      {
        error: 'Email service not configured',
        message: 'Neither RESEND_API_KEY nor SENDGRID_API_KEY is configured',
      },
      { status: 503 }
    );
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
  const from = body.from || 'TaskFlow <no-reply@taskflow.local>';
  const preferredProvider = body.provider || (sendgridApiKey ? 'sendgrid' : 'resend');

  if (!to || !subject || (!html && !text)) {
    return jsonResponse({ error: 'to, subject, and textContent/htmlContent are required' }, { status: 400 });
  }

  try {
    let result: { id: string | null; provider: string };

    if (preferredProvider === 'sendgrid' && sendgridApiKey) {
      result = await sendViaSendGrid(sendgridApiKey, to, subject, html, text, from, tenantId, user.id);
    } else if (preferredProvider === 'resend' && resendApiKey) {
      result = await sendViaResend(resendApiKey, to, subject, html, text, from, tenantId, user.id);
    } else if (sendgridApiKey) {
      result = await sendViaSendGrid(sendgridApiKey, to, subject, html, text, from, tenantId, user.id);
    } else if (resendApiKey) {
      result = await sendViaResend(resendApiKey, to, subject, html, text, from, tenantId, user.id);
    } else {
      return jsonResponse({ error: 'No email provider available' }, { status: 503 });
    }

    const admin = createSupabaseAdminClient();
    await admin.from('email_delivery_logs').insert({
      organization_id: tenantId,
      user_id: body.userId || user.id,
      recipient_email: to,
      subject,
      provider: result.provider,
      status: 'sent',
      provider_message_id: result.id || null,
    });

    return jsonResponse(
      {
        ok: true,
        provider: result.provider,
        messageId: result.id,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const admin = createSupabaseAdminClient();
    await admin.from('email_delivery_logs').insert({
      organization_id: tenantId,
      user_id: body.userId || user.id,
      recipient_email: to,
      subject,
      provider: preferredProvider,
      status: 'failed',
      error_message: errorMessage,
    });

    return jsonResponse(
      {
        error: 'Email send failed',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
