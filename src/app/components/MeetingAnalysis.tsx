import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  CircleDot,
  Mail,
  RefreshCw,
  Share2,
  Shield,
  Sparkles,
  Target,
  Users
} from 'lucide-react';
import { Badge, Button, Card, DataSourcePill, ProgressBar, ScoreDisplay } from './design-system';

type InferenceLevel = 'observable' | 'inferred' | 'hypothetical';

interface Participant {
  id: string;
  name: string;
  role: string;
  stance: string;
  influence: number;
  confidence: number;
  mode: string;
  modeDetail: string;
  sources: string[];
  axes: { left: string; right: string; value: number; level: InferenceLevel }[];
  signals: { text: string; source: string; level: InferenceLevel }[];
  strategy: string;
}

const participants: Participant[] = [
  {
    id: 'sarah',
    name: 'Sarah Chen',
    role: 'VP Partnerships · Contentsquare',
    stance: 'Champion probable',
    influence: 92,
    confidence: 72,
    mode: 'Challenger + Explorer',
    modeDetail: 'Décide vite si le pilote est concret et mesurable.',
    sources: ['Gmail', 'Calendar', 'LinkedIn'],
    axes: [
      { left: 'Relation', right: 'Résultat', value: 76, level: 'inferred' },
      { left: 'Intuition', right: 'Structure', value: 44, level: 'inferred' },
      { left: 'Prudence', right: 'Rapidité', value: 72, level: 'observable' },
      { left: 'Consensus', right: 'Contrôle', value: 58, level: 'hypothetical' }
    ],
    signals: [
      { text: 'Réponses courtes et rapides dans les derniers échanges.', source: 'Gmail', level: 'observable' },
      { text: 'Nouveau rôle depuis 6 mois, recherche probable de quick wins.', source: 'LinkedIn', level: 'inferred' },
      { text: 'Peut sponsoriser un pilote si Marc valide les critères produit.', source: 'Mémoire Knowy', level: 'hypothetical' }
    ],
    strategy: 'Ouvrir avec un pilote 30 jours, métriques simples et prochaine étape datée.'
  },
  {
    id: 'marc',
    name: 'Marc Dubois',
    role: 'Head of Product Strategy · Contentsquare',
    stance: 'Validateur technique',
    influence: 78,
    confidence: 68,
    mode: 'Validator + Operator',
    modeDetail: 'Attend des preuves, critères et contraintes d’intégration.',
    sources: ['Gmail', 'Calendar'],
    axes: [
      { left: 'Relation', right: 'Résultat', value: 84, level: 'observable' },
      { left: 'Intuition', right: 'Structure', value: 81, level: 'inferred' },
      { left: 'Prudence', right: 'Rapidité', value: 39, level: 'inferred' },
      { left: 'Consensus', right: 'Contrôle', value: 64, level: 'hypothetical' }
    ],
    signals: [
      { text: 'Demande régulièrement des benchmarks et détails d’intégration.', source: 'Gmail', level: 'observable' },
      { text: 'Son adhésion dépendra du risque produit perçu.', source: 'Mémoire Knowy', level: 'inferred' },
      { text: 'Peut ralentir le deal si le ROI reste qualitatif.', source: 'Hypothèse', level: 'hypothetical' }
    ],
    strategy: 'Lui donner une grille de décision : ROI, intégration, délai, support.'
  }
];

const levelVariant = {
  observable: 'sage',
  inferred: 'blue',
  hypothetical: 'amber'
} as const;

const levelLabel = {
  observable: 'Observable',
  inferred: 'Inféré',
  hypothetical: 'Hypothétique'
};

export default function MeetingAnalysis() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(participants[0].id);
  const selected = participants.find((participant) => participant.id === selectedId) || participants[0];

  return (
    <div className="size-full overflow-auto bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" aria-label="Retour au dashboard" icon={<ArrowLeft className="size-4" />} onClick={() => navigate('/dashboard')} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl" aria-hidden="true">🎯</span>
                <h1 className="text-2xl font-black">Q1 Strategic Review</h1>
                <Badge>Brief commercial</Badge>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" aria-hidden="true" />
                28 mai 2026 · 14:00-15:00 · Google Meet
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ScoreDisplay value={42} label="Confiance brief" size="sm" tone="confidence" />
            <Button variant="secondary" size="sm" icon={<RefreshCw className="size-4" />} aria-label="Régénérer le brief">Régénérer</Button>
            <Button variant="secondary" size="sm" icon={<Share2 className="size-4" />} aria-label="Partager le brief">Partager</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-black">Brief actionnable</h2>
            </div>
            <p className="max-w-4xl text-base leading-7">
              Sarah peut porter un pilote si la valeur est prouvée vite. Marc risque de bloquer sans métriques et critères d’intégration.
              Le bon angle : pilote limité, preuve ROI, décision cadrée avant la fin de Q2.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <DataSourcePill source="Gmail" level="observable" />
              <DataSourcePill source="Calendar" level="observable" />
              <DataSourcePill source="LinkedIn" level="inferred" />
              <DataSourcePill source="CRM" status="missing" level="unavailable" />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Sources et prudence</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span>Signaux observables</span><Badge variant="sage">7</Badge></div>
              <div className="flex items-center justify-between"><span>Signaux inférés</span><Badge variant="blue">6</Badge></div>
              <div className="flex items-center justify-between"><span>Hypothèses à valider</span><Badge variant="amber">3</Badge></div>
              <div className="flex items-center justify-between"><span>Données non disponibles</span><Badge variant="muted">CRM</Badge></div>
            </div>
          </Card>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary">Moment central</p>
              <h2 className="text-3xl font-black">Qui est dans la room</h2>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Les profils restent probabilistes : chaque carte sépare ce qui est observé, inféré et à valider en réunion.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {participants.map((participant) => (
              <button
                key={participant.id}
                type="button"
                onClick={() => setSelectedId(participant.id)}
                className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card className={`h-full p-5 ${selectedId === participant.id ? 'border-primary bg-primary/5' : ''}`} hover>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-lg font-black text-white">
                        {participant.name.split(' ').map((part) => part[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-lg font-black">{participant.name}</h3>
                        <p className="text-sm text-muted-foreground">{participant.role}</p>
                      </div>
                    </div>
                    <Badge variant={participant.stance.includes('Champion') ? 'sage' : 'violet'}>{participant.stance}</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ScoreDisplay value={participant.influence} label="Influence" size="sm" />
                    <ScoreDisplay value={participant.confidence} label="Confiance" size="sm" tone="confidence" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Mode</p>
                      <p className="mt-1 text-sm font-bold">{participant.mode}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{participant.modeDetail}</p>
                </Card>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Profil interactionnel · {selected.name}</h2>
                <p className="text-sm text-muted-foreground">{selected.strategy}</p>
              </div>
              <Button variant="ghost" size="sm" icon={<ArrowRight className="size-4" />} onClick={() => navigate(`/relation/${selected.id === 'sarah' ? '1' : '2'}`)}>
                Fiche complète
              </Button>
            </div>

            <div className="space-y-5">
              {selected.axes.map((axis) => (
                <div key={`${axis.left}-${axis.right}`}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold">{axis.left}</span>
                    <Badge variant={levelVariant[axis.level]} size="sm">{levelLabel[axis.level]}</Badge>
                    <span className="font-semibold">{axis.right}</span>
                  </div>
                  <ProgressBar value={axis.value} label={`${axis.left} vers ${axis.right}`} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-xl font-black">Signaux comportementaux</h2>
            <div className="space-y-3">
              {selected.signals.map((signal) => (
                <div key={signal.text} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant={levelVariant[signal.level]} size="sm">{levelLabel[signal.level]}</Badge>
                    <DataSourcePill source={signal.source} level={signal.level} />
                  </div>
                  <p className="text-sm">{signal.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { icon: Target, title: 'Ouverture', text: 'Valider les métriques de succès avant la démo.' },
            { icon: Shield, title: 'Objection probable', text: '“On utilise déjà Gong” : positionner Knowy sur l’intelligence relationnelle.' },
            { icon: Building2, title: 'Contexte entreprise', text: 'Levée et recrutements créent une fenêtre favorable, mais courte.' }
          ].map((item) => (
            <Card key={item.title} className="p-5">
              <item.icon className="mb-3 size-5 text-primary" aria-hidden="true" />
              <h3 className="mb-2 font-black">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </Card>
          ))}
        </section>

        <section className="mt-6">
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black"><Users className="size-5 text-primary" /> Dynamique de décision</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg bg-muted/25 p-3 text-sm">
                <CircleDot className="size-4 text-sage" />
                <span><strong>Sarah</strong> peut sponsoriser le pilote si le prochain pas est simple.</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/25 p-3 text-sm">
                <CheckCircle2 className="size-4 text-primary" />
                <span><strong>Marc</strong> doit valider les critères produit et ROI.</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/25 p-3 text-sm">
                <Mail className="size-4 text-amber" />
                <span>Le dernier contact significatif date de 23 jours : relancer sous 48h.</span>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
