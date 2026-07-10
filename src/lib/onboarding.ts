import type { User } from '@supabase/supabase-js';
import { getActiveOrganizationId } from './api/org';
import { supabase } from './supabase';

export type OnboardingProvider = 'google' | 'microsoft' | 'linkedin_oidc';

export type OnboardingContext = {
  user: User;
  organizationId: string;
};

const providerScopes: Record<OnboardingProvider, string[]> = {
  google: [
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/gmail.readonly',
  ],
  microsoft: ['email', 'openid', 'profile', 'offline_access', 'Calendars.Read', 'Mail.Read'],
  linkedin_oidc: ['openid', 'profile', 'email'],
};

export function getConnectedIdentityProviders(user: User | null): string[] {
  return Array.from(
    new Set(
      (user?.identities ?? [])
        .map((identity) => identity.provider)
        .filter(Boolean)
        .map((provider) => (provider === 'azure' ? 'microsoft' : provider))
    )
  );
}

export async function requireOnboardingContext(): Promise<OnboardingContext> {
  if (!supabase) {
    throw new Error('Configuration Supabase absente.');
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Vous devez être connecté pour continuer.');
  }

  const organizationId = await getActiveOrganizationId();
  if (!organizationId) {
    throw new Error("Aucun workspace Tohu n'est associé à ce compte.");
  }

  return { user, organizationId };
}

export async function linkIdentityProvider(provider: OnboardingProvider, redirectPath: string) {
  if (!supabase) throw new Error('Configuration Supabase absente.');

  const authProvider = provider === 'microsoft' ? 'azure' : provider;
  const { error } = await supabase.auth.linkIdentity({
    provider: authProvider as any,
    options: {
      redirectTo: `${window.location.origin}${redirectPath}`,
      scopes: providerScopes[provider].join(' '),
      queryParams: provider === 'google' ? {
        access_type: 'offline',
        prompt: 'consent',
      } : undefined,
    },
  });

  if (error) throw error;
}

export async function markConnectorConnected(
  organizationId: string,
  userId: string,
  provider: 'google' | 'microsoft',
  scopes = providerScopes[provider]
) {
  if (!supabase) throw new Error('Configuration Supabase absente.');
  const client = supabase as any;

  const { error } = await client.from('connectors').upsert(
    {
      organization_id: organizationId,
      user_id: userId,
      provider,
      status: 'connected',
      scopes,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,user_id,provider' }
  );

  if (error) throw error;
}

export async function updateOnboardingContext(
  organizationId: string,
  userId: string,
  patch: Record<string, unknown>
) {
  if (!supabase) throw new Error('Configuration Supabase absente.');
  const client = supabase as any;

  const { data: existing } = await client
    .from('profile_contexts')
    .select('source_payload')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle();

  const sourcePayload = {
    ...(existing?.source_payload ?? {}),
    onboarding: {
      ...(existing?.source_payload?.onboarding ?? {}),
      ...patch,
      updated_at: new Date().toISOString(),
    },
  };

  const { error } = await client.from('profile_contexts').upsert(
    {
      organization_id: organizationId,
      user_id: userId,
      source_payload: sourcePayload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,user_id' }
  );

  if (error) throw error;
}

export function normalizeWebsiteUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

