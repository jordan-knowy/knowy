import { motion } from 'motion/react';
import { useState } from 'react';
import { Check, Zap, Crown, Building2, Mail, CreditCard, Download, ChevronRight } from 'lucide-react';

export default function Subscription() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlan] = useState('pro');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      icon: Mail,
      color: 'text-muted-foreground',
      features: [
        '5 briefs/mois',
        'Sync calendrier',
        'Intelligence humaine basique',
        'Résumés basiques',
        'Export CRM manuel'
      ],
      limitations: [
        'Limité à 5 briefs par mois',
        'Pas d\'intelligence temps réel',
        'Pas d\'organigrammes'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: { monthly: 39, yearly: 32 },
      icon: Zap,
      color: 'text-primary',
      popular: true,
      features: [
        'Briefs illimités',
        'Intelligence humaine avancée',
        'Intelligence entreprise',
        'Mémoire relationnelle',
        'CRM sync',
        'Insights historiques',
        'Organigrammes basiques',
        'Support prioritaire'
      ]
    },
    {
      id: 'business',
      name: 'Business',
      price: { monthly: 79, yearly: 66 },
      icon: Building2,
      color: 'text-accent',
      features: [
        'Tout Pro, plus:',
        'Intelligence temps réel',
        'Advisory live',
        'Organizational mapping avancé',
        'Revenue intelligence',
        'Analyse risque deal',
        'Multi-thread tracking',
        'Analytics équipe',
        'Automatisations IA',
        'API access'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: { monthly: null, yearly: null },
      icon: Crown,
      color: 'text-secondary',
      custom: true,
      features: [
        'Tout Business, plus:',
        'SSO / SAML',
        'Gouvernance avancée',
        'Compliance & audit logs',
        'IA privée dédiée',
        'APIs illimitées',
        'Couche mémoire dédiée',
        'Infrastructure dédiée',
        'Success manager dédié',
        'SLA personnalisé'
      ]
    }
  ];

  const invoices = [
    { date: '1 mai 2026', amount: 590, status: 'paid', invoice: 'INV-2026-05' },
    { date: '1 avril 2026', amount: 590, status: 'paid', invoice: 'INV-2026-04' },
    { date: '1 mars 2026', amount: 590, status: 'paid', invoice: 'INV-2026-03' }
  ];

  const usage = {
    licenses: { used: 15, total: 20 },
    briefs: { used: 147, total: 'Illimité' },
    aiCalls: { used: 2847, total: 'Illimité' },
    storage: { used: 2.4, total: 50, unit: 'GB' }
  };

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-semibold mb-2">Abonnement & Facturation</h1>
          <p className="text-muted-foreground">
            Gérez votre plan, vos licences et votre facturation.
          </p>
        </motion.div>

        {/* Current Plan Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-8 border border-primary/20 mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Zap className="size-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Plan Pro</h2>
                  <p className="text-muted-foreground">Votre plan actuel</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <p className="text-3xl font-semibold">{usage.licenses.used}/{usage.licenses.total}</p>
                  <p className="text-sm text-muted-foreground">Licences utilisées</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold">{usage.briefs.used}</p>
                  <p className="text-sm text-muted-foreground">Briefs ce mois</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold">{usage.aiCalls.used.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Appels IA</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold">{usage.storage.used} {usage.storage.unit}</p>
                  <p className="text-sm text-muted-foreground">Stockage utilisé</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Utilisation des licences</span>
                    <span className="font-medium">{Math.round((usage.licenses.used / usage.licenses.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${(usage.licenses.used / usage.licenses.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-4xl font-semibold mb-1">590€</p>
              <p className="text-muted-foreground mb-4">par mois</p>
              <button className="px-6 py-2 bg-card hover:bg-muted border border-border rounded-xl transition-colors">
                Gérer le plan
              </button>
            </div>
          </div>
        </motion.div>

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
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
              className={`bg-card rounded-2xl p-6 border transition-all ${
                plan.popular
                  ? 'border-primary shadow-lg shadow-primary/10 scale-105'
                  : 'border-border hover:border-primary/30'
              } ${currentPlan === plan.id ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.popular && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    <Zap className="size-3" />
                    Le plus populaire
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className={`size-12 bg-muted/50 rounded-xl flex items-center justify-center mb-4`}>
                  <plan.icon className={`size-6 ${plan.color}`} />
                </div>
                <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>
                {plan.custom ? (
                  <p className="text-3xl font-semibold">Custom</p>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-semibold">
                      {plan.price[billingCycle]}€
                    </span>
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

              {currentPlan === plan.id ? (
                <button className="w-full px-4 py-3 bg-muted text-muted-foreground rounded-xl cursor-default">
                  Plan actuel
                </button>
              ) : plan.custom ? (
                <button className="w-full px-4 py-3 bg-primary hover:bg-accent text-white rounded-xl transition-colors">
                  Contacter les ventes
                </button>
              ) : currentPlan === 'free' || i > plans.findIndex(p => p.id === currentPlan) ? (
                <button className="w-full px-4 py-3 bg-primary hover:bg-accent text-white rounded-xl transition-colors">
                  Upgrade
                </button>
              ) : (
                <button className="w-full px-4 py-3 bg-muted hover:bg-muted/70 rounded-xl transition-colors">
                  Downgrade
                </button>
              )}
            </motion.div>
          ))}
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
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              Moyen de paiement
            </h3>
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl mb-4">
              <div className="size-12 bg-card rounded-xl flex items-center justify-center">
                <CreditCard className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expire 12/2027</p>
              </div>
            </div>
            <button className="w-full px-4 py-2 bg-muted hover:bg-muted/70 rounded-xl transition-colors text-sm">
              Modifier le moyen de paiement
            </button>
          </div>

          {/* Billing Info */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              Informations de facturation
            </h3>
            <div className="space-y-2 mb-4">
              <p className="font-medium">Knowy SAS</p>
              <p className="text-sm text-muted-foreground">123 Rue de Rivoli</p>
              <p className="text-sm text-muted-foreground">75001 Paris, France</p>
              <p className="text-sm text-muted-foreground">VAT: FR12345678900</p>
            </div>
            <button className="w-full px-4 py-2 bg-muted hover:bg-muted/70 rounded-xl transition-colors text-sm">
              Modifier les informations
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
          <h3 className="text-xl font-semibold mb-6">Historique de facturation</h3>

          <div className="space-y-3">
            {invoices.map((invoice, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-success/10 rounded-xl flex items-center justify-center">
                    <Check className="size-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">{invoice.invoice}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">{invoice.amount}€</p>
                    <p className="text-xs text-success">Payée</p>
                  </div>
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <Download className="size-4 text-muted-foreground" />
                  </button>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
