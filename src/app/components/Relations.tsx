import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, ArrowRight, Mail, Search, TrendingDown, TrendingUp, UserRound } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input, ScoreDisplay } from './design-system';

type Phase = 'growth' | 'stagnant' | 'decline';

interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  logo: string;
  confidence: number;
  engagement: number;
  phase: Phase;
  mode: string;
  nextMove: string;
  signals: string[];
  alert?: string;
}

const contacts: Contact[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    title: 'VP Partnerships',
    company: 'Contentsquare',
    logo: '🎯',
    confidence: 72,
    engagement: 87,
    phase: 'growth',
    mode: 'Challenger + Explorer',
    nextMove: 'Proposer un pilote cadré 30 jours.',
    signals: ['Réponses < 2h', 'Quick win probable', 'Champion à confirmer'],
    alert: 'Fenêtre favorable après levée'
  },
  {
    id: '2',
    name: 'Alexandre Garcia',
    title: 'CFO',
    company: 'Qonto',
    logo: '💳',
    confidence: 69,
    engagement: 92,
    phase: 'growth',
    mode: 'Validator',
    nextMove: 'Préparer un ROI chiffré et un scénario de risque.',
    signals: ['Demandes de preuve', 'Décision économique', 'Cycle court']
  },
  {
    id: '3',
    name: 'Julie Martin',
    title: 'Head of Procurement',
    company: 'Swile',
    logo: '🍔',
    confidence: 61,
    engagement: 74,
    phase: 'growth',
    mode: 'Consensus Builder',
    nextMove: 'Identifier les parties prenantes achats.',
    signals: ['Process structuré', 'Risque légal', 'Besoin alignement']
  },
  {
    id: '4',
    name: 'Thomas Lebrun',
    title: 'Sales Ops Manager',
    company: 'Alan',
    logo: '💙',
    confidence: 54,
    engagement: 58,
    phase: 'stagnant',
    mode: 'Operator',
    nextMove: 'Revenir avec un cas d’usage opérationnel.',
    signals: ['Peu de momentum', 'Orienté exécution', 'CRM important']
  },
  {
    id: '6',
    name: 'Pierre Dubois',
    title: 'Sales Director',
    company: 'Doctolib',
    logo: '🏥',
    confidence: 38,
    engagement: 28,
    phase: 'decline',
    mode: 'Strategist',
    nextMove: 'Réactiver avec un insight marché, pas une relance générique.',
    signals: ['47 jours sans échange', 'Relation froide', 'Source Gmail uniquement'],
    alert: 'Relation qui refroidit'
  }
];

const phaseConfig = {
  growth: { label: 'Développement', variant: 'sage', icon: TrendingUp },
  stagnant: { label: 'Stagnation', variant: 'muted', icon: Mail },
  decline: { label: 'Décroissance', variant: 'coral', icon: TrendingDown }
} as const;

export default function Relations() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | Phase | 'alerts'>('all');

  const filteredContacts = contacts.filter((contact) => {
    const textMatch = [contact.name, contact.title, contact.company, contact.mode].join(' ').toLowerCase().includes(query.toLowerCase());
    const filterMatch = filter === 'all' || contact.phase === filter || (filter === 'alerts' && contact.alert);
    return textMatch && filterMatch;
  });

  return (
    <div className="size-full overflow-auto bg-background">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <header className="mb-6">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Mémoire vivante</p>
          <h1 className="mb-2 text-4xl font-black">Relations</h1>
          <p className="text-muted-foreground">
            Fiches cognitives et comportementales mockées, sourcées localement pour la P0 design.
          </p>
        </header>

        <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <Input
            label="Rechercher une relation"
            icon={<Search className="size-4" aria-hidden="true" />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, entreprise, rôle ou mode d’interaction"
          />
          <div className="flex flex-wrap items-end gap-2">
            {[
              ['all', 'Tous'],
              ['growth', 'Développement'],
              ['stagnant', 'Stagnation'],
              ['decline', 'Décroissance'],
              ['alerts', 'Alertes']
            ].map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={filter === value ? 'primary' : 'secondary'}
                onClick={() => setFilter(value as typeof filter)}
              >
                {label}
              </Button>
            ))}
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="p-5"><ScoreDisplay value={71} label="Confiance moyenne" showBar tone="confidence" /></Card>
          <Card className="p-5"><ScoreDisplay value={68} label="Momentum réseau" showBar /></Card>
          <Card className="p-5"><ScoreDisplay value={3} label="Relations à risque" size="md" /></Card>
        </section>

        {filteredContacts.length === 0 ? (
          <EmptyState
            icon={<UserRound className="size-7" aria-hidden="true" />}
            title="Aucune relation trouvée"
            description="Aucun contact ne correspond à la recherche ou aux filtres actifs."
          />
        ) : (
          <div className="grid gap-4">
            {filteredContacts.map((contact, index) => {
              const config = phaseConfig[contact.phase];
              const PhaseIcon = config.icon;

              return (
                <Card key={contact.id} hover delay={index * 0.03} className="p-5" onClick={() => navigate(`/relation/${contact.id}`)}>
                  <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr_1fr_auto] lg:items-center">
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-lavender-100 text-2xl">{contact.logo}</div>
                      <div>
                        <h2 className="text-xl font-black">{contact.name}</h2>
                        <p className="text-sm text-muted-foreground">{contact.title} · {contact.company}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="blue">{contact.mode}</Badge>
                          <Badge variant={config.variant}><PhaseIcon className="size-3" />{config.label}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <ScoreDisplay value={contact.engagement} label="Engagement" size="sm" showBar />
                      <ScoreDisplay value={contact.confidence} label="Confiance" size="sm" tone="confidence" showBar />
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Signaux clés</p>
                      <div className="flex flex-wrap gap-2">
                        {contact.signals.map((signal) => <Badge key={signal} variant="muted">{signal}</Badge>)}
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{contact.nextMove}</p>
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      {contact.alert && (
                        <Badge variant={contact.phase === 'decline' ? 'coral' : 'amber'}>
                          <AlertCircle className="size-3" />
                          {contact.alert}
                        </Badge>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<ArrowRight className="size-4" />}
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/relation/${contact.id}`);
                        }}
                      >
                        Ouvrir
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
