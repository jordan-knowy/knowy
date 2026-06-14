// Spec-32 — Typage de compte & modulation du moteur de priorisation

export type AccountType = 'acquisition' | 'account_management' | 'partenaire';

/** Seuil de confiance (spec-32 §3) : sous τ, le type est traité comme NULL (« à qualifier »). */
export const ACCOUNT_TYPE_TAU = 0.6;

export interface AccountTypeConfig {
  short: string;   // pastille compacte
  label: string;   // libellé complet
  color: string;   // couleur de texte / accent
  bg: string;      // fond de pastille
  border: string;
}

export const ACCOUNT_TYPE_CONFIG: Record<AccountType, AccountTypeConfig> = {
  acquisition: {
    short: 'Acq',
    label: 'Acquisition',
    color: '#6E50C8',
    bg: 'rgba(110,80,200,0.10)',
    border: 'rgba(110,80,200,0.28)',
  },
  account_management: {
    short: 'AM',
    label: 'Account mgmt',
    color: '#2EA86A',
    bg: 'rgba(46,168,106,0.10)',
    border: 'rgba(46,168,106,0.28)',
  },
  partenaire: {
    short: 'Part',
    label: 'Partenaire',
    color: '#2896A8',
    bg: 'rgba(40,150,168,0.10)',
    border: 'rgba(40,150,168,0.28)',
  },
};

/** Config « à qualifier » pour un type null / sous seuil. */
export const ACCOUNT_TYPE_UNKNOWN: AccountTypeConfig = {
  short: '?',
  label: 'À qualifier',
  color: '#9082B8',
  bg: 'rgba(144,130,184,0.10)',
  border: 'rgba(144,130,184,0.25)',
};

/**
 * Résout le type effectif en appliquant le seuil de confiance (zéro-hallu).
 * Retourne null (« à qualifier ») si type absent ou confiance < τ.
 */
export function resolveAccountType(
  type: AccountType | string | null | undefined,
  confidence: number | null | undefined,
): AccountType | null {
  if (!type) return null;
  if (confidence != null && confidence < ACCOUNT_TYPE_TAU) return null;
  if (type === 'acquisition' || type === 'account_management' || type === 'partenaire') {
    return type;
  }
  return null;
}

export function accountTypeConfig(type: AccountType | null): AccountTypeConfig {
  return type ? ACCOUNT_TYPE_CONFIG[type] : ACCOUNT_TYPE_UNKNOWN;
}

// ── Gating de signaux (spec-32 §4.1) ─────────────────────────────────────────
// Familles spec-30 autorisées par type. Les familles hors-set sont neutralisées.
export const TYPE_GATING: Record<AccountType, Set<string>> = {
  // Acquisition : conquête. Bloque churn / M&A control / couverture fragile (logique rétention).
  acquisition: new Set(['risk', 'lever', 'mobility', 'market', 'growth']),
  // Account management : set complet de rétention.
  account_management: new Set(['churn', 'risk', 'lever', 'mobility', 'market', 'growth']),
  // Partenaire : entretien. Bloque tout signal revenu/churn.
  partenaire: new Set(['lever', 'mobility', 'growth']),
};

/** Plafond de sévérité par type (spec-32 §4.3) : un partenaire ne peut pas être « critique churn ». */
export const TYPE_SEVERITY_CAP: Record<AccountType, number> = {
  acquisition: 100,
  account_management: 100,
  partenaire: 60,
};
