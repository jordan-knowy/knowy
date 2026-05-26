import { meetings } from '../../data/mock/meetings';
import { contacts } from '../../data/mock/contacts';
import { cognitiveProfiles } from '../../data/mock/cognitiveProfiles';
import { supabase } from '../supabase';
import { getCognitiveProfile, getContact } from './contacts';
import { getActiveOrganizationId } from './org';
import type { CognitiveProfile, Contact, Meeting } from '../../types/domain';

export interface MeetingParticipantProfile {
  contact: Contact;
  profile: CognitiveProfile | null;
}

export async function listMeetings(): Promise<Meeting[]> {
  const organizationId = await getActiveOrganizationId();

  if (supabase && organizationId) {
    const { data, error } = await supabase
      .from('meetings')
      .select('id, title, starts_at, importance_score, brief_status, companies(name)')
      .eq('organization_id', organizationId)
      .order('starts_at', { ascending: true });

    if (!error && data?.length) {
      const participants = await supabase
        .from('meeting_participants')
        .select('meeting_id, contact_id')
        .eq('organization_id', organizationId);

      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        company: row.companies?.name ?? '',
        startsAt: row.starts_at ?? new Date().toISOString(),
        participantContactIds: (participants.data ?? [])
          .filter((item: any) => item.meeting_id === row.id && item.contact_id)
          .map((item: any) => item.contact_id),
        importanceScore: row.importance_score,
        briefStatus: row.brief_status,
      }));
    }
  }

  return meetings;
}

export async function getMeeting(meetingId: string): Promise<Meeting | null> {
  const liveMeeting = (await listMeetings()).find((meeting) => meeting.id === meetingId);
  if (liveMeeting) return liveMeeting;

  return meetings.find((meeting) => meeting.id === meetingId) ?? null;
}

export async function getMeetingParticipants(meetingId: string): Promise<MeetingParticipantProfile[]> {
  const meeting = await getMeeting(meetingId);
  if (!meeting) return [];

  const liveContacts = await Promise.all(
    meeting.participantContactIds.map(async (contactId) => {
      const contact = (await getContact(contactId)) ?? contacts.find((item) => item.id === contactId);
      if (!contact) return null;

      return {
        contact,
        profile:
          (await getCognitiveProfile(contactId)) ??
          cognitiveProfiles.find((profile) => profile.contactId === contactId) ??
          null,
      };
    }),
  );

  return liveContacts.filter((item): item is MeetingParticipantProfile => Boolean(item));
}
