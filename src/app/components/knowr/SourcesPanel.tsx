import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Mail, Globe, Database, Check, AlertTriangle, Minus, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

/**
 * « Sources connectées » (hsrc) — panneau commun fiche Personne / Compte.
 * Reproduit le design de la maquette (knowr-personne / knowr-compte) en le
 * branchant sur les données réelles : table `connectors` (email) + présence
 * d'un enrichissement public (Pappers/LinkedIn) + statut CRM (à venir).
 */

interface ConnectorRow {
  provider: string;
  status: string;
  last_synced_at: string | null;
}

interface SourcesPanelProps {
  organizationId: string | null;
  /** Données publiques captées (enrichment_data / public_context non vides) */
  hasPublicData?: boolean;
  /** Note de provenance affichée en pied (sourcing). */
  provenanceNote?: string;
}

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Gmail · Agenda Google',
  microsoft: 'Outlook · Microsoft 365',
  azure: 'Outlook · Microsoft 365',
};

function isConnected(status: string) {
  return status === 'connected' || status === 'active';
}

export default function SourcesPanel({ organizationId, hasPublicData = false, provenanceNote }: SourcesPanelProps) {
  const navigate = useNavigate();
  const [connectors, setConnectors] = useState<ConnectorRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase || !organizationId) return;
      const { data } = await supabase
        .from('connectors')
        .select('provider, status, last_synced_at')
        .eq('organization_id', organizationId);
      if (!cancelled) setConnectors((data ?? []) as ConnectorRow[]);
    })();
    return () => { cancelled = true; };
  }, [organizationId]);

  // ── Construire les lignes (toujours présentes, même vides) ──────────────
  const emailRows = connectors.filter(c => ['google', 'microsoft', 'azure'].includes(c.provider));
  const anyEmailConnected = emailRows.some(c => isConnected(c.status));
  const needsReauth = emailRows.some(c => c.status === 'needs_reauth');

  type RowState = 'ok' | 'warn' | 'off';
  const emailRow: { icon: typeof Mail; label: string; sub: string; state: RowState } = anyEmailConnected
    ? {
        icon: Mail,
        label: emailRows.filter(c => isConnected(c.status)).map(c => PROVIDER_LABEL[c.provider] ?? c.provider).join(' · '),
        sub: 'Emails & réunions',
        state: 'ok',
      }
    : needsReauth
      ? { icon: Mail, label: 'Messagerie', sub: 'Reconnexion requise', state: 'warn' }
      : { icon: Mail, label: 'Messagerie', sub: 'Aucune source email connectée', state: 'off' };

  const rows: { icon: typeof Mail; label: string; sub: string; state: RowState; pill: string }[] = [
    { ...emailRow, pill: emailRow.state === 'ok' ? '✓' : emailRow.state === 'warn' ? 'Reconnexion' : 'À connecter' },
    {
      icon: Globe,
      label: 'Pappers · LinkedIn',
      sub: 'Sources publiques',
      state: hasPublicData ? 'ok' : 'off',
      pill: hasPublicData ? '✓' : 'À enrichir',
    },
    {
      icon: Database,
      label: 'CRM',
      sub: 'HubSpot · Salesforce · Pipedrive',
      state: 'off',
      pill: 'Bientôt',
    },
  ];

  const stateColor = (s: RowState) =>
    s === 'ok' ? { fg: '#2EA86A', bg: 'rgba(46,168,106,0.10)' }
    : s === 'warn' ? { fg: '#C97A20', bg: 'rgba(201,122,32,0.10)' }
    : { fg: '#9082B8', bg: 'rgba(144,130,184,0.10)' };

  const StateIcon = ({ s }: { s: RowState }) =>
    s === 'ok' ? <Check className="size-3.5" />
    : s === 'warn' ? <AlertTriangle className="size-3.5" />
    : <Minus className="size-3.5" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3"
        style={{ fontFamily: 'var(--mono)' }}>
        Sources connectées
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {rows.map(({ icon: Icon, label, sub, state, pill }) => {
          const c = stateColor(state);
          return (
            <div key={label} className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5">
              <span className="size-8 flex-shrink-0 rounded-lg flex items-center justify-center"
                style={{ background: c.bg, color: c.fg }}>
                <Icon className="size-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{sub}</p>
              </div>
              <span className="flex items-center gap-0.5 text-[10px] font-bold flex-shrink-0"
                style={{ color: c.fg }}>
                <StateIcon s={state} />
                {pill !== '✓' && <span className="hidden sm:inline">{pill}</span>}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
        {provenanceNote && (
          <p className="text-[11px] text-muted-foreground italic flex-1 min-w-[180px]">{provenanceNote}</p>
        )}
        <button
          onClick={() => navigate('/account')}
          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline ml-auto"
        >
          Gérer les connecteurs <ChevronRight className="size-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
