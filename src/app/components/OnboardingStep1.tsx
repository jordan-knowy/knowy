import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Brain,
  Briefcase,
  Building2,
  CheckCircle2,
  Globe,
  Linkedin,
  Loader2,
  Mail,
  Sparkles,
  User,
} from 'lucide-react';
import KnowyButton from './knowy/KnowyButton';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';

type ProviderId = 'linkedin_oidc' | 'google' | 'azure';

interface WebsiteAnalysisResponse {
  url: string;
  title: string | null;
  usedLlm: boolean;
  analysis: {
    companyName: string | null;
    industry: string | null;
    positioning: string | null;
    targetCustomers: string[];
    productSignals: string[];
    valueProposition: string | null;
    confidence: number;
    summary: string;
  };
}

function getIdentityProviders(user: any): string[] {
  return (user?.identities ?? []).map((identity: any) => identity.provider).filter(Boolean);
}

function providerIsConnected(user: any, provider: ProviderId) {
  const providers = getIdentityProviders(user);
  if (provider === 'azure') return providers.includes('azure');
  return providers.includes(provider);
}

function buildLlmSummary(input: {
  user: any;
  companyName: string;
  role: string;
  productDescription: string;
  websiteData: WebsiteAnalysisResponse | null;
  connectedProviders: string[];
}) {
  const name = input.user?.user_metadata?.full_name ?? input.user?.user_metadata?.name ?? input.user?.email ?? 'Utilisateur Knowy';
  const website = input.websiteData?.analysis;

  return [
    `Utilisateur: ${name}`,
    `Email: ${input.user?.email ?? 'non disponible'}`,
    `Rôle déclaré: ${input.role || 'non disponible'}`,
    `Entreprise: ${input.companyName || website?.companyName || 'non disponible'}`,
    `Offre déclarée: ${input.productDescription || 'non disponible'}`,
    `Site analysé: ${input.websiteData?.url ?? 'non disponible'}`,
    `Positionnement site: ${website?.positioning ?? 'non disponible'}`,
    `Industrie détectée: ${website?.industry ?? 'non disponible'}`,
    `Clients cibles: ${website?.targetCustomers?.join(', ') || 'non disponible'}`,
    `Signaux produit: ${website?.productSignals?.join(', ') || 'non disponible'}`,
    `Résumé site: ${website?.summary ?? 'non disponible'}`,
    `Connecteurs identité: ${input.connectedProviders.join(', ') || 'email uniquement'}`,
  ].join('\n');
}

export default function OnboardingStep1() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [pendingProvider, setPendingProvider] = useState<ProviderId | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState(false);
  const [websiteData, setWebsiteData] = useState<WebsiteAnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [productDescription, setProductDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoadingUser(false);
        return;
      }

      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);

      if (data.user) {
        const metadata = data.user.user_metadata ?? {};
        setCompanyName(metadata.company_name ?? '');
        setRole(metadata.role_title ?? '');
      }

      setLoadingUser(false);
    }

    load();
  }, []);

  const connectedProviders = useMemo(() => getIdentityProviders(user), [user]);
  const linkedInConnected = providerIsConnected(user, 'linkedin_oidc');

  async function refreshUser() {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
  }

  async function handleConnectIdentity(provider: ProviderId) {
    setPendingProvider(provider);
    setAuthError(null);

    if (!supabase) {
      setPendingProvider(null);
      setAuthError('Supabase n’est pas configuré localement.');
      return;
    }

    const { error } = await supabase.auth.linkIdentity({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/onboarding/step1`,
        scopes:
          provider === 'google'
            ? 'email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly'
            : provider === 'azure'
              ? 'email openid profile offline_access Calendars.Read Mail.Read'
              : 'openid profile email',
      },
    });

    if (error) {
      setPendingProvider(null);
      setAuthError(`Connexion impossible: ${error.message}. Le provider doit être activé dans Supabase Auth.`);
    }
  }

  async function handleAnalyzeWebsite() {
    if (!websiteUrl.trim() || !supabase) return;

    setIsAnalyzingWebsite(true);
    setAnalysisError(null);

    const { data, error } = await supabase.functions.invoke('analyze-website', {
      body: { url: websiteUrl.trim() },
    });

    setIsAnalyzingWebsite(false);

    if (error) {
      setAnalysisError(`Analyse impossible: ${error.message}`);
      return;
    }

    const response = data as WebsiteAnalysisResponse;
    setWebsiteData(response);

    if (!companyName && response.analysis.companyName) setCompanyName(response.analysis.companyName);
    if (!productDescription && response.analysis.valueProposition) {
      setProductDescription(response.analysis.valueProposition.slice(0, 140));
    }
  }

  function canContinue() {
    return Boolean(productDescription.trim() || websiteData || companyName.trim() || role.trim() || connectedProviders.length);
  }

  async function saveProfileContext() {
    if (!supabase || !user) {
      setSaveError('Vous devez être connecté pour sauvegarder ce contexte.');
      return false;
    }

    setIsSaving(true);
    setSaveError(null);

    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      setIsSaving(false);
      setSaveError('Aucun workspace trouvé pour ce compte. Déconnectez-vous puis recréez le compte si nécessaire.');
      return false;
    }

    const structuredOffer = {
      declaredOffer: productDescription.trim() || null,
      detectedCompany: websiteData?.analysis.companyName ?? null,
      detectedIndustry: websiteData?.analysis.industry ?? null,
      positioning: websiteData?.analysis.positioning ?? null,
      targetCustomers: websiteData?.analysis.targetCustomers ?? [],
      productSignals: websiteData?.analysis.productSignals ?? [],
      confidence: websiteData?.analysis.confidence ?? null,
    };

    const llmContextSummary = buildLlmSummary({
      user,
      companyName,
      role,
      productDescription,
      websiteData,
      connectedProviders,
    });
    const normalizedWebsiteUrl = websiteData?.url ?? (websiteUrl.trim() || null);

    const [{ error: profileError }, { error: contextError }] = await Promise.all([
      supabase
        .from('profiles')
        .update({
          company_name: companyName || websiteData?.analysis.companyName || null,
          role_title: role || null,
          website_url: normalizedWebsiteUrl,
          product_summary: productDescription.trim() || websiteData?.analysis.summary || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id),
      supabase.from('profile_contexts').upsert(
        {
          organization_id: organizationId,
          user_id: user.id,
          website_url: normalizedWebsiteUrl,
          website_analysis: websiteData?.analysis ?? {},
          product_description: productDescription.trim() || null,
          structured_offer: structuredOffer,
          connected_identity_providers: connectedProviders,
          llm_context_summary: llmContextSummary,
          source_payload: {
            user_metadata: user.user_metadata ?? {},
            website_title: websiteData?.title ?? null,
            used_llm_for_website: websiteData?.usedLlm ?? false,
          },
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: 'organization_id,user_id' },
      ),
    ]);

    setIsSaving(false);

    if (profileError || contextError) {
      setSaveError(profileError?.message ?? contextError?.message ?? 'Sauvegarde impossible.');
      return false;
    }

    return true;
  }

  async function handleContinue() {
    const saved = await saveProfileContext();
    if (saved) navigate('/onboarding/step2');
  }

  if (loadingUser) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Chargement du profil...</div>;
  }

  return (
    <div className="size-full overflow-auto bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-12">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Étape 1 sur 4</span>
            <span className="text-sm font-medium text-primary">25%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-border">
            <motion.div initial={{ width: 0 }} animate={{ width: '25%' }} transition={{ duration: 0.6 }} className="h-2 rounded-full bg-primary" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <div className="mb-6 inline-flex size-16 items-center justify-center rounded-lg bg-primary/10">
            <User className="size-8 text-primary" />
          </div>
          <h1 className="mb-4 text-4xl font-semibold">Créons votre profil</h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Connectez une identité professionnelle, analysez votre site et donnez au moteur Knowy un contexte clair.
          </p>
        </motion.div>

        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-6">
            <div className="mb-5 flex items-start gap-4">
              <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#0A66C2]/10">
                <Linkedin className="size-6 text-[#0A66C2]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">LinkedIn</h2>
                <p className="mt-1 text-sm text-muted-foreground">Importez votre profil, poste, entreprise en 1 clic.</p>
              </div>
            </div>

            {linkedInConnected ? (
              <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/10 p-4">
                <CheckCircle2 className="size-5 text-success" />
                <div>
                  <p className="font-semibold text-success">LinkedIn connecté</p>
                  <p className="text-sm text-muted-foreground">{user?.user_metadata?.full_name ?? user?.email}</p>
                </div>
              </div>
            ) : (
              <KnowyButton variant="primary" size="md" onClick={() => handleConnectIdentity('linkedin_oidc')} loading={pendingProvider === 'linkedin_oidc'}>
                Connecter LinkedIn réellement
              </KnowyButton>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => handleConnectIdentity('google')}
                disabled={Boolean(pendingProvider)}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 text-left hover:border-primary/40 disabled:opacity-60"
              >
                <Mail className="size-5 text-primary" />
                <span>
                  <span className="block font-semibold">{providerIsConnected(user, 'google') ? 'Gmail connecté' : 'Connecter Gmail'}</span>
                  <span className="block text-sm text-muted-foreground">Emails et calendrier Google</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleConnectIdentity('azure')}
                disabled={Boolean(pendingProvider)}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 text-left hover:border-primary/40 disabled:opacity-60"
              >
                <Mail className="size-5 text-primary" />
                <span>
                  <span className="block font-semibold">{providerIsConnected(user, 'azure') ? 'Outlook connecté' : 'Connecter Outlook'}</span>
                  <span className="block text-sm text-muted-foreground">Emails et calendrier Microsoft</span>
                </span>
              </button>
            </div>

            {authError && <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{authError}</p>}
            <button type="button" onClick={refreshUser} className="mt-3 text-sm font-semibold text-primary hover:underline">
              J’ai terminé la connexion, rafraîchir mon profil
            </button>
          </section>

          <section className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-start gap-4">
              <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="size-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Analysez votre site web</h2>
                <p className="mt-1 text-sm text-muted-foreground">Le LLM extrait le secteur, l’offre, les signaux produit et les clients cibles.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="url"
                placeholder="https://votre-entreprise.com"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                className="min-h-12 flex-1 rounded-lg border border-border bg-input-background px-4 py-3 text-sm focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <KnowyButton variant="secondary" size="md" onClick={handleAnalyzeWebsite} loading={isAnalyzingWebsite} disabled={!websiteUrl.trim()}>
                {isAnalyzingWebsite ? <><Loader2 className="size-4 animate-spin" /> Analyse...</> : <><Sparkles className="size-4" /> Analyser</>}
              </KnowyButton>
            </div>

            {analysisError && <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{analysisError}</p>}

            {websiteData && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-lg border border-primary/15 bg-primary/5 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{websiteData.analysis.companyName ?? websiteData.title ?? 'Site analysé'}</p>
                    <p className="text-sm text-muted-foreground">{websiteData.url}</p>
                  </div>
                  <span className="rounded-full bg-card px-3 py-1 text-sm font-semibold text-primary">{websiteData.analysis.confidence}% confiance</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-card p-4">
                    <Building2 className="mb-2 size-4 text-primary" />
                    <p className="text-sm font-semibold">Secteur</p>
                    <p className="text-sm text-muted-foreground">{websiteData.analysis.industry ?? 'Non disponible'}</p>
                  </div>
                  <div className="rounded-lg bg-card p-4">
                    <Briefcase className="mb-2 size-4 text-primary" />
                    <p className="text-sm font-semibold">Positionnement</p>
                    <p className="text-sm text-muted-foreground">{websiteData.analysis.positioning ?? 'Non disponible'}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{websiteData.analysis.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {websiteData.analysis.productSignals.map((signal) => (
                    <span key={signal} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">{signal}</span>
                  ))}
                </div>
              </motion.div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-start gap-4">
              <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="size-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Décrivez ce que vous vendez</h2>
                <p className="mt-1 text-sm text-muted-foreground">Cette phrase est structurée et stockée dans la mémoire IA de votre compte.</p>
              </div>
            </div>

            <textarea
              placeholder="Ex: Plateforme d’intelligence relationnelle qui prépare les équipes commerciales avant leurs réunions."
              value={productDescription}
              onChange={(event) => event.target.value.length <= 140 && setProductDescription(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-input-background px-4 py-3 text-sm focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-2 text-right text-xs text-muted-foreground">{productDescription.length}/140</div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Entreprise"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                className="min-h-11 rounded-lg border border-border bg-input-background px-4 text-sm focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="text"
                placeholder="Votre poste"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="min-h-11 rounded-lg border border-border bg-input-background px-4 text-sm focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="mt-5 rounded-lg border border-border bg-muted/25 p-4">
              <p className="text-sm font-semibold">Résumé qui sera donné au LLM</p>
              <pre className="mt-2 max-h-48 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                {buildLlmSummary({ user, companyName, role, productDescription, websiteData, connectedProviders })}
              </pre>
            </div>
          </section>

          <div className="pt-4">
            <KnowyButton variant="primary" size="lg" onClick={handleContinue} loading={isSaving} disabled={!canContinue()} className="w-full">
              Sauvegarder le contexte IA et continuer
            </KnowyButton>
            {saveError && <p className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{saveError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
