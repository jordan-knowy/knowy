import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await req.json().catch(() => null);

  if (!body?.organizationId || !body?.meetingId) {
    return jsonResponse({ error: 'organizationId and meetingId are required' }, 400);
  }

  return jsonResponse({
    briefId: null,
    meetingId: body.meetingId,
    status: 'queued',
    confidenceScore: null,
    message: 'Stub function. Implement source-grounded generation in Phase Fonction integration.',
  });
});

