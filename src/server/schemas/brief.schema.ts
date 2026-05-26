import { z } from 'zod';
import { cognitiveProfileSchema } from './cognitive-profile.schema';

export const briefTypeSchema = z.enum(['commercial', 'partnership', 'productivity']);
export const briefStatusSchema = z.enum(['queued', 'generating', 'ready', 'failed', 'insufficient_data']);

export const briefSourceSchema = z.object({
  type: z.string(),
  label: z.string(),
  weight: z.number().min(0).max(1),
  status: z.enum(['connected', 'missing', 'available', 'revoked']),
  lastSyncedAt: z.string().nullable(),
});

export const briefInsightSchema = z.object({
  id: z.string(),
  section: z.string(),
  text: z.string(),
  confidence: z.number().min(0).max(100),
  inferenceLevel: z.enum(['observable', 'inferred', 'hypothetical', 'unavailable']),
  sourceIds: z.array(z.string()),
});

export const meetingBriefSchema = z.object({
  id: z.string(),
  meetingId: z.string(),
  type: briefTypeSchema,
  status: briefStatusSchema,
  confidenceScore: z.number().min(0).max(100),
  participantProfiles: z.array(cognitiveProfileSchema),
  sources: z.array(briefSourceSchema),
  insights: z.array(briefInsightSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MeetingBrief = z.infer<typeof meetingBriefSchema>;

