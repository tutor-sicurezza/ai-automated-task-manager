/**
 * Vercel Function: Complete a task using Claude AI.
 *
 * This endpoint processes task completion requests by:
 * 1. Validating the task data and organization membership
 * 2. Calling Claude API with task context
 * 3. Saving the AI-generated completion notes to the database
 * 4. Returning the updated task with Claude's completion output
 *
 * Runtime: edge (Vercel Edge Functions)
 */
export const runtime = 'edge';

import Anthropic from '@anthropic-ai/sdk';

import {
  createSupabaseAdminClient,
  ensureTenantRole,
  getAuthenticatedUser,
  jsonResponse,
  withErrors,
} from '../_lib/supabase.js';
import {
  creaClientAnthropic,
  classificaErroreAI,
  corpoErroreAI,
} from '../_lib/aiProvider.js';

/**
 * Modello e parametri per la completion dei task.
 * Usa un modello più capace per task completion rispetto al default.
 */
const COMPLETION_MODEL = 'claude-3-5-sonnet-20241022';
const MAX_OUTPUT_TOKENS = 2048;
const MAX_PROMPT_CHARS = 10000;

/**
 * Rate limiting per task completion: 30 calls per hour per user
 */
const COMPLETION_RATE_LIMIT = readLimit('AI_COMPLETION_RATE_LIMIT_HOUR', 30);

function readLimit(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

interface CompleteTaskRequest {
  /** Organization ID (tenant) */
  tenantId: string;
  /** Task ID to complete */
  taskId: string;
  /** Task title for context */
  taskTitle: string;
  /** Task description for context */
  taskDescription: string;
  /** Custom prompt/instructions for completion (optional) */
  customPrompt?: string;
  /** Task status (should be 'completed' after this call) */
  targetStatus: 'completed';
}

interface CompleteTaskResponse {
  success: boolean;
  taskId: string;
  completionNotes?: string;
  model: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
  error?: string;
}

export const fetch = withErrors(async (request: Request) => {
  const user = await getAuthenticatedUser(request);

  if (request.method !== 'POST') {
    return jsonResponse(
      { error: 'method_not_allowed', message: 'Only POST is allowed' },
      { status: 405 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    return jsonResponse(
      {
        error: 'ai_non_configurata',
        message: 'ANTHROPIC_API_KEY is not configured',
      },
      { status: 503 }
    );
  }

  // Parse and validate request body
  let body: Record<string, unknown>;
  try {
    const letto: unknown = await request.json();
    if (!letto || typeof letto !== 'object' || Array.isArray(letto)) {
      throw new Error('Request body must be a JSON object');
    }
    body = letto as Record<string, unknown>;
  } catch (e) {
    return jsonResponse(
      {
        error: 'corpo_non_valido',
        message: e instanceof Error ? e.message : 'Invalid request body',
      },
      { status: 400 }
    );
  }

  // Validate required fields
  const tenantId = typeof body.tenantId === 'string' ? body.tenantId : '';
  const taskId = typeof body.taskId === 'string' ? body.taskId : '';
  const taskTitle = typeof body.taskTitle === 'string' ? body.taskTitle : '';
  const taskDescription = typeof body.taskDescription === 'string' ? body.taskDescription : '';
  const customPrompt = typeof body.customPrompt === 'string' ? body.customPrompt?.trim() : '';
  const targetStatus = body.targetStatus === 'completed' ? 'completed' : '';

  if (!tenantId) {
    return jsonResponse(
      { error: 'tenant_mancante', message: 'tenantId is required' },
      { status: 400 }
    );
  }

  if (!taskId) {
    return jsonResponse(
      { error: 'task_mancante', message: 'taskId is required' },
      { status: 400 }
    );
  }

  if (!taskTitle) {
    return jsonResponse(
      { error: 'title_mancante', message: 'taskTitle is required' },
      { status: 400 }
    );
  }

  if (!targetStatus) {
    return jsonResponse(
      { error: 'status_non_valido', message: 'targetStatus must be "completed"' },
      { status: 400 }
    );
  }

  // Verify user membership and role
  await ensureTenantRole(user.id, tenantId, 'member');

  // Check rate limiting
  const admin = createSupabaseAdminClient();
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: usageData, error: usageError } = await admin
    .from('ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', windowStart);

  if (usageError) {
    console.error('[complete-with-claude] rate limit check failed:', usageError.message);
    return jsonResponse(
      { error: 'verifica_limiti_fallita', message: usageError.message },
      { status: 500 }
    );
  }

  const completionCount = (usageData?.length ?? 0);
  if (completionCount >= COMPLETION_RATE_LIMIT) {
    return jsonResponse(
      {
        error: 'limite_richieste_superato',
        message: `Completion rate limit reached (${COMPLETION_RATE_LIMIT} per hour)`,
        limit: COMPLETION_RATE_LIMIT,
        retryAfterSeconds: 3600,
      },
      { status: 429, headers: { 'retry-after': '3600' } }
    );
  }

  // Build the completion prompt
  const systemPrompt = `You are a task completion assistant. Your role is to provide concise, professional completion notes for a task that has been marked as done. The notes should:
- Summarize what was accomplished
- Be clear and actionable for team members reviewing the work
- Be professional but friendly in tone
- Be concise (2-3 sentences maximum)
- Include any relevant outcomes or deliverables

Format your response as a single paragraph of completion notes.`;

  const userPrompt = customPrompt
    ? `Task: "${taskTitle}"
Description: ${taskDescription}

Custom instructions: ${customPrompt}

Please provide completion notes based on the above information.`
    : `Task: "${taskTitle}"
Description: ${taskDescription}

Please provide completion notes for this completed task.`;

  if (userPrompt.length > MAX_PROMPT_CHARS) {
    return jsonResponse(
      {
        error: 'prompt_troppo_lungo',
        message: `Prompt exceeds ${MAX_PROMPT_CHARS} character limit`,
      },
      { status: 413 }
    );
  }

  // Call Claude API
  const client = creaClientAnthropic(apiKey);
  let response: Anthropic.Message;

  try {
    response = await client.messages.create({
      model: COMPLETION_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      output_config: {
        effort: 'low',
      },
    });
  } catch (e) {
    const errore = classificaErroreAI(e);
    console.error(
      `[complete-with-claude] Claude API call failed (${errore.codice}):`,
      errore.message
    );
    return jsonResponse(corpoErroreAI(errore), { status: errore.stato });
  }

  // Extract completion notes from response
  if (response.stop_reason === 'refusal') {
    return jsonResponse(
      {
        error: 'risposta_rifiutata',
        message: 'Claude refused to complete this request',
      },
      { status: 422 }
    );
  }

  const completionNotes = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  if (!completionNotes) {
    return jsonResponse(
      {
        error: 'risposta_vuota',
        message: 'No completion notes were generated',
      },
      { status: 502 }
    );
  }

  // Log API usage
  const { error: logError } = await admin.from('ai_usage').insert({
    organization_id: tenantId,
    user_id: user.id,
    model: response.model,
    input_tokens: response.usage?.input_tokens ?? 0,
    output_tokens: response.usage?.output_tokens ?? 0,
  });

  if (logError) {
    console.error('[complete-with-claude] Failed to log usage:', logError.message);
  }

  // Save completion notes to task (in comments or activities)
  // This creates an activity record showing the task was completed with AI assistance
  const completionActivity = {
    id: crypto.randomUUID?.() || Date.now().toString(),
    userId: user.id,
    userName: 'Claude AI',
    userAvatar: '🤖',
    type: 'status_changed' as const,
    oldValue: 'in-progress',
    newValue: 'completed',
    details: `AI Completion: ${completionNotes}`,
    createdAt: new Date().toISOString(),
  };

  // Update task status and add completion activity
  const { error: updateError } = await admin
    .from('tasks')
    .update({
      status: 'completed',
      activities: admin.from('tasks')
        .select('activities')
        .eq('id', taskId)
        .single()
        .then(({ data }) => [...(data?.activities ?? []), completionActivity]),
    })
    .eq('id', taskId)
    .eq('organization_id', tenantId);

  if (updateError) {
    console.error('[complete-with-claude] Failed to update task:', updateError.message);
    return jsonResponse(
      { error: 'update_fallito', message: 'Failed to save completion to task' },
      { status: 500 }
    );
  }

  return jsonResponse(
    {
      success: true,
      taskId,
      completionNotes,
      model: response.model,
      tokensUsed: {
        input: response.usage?.input_tokens ?? 0,
        output: response.usage?.output_tokens ?? 0,
      },
    } as CompleteTaskResponse,
    { status: 200 }
  );
});
