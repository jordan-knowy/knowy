import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Check, Zap, Crown, Building2, Mail, CreditCard, Loader2, AlertCircle, TrendingUp, Users, FileText, Brain } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';

interface SubscriptionData {
  plan_id: string;
  status: string;
  billing_cycle: 'monthly' | 'yearly';
  amount_per_period: number;
  current_period_start: string;
  current_period_end: string;
  started_at: string;
}

interface PlanData {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_licenses: number;
  max_briefs_per_month: number;
  max_ai_calls_per_month: number;
  max_storage_gb: number;
  features: string[];
}

interface UsageData {
  licenses_used: number;
  briefs_used: number;
  ai_calls_used: number;
}

const planIcons: Record<string, React.ElementType> = {
  free: Mail,
  pro: Zap,
  business: Building2,
  enterprise: Crown,
  super_admin: Crown,
};

const planColors: Record<string, string> = {
  free: 'text-muted-foreground',
  pro: 'text-primary',
  business: 'text-accent',
  enterprise: 'text-secondary',
  super_admin: 'text-yellow-400',
};

export default function Subscription() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanData | null>(null);
  const [allPlans, setAllPlans] = useState<PlanData[]>([]);
  const [usage, setUsage] = useState<UsageData>({ licenses_used: 0, briefs_used: 0, ai_calls_used: 0 });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [switchingPlan, setSwitchingPlan] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const orgId = await getActiveOrganizationId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const [subRes, plansRes, profileRes] = await Promise.all([
        supabase
          .from('subscriptions' as any)
          .select('plan_id, status, billing_cycle, amount_per_period, current_period_start, current_period_end, started_at')
          .eq('organization_id', orgId)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('subscription_plans' as any)
          .select('*')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('profiles')
          .select('is_super_admin, subscription_override')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      const sub = subRes.data as SubscriptionData | null;
      const plans = (plansRes.data || []) as PlanData[];
      const profile = profileRes.data as any;

      setAllPlans(plans.filter(p => p.id !== 'super_admin'));
      setSubscription(sub);
      setIsSuperAdmin(profile?.is_super_admin || false);

      const effectivePlanId = profile?.subscription_override || sub?.plan_id;
      const activePlan = plans.find(p => p.id === effectivePlanId) || null;
      setCurrentPlan(activePlan);

      if (sub && orgId) {
        const [licRes, briefRes, aiRes] = await Promise.all([
          supabase
            .from('memberships')
            .select('user_id', { count: 'exact', head: true })
            .eq('organization_id', orgId),
          supabase
            .from('meetings')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .in('brief_status', ['ready', 'consulted'])
            .gte('created_at', sub.current_period_start),
          supabase
            .from('ai_usage_events' as any)
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('created_at', sub.current_period_start),
        ]);

        setUsage({
          licenses_used: licRes.count || 0,
          briefs_used: briefRes.count || 0,
          ai_calls_used: aiRes.count || 0,
        });
      }
    } catch (e: any) {
      console.error('Subscription load error:', e);
      setError('Impossible de charger les données d\'abonnement.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSwitchPlan(planId: string) {
    if (!supabase || !isSuperAdmin) return;
    setSwitchingPlan(planId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const newOverride = planId === currentPlan?.id ? null : planId;
      await supabase
        .from('profiles')
        .update({ subscription_override: newOverride } as any)
        .eq('id', user.id);
      await loadData();
    } catch (e) {
      console.error('Switch plan error:', e);
    } finally {
      setSwitchingPlan(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function formatLimit(val: number) {
    return val === -1 ? 'Illimité' : val.toLocaleString('fr-FR');
  }

  function licensePercent() {
    if (!currentPlan || currentPlan.max_licenses === -1) return 0;
    return Math.min(100, Math.round((usage.licenses_used / currentPlan.max_licenses) * 100));
  }

  const PlanIcon = currentPlan ? (planIcons[currentPlan.id] || Zap) : Zap;
  const planColor = currentPlan ? (planColors[currentPlan.id] || 'text-primary') : 'text-primary';

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-2">Abonnement & Facturation</h1>
          <p className="text-muted-foreground">
            Gérez votre plan, vos licences et votre facturation.
          </p>
          {isSuperAdmin && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 text-yellow-500 rounded-full text-xs font-medium border border-yellow-400/20">
              <Crown className="size-3" />
              Mode Super Admin — Vous pouvez changer de plan librement
            </div>
          )}
        </motion.div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20">
            <AlertCircle className="size-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Plan Overview */}
        {currentPlan && subscription ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-5 border border-primary/20 mb-8 md:p-8"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 mb-4">
                  <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <PlanIcon className={`size-6 ${planColor}`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Plan {currentPlan.name}</h2>
                    <p className="text-muted-foreground text-sm">
                      Actif depuis le {formatDate(subscription.started_at)} · Renouvellement le {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 mb-6 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
                  <div>
                    <p className="text-3xl font-semibold">
                      {usage.licenses_used}/{formatLimit(currentPlan.max_licenses)}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Users className="size-3" /> Licences utilisées
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold">{usage.briefs_used.toLocaleString('fr-FR')}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <FileText className="size-3" /> Briefs ce mois
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold">{usage.ai_calls_used.toLocaleString('fr-FR')}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Brain className="size-3" /> Appels IA
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-semibold">
                      {currentPlan.max_storage_gb === -1 ? '∞' : currentPlan.max_storage_gb + ' GB'}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <TrendingUp className="size-3" /> Stockage inclus
                    </p>
                  </div>
                </div>

                {currentPlan.max_licenses !== -1 && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Utilisation des licences</span>
                      <span className="font-medium">{licensePercent()}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${licensePercent()}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="text-left flex-shrink-0 lg:text-right">
                {subscription.amount_per_period > 0 ? (
                  <>
                    <p className="text-4xl font-semibold mb-1">
                      {(subscription.amount_per_period / 100).toLocaleString('fr-FR')}€
                    </p>
                    <p className="text-muted-foreground mb-4">
                      par {subscription.billing_cycle === 'yearly' ? 'an' : 'mois'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl font-semibold mb-1">Gratuit</p>
                    <p className="text-muted-foreground mb-4">plan de base</p>
                  </>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  subscription.status === 'active'
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
                }`}>
                  {subscription.status === 'active' ? '● Actif' : subscription.status}
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-muted/30 rounded-3xl p-5 border border-border mb-8 text-center md:p-8"
          >
            <Mail className="size-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Aucun abonnement actif</h2>
            <p className="text-muted-foreground">Choisissez un plan ci-dessous pour commencer.</p>
          </motion.div>
        )}

        {/* Billing Cycle Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-xl transition-all ${
              billingCycle === 'monthly'
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-xl transition-all flex items-center gap-2 ${
              billingCycle === 'yearly'
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            Annuel
            <span className="text-xs px-2 py-0.5 bg-success/20 text-success rounded-full">-17%</span>
          </button>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {allPlans.map((plan, i) => {
            const PIcon = planIcons[plan.id] || Mail;
            const pColor = planColors[plan.id] || 'text-muted-foreground';
            const isCurrentPlan = currentPlan?.id === plan.id;
            const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
            const isCustom = plan.id === 'enterprise';
            const isLoadingSwitch = switchingPlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                className={`bg-card rounded-2xl p-6 border transition-all ${
                  plan.id === 'pro'
                    ? 'border-primary shadow-lg shadow-primary/10 scale-105'
                    : 'border-border hover:border-primary/30'
                } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.id === 'pro' && (
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      <Zap className="size-3" />
                      Le plus populaire
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="size-12 bg-muted/50 rounded-xl flex items-center justify-center mb-4">
                    <PIcon className={`size-6 ${pColor}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
                  {isCustom ? (
                    <p className="text-3xl font-semibold">Sur devis</p>
                  ) : price === 0 ? (
                    <p className="text-3xl font-semibold">Gratuit</p>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-semibold">{price / 100}€</span>
                      <span className="text-muted-foreground">/mois</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className="size-4 text-success flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <button className="w-full px-4 py-3 bg-muted text-muted-foreground rounded-xl cursor-default text-sm">
                    ✓ Plan actuel
                  </button>
                ) : isSuperAdmin ? (
                  <button
                    onClick={() => handleSwitchPlan(plan.id)}
                    disabled={!!switchingPlan}
                    className="w-full px-4 py-3 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-500 border border-yellow-400/30 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoadingSwitch ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Crown className="size-4" />
                    )}
                    {isLoadingSwitch ? 'Changement...' : 'Activer ce plan'}
                  </button>
                ) : isCustom ? (
                  <button className="w-full px-4 py-3 bg-primary hover:bg-accent text-white rounded-xl transition-colors text-sm">
                    Contacter les ventes
                  </button>
                ) : (
                  <button className="w-full px-4 py-3 bg-primary hover:bg-accent text-white rounded-xl transition-colors text-sm">
                    Choisir ce plan
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Billing Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {/* Payment Method */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              Moyen de paiement
            </h3>
            <div className="p-4 bg-muted/30 rounded-xl mb-4 text-center">
              <p className="text-muted-foreground text-sm">Aucun moyen de paiement enregistré</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ajoutez une carte pour activer la facturation automatique
              </p>
            </div>
            <button className="w-full px-4 py-2 bg-primary hover:bg-accent text-white rounded-xl transition-colors text-sm">
              Ajouter un moyen de paiement
            </button>
          </div>

          {/* Billing Info */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              Informations de facturation
            </h3>
            <div className="p-4 bg-muted/30 rounded-xl mb-4 text-center">
              <p className="text-muted-foreground text-sm">Aucune information de facturation</p>
              <p className="text-xs text-muted-foreground mt-1">
                Requis pour la génération des factures
              </p>
            </div>
            <button className="w-full px-4 py-2 bg-muted hover:bg-muted/70 rounded-xl transition-colors text-sm">
              Compléter les informations
            </button>
          </div>
        </motion.div>

        {/* Invoice History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <h3 className="text-xl font-bold mb-6">Historique de facturation</h3>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="size-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-lg mb-2">Aucune facture pour le moment</p>
            <p className="text-muted-foreground text-sm max-w-sm">
              Votre abonnement vient de démarrer. Votre première facture sera générée à la fin de la période en cours
              {subscription ? ` (${formatDate(subscription.current_period_end)})` : ''}.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
