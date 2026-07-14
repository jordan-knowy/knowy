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
  if (!supabase || !organizationId) return [];

  const { data, error } = await supabase
    .from('contacts')
    .select('id, full_name, email, role_title, linkedin_url, avatar_url, companies(name)')
    .eq('organization_id', organizationId)
    // Exclure les contacts fusionnés dans un autre
    .is('merged_into_contact_id', null)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('listContacts:', error.message);
    return [];
  }
  return (data ?? []).map(mapContact);
}

// ── Fusion de contacts (homonymes / multi-emails) ────────────────────────────

/** Tokens normalisés d'un nom : minuscule, sans accents, mots de >1 lettre */
function nameTokens(name: string): string[] {
  return (name || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // retire accents
    .toLowerCase()
    .replace(/[._-]/g, ' ')              // sépare aussi les usernames type mia.perrotin.pro
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/).filter(t => t.length > 1);
}

// Mots à ignorer dans le matching (usernames d'email)
const NAME_STOPWORDS = new Set(['pro', 'perso', 'contact', 'pro1', 'me', 'gmail']);

/** Deux noms désignent probablement la même personne si le plus petit jeu de
 *  tokens (hors stopwords) est inclus dans l'autre, avec ≥2 tokens en commun. */
function sameName(a: string, b: string): boolean {
  const ta = nameTokens(a).filter(t => !NAME_STOPWORDS.has(t));
  const tb = nameTokens(b).filter(t => !NAME_STOPWORDS.has(t));
  if (ta.length < 2 || tb.length < 2) return false;
  const setA = new Set(ta), setB = new Set(tb);
  const common = [...setA].filter(t => setB.has(t));
  const smaller = Math.min(setA.size, setB.size);
  return common.length >= 2 && common.length === smaller;
}

export interface MergeCandidate {
  id: string;
  name: string;
  email: string | null;
  enrichmentStatus: string;
  emailCount: number;
  meetingCount: number;
}

/** Trouve les contacts au nom identique mais email différent (doublons probables) */
export async function findMergeCandidates(contactId: string): Promise<MergeCandidate[]> {
  const organizationId = await getActiveOrganizationId();
  if (!supabase || !organizationId) return [];

  const { data: target } = await supabase
    .from('contacts')
    .select('id, full_name, email')
    .eq('id', contactId)
    .maybeSingle();
  if (!target?.full_name) return [];

  // Charge tous les contacts non-fusionnés de l'org
  const { data: all } = await supabase
    .from('contacts')
    .select('id, full_name, email, enrichment_status')
    .eq('organization_id', organizationId)
    .is('merged_into_contact_id', null)
    .neq('id', contactId);

  const matches = (all ?? []).filter((c: any) =>
    c.full_name &&
    sameName(c.full_name, target.full_name) &&
    (c.email ?? '').toLowerCase() !== (target.email ?? '').toLowerCase()
  );
  if (matches.length === 0) return [];

  // Compte emails + réunions pour chaque candidat
  const results: MergeCandidate[] = [];
  for (const c of matches) {
    const [{ count: emailCount }, { count: meetingCount }] = await Promise.all([
      supabase.from('communication_messages').select('id', { count: 'exact', head: true }).eq('contact_id', c.id),
      supabase.from('meeting_participants').select('id', { count: 'exact', head: true }).eq('contact_id', c.id),
    ]);
    results.push({
      id: c.id,
      name: c.full_name,
      email: c.email,
      enrichmentStatus: c.enrichment_status,
      emailCount: emailCount ?? 0,
      meetingCount: meetingCount ?? 0,
    });
  }
  return results;
}

/** Fusionne le contact secondaire dans le primaire (re-pointe échanges + réunions) */
export async function mergeContacts(primaryId: string, secondaryId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.rpc('merge_contacts', {
    primary_id: primaryId,
    secondary_id: secondaryId,
  });
  if (error) { console.error('merge_contacts error:', error.message); return false; }
  return true;
}

/** Annule une fusion */
export async function unmergeContact(secondaryId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.rpc('unmerge_contact', { secondary_id: secondaryId });
  if (error) { console.error('unmerge_contact error:', error.message); return false; }
  return true;
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

  return null;
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

  return null;
}

export async function getRelationListItems(): Promise<RelationListItem[]> {
  const organizationId = await getActiveOrganizationId();

  if (supabase && organizationId) {
    const { data: contactRows, error } = await supabase
      .from('contacts')
      .select('id, full_name, email, role_title, linkedin_url, avatar_url, companies(name)')
      .eq('organization_id', organizationId)
      // Exclure les contacts fusionnés dans un autre
      .is('merged_into_contact_id', null)
      .order('updated_at', { ascending: false });

    if (!error && contactRows?.length) {
      const mappedContacts = contactRows.map(mapContact);
      const contactIds = mappedContacts.map(c => c.id);

      // Fetch latest cognitive profile per contact
      const { data: profileRows } = await supabase
        .from('cognitive_profiles')
        .select('contact_id, global_confidence, summary, updated_from')
        .eq('organization_id', organizationId)
        .in('contact_id', contactIds)
        .order('profile_version', { ascending: false });

      // Fetch behavioral signals for all contacts
      const { data: signalRows } = await supabase
        .from('behavioral_signals')
        .select('contact_id, signal_type, text, inference, inference_level, confidence, source_type, source_ref, observed_at')
        .eq('organization_id', organizationId)
        .in('contact_id', contactIds)
        .order('created_at', { ascending: false });

      // Build profile map (first = latest version per contact)
      const profileMap = new Map<string, CognitiveProfile>();
      for (const row of profileRows ?? []) {
        if (!profileMap.has(row.contact_id)) {
          const contactSignals = (signalRows ?? [])
            .filter((s: any) => s.contact_id === row.contact_id)
            .slice(0, 5)
            .map((s: any) => ({
              id: s.id ?? crypto.randomUUID(),
              type: s.signal_type,
              text: s.text,
              inference: s.inference,
              level: s.inference_level,
              confidence: s.confidence,
              sourceType: s.source_type,
              sourceRef: s.source_ref,
              observedAt: s.observed_at,
            }));

          profileMap.set(row.contact_id, {
            contactId: row.contact_id,
            profileVersion: 1,
            globalConfidence: row.global_confidence,
            summary: row.summary,
            updatedFrom: row.updated_from ?? [],
            axes: [],
            interactionModes: [],
            signals: contactSignals,
            relationships: [],
          });
        }
      }

      return mappedContacts.map(contact => {
        const profile = profileMap.get(contact.id) ?? null;
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
  }

  return [];
}
