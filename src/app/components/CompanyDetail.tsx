import { motion } from 'motion/react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Building2,
  Users,
  TrendingUp,
  Target,
  AlertCircle,
  Network,
  Newspaper,
  Star,
  ArrowRight,
  Mail,
  Calendar,
  Clock,
  BarChart3
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  founded: string;
  businessModel: string;
  employees: string;
  growth: string;
  activeContacts: number;
  totalContacts: number;
  emails30d: number;
  meetings30d: number;
  healthScore: number;
  lastContactDays: number;
  funding: {
    stage: string;
    valuation: string;
    totalRaised: string;
    lastRound: string;
    investors: string[];
  };
  financials: {
    revenue: string;
    revenueGrowth: string;
    customers: string;
    averageContractValue: string;
  };
  departments: { name: string; size: string; growth: string }[];
  recentNews: { title: string; date: string; type: string }[];
  positioning: string;
  competitors: string[];
  locations: string[];
  challenges: string[];
  priorities: string[];
}

interface Contact {
  id: string;
  name: string;
  role: string;
  photo: string;
  engagementScore: number;
  isDecisionMaker: boolean;
  lastContactDays: number;
}

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data
  const allCompanies: Company[] = [
    {
      id: 'c1',
      name: 'Contentsquare',
      logo: '🎯',
      industry: 'Digital Experience Analytics',
      founded: '2012',
      businessModel: 'SaaS B2B',
      employees: '1,200+',
      growth: '+45% YoY',
      activeContacts: 8,
      totalContacts: 12,
      emails30d: 127,
      meetings30d: 6,
      healthScore: 95,
      lastContactDays: 2,
      funding: {
        stage: 'Series F',
        valuation: '$5.6B',
        totalRaised: '$800M',
        lastRound: 'Series F - $500M (2024)',
        investors: ['SoftBank', 'Eurazeo', 'Canaan Partners', 'Highland Europe']
      },
      financials: {
        revenue: '$200M ARR',
        revenueGrowth: '+60% YoY',
        customers: '1,300+',
        averageContractValue: '$150K'
      },
      departments: [
        { name: 'Engineering', size: '450+', growth: '+35% cette année' },
        { name: 'Sales & BD', size: '280+', growth: '+50% cette année' },
        { name: 'Customer Success', size: '180+', growth: '+40% cette année' },
        { name: 'Marketing', size: '120+', growth: '+30% cette année' },
        { name: 'Product', size: '85+', growth: '+45% cette année' },
        { name: 'Operations', size: '85+', growth: '+25% cette année' }
      ],
      recentNews: [
        { title: 'Acquisition de Hotjar pour $120M', date: '2024', type: 'expansion' },
        { title: 'Ouverture bureau Tokyo', date: 'Jan 2026', type: 'expansion' },
        { title: '150+ nouvelles embauches en engineering', date: 'Q1 2026', type: 'hiring' },
        { title: 'Nouveau VP of Sales EMEA', date: 'Mars 2026', type: 'leadership' }
      ],
      positioning: 'Leader du marché de l\'analyse d\'expérience digitale, concurrençant des acteurs établis comme Adobe Analytics et Google Analytics pour les entreprises mid-market et enterprise.',
      competitors: ['Adobe Analytics', 'Google Analytics 360', 'Mixpanel', 'Amplitude', 'Heap'],
      locations: ['Paris', 'New York', 'London', 'Munich', 'Tokyo', 'San Francisco', 'Singapore'],
      challenges: [
        'Compétition intense avec Adobe et Google sur le segment enterprise',
        'Besoin d\'accélérer l\'intégration de Hotjar post-acquisition',
        'Scaling international rapide nécessite harmonisation processus'
      ],
      priorities: [
        'Expansion Asie-Pacifique (focus Japon et Singapour)',
        'Lancement nouvelle plateforme AI-powered analytics Q3 2026',
        'Consolidation position enterprise en Europe',
        'Intégration complète Hotjar dans la suite produit'
      ]
    },
    {
      id: 'c2',
      name: 'Qonto',
      logo: '💳',
      industry: 'Fintech - Business Banking',
      founded: '2016',
      businessModel: 'SaaS B2B Fintech',
      employees: '1,600+',
      growth: '+55% YoY',
      activeContacts: 6,
      totalContacts: 8,
      emails30d: 184,
      meetings30d: 9,
      healthScore: 92,
      lastContactDays: 1,
      funding: {
        stage: 'Series D',
        valuation: '$5.0B',
        totalRaised: '$900M',
        lastRound: 'Series D - $550M (2023)',
        investors: ['Tencent', 'TCV', 'Valar Ventures', 'Alven Capital']
      },
      financials: {
        revenue: '$150M ARR',
        revenueGrowth: '+70% YoY',
        customers: '450K+',
        averageContractValue: '$65K'
      },
      departments: [
        { name: 'Engineering & Product', size: '520+', growth: '+40% cette année' },
        { name: 'Sales', size: '380+', growth: '+60% cette année' },
        { name: 'Customer Support', size: '240+', growth: '+45% cette année' },
        { name: 'Operations & Risk', size: '180+', growth: '+35% cette année' },
        { name: 'Marketing', size: '95+', growth: '+30% cette année' },
        { name: 'Finance', size: '85+', growth: '+25% cette année' }
      ],
      recentNews: [
        { title: 'Lancement en Espagne et Italie', date: 'Fév 2026', type: 'expansion' },
        { title: 'Partenariat stratégique avec Stripe', date: 'Mars 2026', type: 'product' },
        { title: 'Licence bancaire européenne obtenue', date: 'Jan 2026', type: 'leadership' },
        { title: '200+ nouvelles embauches prévues en 2026', date: 'Q1 2026', type: 'hiring' }
      ],
      positioning: 'Challenger des banques traditionnelles pour les PME et startups en Europe. Alternative moderne à des acteurs établis comme les banques traditionnelles et des néo-banques comme Revolut Business.',
      competitors: ['Revolut Business', 'N26 Business', 'Shine', 'Penta', 'Banques traditionnelles'],
      locations: ['Paris', 'Berlin', 'Milan', 'Madrid', 'Barcelona', 'Amsterdam'],
      challenges: [
        'Régulation bancaire complexe et différente par pays européen',
        'Compétition féroce avec Revolut sur segment PME',
        'Besoin de maintenir croissance tout en respectant contraintes réglementaires'
      ],
      priorities: [
        'Expansion dans 5 nouveaux pays européens en 2026',
        'Lancement offre crédit pour PME Q2 2026',
        'Renforcement équipe compliance et risk management',
        'Amélioration produits d\'investissement et épargne'
      ]
    }
  ];

  const company = allCompanies.find(c => c.id === id);

  const getDaysText = (days: number) => {
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
    return `Il y a ${Math.floor(days / 30)} mois`;
  };

  const companyContacts: Contact[] = [
    { id: '1', name: 'Sarah Chen', role: 'VP of Partnerships', photo: '👩‍💼', engagementScore: 88, isDecisionMaker: true, lastContactDays: 2 },
    { id: '2', name: 'Marc Dubois', role: 'Head of Product Strategy', photo: '👨‍💻', engagementScore: 72, isDecisionMaker: true, lastContactDays: 5 },
    { id: '3', name: 'Emma Wilson', role: 'Partnerships Lead', photo: '👩‍💼', engagementScore: 68, isDecisionMaker: false, lastContactDays: 12 },
    { id: '4', name: 'Nathalie Roux', role: 'CFO', photo: '👩‍💼', engagementScore: 86, isDecisionMaker: true, lastContactDays: 3 },
  ];

  if (!company) {
    return (
      <div className="size-full bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Entreprise introuvable</h2>
          <p className="text-muted-foreground mb-6">Cette entreprise n'existe pas ou a été supprimée.</p>
          <button
            onClick={() => navigate('/network')}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-accent transition-colors"
          >
            Retour au réseau
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="size-4" />
          Retour
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Company Overview Header */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <span className="text-5xl">{company.logo}</span>
                <div>
                  <h2 className="text-2xl font-semibold mb-2">{company.name}</h2>
                  <p className="text-muted-foreground mb-3">{company.industry}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-success/10 text-success rounded-lg text-sm font-medium">{company.funding.stage}</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm">{company.employees} employés</span>
                    <span className="px-3 py-1 bg-accent/10 text-accent rounded-lg text-sm">{company.businessModel}</span>
                    <span className="px-3 py-1 bg-warning/10 text-warning rounded-lg text-sm">Fondée en {company.founded}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary mb-1">{company.funding.valuation}</p>
                <p className="text-sm text-muted-foreground">Valorisation</p>
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-primary" />
                <p className="text-sm text-muted-foreground">Health Score</p>
              </div>
              <p className="text-2xl font-semibold mb-1">{company.healthScore}</p>
              <div className="mt-2 w-full bg-border rounded-full h-1.5">
                <div
                  className={`rounded-full h-1.5 ${
                    company.healthScore >= 80 ? 'bg-success' :
                    company.healthScore >= 70 ? 'bg-primary' :
                    company.healthScore >= 60 ? 'bg-warning' :
                    'bg-destructive'
                  }`}
                  style={{ width: `${company.healthScore}%` }}
                />
              </div>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="size-4 text-primary" />
                <p className="text-sm text-muted-foreground">Emails</p>
              </div>
              <p className="text-2xl font-semibold mb-1">{company.emails30d}</p>
              <p className="text-xs text-muted-foreground">30 derniers jours</p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="size-4 text-primary" />
                <p className="text-sm text-muted-foreground">Meetings</p>
              </div>
              <p className="text-2xl font-semibold mb-1">{company.meetings30d}</p>
              <p className="text-xs text-muted-foreground">30 derniers jours</p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="size-4 text-primary" />
                <p className="text-sm text-muted-foreground">Dernier contact</p>
              </div>
              <p className={`text-2xl font-semibold mb-1 ${
                company.lastContactDays > 10 ? 'text-destructive' :
                company.lastContactDays > 5 ? 'text-warning' :
                'text-success'
              }`}>
                {company.lastContactDays}j
              </p>
              <p className="text-xs text-muted-foreground">{getDaysText(company.lastContactDays)}</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="size-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Employés</p>
              </div>
              <p className="text-2xl font-semibold mb-1">{company.employees}</p>
              <p className="text-xs text-success flex items-center gap-1">
                <TrendingUp className="size-3" />
                {company.growth}
              </p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">ARR (estimé)</p>
              </div>
              <p className="text-2xl font-semibold mb-1">{company.financials.revenue}</p>
              <p className="text-xs text-success">{company.financials.revenueGrowth}</p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="size-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Clients</p>
              </div>
              <p className="text-2xl font-semibold mb-1">{company.financials.customers}</p>
              <p className="text-xs text-muted-foreground">Enterprise focus</p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="size-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">ACV moyen</p>
              </div>
              <p className="text-2xl font-semibold mb-1">{company.financials.averageContractValue}</p>
              <p className="text-xs text-muted-foreground">Deal size</p>
            </div>
          </div>

          {/* Contacts at Company */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="size-5 text-primary" />
                <h2 className="text-xl font-semibold">Contacts dans l'entreprise</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {company.activeContacts} actifs / {company.totalContacts} total ({Math.round((company.activeContacts / company.totalContacts) * 100)}% coverage)
              </span>
            </div>

            <div className="space-y-3">
              {companyContacts.map((contact, i) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/contact/${contact.id}`)}
                  className="flex items-center justify-between p-4 bg-muted/20 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{contact.photo}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{contact.name}</p>
                        {contact.isDecisionMaker && (
                          <Star className="size-3 text-primary fill-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{contact.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-semibold mb-1">Score: {contact.engagementScore}</p>
                      <p className={`text-xs ${
                        contact.lastContactDays > 10 ? 'text-destructive' :
                        contact.lastContactDays > 5 ? 'text-warning' :
                        'text-success'
                      }`}>
                        Dernier contact: {contact.lastContactDays}j
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Funding & Investors */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="size-5 text-success" />
              Financement & Investisseurs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total levé</p>
                    <p className="text-2xl font-semibold">{company.funding.totalRaised}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Dernier tour</p>
                    <p className="font-medium">{company.funding.lastRound}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-3">Investisseurs principaux</p>
                <div className="flex flex-wrap gap-2">
                  {company.funding.investors.map((investor, i) => (
                    <span key={i} className="px-3 py-1.5 bg-success/10 text-success rounded-lg text-sm font-medium">
                      {investor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Departments & Structure */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              Structure & Départements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {company.departments.map((dept, i) => (
                <div key={i} className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{dept.name}</h4>
                    <span className="text-sm font-semibold text-primary">{dept.size}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{dept.growth}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent News & Signals */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Newspaper className="size-5 text-accent" />
              Actualités & Signaux récents
            </h3>
            <div className="space-y-3">
              {company.recentNews.map((news, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className={`size-2 rounded-full mt-2 ${
                    news.type === 'expansion' ? 'bg-success' :
                    news.type === 'hiring' ? 'bg-primary' :
                    news.type === 'leadership' ? 'bg-warning' :
                    'bg-accent'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium">{news.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">{news.date}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      news.type === 'expansion' ? 'bg-success/10 text-success' :
                      news.type === 'hiring' ? 'bg-primary/10 text-primary' :
                      news.type === 'leadership' ? 'bg-warning/10 text-warning' :
                      'bg-accent/10 text-accent'
                    }`}>
                      {news.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="size-5 text-primary" />
                Positionnement
              </h3>
              <p className="text-muted-foreground mb-4">{company.positioning}</p>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Concurrents principaux</p>
                <div className="flex flex-wrap gap-2">
                  {company.competitors.map((comp, i) => (
                    <span key={i} className="px-2 py-1 bg-muted rounded text-sm">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Network className="size-5 text-accent" />
                Présence mondiale
              </h3>
              <p className="text-sm text-muted-foreground mb-3">Bureaux: {company.locations.length} villes</p>
              <div className="flex flex-wrap gap-2">
                {company.locations.map((loc, i) => (
                  <span key={i} className="px-3 py-1 bg-accent/10 text-accent rounded-lg text-sm">
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Strategic Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-warning/5 border border-warning/20 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="size-5 text-warning" />
                Défis identifiés
              </h3>
              <ul className="space-y-2">
                {company.challenges.map((challenge, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-warning mt-1">•</span>
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-success/5 border border-success/20 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="size-5 text-success" />
                Priorités 2026
              </h3>
              <ul className="space-y-2">
                {company.priorities.map((priority, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-success mt-1">•</span>
                    <span>{priority}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Relationship Insights */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="size-5 text-primary" />
              <h2 className="text-xl font-semibold">Insights relationnels</h2>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-muted/20 rounded-xl">
                <p className="text-sm">
                  <span className="font-semibold">Tendance d'engagement:</span> Le volume d'interactions a {company.healthScore >= 85 ? 'augmenté de 24%' : 'diminué de 12%'} ce mois-ci, principalement grâce aux échanges avec les contacts clés.
                </p>
              </div>
              <div className="p-4 bg-muted/20 rounded-xl">
                <p className="text-sm">
                  <span className="font-semibold">Opportunité détectée:</span> {company.activeContacts} contacts actifs sur {company.totalContacts} au total. Envisager de renouer le contact avec les {company.totalContacts - company.activeContacts} autres personnes pour maximiser la couverture.
                </p>
              </div>
              {company.healthScore >= 85 && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                  <p className="text-sm">
                    <span className="font-semibold">🔥 Moment fort:</span> {company.meetings30d} meetings planifiés dans les 30 derniers jours. C'est le moment idéal pour proposer de nouvelles initiatives.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
