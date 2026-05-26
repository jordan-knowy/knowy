import { motion } from 'motion/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Brain, CalendarCheck, CheckCircle2, Mail, Network, ShieldCheck, Sparkles, Users, MapPin } from 'lucide-react';
import logoKnowy from '../../imports/Pre_sentation1.jpg';
import relationPreview from '../../imports/Capture_d_e_cran_2026-05-21_a__13.09.57.png';
import pricingPreview from '../../imports/Capture_d_e_cran_2026-05-25_a__14.17.20.png';
import { Button } from './design-system/Button';
import { supabase } from '../../lib/supabase';

const sources = ['Gmail', 'Outlook', 'LinkedIn', 'Calendar', 'Zoom text', 'Teams text', 'Notes'];

const productShots = [
  {
    title: 'La relation, enfin visible.',
    text: 'Score relationnel, stakeholders actifs, momentum: Knowy transforme le bruit des échanges en signaux lisibles.',
    image: relationPreview,
  },
  {
    title: "Une fiche avant d'entrer en réunion.",
    text: 'Qui influence. Qui bloque. Qui valide. Comment parler à chacun.',
    image: pricingPreview,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  // If already authenticated, go straight to dashboard
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true });
    });
  }, [navigate]);

  function goToApp() {
    if (!supabase) { navigate('/signin'); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      navigate(session ? '/dashboard' : '/signin', { replace: true });
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <img src={logoKnowy} alt="Knowy" className="h-10 w-auto" />
            </button>

            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={goToApp}>
                Se connecter
              </Button>
              <Button onClick={goToApp} icon={<ArrowRight className="size-4" />}>
                Essayer maintenant
              </Button>
            </div>
          </header>

          <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[0.88fr_1.12fr]">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-semibold text-primary">
                <Sparkles className="size-4" />
                L'intelligence relationnelle avant la réunion
              </p>

              <h1 className="text-5xl font-semibold leading-tight tracking-normal md:text-7xl">
                Sachez qui vous avez en face.
              </h1>

              <p className="mt-6 max-w-2xl text-xl leading-9 text-muted-foreground">
                Knowy lit les signaux autorisés de vos échanges et prépare une fiche claire: comportement,
                influence, risques, stratégie de conversation.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={goToApp} icon={<ArrowRight className="size-5" />}>
                  Essayer maintenant
                </Button>
                <Button size="lg" variant="secondary" onClick={goToApp}>
                  Voir mon premier profil
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {sources.map((source) => (
                  <span key={source} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
                    {source}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}>
              <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
                <img src={relationPreview} alt="Capture Knowy montrant l'évolution relationnelle" className="aspect-[1.35] w-full rounded-md object-cover" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ['84', 'Score relationnel'],
                  ['3/7', 'Couverture'],
                  ['+18%', 'Momentum'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-lg border border-border bg-card p-4">
                    <p className="text-2xl font-semibold text-primary">{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-semibold md:text-6xl">Pas un CRM. Une lecture de la pièce.</h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            La donnée utile n'est pas seulement dans les champs. Elle est dans les silences, les objections,
            les habitudes de réponse et les relations entre les personnes.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {[
            [Users, 'Qui compte vraiment', 'Sponsors, validateurs, bloqueurs, influenceurs et personnes silencieuses.'],
            [Brain, 'Comment leur parler', 'Direct, structuré, relationnel, prudent, rapide ou orienté preuve.'],
            [Network, 'Ce qui se joue entre eux', 'Alliances, dépendances, tensions et dynamique de décision.'],
          ].map(([Icon, title, text]) => (
            <article key={String(title)} className="rounded-lg border border-border bg-card p-6">
              <Icon className="mb-4 size-6 text-primary" />
              <h3 className="text-lg font-semibold">{String(title)}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{String(text)}</p>
            </article>
          ))}
        </div>
      </section>

      {productShots.map((shot, index) => (
        <section key={shot.title} className={`border-t border-border ${index % 2 === 1 ? 'bg-muted/30' : 'bg-background'}`}>
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:px-10">
            <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
              <h2 className="text-4xl font-semibold md:text-5xl">{shot.title}</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">{shot.text}</p>
              <div className="mt-7 grid gap-3">
                {[
                  'Hypothèses visibles, jamais inventées.',
                  'Confiance scorée par source et fraîcheur.',
                  'Amélioration continue à chaque échange.',
                ].map((line) => (
                  <p key={line} className="flex items-center gap-3 text-sm font-semibold">
                    <CheckCircle2 className="size-4 text-success" />
                    {line}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
              <img src={shot.image} alt={shot.title} className="aspect-[1.45] w-full rounded-md object-cover" />
            </div>
          </div>
        </section>
      ))}

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <h2 className="text-4xl font-semibold">Un contexte IA, propre dès le départ.</h2>
              <p className="mt-4 text-muted-foreground">
                Knowy structure votre profil, votre offre, votre site et vos connecteurs pour donner au moteur une base claire.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [Mail, 'Emails et messages', 'Ton, objections, engagements, rythme de réponse.'],
                [CalendarCheck, 'Réunions et agenda', 'Fréquence, participants, initiative, contexte temporel.'],
                [ShieldCheck, 'Zéro hallucination', 'Null si absent. Hypothèse si faible. Recommandation si fiable.'],
                [Brain, 'Profil cognitif', "Axes comportementaux, modes d'interaction, signaux observables."],
              ].map(([Icon, title, text]) => (
                <div key={String(title)} className="rounded-lg border border-border bg-card p-5">
                  <Icon className="mb-3 size-5 text-primary" />
                  <p className="font-semibold">{String(title)}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{String(text)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-violet-night text-white">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center lg:px-10">
          <h2 className="text-4xl font-semibold md:text-6xl">Entrez préparé. Sortez aligné.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/70">
            Créez votre profil, connectez vos sources, puis laissez Knowy construire votre mémoire relationnelle.
          </p>
          <Button className="mt-8" size="lg" onClick={goToApp} icon={<ArrowRight className="size-5" />}>
            Commencer
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-2xl font-black italic text-foreground">
                  Know<span className="text-primary">y</span>
                </h3>
                <span className="text-xl">🇫🇷</span>
              </div>
              <p className="text-sm font-semibold text-primary mb-1">App Made In France</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-4">
                <MapPin className="size-3.5" />
                Paris, France
              </p>
              <p className="text-xs text-muted-foreground leading-5">
                Intelligence relationnelle pour professionnels B2B.
                Connaissez vos contacts avant d'entrer en réunion.
              </p>
            </div>

            {/* Produit */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Produit</h4>
              <ul className="space-y-2.5">
                {[
                  ['Commencer gratuitement', '/signin'],
                  ['Fonctionnalités', '/signin'],
                  ['Tarifs', '/subscription'],
                  ['Se connecter', '/signin'],
                ].map(([label, path]) => (
                  <li key={label}>
                    <button
                      onClick={() => navigate(path)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Légal</h4>
              <ul className="space-y-2.5">
                {[
                  ['CGU', '/cgu'],
                  ['Politique de confidentialité', '/privacy'],
                  ['Politique cookies', '/cookies'],
                  ['Plan du site', '/sitemap'],
                ].map(([label, path]) => (
                  <li key={label}>
                    <button
                      onClick={() => navigate(path)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Contact</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="mailto:contact@knowy.ai" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    contact@knowy.ai
                  </a>
                </li>
                <li>
                  <a href="mailto:privacy@knowy.ai" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    privacy@knowy.ai
                  </a>
                </li>
                <li>
                  <a href="mailto:legal@knowy.ai" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    legal@knowy.ai
                  </a>
                </li>
              </ul>

              <div className="mt-6 p-3 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-xs font-semibold text-primary mb-1">🇫🇷 Made in Paris</p>
                <p className="text-xs text-muted-foreground">
                  Données hébergées en Union Européenne.<br />
                  Conforme RGPD.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © 2026 Knowy SAS · Tous droits réservés · 🇫🇷 Paris, France
            </p>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <button onClick={() => navigate('/cgu')} className="hover:text-primary transition-colors">CGU</button>
              <button onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors">Vie privée</button>
              <button onClick={() => navigate('/cookies')} className="hover:text-primary transition-colors">Cookies</button>
              <button onClick={() => navigate('/sitemap')} className="hover:text-primary transition-colors">Plan du site</button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
