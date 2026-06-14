import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

interface CurrentProfile {
  fullName: string;
  email: string;
  initials: string;
  companyName: string;
  roleTitle: string;
  avatarUrl: string | null;
}

function getInitials(nameOrEmail: string) {
  const clean = nameOrEmail.trim();
  if (!clean) return 'K';

  const parts = clean.includes('@') ? [clean[0]] : clean.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]).join('').toUpperCase();
}

export function useCurrentProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profileRow, setProfileRow] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!supabase || !user) {
        setProfileRow(null);
        return;
      }

      setLoadingProfile(true);
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

      if (mounted) {
        setProfileRow(data ?? null);
        setLoadingProfile(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  const profile = useMemo<CurrentProfile | null>(() => {
    if (!user) return null;

    const metadata = user.user_metadata ?? {};
    const email = user.email ?? '';
    const fullName = profileRow?.full_name ?? metadata.full_name ?? metadata.name ?? email;
    const companyName = profileRow?.company_name ?? metadata.company_name ?? 'Workspace Knowr';
    const roleTitle = profileRow?.role_title ?? metadata.role_title ?? 'Compte test';

    return {
      fullName,
      email,
      initials: getInitials(fullName || email),
      companyName,
      roleTitle,
      avatarUrl: profileRow?.avatar_url ?? metadata.avatar_url ?? null,
    };
  }, [profileRow, user]);

  return {
    profile,
    loading: authLoading || loadingProfile,
  };
}
