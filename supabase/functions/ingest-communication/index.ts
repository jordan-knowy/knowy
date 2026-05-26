import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await req.json().catch(() => null);

  if (!body?.organizationId || !body?.sourceType || !body?.text) {
    return jsonResponse({ error: 'organizationId, sourceType and text are required' }, 400);
  }

  return jsonResponse({
    threadId: null,
    messageId: null,
    signalsQueued: false,
    message: 'Stub function. Implement authorized text ingestion in Phase Fonction integration.',
  });
});

