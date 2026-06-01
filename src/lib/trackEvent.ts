/**
 * trackEvent — fire-and-forget behavioral analytics
 * Logs user behavior events to user_behavior_events table.
 * Never blocks the UI, errors are silently swallowed.
 */
import { supabase } from './supabase';
import { getActiveOrganizationId } from './api/org';

let _userId: string | null = null;
let _orgId: string | null = null;

async function resolveIds(): Promise<{ userId: string; orgId: string | null } | null> {
  if (!supabase) return null;
  try {
    if (!_userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      _userId = user.id;
    }
    if (!_orgId) {
      _orgId = await getActiveOrganizationId();
    }
    return { userId: _userId, orgId: _orgId };
  } catch { return null; }
}

export interface BehaviorEvent {
  event_type: string;
  entity_id?: string;
  entity_type?: 'meeting' | 'contact';
  tab?: string;
  duration_ms?: number;
  metadata?: Record<string, unknown>;
}

export function trackEvent(event: BehaviorEvent): void {
  // Non-bloquant — on ne await pas
  resolveIds().then(ids => {
    if (!ids || !supabase) return;
    (supabase.from('user_behavior_events') as any).insert({
      user_id: ids.userId,
      organization_id: ids.orgId,
      event_type: event.event_type,
      entity_id: event.entity_id ?? null,
      entity_type: event.entity_type ?? null,
      tab: event.tab ?? null,
      duration_ms: event.duration_ms ?? null,
      metadata: event.metadata ?? null,
      created_at: new Date().toISOString(),
    }).then(() => {}).catch(() => {});
  }).catch(() => {});
}

// Reset du cache (ex: après logout)
export function resetTrackingCache(): void {
  _userId = null;
  _orgId = null;
}
