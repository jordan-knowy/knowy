import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Globe,
  Linkedin,
  Loader2,
  Sparkles,
  User,
} from 'lucide-react';
import KnowrButton from './knowr/KnowrButton';
import { supabase } from '../../lib/supabase';
import {
  getConnectedIdentityProviders,
  linkIdentityProvider,
  normalizeWebsiteUrl,
  requireOnboardingContext,
  updateOnboardingContext,
} from '../../lib/onboarding';

type WebsiteAnalysis = {
  analysis?: Record<string, any>;
  extractedTextSample?: string;
  title?: string;
  usedLlm?: boolean;
};

function pickAnalysisValue(analysis: WebsiteAnalysis | null, keys: string[]) {
  const source = analysis?.analysis ?? {};
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function buildLlmSummary(params: {
  role: string;
  companyName: string;
  productDescription: string;
  websiteUrl: string;
  websiteData: WebsiteAnalysis | null;
}) {
  const { role, companyName, productDescription, websiteUrl, websiteData } = params;
  const industry = pickAnalysisValue(websiteData, ['industry', 'sector', 'market']);
  const positioning = pickAnalysisValue(websiteData, ['positioning', 'description', 'summary']);
  const pieces = [
    companyName ? `Entreprise: ${companyName}.` : null,
    role ? `Role utilisateur: ${role}.` : null,
    productDescription ? `Offre vendue: ${productDescription}.` : null,
    websiteUrl ? `Site source: ${websiteUrl}.` : null,
    industry ? `Secteur compris: ${industry}.` : null,
    positioning ? `Positionnement compris: ${positioning}.` : null,
  ].filter(Boolean);

  return pieces.join(' ');
}

export default function OnboardingStep1() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isConnectingLinkedIn, setIsConnectingLinkedIn] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState(false);
  const [websiteData, setWebsiteData] = useState<WebsiteAnalysis | null>(null);
  const [productDescription, setProductDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    let mounted = true;

    requireOnboardingContext()
      .then(async ({ user, organizationId }) => {
        if (!mounted) return;
        setUserId(user.id);
        setOrganizationId(organizationId);
        setConnectedProviders(getConnectedIdentityProviders(user));

        const { data } = await (supabase as any)
          .from('profiles')
          .select('company_name, role_title, website_url, product_summary')
          .eq('id', user.id)
          .maybeSingle();

        if (!mounted) return;
        setCompanyName(data?.company_name ?? '');
        setRole(data?.role_title ?? '');
        setWebsiteUrl(data?.website_url ?? '');
        setProductDescription(data?.product_summary ?? '');
      })
      .catch(() => navigate('/signin', { replace: true }))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const linkedInConnected = connectedProviders.includes('linkedin_oidc') || connectedProviders.includes('linkedin');

  const llmSummary = useMemo(
    () => buildLlmSummary({ role, companyName, productDescription, websiteUrl, websiteData }),
    [role, companyName, productDescription, websiteUrl, websiteData]
  );

  async function refreshUser() {
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setConnectedProviders(getConnectedIdentityProviders(user));
  }

  async function handleLinkedInConnect() {
    setError(null);
    setIsConnectingLinkedIn(true);
    try {
      await linkIdentityProvider('linkedin_oidc', '/onboarding/step1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion LinkedIn impossible.');
      setIsConnectingLinkedIn(false);
    }
  }

  async function handleAnalyzeWebsite() {
    setError(null);
    const normalizedUrl = normalizeWebsiteUrl(websiteUrl);
    if (!normalizedUrl || !supabase) return;

    setWebsiteUrl(normalizedUrl);
    setIsAnalyzingWebsite(true);
    const { data, error } = await supabase.functions.invoke('analyze-website' as any, {
      body: { url: normalizedUrl },
    });
    setIsAnalyzingWebsite(false);

    if (error) {
      setError(`Analyse du site impossible : ${error.message}`);
      return;
    }

    setWebsiteData(data as WebsiteAnalysis);
    const inferredCompany = pickAnalysisValue(data as WebsiteAnalysis, ['company_name', 'company', 'name']);
    const inferredDescription = pickAnalysisValue(data as WebsiteAnalysis, [
      'description',
      'summary',
      'positioning',
      'value_proposition',
    ]);
    if (!companyName && inferredCompany) setCompanyName(inferredCompany);
    if (!productDescription && inferredDescription) setProductDescription(inferredDescription.slice(0, 140));
  }

  const canContinue = productDescription.trim().length > 0 && companyName.trim().length > 0;

  async function handleContinue() {
    if (!canContinue || !userId || !organizationId || !supabase) return;
    setError(null);
    setSaving(true);

    const normalizedUrl = normalizeWebsiteUrl(websiteUrl);
    const connectedIdentityProviders = connectedProviders;
    const structuredOffer = {
      product_description: productDescription,
      company_name: companyName,
      role_title: role,
      website_url: normalizedUrl || null,
      website_analysis_confidence: websiteData?.analysis?.confidence ?? null,
    };

    const client = supabase as any;
    const { error: profileError } = await client.from('profiles').upsert({
      id: userId,
      company_name: companyName,
      role_title: role || null,
      website_url: normalizedUrl || null,
      product_summary: productDescription,
      updated_at: new Date().toISOString(),
    });

    if (!profileError) {
      const { error: contextError } = await client.from('profile_contexts').upsert(
        {
          organization_id: organizationId,
          user_id: userId,
          website_url: normalizedUrl || null,
          website_analysis: websiteData?.analysis ?? {},
          product_description: productDescription,
          structured_offer: structuredOffer,
          connected_identity_providers: connectedIdentityProviders,
          llm_context_summary: llmSummary,
          source_payload: {
            onboarding: {
              step1_completed_at: new Date().toISOString(),
              website_analysis_used_llm: Boolean(websiteData?.usedLlm),
              website_title: websiteData?.title ?? null,
              extracted_text_sample: websiteData?.extractedTextSample ?? null,
            },
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,user_id' }
      );

      if (!contextError) {
        await updateOnboardingContext(organizationId, userId, { current_step: 2, step1: true });
        navigate('/onboarding/step2');
        return;
      }

      setError(contextError.message);
    } else {
      setError(profileError.message);
    }

    setSaving(false);
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement du profil...</div>;
  }

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Étape 1 sur 4</span>
            <span className="text-sm font-medium text-primary">25%</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <motion.div initial={{ width: 0 }} animate={{ width: '25%' }} className="bg-primary rounded-full h-2" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center size-16 bg-primary/10 rounded-2xl mb-6">
            <User className="size-8 text-primary" />
          </div>
          <h1 className="mb-4">Créons votre profil</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tohu construit le contexte que le LLM utilisera pour comprendre qui vous êtes, ce que vous vendez et comment préparer vos échanges.
          </p>
        </motion.div>

        <div className="space-y-6">
          <section className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-start gap-4">
              <div className="size-12 bg-[#0A66C2]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Linkedin className="size-6 text-[#0A66C2]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1">LinkedIn</h3>
                <p className="text-sm text-muted-foreground mb-4">Importez votre identité publique en OAuth. Le poste et l'entreprise restent éditables car LinkedIn ne les expose pas toujours via OpenID.</p>
                {linkedInConnected ? (
                  <div className="flex items-center gap-3 bg-success/10 border border-success/20 rounded-xl p-3">
                    <CheckCircle2 className="size-5 text-success" />
                    <p className="text-sm font-medium text-success">LinkedIn connecté</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <KnowrButton variant="primary" size="md" onClick={handleLinkedInConnect} loading={isConnectingLinkedIn}>
                      Connecter LinkedIn
                    </KnowrButton>
                    <KnowrButton variant="secondary" size="md" onClick={refreshUser}>
                      Rafraîchir
                    </KnowrButton>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <div className="flex items-start gap-4">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Globe className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-1">Analysez votre site web</h3>
                <p className="text-sm text-muted-foreground">L'Edge Function `analyze-website` extrait le positionnement, le marché et les signaux utiles pour le contexte LLM.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="url"
                placeholder="https://votre-entreprise.com"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                className="flex-1 px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
              <KnowrButton variant="secondary" size="md" onClick={handleAnalyzeWebsite} loading={isAnalyzingWebsite} disabled={!websiteUrl.trim()}>
                {websiteData ? <CheckCircle2 className="size-4" /> : <Sparkles className="size-4" />}
                {websiteData ? 'Réanalyser' : 'Analyser'}
              </KnowrButton>
            </div>
            {websiteData && (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">{websiteData.title ?? 'Site analysé'}</p>
                <p>{pickAnalysisValue(websiteData, ['summary', 'description', 'positioning']) || 'Analyse enregistrée pour le moteur Tohu.'}</p>
              </div>
            )}
          </section>

          <section className="bg-card rounded-2xl p-6 border border-border space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Entreprise
                <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Tohu" className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Votre poste
                <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Founder, Sales, CEO..." className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </label>
            </div>
            <label className="block space-y-2 text-sm font-medium">
              Décrivez ce que vous vendez
              <textarea
                placeholder="Ex: Plateforme d'mémoire relationnelle qui prépare chaque réunion importante."
                value={productDescription}
                onChange={(event) => setProductDescription(event.target.value.slice(0, 140))}
                rows={3}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
              />
            </label>
            <div className="text-right text-xs text-muted-foreground font-mono">{productDescription.length}/140</div>
          </section>

          {llmSummary && (
            <section className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-start gap-3">
                <Building2 className="size-5 text-primary mt-0.5" />
                <div>
                  <h3 className="mb-2">Résumé qui sera donné au LLM</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{llmSummary}</p>
                </div>
              </div>
            </section>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="size-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <KnowrButton variant="primary" size="lg" onClick={handleContinue} disabled={!canContinue || saving} loading={saving} className="w-full">
            Sauvegarder et continuer
          </KnowrButton>
        </div>
      </div>
    </div>
  );
}
