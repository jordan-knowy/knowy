import { z } from 'zod';

export const inferenceLevelSchema = z.enum(['observable', 'inferred', 'hypothetical', 'unavailable']);

export const interactionAxisKeySchema = z.enum([
  'relation_result',
  'intuition_structure',
  'caution_speed',
  'consensus_control',
]);

export const interactionModeSchema = z.enum([
  'Challenger',
  'Validator',
  'Strategist',
  'Operator',
  'Consensus Builder',
  'Explorer',
]);

export const axisScoreSchema = z.object({
  axis: interactionAxisKeySchema,
  value: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  level: inferenceLevelSchema,
  evidenceCount: z.number().int().min(0),
});

export const modeScoreSchema = z.object({
  mode: interactionModeSchema,
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  evidenceCount: z.number().int().min(0),
});

export const behavioralSignalSchema = z.object({
  id: z.string(),
  type: z.string(),
  text: z.string(),
  inference: z.string().nullable(),
  level: inferenceLevelSchema,
  confidence: z.number().min(0).max(100),
  sourceType: z.string(),
  sourceRef: z.string().nullable(),
  observedAt: z.string().nullable(),
});

export const relationshipEdgeSchema = z.object({
  fromContactId: z.string(),
  toContactId: z.string(),
  relationType: z.enum(['reports_to', 'influences', 'validates', 'blocks', 'collaborates_with', 'unknown']),
  strength: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  sourceType: z.string(),
});

export const cognitiveProfileSchema = z.object({
  contactId: z.string(),
  profileVersion: z.number().int().min(1),
  globalConfidence: z.number().min(0).max(100),
  summary: z.string().nullable(),
  axes: z.array(axisScoreSchema),
  interactionModes: z.array(modeScoreSchema),
  signals: z.array(behavioralSignalSchema),
  relationships: z.array(relationshipEdgeSchema),
  updatedFrom: z.array(z.string()),
});

export type InferenceLevel = z.infer<typeof inferenceLevelSchema>;
export type InteractionAxisKey = z.infer<typeof interactionAxisKeySchema>;
export type InteractionMode = z.infer<typeof interactionModeSchema>;
export type CognitiveProfile = z.infer<typeof cognitiveProfileSchema>;
export type BehavioralSignal = z.infer<typeof behavioralSignalSchema>;
export type InteractionAxisScore = z.infer<typeof axisScoreSchema>;
export type InteractionModeScore = z.infer<typeof modeScoreSchema>;
export type RelationshipEdge = z.infer<typeof relationshipEdgeSchema>;

