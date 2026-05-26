import type { MeetingBrief } from '../../server/schemas/brief.schema';
import { supabase } from '../supabase';
import { getActiveOrganizationId } from './org';

export async function generateBrief(meetingId: string): Promise<Pick<MeetingBrief, 'meetingId' | 'status'>> {
  const organizationId = await getActiveOrganizationId();

  if (supabase && organizationId) {
    const { data, error } = await supabase.functions.invoke('generate-brief', {
      body: {
        organizationId,
        meetingId,
        forceRefresh: false,
      },
    });

    if (!error && data?.status) {
      return {
        meetingId: data.meetingId ?? meetingId,
        status: data.status,
      };
    }
  }

  return {
    meetingId,
    status: 'queued',
  };
}
