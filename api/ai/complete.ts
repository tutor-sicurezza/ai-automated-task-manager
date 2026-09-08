import Anthropic from '@anthropic-ai/sdk';

import {
  ensureTenantMembership,
  getAuthenticatedUser,
  jsonResponse,
  withErrors,
} from '../_lib/supabase.js';

/**
 * Endpoint unico per tutte le funzioni AI dell'app.
 *
 * Perche' esiste: i componenti AI chiamavano window.spark.llm DAL BROWSER.
 * Funzionava solo perche' il runtime GitHub Spark faceva da proxy con le proprie
 * credenziali. Con un provider vero quel percorso non e' replicabile: una chiave
 * API nel bundle del client e' leggibile da chiunque apra i DevTools. La chiave
 * resta quindi qui, lato server, e il client passa da questa rotta.
 *
 * Chi puo' chiamarlo: solo utenti autenticati e membri dell'organizzazione
 * indicata. Senza questo controllo l'endpoint sarebbe un modo gratuito per
 * chiunque di consumare token a spese del titolare della chiave.
 */

const DEFAULT_MODEL = 'claude-opus-5';

export const fetch = withErrors(async (request: Request) => {
  const user = await getAuthenticatedUser(request);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse(
      {
        error: 'AI service not configured',
        message: 'ANTHROPIC_API_KEY is not set',
      },
      { status: 503 }
    );
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
  }

  const body = await request.json().catch(() => ({}));
  const tenantId = typeof body.tenantId === 'string' ? body.tenantId : '';
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const wantsJson = body.json === true;
  const schema = body.schema && typeof body.schema === 'object' ? body.schema : null;
  const model = typeof body.model === 'string' && body.model ? body.model : DEFAULT_MODEL;

  if (!tenantId) {
    return jsonResponse({ error: 'tenantId is required' }, { status: 400 });
  }
  if (!prompt) {
    return jsonResponse({ error: 'prompt is required' }, { status: 400 });
  }

  await ensureTenantMembership(user.id, tenantId);

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
    // Quando il chiamante fornisce uno schema il formato e' garantito dall'API,
    // non semplicemente richiesto nel prompt: JSON.parse lato client non puo'
    // piu' fallire su output malformato.
    ...(wantsJson && schema
      ? { output_config: { format: { type: 'json_schema' as const, schema } } }
      : {}),
  });

  // stop_reason 'refusal' arriva con HTTP 200 e content vuoto: leggere
  // content[0] senza controllare esploderebbe.
  if (response.stop_reason === 'refusal') {
    return jsonResponse(
      { error: 'Request declined', message: 'Il modello ha rifiutato la richiesta.' },
      { status: 422 }
    );
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  if (!text) {
    return jsonResponse({ error: 'Empty response from model' }, { status: 502 });
  }

  if (wantsJson) {
    // Senza schema il modello puo' incorniciare il JSON in un blocco markdown.
    // Lo ripuliamo e validiamo QUI: meglio un errore esplicito lato server che
    // un JSON.parse che esplode dentro un componente React.
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');

    try {
      JSON.parse(cleaned);
    } catch {
      return jsonResponse(
        { error: 'Model did not return valid JSON', raw: text.slice(0, 500) },
        { status: 502 }
      );
    }

    return jsonResponse({ text: cleaned, model: response.model });
  }

  return jsonResponse({ text, model: response.model });
});
