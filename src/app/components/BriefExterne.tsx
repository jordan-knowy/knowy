import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Mail, Loader2, Lock, Globe, Building2,
  Zap, Target, Users, AlertTriangle, Sparkles, Calendar,
  TrendingUp, ShieldCheck, ExternalLink,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CollapsibleSection from './knowr/CollapsibleSection';

// ── Types (brief_externe_schema) ────────────────────────────────────────────
type Intention = 'vente' | 'decouverte' | 'negociation' | 'retention' | 'partenariat';

interface Pillar { score: number; drivers?: string[]; sources: string[]; }
interface Participant {
  name: string; title: string; linkedin: string | null;
  buying_role: string; confirmed: boolean;
  parcours: { company: string; title: string; period: string | null; source: string }[];
  icebreaker: string | null; sources: string[];
}
interface Trigger { type?: string; label: string; date: string | null; ampleur: string | null; source: string; }
interface Dossier {
  seller: { company: string; intention: Intention };
  trigger_email: string;
  prospect: {
    company: {
      name: string; domain: string; siren: string | null; forme_juridique: string | null;
      effectif: string | null; ca: string | null; ville: string | null; secteur: string | null;
      description: string | null; site: string | null; sources: string[];
    };
    triggers: Trigger[];
    participants: Participant[];
  };
  eos: { fit: Pillar; timing: Pillar; pouvoir: Pillar; agg: 'a_priori' | 'mesure'; score: number };
  mode_5min: { qui: string; pourquoi_maintenant: string; angle: string; premiere_phrase: string; anti_pattern: string } | null;
  coverage_score: number;
  meta?: { used_research: boolean; used_llm: boolean; generic_domain: boolean };
}

const INTENTIONS: { key: Intention; label: string }[] = [
  { key: 'vente',        label: 'Vente' },
  { key: 'decouverte',   label: 'Découverte' },
  { key: 'negociation',  label: 'Négociation' },
  { key: 'retention',    label: 'Rétention' },
  { key: 'partenariat',  label: 'Partenariat' },
];

const BUYING_ROLE_LABEL: Record<string, string> = {
  decideur: 'Décideur', acheteur_eco: 'Acheteur éco.', champion: 'Champion',
  influenceur: 'Influenceur', utilisateur: 'Utilisateur', gatekeeper: 'Gatekeeper',
  a_confirmer: 'À confirmer',
};

function eosColor(s: number) {
  if (s >= 65) return '#2EA86A';
  if (s >= 40) return '#C97A20';
  return '#D94F63';
}

function initials(name: string) {
  return name.split(/[\s\-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ── Confirmé / à confirmer chip (règle stricte d'emploi) ─────────────────────
function ProvChip({ confirmed }: { confirmed: boolean }) {
  return confirmed ? (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: 'rgba(46,168,106,0.12)', color: '#2EA86A', fontFamily: 'var(--mono)' }}>
      CONFIRMÉ
    </span>
  ) : (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: 'rgba(201,122,32,0.12)', color: '#C97A20', fontFamily: 'var(--mono)' }}>
      À CONFIRMER
    </span>
  );
}

function PillarBar({ label, pillar }: { label: string; pillar: Pillar }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>{label}</span>
        <span className="text-sm font-mono font-bold" style={{ color: eosColor(pillar.score) }}>{pillar.score}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E8EBF0' }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pillar.score}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: eosColor(pillar.score) }}
        />
      </div>
      {pillar.drivers && pillar.drivers.length > 0 && (
        <p className="text-[10px] text-muted-foreground mt-1">{pillar.drivers.slice(0, 2).join(' · ')}</p>
      )}
    </div>
  );
}

export default function BriefExterne() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [intention, setIntention] = useState<Intention>('vente');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dossier, setDossier] = useState<Dossier | null>(null);

  const generate = async () => {
    if (!email.includes('@') || !supabase) {
      setError('Entrez une adresse email valide.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('generate-external-brief', {
        body: { trigger_email: email.trim(), intention, seller_company: 'Mon entreprise' },
      });
      if (fnErr) {
        setError(fnErr.message ?? 'Erreur de génération.');
      } else if (data?.error) {
        setError(data.error);
      } else {
        setDossier(data as Dossier);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="size-full overflow-auto" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-8">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-5"
        >
          <ArrowLeft className="size-4" /> Retour
        </button>

        {/* ══ FORM D'ENTRÉE ════════════════════════════════════════════════ */}
        {!dossier && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden p-8" style={{ background: '#13111E' }}
          >
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-5" style={{ color: '#B39DDB' }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--mono)' }}>
                  Brief externe · sans inbox
                </span>
              </div>
              <h1 className="text-2xl font-black mb-2" style={{ color: '#fff' }}>
                Préparez un RDV depuis une simple adresse email
              </h1>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                100 % sources publiques (registres FR, LinkedIn, presse, site). Aucune connexion de boîte mail requise.
              </p>

              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--mono)' }}>
                Email du prospect
              </label>
              <div className="relative mb-4">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type="email"
                  placeholder="prenom.nom@entreprise.fr"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generate()}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>

              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--mono)' }}>
                Intention
              </label>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {INTENTIONS.map(i => (
                  <button
                    key={i.key}
                    onClick={() => setIntention(i.key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    style={intention === i.key
                      ? { background: '#6E50C8', color: '#fff' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    {i.label}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-sm mb-3" style={{ color: '#F0A0AD' }}>{error}</p>
              )}

              <button
                onClick={generate}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: '#6E50C8' }}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                {loading ? 'Génération du dossier…' : 'Générer le brief'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ══ DOSSIER RENDU ════════════════════════════════════════════════ */}
        {dossier && (
          <>
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden p-6 mb-4" style={{ background: '#13111E' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--mono)' }}>
                  Inbox OFF
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--mono)' }}>
                  Intention · {dossier.seller.intention}
                </span>
              </div>
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-xl flex items-center justify-center text-lg font-black text-white"
                    style={{ background: 'linear-gradient(135deg,#6E50C8,#9747FF)' }}>
                    {initials(dossier.prospect.company.name)}
                  </div>
                  <div>
                    <h1 className="text-2xl font-black leading-tight" style={{ color: '#fff' }}>
                      {dossier.prospect.company.name}
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {[dossier.prospect.company.secteur, dossier.prospect.company.ville, dossier.prospect.company.domain].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                {/* EOS score */}
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>
                    EOS · a priori
                  </p>
                  <p className="text-4xl font-black leading-none" style={{ color: eosColor(dossier.eos.score) }}>{dossier.eos.score}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>/100</p>
                </div>
              </div>
              {/* Coverage */}
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(110,80,200,0.2)', color: '#B39DDB', border: '1px solid rgba(110,80,200,0.3)', fontFamily: 'var(--mono)' }}>
                  Couverture {dossier.coverage_score}%
                </span>
                {dossier.meta?.generic_domain && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(201,122,32,0.18)', color: '#F0C07A', fontFamily: 'var(--mono)' }}>
                    Domaine générique — entreprise à confirmer
                  </span>
                )}
                <button onClick={() => setDossier(null)} className="ml-auto text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  ← Nouveau brief
                </button>
              </div>
            </motion.div>

            {/* LAYOUT MAIN + RAIL */}
            <div className="flex flex-col lg:flex-row gap-5">
              <div className="flex-1 min-w-0 space-y-4">

                {/* Mode 5 min */}
                {dossier.mode_5min && (
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
                      <Sparkles className="size-4 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>Mode 5 min</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border">
                      {[
                        { l: 'Qui', v: dossier.mode_5min.qui },
                        { l: 'Pourquoi maintenant', v: dossier.mode_5min.pourquoi_maintenant },
                        { l: 'Angle', v: dossier.mode_5min.angle },
                        { l: '1ʳᵉ phrase', v: dossier.mode_5min.premiere_phrase },
                        { l: 'Anti-pattern', v: dossier.mode_5min.anti_pattern },
                      ].map(c => (
                        <div key={c.l} className="p-3">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5" style={{ fontFamily: 'var(--mono)' }}>{c.l}</p>
                          <p className="text-xs text-foreground leading-snug">{c.v || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Participants */}
                <CollapsibleSection title="Participants" icon={<Users className="size-4" />} badge={String(dossier.prospect.participants.length)} defaultOpen>
                  {dossier.prospect.participants.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucun participant identifié publiquement.</p>
                  ) : (
                    <div className="space-y-3">
                      {dossier.prospect.participants.map((p, i) => (
                        <div key={i} className="rounded-xl border border-border p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="size-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg,#6E50C8,#9747FF)' }}>
                              {initials(p.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold truncate">{p.name}</p>
                                <ProvChip confirmed={p.confirmed} />
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{ background: 'rgba(110,80,200,0.10)', color: '#6E50C8', fontFamily: 'var(--mono)' }}>
                                  {BUYING_ROLE_LABEL[p.buying_role] ?? p.buying_role}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{p.title}</p>
                            </div>
                            {p.linkedin && (
                              <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                <ExternalLink className="size-4" />
                              </a>
                            )}
                          </div>
                          {p.icebreaker && (
                            <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2.5 mb-2">
                              💬 {p.icebreaker}
                            </p>
                          )}
                          {p.parcours.length > 0 && (
                            <div className="space-y-1 mt-2">
                              {p.parcours.slice(0, 3).map((pc, j) => (
                                <p key={j} className="text-[11px] text-muted-foreground">
                                  <span className="font-semibold text-foreground">{pc.title}</span> · {pc.company}
                                  {pc.period ? ` · ${pc.period}` : ''}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleSection>

                {/* Déclencheurs */}
                {dossier.prospect.triggers.length > 0 && (
                  <CollapsibleSection title="Déclencheurs · pourquoi maintenant" icon={<TrendingUp className="size-4" />} badge={String(dossier.prospect.triggers.length)} defaultOpen>
                    <div className="space-y-2">
                      {dossier.prospect.triggers.map((t, i) => (
                        <div key={i} className="rounded-xl border border-border p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="size-3.5 text-primary" />
                            <p className="text-sm font-semibold">{t.label}</p>
                            {t.date && <span className="text-[10px] font-mono text-muted-foreground ml-auto">{t.date}</span>}
                          </div>
                          {t.ampleur && <p className="text-xs text-muted-foreground">{t.ampleur}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: 'var(--mono)' }}>Source : {t.source}</p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}

                {/* L'entreprise */}
                <CollapsibleSection title="L'entreprise" icon={<Building2 className="size-4" />} defaultOpen={false}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    {[
                      { l: 'SIREN', v: dossier.prospect.company.siren },
                      { l: 'Forme juridique', v: dossier.prospect.company.forme_juridique },
                      { l: 'Effectif', v: dossier.prospect.company.effectif },
                      { l: 'CA', v: dossier.prospect.company.ca },
                      { l: 'Ville', v: dossier.prospect.company.ville },
                      { l: 'Secteur', v: dossier.prospect.company.secteur },
                    ].map(f => (
                      <div key={f.l} className="rounded-xl border border-border p-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5" style={{ fontFamily: 'var(--mono)' }}>{f.l}</p>
                        <p className="text-xs font-semibold text-foreground">{f.v ?? 'à confirmer'}</p>
                      </div>
                    ))}
                  </div>
                  {dossier.prospect.company.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{dossier.prospect.company.description}</p>
                  )}
                  {dossier.prospect.company.site && (
                    <a href={dossier.prospect.company.site} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2">
                      <Globe className="size-3.5" /> {dossier.prospect.company.site}
                    </a>
                  )}
                </CollapsibleSection>

                {/* Intelligence relationnelle — VERROUILLÉE (spec-38 §4) */}
                <div className="relative rounded-2xl border border-border overflow-hidden">
                  <div className="p-6 blur-[6px] select-none pointer-events-none opacity-60">
                    <p className="text-sm font-bold mb-3">Intelligence relationnelle</p>
                    <div className="grid grid-cols-3 gap-3">
                      {['Santé relation', 'Power map', 'Signaux inbox'].map(x => (
                        <div key={x} className="h-20 rounded-xl bg-muted" />
                      ))}
                    </div>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
                    style={{ background: 'rgba(240,242,247,0.55)', backdropFilter: 'blur(2px)' }}>
                    <div className="size-11 rounded-full flex items-center justify-center mb-2"
                      style={{ background: 'rgba(110,80,200,0.12)', border: '1px solid rgba(110,80,200,0.3)' }}>
                      <Lock className="size-5 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-foreground mb-1">Intelligence relationnelle verrouillée</p>
                    <p className="text-xs text-muted-foreground mb-3 max-w-xs">
                      NPS, mémoire, lecture comportementale et power map réelle se débloquent dès la connexion de votre boîte mail.
                    </p>
                    <button
                      onClick={() => navigate('/account')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                      style={{ background: '#1A1040' }}
                    >
                      Connecter ma boîte mail
                    </button>
                  </div>
                </div>
              </div>

              {/* RAIL : EOS + sources */}
              <aside className="lg:w-64 xl:w-72 flex-shrink-0">
                <div className="lg:sticky lg:top-6 space-y-4">
                  {/* EOS 3 piliers */}
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="size-4 text-primary" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>
                        EOS · 3 piliers
                      </p>
                    </div>
                    <div className="space-y-3">
                      <PillarBar label="Fit firmographique" pillar={dossier.eos.fit} />
                      <PillarBar label="Timing" pillar={dossier.eos.timing} />
                      <PillarBar label="Pouvoir d'achat" pillar={dossier.eos.pouvoir} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border" style={{ fontFamily: 'var(--mono)' }}>
                      Score a priori · méthodo Knowr (non calibré closed-won)
                    </p>
                  </div>

                  {/* Sources mobilisées */}
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="size-4 text-success" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--mono)' }}>
                        Sources mobilisées
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {[...new Set([
                        ...dossier.prospect.company.sources,
                        ...dossier.prospect.triggers.flatMap(t => t.source ? [t.source] : []),
                      ])].slice(0, 8).map((s, i) => (
                        <p key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="text-primary">›</span> {s}
                        </p>
                      ))}
                      {dossier.prospect.company.sources.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">Sources à confirmer (recherche publique limitée).</p>
                      )}
                    </div>
                  </div>

                  {/* RGPD note */}
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(201,122,32,0.06)', border: '1px solid rgba(201,122,32,0.2)' }}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="size-4 flex-shrink-0 mt-0.5" style={{ color: '#C97A20' }} />
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Données publiques uniquement · assistance à la préparation (pas de décision automatisée).
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
