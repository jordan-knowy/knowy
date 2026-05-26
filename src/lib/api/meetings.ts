import { meetings as mockMeetings } from '../../data/mock/meetings';
import { contacts as mockContacts } from '../../data/mock/contacts';
import { cognitiveProfiles } from '../../data/mock/cognitiveProfiles';
import { supabase } from '../supabase';
import { getCognitiveProfile, getContact } from './contacts';
import { getActiveOrganizationId } from './org';
import type { CognitiveProfile, Contact, Meeting } from '../../types/domain';

export interface RawParticipant {
  id: string;
  email: string | null;
  displayName: string | null;
  responseStatus: string | null;
  contactId: string | null;
}

export interface MeetingParticipantProfile {
  contact: Contact;
  profile: CognitiveProfile | null;
  raw: RawParticipant | null;
}

export async function listMeetings(): Promise<Meeting[]> {
  const organizationId = await getActiveOrganizationId();

  if (supabase && organizationId) {
    const { data, error } = await supabase
      .from('meetings')
      .select('id, title, starts_at, ends_at, importance_score, brief_status, company, location, format, platform, is_external')
      .eq('organization_id', organizationId)
      .order('starts_at', { ascending: true });

    if (!error && data?.length) {
      const { data: parts } = await supabase
        .from('meeting_participants')
        .select('meeting_id, contact_id')
        .eq('organization_id', organizationId);

      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        company: row.company ?? '',
        startsAt: row.starts_at ?? new Date().toISOString(),
        endsAt: row.ends_at ?? null,
        location: row.location ?? null,
        format: row.format ?? row.platform ?? 'video',
        isExternal: row.is_external ?? true,
        participantContactIds: (parts ?? [])
          .filter((p: any) => p.meeting_id === row.id && p.contact_id)
          .map((p: any) => p.contact_id),
        importanceScore: row.importance_score,
        briefStatus: row.brief_status,
      }));
    }
  }

  return mockMeetings;
}

export async function getMeeting(meetingId: string): Promise<Meeting | null> {
  if (supabase) {
    const { data } = await supabase
      .from('meetings')
      .select('id, title, starts_at, ends_at, importance_score, brief_status, company, location, format, platform, is_external')
      .eq('id', meetingId)
      .maybeSingle();
    if (data) {
      return {
        id: data.id,
        title: data.title,
        company: (data as any).company ?? '',
        startsAt: data.starts_at ?? new Date().toISOString(),
        endsAt: (data as any).ends_at ?? null,
        location: (data as any).location ?? null,
        format: (data as any).format ?? (data as any).platform ?? 'video',
        isExternal: (data as any).is_external ?? true,
        participantContactIds: [],
        importanceScore: data.importance_score,
        briefStatus: data.brief_status,
      } as Meeting;
    }
  }
  return mockMeetings.find(m => m.id === meetingId) ?? null;
}

/**
 * Load all participants for a meeting from meeting_participants.
 * Also auto-creates contacts in the contacts table for external participants.
 */
export async function getMeetingParticipants(meetingId: string): Promise<MeetingParticipantProfile[]> {
  if (!supabase) {
    // Fall back to mock
    const meeting = mockMeetings.find(m => m.id === meetingId);
    if (!meeting) return [];
    const results = await Promise.all(
      meeting.participantContactIds.map(async cid => {
        const contact = mockContacts.find(c => c.id === cid);
        if (!contact) return null;
        return { contact, profile: cognitiveProfiles.find(p => p.contactId === cid) ?? null, raw: null };
      })
    );
    return results.filter(Boolean) as MeetingParticipantProfile[];
  }

  const orgId = await getActiveOrganizationId();
  if (!orgId) return [];

  // Load raw participants
  const { data: rawParts } = await (supabase as any)
    .from('meeting_participants')
    .select('id, email, display_name, name, response_status, contact_id, is_current_user')
    .eq('meeting_id', meetingId)
    .eq('is_current_user', false);

  if (!rawParts?.length) return [];

  const results: MeetingParticipantProfile[] = [];

  for (const p of rawParts) {
    const displayName = p.display_name || p.name || (p.email ? p.email.split('@')[0] : 'Participant');
    const domain = p.email ? p.email.split('@')[1] : null;
    const company = domain ? domain.split('.')[0] : '';

    let contactId = p.contact_id;

    // Auto-create contact if not yet linked
    if (!contactId && p.email) {
      // Check if contact already exists for this email + org
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', orgId)
        .eq('email', p.email)
        .maybeSingle();

      if (existing) {
        contactId = existing.id;
      } else {
        // Create new contact
        const { data: created } = await supabase
          .from('contacts')
          .insert({
            organization_id: orgId,
            full_name: displayName,
            email: p.email,
            source_summary: {
              company,
              source: 'meeting_participant',
              ai_enrichment_pending: true,
            },
          })
          .select('id')
          .single();
        if (created) contactId = created.id;
      }

      // Link participant to contact
      if (contactId) {
        await supabase
          .from('meeting_participants')
          .update({ contact_id: contactId })
          .eq('id', p.id);
      }
    }

    const raw: RawParticipant = {
      id: p.id,
      email: p.email,
      displayName,
      responseStatus: p.response_status,
      contactId,
    };

    if (contactId) {
      const contact = await getContact(contactId);
      const profile = await getCognitiveProfile(contactId);
      if (contact) {
        results.push({ contact, profile, raw });
        continue;
      }
    }

    // No contact linked — build a minimal contact from participant data
    const minContact: Contact = {
      id: p.id,
      name: displayName,
      title: '',
      company,
      linkedinUrl: null,
      phase: 'growth',
      engagementScore: 0,
    };
    results.push({ contact: minContact, profile: null, raw });
  }

  return results;
}
