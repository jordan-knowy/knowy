import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string; self?: boolean }>;
  organizer?: { email: string; displayName?: string };
  hangoutLink?: string;
  conferenceData?: { entryPoints?: Array<{ uri: string; entryPointType: string }> };
  status?: string;
  htmlLink?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Auth: Supabase JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Missing authorization header' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Verify the user via their JWT
  const jwt = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const { organizationId, providerToken } = body;

  if (!organizationId) return jsonResponse({ error: 'organizationId is required' }, 400);
  if (!providerToken) return jsonResponse({ error: 'providerToken is required — please reconnect your Google account' }, 400);

  // Fetch calendar events from Google Calendar API
  const now = new Date();
  const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
  const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ahead

  let events: GoogleEvent[] = [];

  try {
    const calRes = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events?` +
      `timeMin=${encodeURIComponent(timeMin)}&` +
      `timeMax=${encodeURIComponent(timeMax)}&` +
      `singleEvents=true&` +
      `orderBy=startTime&` +
      `maxResults=250`,
      {
        headers: {
          Authorization: `Bearer ${providerToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!calRes.ok) {
      const errText = await calRes.text();
      console.error('Google Calendar API error:', calRes.status, errText);

      if (calRes.status === 401) {
        // Update connector status to indicate re-auth needed
        await supabase
          .from('connectors')
          .update({ status: 'needs_reauth', updated_at: new Date().toISOString() })
          .eq('organization_id', organizationId)
          .eq('user_id', user.id)
          .eq('provider', 'google');

        return jsonResponse({
          error: 'Google token expired. Please sign out and sign back in with Google to refresh your Calendar access.',
          code: 'TOKEN_EXPIRED',
        }, 401);
      }

      return jsonResponse({ error: `Google Calendar API error: ${calRes.status}` }, 502);
    }

    const calData = await calRes.json();
    events = (calData.items || []) as GoogleEvent[];
  } catch (e) {
    console.error('Fetch error:', e);
    return jsonResponse({ error: 'Failed to reach Google Calendar API' }, 502);
  }

  // Filter: only meetings with external attendees
  const meetingEvents = events.filter(e => {
    if (e.status === 'cancelled') return false;
    const attendees = e.attendees || [];
    const hasOthers = attendees.some(a => !a.self);
    return hasOthers && e.summary;
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const event of meetingEvents) {
    const startsAt = event.start?.dateTime || event.start?.date;
    const endsAt = event.end?.dateTime || event.end?.date;
    if (!startsAt || !endsAt) { skipped++; continue; }

    const attendees = (event.attendees || []).filter(a => !a.self);
    const externalAttendees = attendees.filter(a => {
      const domain = a.email.split('@')[1] || '';
      const userDomain = user.email?.split('@')[1] || '';
      return domain !== userDomain;
    });
    const isExternal = externalAttendees.length > 0;

    // Get video link
    const videoLink = event.hangoutLink ||
      event.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri ||
      null;

    // Get company from first external attendee domain
    const firstExternal = externalAttendees[0];
    const company = firstExternal
      ? firstExternal.displayName?.split(' ').slice(-1)[0] || firstExternal.email.split('@')[1]?.split('.')[0] || ''
      : '';

    // Upsert meeting
    const meetingData = {
      organization_id: organizationId,
      owner_user_id: user.id,
      user_id: user.id,
      title: event.summary || 'Réunion sans titre',
      company: company || null,
      description: event.description || null,
      location: event.location || videoLink || null,
      starts_at: startsAt,
      ends_at: endsAt,
      platform: videoLink ? 'video' : (event.location ? 'physical' : 'video'),
      format: videoLink ? 'video' : (event.location ? 'physical' : 'video'),
      is_external: isExternal,
      brief_status: 'to_generate',
      external_event_id: event.id,
      external_calendar_url: event.htmlLink || null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('meetings')
      .select('id, brief_status')
      .eq('organization_id', organizationId)
      .eq('external_event_id', event.id)
      .maybeSingle();

    if (existing) {
      // Don't overwrite brief_status if already generated
      const updateData = { ...meetingData };
      if (existing.brief_status && existing.brief_status !== 'to_generate') {
        delete (updateData as any).brief_status;
      }
      await supabase.from('meetings').update(updateData).eq('id', existing.id);
      updated++;

      // Update participants
      await syncParticipants(supabase, existing.id, organizationId, attendees);
    } else {
      const { data: newMeeting } = await supabase
        .from('meetings')
        .insert(meetingData)
        .select('id')
        .single();

      if (newMeeting) {
        created++;
        await syncParticipants(supabase, newMeeting.id, organizationId, attendees);
      }
    }
  }

  // Update connector — stocke aussi le token pour que ingest-communication puisse l'utiliser
  const { data: existingConn } = await supabase
    .from('connectors')
    .select('metadata')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .maybeSingle();

  await supabase
    .from('connectors')
    .update({
      status: 'connected',
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        ...(existingConn?.metadata ?? {}),
        access_token: providerToken,
        token_stored_at: new Date().toISOString(),
      },
    })
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('provider', 'google');

  return jsonResponse({
    success: true,
    stats: {
      total_events: events.length,
      meeting_events: meetingEvents.length,
      created,
      updated,
      skipped,
    },
  });
});

async function syncParticipants(
  supabase: ReturnType<typeof createClient>,
  meetingId: string,
  organizationId: string,
  attendees: Array<{ email: string; displayName?: string; responseStatus?: string; self?: boolean }>
) {
  if (!attendees.length) return;

  // Delete existing and re-insert
  await supabase.from('meeting_participants').delete().eq('meeting_id', meetingId);

  const participants = attendees.map(a => ({
    meeting_id: meetingId,
    organization_id: organizationId,
    email: a.email,
    display_name: a.displayName || a.email.split('@')[0],
    name: a.displayName || a.email.split('@')[0],
    response_status: a.responseStatus || 'needsAction',
    is_current_user: false,
  }));

  await supabase.from('meeting_participants').insert(participants);
}
