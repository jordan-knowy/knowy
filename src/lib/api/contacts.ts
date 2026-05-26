import { contacts } from '../../data/mock/contacts';
import { cognitiveProfiles } from '../../data/mock/cognitiveProfiles';
import { supabase } from '../supabase';
import { getActiveOrganizationId } from './org';
import type { CognitiveProfile, Contact, RelationListItem } from '../../types/domain';

function mapContact(row: any): Contact {
  return {
    id: row.id,
    name: row.full_name,
    title: row.role_title ?? '',
    company: row.companies?.name ?? row.company_name ?? '',
    avatar: row.avatar_url ?? undefined,
    email: row.email ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
  };
}

export async function listContacts(): Promise<Contact[]> {
  const organizationId = await getActiveOrganizationId();

  if (supabase && organizationId) {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, full_name, email, role_title, linkedin_url, avatar_url, companies(name)')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (!error && data?.length) {
      return data.map(mapContact);
    }
  }

  return contacts;
}

export async function getContact(contactId: string): Promise<Contact | null> {
  const organizationId = await getActiveOrganizationId();

  if (supabase && organizationId) {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, full_name, email, role_title, linkedin_url, avatar_url, companies(name)')
      .eq('organization_id', organizationId)
      .eq('id', contactId)
      .maybeSingle();

    if (!error && data) {
      return mapContact(data);
    }
  }

  return contacts.find((contact) => contact.id === contactId) ?? null;
}

export async function getCognitiveProfile(contactId: string): Promise<CognitiveProfile | null> {
  const organizationId = await getActiveOrganizationId();

  if (supabase && organizationId) {
    const { data: profile, error } = await supabase
      .from('cognitive_profiles')
      .select('id, contact_id, profile_version, global_confidence, summary, updated_from')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .order('profile_version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && profile) {
      const [{ data: axes }, { data: modes }, { data: signals }, { data: relationships }] = await Promise.all([
        supabase.from('interaction_axis_scores').select('*').eq('profile_id', profile.id),
        supabase.from('interaction_mode_scores').select('*').eq('profile_id', profile.id),
        supabase.from('behavioral_signals').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('relationship_edges').select('*').eq('from_contact_id', contactId),
      ]);

      return {
        contactId: profile.contact_id,
        profileVersion: profile.profile_version,
        globalConfidence: profile.global_confidence,
        summary: profile.summary,
        updatedFrom: profile.updated_from ?? [],
        axes: (axes ?? []).map((axis: any) => ({
          axis: axis.axis,
          value: axis.value,
          confidence: axis.confidence,
          level: axis.inference_level,
          evidenceCount: axis.evidence_count,
        })),
        interactionModes: (modes ?? []).map((mode: any) => ({
          mode: mode.mode,
          score: mode.score,
          confidence: mode.confidence,
          evidenceCount: mode.evidence_count,
        })),
        signals: (signals ?? []).map((signal: any) => ({
          id: signal.id,
          type: signal.signal_type,
          text: signal.text,
          inference: signal.inference,
          level: signal.inference_level,
          confidence: signal.confidence,
          sourceType: signal.source_type,
          sourceRef: signal.source_ref,
          observedAt: signal.observed_at,
        })),
        relationships: (relationships ?? []).map((edge: any) => ({
          fromContactId: edge.from_contact_id,
          toContactId: edge.to_contact_id,
          relationType: edge.relation_type,
          strength: edge.strength,
          confidence: edge.confidence,
          sourceType: edge.source_type,
        })),
      };
    }
  }

  return cognitiveProfiles.find((profile) => profile.contactId === contactId) ?? null;
}

export async function getRelationListItems(): Promise<RelationListItem[]> {
  return contacts.map((contact) => {
    const profile = cognitiveProfiles.find((item) => item.contactId === contact.id) ?? null;
    const primaryMode = profile?.interactionModes[0]?.mode ?? null;

    return {
      contact,
      profile,
      relationshipStrength: profile?.globalConfidence ?? 0,
      primaryMode,
      activeSignals: profile?.signals.slice(0, 2) ?? [],
    };
  });
}
