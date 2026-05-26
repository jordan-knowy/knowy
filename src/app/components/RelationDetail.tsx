import { useNavigate } from 'react-router';
import { ArrowLeft, Calendar, CheckCircle2, Mail, MessageSquare, Share2, Target, TrendingUp, Users } from 'lucide-react';
import { Badge, Button, Card, DataSourcePill, ProgressBar, ScoreDisplay } from './design-system';

const axes = [
  { left: 'Relation', right: 'Résultat', value: 76, confidence: 68, level: 'Inféré' },
  { left: 'Intuition', right: 'Structure', value: 42, confidence: 61, level: 'Inféré' },
  { left: 'Prudence', right: 'Rapidité', value: 72, confidence: 74, level: 'Observable' },
  { left: 'Consensus', right: 'Contrôle', value: 55, confidence: 32, level: 'Hypothétique' }
];

const insights = [
  { title: 'Communication directe', text: 'Réponses courtes, peu d’introduction, demande vite la prochaine étape.', source: 'Gmail', level: 'observable' as const },
  { title: 'Recherche de quick win', text: 'Nouveau rôle et fenêtre Q2 : motivation probable à montrer un résultat rapide.', source: 'LinkedIn + Calendar', level: 'inferred' as const },
  { title: 'Influence sur l’équipe Sales', text: 'Peut embarquer l’équipe Sales si Marc ne bloque pas le cadrage produit.', source: 'Mémoire Knowy', level: 'hypothetical' as const }
];

const timeline = [
  { type: 'email', title: 'Re: Partnership discussion Q2', date: 'Il y a 3 jours', meta: '34 mots · ton positif' },
  { type: 'meeting', title: 'Q1 Partnership Review', date: 'Il y a 1 semaine', meta: '45 min · 3 participants' },
  { type: 'brief', title: 'Brief commercial généré', date: 'Il y a 3 semaines', meta: 'Confiance 85/100' }
];

export default function RelationDetail() {
  const navigate = useNavigate();

  return (
    <div className="size-full overflow-auto bg-background">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="size-4" />} onClick={() => navigate('/relations')}>
            Relations
          </Button>
          <Button variant="secondary" size="sm" icon={<Share2 className="size-4" />}>Partager la fiche</Button>
        </div>

        <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card className="p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-4">
                <div className="flex size-16 items-center justify-center rounded-lg bg-primary text-2xl font-black text-white">SC</div>
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-black">Sarah Chen</h1>
                    <Badge variant="sage"><CheckCircle2 className="size-3" />Titre confirmé</Badge>
                  </div>
                  <p className="text-lg text-muted-foreground">VP Partnerships · Contentsquare</p>
                  <p className="mt-1 text-sm text-muted-foreground">Paris · SaaS Analytics · en poste depuis 2 ans 4 mois</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <DataSourcePill source="Gmail" level="observable" />
                    <DataSourcePill source="Calendar" level="observable" />
                    <DataSourcePill source="LinkedIn" level="inferred" />
                    <DataSourcePill source="CRM" status="missing" level="unavailable" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:min-w-72">
                <ScoreDisplay value={87} label="Engagement" showBar />
                <ScoreDisplay value={72} label="Confiance profil" tone="confidence" showBar />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">Prochaine action</p>
            <h2 className="mb-3 text-xl font-black">Pilote cadré 30 jours</h2>
            <p className="text-sm text-muted-foreground">
              Relancer sous 48h avec un plan simple : métriques de succès, périmètre réduit, décision Marc.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="sage">Développement</Badge>
              <Badge variant="blue">Challenger</Badge>
              <Badge variant="amber">Hypothèse à valider</Badge>
            </div>
          </Card>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          {[
            ['47', 'Emails échangés', 'Gmail'],
            ['8', 'Réunions tenues', 'Calendar'],
            ['< 4h', 'Délai réponse', 'Gmail'],
            ['23j', 'Dernier contact important', 'Mémoire']
          ].map(([value, label, source]) => (
            <Card key={label} className="p-5">
              <p className="text-3xl font-black">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">via {source}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="mb-5 text-xl font-black">Fiche cognitive et comportementale</h2>
              <div className="space-y-5">
                {axes.map((axis) => (
                  <div key={axis.left}>
                    <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                      <span className="font-semibold">{axis.left}</span>
                      <Badge variant={axis.level === 'Observable' ? 'sage' : axis.level === 'Inféré' ? 'blue' : 'amber'}>{axis.level} · {axis.confidence}%</Badge>
                      <span className="font-semibold">{axis.right}</span>
                    </div>
                    <ProgressBar value={axis.value} label={`${axis.left} vers ${axis.right}`} />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-xl font-black">Insights sourcés</h2>
              <div className="grid gap-3">
                {insights.map((insight) => (
                  <div key={insight.title} className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-black">{insight.title}</h3>
                      <DataSourcePill source={insight.source} level={insight.level} />
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.text}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-xl font-black">Stratégie conversationnelle</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-sage-bg p-4"><Target className="mb-2 size-5 text-sage" /><p className="font-bold">Commencer par le résultat attendu.</p></div>
                <div className="rounded-lg bg-blue-info-bg p-4"><Users className="mb-2 size-5 text-blue-info" /><p className="font-bold">Faire valider Marc explicitement.</p></div>
                <div className="rounded-lg bg-amber-bg p-4"><TrendingUp className="mb-2 size-5 text-amber" /><p className="font-bold">Transformer l’actualité en urgence douce.</p></div>
              </div>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-black">Historique relationnel</h2>
              <div className="space-y-4">
                {timeline.map((event) => {
                  const Icon = event.type === 'email' ? Mail : event.type === 'meeting' ? Calendar : MessageSquare;
                  return (
                    <div key={event.title} className="flex gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-primary">
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-bold">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.date}</p>
                        <p className="text-xs text-muted-foreground">{event.meta}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-xl font-black">Modes probables</h2>
              <div className="space-y-3">
                <div><div className="mb-1 flex justify-between text-sm"><span>Challenger</span><strong>84%</strong></div><ProgressBar value={84} label="Mode Challenger" /></div>
                <div><div className="mb-1 flex justify-between text-sm"><span>Explorer</span><strong>71%</strong></div><ProgressBar value={71} label="Mode Explorer" tone="blue" /></div>
                <div><div className="mb-1 flex justify-between text-sm"><span>Strategist</span><strong>54%</strong></div><ProgressBar value={54} label="Mode Strategist" tone="amber" /></div>
              </div>
            </Card>
          </aside>
        </section>
      </main>
    </div>
  );
}
