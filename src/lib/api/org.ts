import { supabase } from '../supabase';

export async function getActiveOrganizationId(): Promise<string | null> {
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.organization_id) return null;
  return data.organization_id;
}
