# -*- coding: utf-8 -*-
"""
Knowr — Moteur de fusion & priorisation (spec-30) · formules GELÉES.
Référence d'implémentation pour le dev (Jordan). Validé sur 6 comptes réels (04/06/2026).

Trois couches :
  1) score d'un signal   : sev_base[0-100] × m(t)[0-1] × confiance[0-1]   -> borné [0,100]
  2) fusion en patterns  : combine(...) top-dominant borné
  3) sévérité du compte  : combine(patterns) ; urgence ; priorité = sév × (0.55 + 0.45*urg/100)

Aucune dépendance externe. Python 3.
"""
from datetime import date
from functools import reduce

TODAY = date(2026, 6, 4)          # en prod : date.today()
def _age(d): return (TODAY - d).days

# ─────────────────────────── FIX 1 · modulation temporelle bornée [0,1] ───────────────────────────
def m_decay(d, half):             # événements qui s'estompent (exponentiel concave)
    return 0.5 ** (_age(d) / half) if (d and half) else 1.0

def m_hill(days, K=45, k=1.5):    # silence/cooling : montée concave bornée, garde l'écart > 50j
    days = max(days or 0, 0)
    return (days ** k) / (days ** k + K ** k) if days > 0 else 0.0

# sev_base ∈ [0,100] (défensabilité bakée) · conf ∈ [0,1] · type · demi-vie (j)
SIGNALS = {
    "active_churn":      (96, 0.95, "event",  30),
    "sla_breach_ours":   (82, 0.95, "event",  45),   # first-party pur (relance ignorée de notre côté)
    "objection":         (72, 0.90, "event",  60),
    "tension_paiement":  (66, 0.88, "event",  60),
    "controle_ma":       (70, 0.85, "event", 150),
    "nouveau_decideur":  (64, 0.70, "event",  90),
    "silence_cooling":   (88, 0.85, "silence", None),
    "reengagement":      (62, 0.80, "event",  21),   # +
    "goodwill_recovery": (58, 0.85, "event",  45),   # +
    "levee_fonds":       (60, 0.85, "event", 120),   # +
    "croissance":        (50, 0.70, "event", 180),   # +
    "couverture_fragile":(50, 0.90, "struct", None), # structurel -> santé (spec-22), consommé ici
    "expansion_surface": (48, 0.80, "struct", None), # +
}

def signal_severity(name, d=None, silence_days=None):
    base, conf, typ, half = SIGNALS[name]
    if typ == "silence": m = m_hill(silence_days)
    elif typ == "struct": m = 1.0
    else: m = m_decay(d, half)
    return round(base * m * conf, 1)                  # ≤ 100 par construction

# ─────────────────────────── FIX 2 · combinaison top-dominant bornée ───────────────────────────
def combine(scores, beta):
    s = sorted([x for x in scores if x > 0], reverse=True)
    if not s: return 0.0
    top, rest = s[0], s[1:]
    tail = 1 - reduce(lambda a, b: a * (1 - b / 100), rest, 1.0)   # [0,1]
    return round(top + (100 - top) * beta * tail, 1)
BETA_INTRA = 0.40    # fusion de signaux dans un pattern
BETA_INTER = 0.30    # patterns -> sévérité du compte

# ─────────────────────────── urgence (v1 paliers) & priorité ───────────────────────────
def urgency(next_action_days=None, active_event=False):
    if active_event: return 100
    if next_action_days is None: return 35
    n = next_action_days
    return 95 if n <= 2 else 75 if n <= 5 else 55 if n <= 14 else 35

def priority(account_severity, urg):
    return round(account_severity * (0.55 + 0.45 * urg / 100), 1)

# posture par pattern pilote (pour la couleur du verdict, spec-31)
POSTURE = {  # "defend" | "capitaliser" | "dé-risquer"
    "active_churn":"defend","sla_breach_ours":"defend","objection":"defend","tension_paiement":"defend",
    "controle_ma":"defend","nouveau_decideur":"defend","silence_cooling":"defend",
    "reengagement":"capitaliser","goodwill_recovery":"capitaliser","levee_fonds":"capitaliser","croissance":"capitaliser",
    "couverture_fragile":"dé-risquer","expansion_surface":"étendre",
}

if __name__ == "__main__":
    # mini-démo : ORSO (sain mais mono-thread) -> Coverage Fragility, dé-risquer
    cov = signal_severity("couverture_fragile")
    rec = signal_severity("goodwill_recovery", date(2026, 5, 27))
    sev = combine([cov, rec], BETA_INTER)
    urg = urgency(next_action_days=None)
    print("ORSO  sévérité=%.1f urgence=%d priorité=%.1f (pilote Coverage Fragility · dé-risquer)"
          % (sev, urg, priority(sev, urg)))

# ═══════════════════════ SPEC-32 · TYPAGE COMPTE & MODULATION ═══════════════════════
# Couche ajoutée : le type de compte gate les signaux et plafonne la priorité.
TAU_TYPE = 0.60  # seuil de confiance ; en dessous -> None ("à qualifier")

TYPE_GATING = {
    "acquisition": {
        "objection", "silence_cooling", "nouveau_decideur",
        "reengagement", "levee_fonds", "croissance",
    },
    "account_management": {
        "active_churn", "sla_breach_ours", "silence_cooling", "controle_ma",
        "couverture_fragile", "tension_paiement", "objection",
        "goodwill_recovery", "reengagement", "nouveau_decideur",
        "levee_fonds", "croissance",
    },
    "partenaire": {
        "silence_cooling", "nouveau_decideur", "croissance", "levee_fonds",
    },
}
POSTURE_DEFAULT = {
    "acquisition": "capitaliser",
    "account_management": "defendre",     # raffiné ensuite par les signaux actifs
    "partenaire": "entretenir",
}
TYPE_SEVERITY_CAP = {"partenaire": 60}    # un partenaire ne "churn" pas comme un client

def classify_account_type(evidence):
    """Stub de référence. `evidence` = dict de signaux sourcés :
    {lifecycle_crm, has_contract, money_flow, intent, value_chain_role, ...}
    Retourne {'type': str|None, 'conf': float, 'preuves': list}.
    Règles dures d'abord, sinon laissé au classifieur LLM (non implémenté ici)."""
    ev = evidence or {}
    lc = (ev.get("lifecycle_crm") or "").lower()
    if lc in ("customer", "client"):
        return {"type": "account_management", "conf": 0.95, "preuves": ["CRM lifecycle=Customer"]}
    if lc in ("lead", "opportunity", "opp"):
        return {"type": "acquisition", "conf": 0.9, "preuves": ["CRM lifecycle=Lead/Opp"]}
    if lc == "partner" or ev.get("money_flow") == "outbound":
        return {"type": "partenaire", "conf": 0.9, "preuves": ["CRM=Partner / flux sortant"]}
    if ev.get("has_contract"):
        return {"type": "account_management", "conf": 0.8, "preuves": ["contrat actif"]}
    # sinon : à qualifier (le LLM trancherait sur l'intent ; ici on reste prudent)
    return {"type": None, "conf": 0.0, "preuves": []}

def gate_signals(account_type, signals_present):
    """Neutralise les signaux hors-set pour le type donné."""
    allowed = TYPE_GATING.get(account_type or "account_management", set())
    return {s: v for s, v in (signals_present or {}).items() if s in allowed}

def apply_type_cap(raw_severity, account_type):
    cap = TYPE_SEVERITY_CAP.get(account_type)
    return min(raw_severity, cap) if cap is not None else raw_severity

def modulate(account_type_result, signals_present, spec30_engine):
    """Pont spec-30 ⇄ spec-32. `spec30_engine(active_signals)` -> (severity, urgency).
    Retourne (priority, posture, type_result)."""
    ty = account_type_result or {"type": None, "conf": 0.0, "preuves": []}
    base = ty["type"] if ty.get("conf", 0) >= TAU_TYPE else None
    base = base or "account_management"           # défaut prudent
    active = gate_signals(base, signals_present)
    sev, urg = spec30_engine(active)              # moteur inchangé
    sev = apply_type_cap(sev, base)
    priority = round(sev * (0.55 + 0.45 * urg / 100))
    posture = POSTURE_DEFAULT.get(base, "defendre")
    return priority, posture, ty
