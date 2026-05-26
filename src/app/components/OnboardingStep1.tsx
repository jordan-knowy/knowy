import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { User, Sparkles, Globe, CheckCircle2, Loader2, Linkedin, Building2, Briefcase } from 'lucide-react';
import KnowyButton from './knowy/KnowyButton';

export default function OnboardingStep1() {
  const navigate = useNavigate();

  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [isConnectingLinkedIn, setIsConnectingLinkedIn] = useState(false);
  const [linkedInProfile, setLinkedInProfile] = useState<any>(null);

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState(false);
  const [websiteAnalyzed, setWebsiteAnalyzed] = useState(false);
  const [websiteData, setWebsiteData] = useState<any>(null);

  const [productDescription, setProductDescription] = useState('');

  // Manual fallback fields
  const [showManualFields, setShowManualFields] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');

  const handleLinkedInConnect = () => {
    setIsConnectingLinkedIn(true);

    // Simulate OAuth + profile fetch
    setTimeout(() => {
      setLinkedInConnected(true);
      setLinkedInProfile({
        name: 'Maxime Durant',
        role: 'Sales Director',
        company: 'SaaS Corp',
        photo: null
      });
      setIsConnectingLinkedIn(false);

      // Auto-fill manual fields from LinkedIn
      setCompanyName('SaaS Corp');
      setRole('Sales Director');
    }, 2000);
  };

  const handleAnalyzeWebsite = () => {
    if (!websiteUrl.trim()) return;

    setIsAnalyzingWebsite(true);

    // Simulate AI website analysis (2 seconds)
    setTimeout(() => {
      setWebsiteAnalyzed(true);
      setWebsiteData({
        company: 'SaaS Corp',
        industry: 'B2B SaaS',
        description: 'Cloud-based CRM and sales automation platform'
      });
      setIsAnalyzingWebsite(false);

      // Auto-generate product description from website
      if (!productDescription) {
        setProductDescription('Cloud-based CRM and sales automation platform for B2B teams');
      }
    }, 2000);
  };

  const canContinue = () => {
    // Requires (linkedIn OR productDescription) AND (website analyzed OR productDescription)
    const hasIdentity = linkedInConnected || productDescription.trim().length > 0;
    const hasContext = websiteAnalyzed || productDescription.trim().length > 0;
    return hasIdentity && hasContext;
  };

  const handleContinue = () => {
    if (canContinue()) {
      navigate('/onboarding/step2');
    }
  };

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Étape 1 sur 5</span>
            <span className="text-sm font-medium text-primary">20%</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '20%' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-primary rounded-full h-2"
            />
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center size-16 bg-primary/10 rounded-2xl mb-6">
            <User className="size-8 text-primary" />
          </div>
          <h1 className="mb-4">Créons votre profil</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connectez LinkedIn pour un setup instantané, ou remplissez manuellement.
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* LinkedIn Connection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <div className="flex items-start gap-4">
              <div className="size-12 bg-[#0A66C2]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Linkedin className="size-6 text-[#0A66C2]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1">LinkedIn</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Importez votre profil, poste, entreprise en 1 clic
                </p>

                {!linkedInConnected ? (
                  <KnowyButton
                    variant="primary"
                    size="md"
                    onClick={handleLinkedInConnect}
                    loading={isConnectingLinkedIn}
                  >
                    {isConnectingLinkedIn ? 'Connexion...' : 'Connecter LinkedIn'}
                  </KnowyButton>
                ) : (
                  <div className="flex items-center gap-3 bg-success/10 border border-success/20 rounded-xl p-3">
                    <CheckCircle2 className="size-5 text-success flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-success">Connecté</p>
                      <p className="text-xs text-muted-foreground">{linkedInProfile?.name} • {linkedInProfile?.role}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Website Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Globe className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1">Analysez votre site web</h3>
                <p className="text-sm text-muted-foreground">
                  L'IA Knowy extrait automatiquement votre secteur, produit, et positionnement
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="url"
                  placeholder="https://votre-entreprise.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  disabled={websiteAnalyzed}
                  className="flex-1 px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-sm disabled:opacity-50"
                />
                <KnowyButton
                  variant="secondary"
                  size="md"
                  onClick={handleAnalyzeWebsite}
                  loading={isAnalyzingWebsite}
                  disabled={!websiteUrl.trim() || websiteAnalyzed}
                >
                  {isAnalyzingWebsite ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Analyse...
                    </>
                  ) : websiteAnalyzed ? (
                    <>
                      <CheckCircle2 className="size-4" />
                      Analysé
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Analyser
                    </>
                  )}
                </KnowyButton>
              </div>

              {websiteAnalyzed && websiteData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-primary/5 border border-primary/10 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <Sparkles className="size-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{websiteData.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="size-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{websiteData.industry}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{websiteData.description}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Product Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <h3 className="mb-1">Décrivez ce que vous vendez</h3>
            <p className="text-sm text-muted-foreground mb-4">
              En une phrase simple (140 caractères max)
            </p>

            <div className="relative">
              <textarea
                placeholder="Ex: Plateforme de CRM cloud pour équipes B2B SaaS"
                value={productDescription}
                onChange={(e) => {
                  if (e.target.value.length <= 140) {
                    setProductDescription(e.target.value);
                  }
                }}
                rows={3}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-sm resize-none"
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground font-mono">
                {productDescription.length}/140
              </div>
            </div>
          </motion.div>

          {/* Manual Fallback Fields */}
          {!linkedInConnected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <button
                onClick={() => setShowManualFields(!showManualFields)}
                className="text-sm text-primary hover:underline mb-4"
              >
                {showManualFields ? 'Masquer les champs manuels' : 'Ou remplir manuellement'}
              </button>

              {showManualFields && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-card rounded-2xl p-6 border border-border space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-2">Entreprise</label>
                    <input
                      type="text"
                      placeholder="Nom de votre entreprise"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Votre poste</label>
                    <input
                      type="text"
                      placeholder="Ex: Sales Director"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="pt-6"
          >
            <KnowyButton
              variant="primary"
              size="lg"
              onClick={handleContinue}
              disabled={!canContinue()}
              className="w-full"
            >
              Continuer
            </KnowyButton>

            {!canContinue() && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Connectez LinkedIn ou remplissez la description produit pour continuer
              </p>
            )}
          </motion.div>
        </div>

        {/* Skip option */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/onboarding/step2')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Passer cette étape
          </button>
        </div>
      </div>
    </div>
  );
}
