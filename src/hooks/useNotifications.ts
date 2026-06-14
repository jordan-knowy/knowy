import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getActiveOrganizationId } from '../lib/api/org';

export interface KnowrNotification {
  id: string;
  type: 'brief_ready' | 'meeting_soon' | 'no_brief' | 'contact_alert' | 'deal_risk' | 'sync_done' | 'team_update' | 'system';
  priority: 'urgent' | 'important' | 'info';
  title: string;
  body: string | null;
  entity_type: 'meeting' | 'contact' | 'organization' | null;
  entity_id: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<KnowrNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);
  const orgIdRef = useRef<string | null>(null);
  // Track whether we've already generated this session to avoid infinite loop
  const generatedRef = useRef(false);

  /** Only fetches from DB — does NOT call generate */
  const fetchOnly = useCallback(async () => {
    if (!supabase || !userIdRef.current) return;
    const { data } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', userIdRef.current)
      .is('dismissed_at', null)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data as KnowrNotification[]) || []);
  }, []);

  /** Full load: resolve user/org, generate once per session, then fetch */
  const load = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;

      const orgId = await getActiveOrganizationId();
      if (!orgId) return;
      orgIdRef.current = orgId;

      // Only call generate once per browser session (not on every realtime event)
      if (!generatedRef.current) {
        generatedRef.current = true;
        await (supabase as any).rpc('generate_user_notifications', {
          p_user_id: user.id,
          p_org_id: orgId,
        });
      }

      await fetchOnly();
    } catch (e) {
      console.error('useNotifications error:', e);
    } finally {
      setLoading(false);
    }
  }, [fetchOnly]);

  // Initial load on mount
  useEffect(() => {
    load();
  }, [load]);

  // Real-time: only re-fetch (never re-generate)
  useEffect(() => {
    if (!supabase) return;
    let channelReady = false;

    const timer = setTimeout(() => {
      if (!userIdRef.current) return;
      channelReady = true;
      const channel = supabase
        .channel('notifications-live')
        .on(
          'postgres_changes' as any,
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userIdRef.current}`,
          },
          () => { if (channelReady) fetchOnly(); }
        )
        .subscribe();
    }, 1000); // small delay to ensure userIdRef is populated

    return () => {
      clearTimeout(timer);
    };
  }, [fetchOnly]);

  const markRead = useCallback(async (id: string) => {
    if (!supabase) return;
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    );
    await (supabase as any)
      .from('notifications')
      .update({ read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!supabase || !userIdRef.current) return;
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? now })));
    await (supabase as any)
      .from('notifications')
      .update({ read_at: now, updated_at: now })
      .eq('user_id', userIdRef.current)
      .is('read_at', null);
  }, []);

  const dismiss = useCallback(async (id: string) => {
    if (!supabase) return;
    setNotifications(prev => prev.filter(n => n.id !== id));
    await (supabase as any)
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id);
  }, []);

  /** Force re-generate (e.g. after a calendar sync) */
  const regenerate = useCallback(async () => {
    generatedRef.current = false;
    await load();
  }, [load]);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return { notifications, loading, unreadCount, markRead, markAllRead, dismiss, reload: fetchOnly, regenerate };
}
