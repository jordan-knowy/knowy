export type ID = string;
export type ISODate = string;
export type Score = number;

export type InferenceLevel = 'observable' | 'inferred' | 'hypothetical' | 'unavailable';

export type SourceKind =
  | 'gmail'
  | 'calendar'
  | 'linkedin_public'
  | 'crm'
  | 'slack'
  | 'meeting_transcript'
  | 'public_news'
  | 'knowy_memory';

export interface EvidenceSource {
  id: ID;
  kind: SourceKind;
  label: string;
  observedAt?: ISODate | null;
}

export type InteractionAxis =
  | 'relation_result'
  | 'intuition_structure'
  | 'caution_speed'
  | 'consensus_control';

export type InteractionMode =
  | 'Challenger'
  | 'Validator'
  | 'Strategist'
  | 'Operator'
  | 'Consensus Builder'
  | 'Explorer';

export interface Contact {
  id: ID;
  name: string;
  title: string;
  company: string;
  companyLogo?: string;
  avatar?: string;
  email?: string;
  linkedinUrl?: string;
}

export interface Meeting {
  id: ID;
  title: string;
  company: string;
  startsAt: ISODate;
  participantContactIds: ID[];
  importanceScore: Score;
  briefStatus: 'to_generate' | 'queued' | 'generating' | 'ready' | 'failed' | 'insufficient_data' | 'consulted';
}

export interface BehavioralSignal {
  id: ID;
  type: string;
  text: string;
  inference: string | null;
  level: InferenceLevel;
  confidence: Score;
  sourceType: SourceKind | string;
  sourceRef: string | null;
  observedAt: ISODate | null;
}

export interface InteractionAxisScore {
  axis: InteractionAxis;
  value: Score;
  confidence: Score;
  level: InferenceLevel;
  evidenceCount: number;
}

export interface InteractionModeScore {
  mode: InteractionMode;
  score: Score;
  confidence: Score;
  evidenceCount: number;
}

export interface RelationshipEdge {
  fromContactId: ID;
  toContactId: ID;
  relationType: 'reports_to' | 'influences' | 'validates' | 'blocks' | 'collaborates_with' | 'unknown';
  strength: Score;
  confidence: Score;
  sourceType: SourceKind | string;
}

export interface CognitiveProfile {
  contactId: ID;
  profileVersion: number;
  globalConfidence: Score;
  summary: string | null;
  axes: InteractionAxisScore[];
  interactionModes: InteractionModeScore[];
  signals: BehavioralSignal[];
  relationships: RelationshipEdge[];
  updatedFrom: string[];
}

export interface RelationListItem {
  contact: Contact;
  profile: CognitiveProfile | null;
  relationshipStrength: Score;
  primaryMode: InteractionMode | null;
  activeSignals: BehavioralSignal[];
}

