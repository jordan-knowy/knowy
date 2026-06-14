# 16 — Design System « Violet Trust » appliqué aux surfaces
## Knowy — Spec Jordan v4 · Juin 2026

> Les surfaces (Réunion/Personne/Compte) sont désormais **alignées sur la DA du site knowy** (Violet Trust). On abandonne l'ancien système éditorial des briefs v2 (Fraunces / Cabinet Grotesk / DM Mono · palette ardoise/bleu/vert-montagne). Référence vivante : `ui-references/` (3 fichiers canoniques).

---

## 1. Tokens (`:root`)

```css
--bg:#F9F8FC; --bg2:#F0EEF8; --bg3:#E8E4F4; --white:#FFFFFF;
--night:#1A1040; --night2:#2A1E60;                 /* sections sombres */
--violet:#6E50C8; --violet-d:#5A3EAA; --violet-l:#D4C5F5;
--violet-s:rgba(110,80,200,.08); --violet-m:rgba(110,80,200,.15);
--violet-x:rgba(110,80,200,.18);
--t1:#1A1040; --t2:#5A4880; --t3:#9082B8; --t4:#C4B8E0;   /* rampe texte violet-teintée */
--sage:#2EA86A;  --sage-s:#E4F5ED;  --sage-l:#96DDB8;
--amber:#C97A20; --amber-s:#FBF0E2; --amber-l:#F0C07A;
--coral:#D94F63; --coral-s:#FDEAED; --coral-l:#F0A0AD;
--blue:#3D6FCC;  --blue-s:#E5EDFF;  --blue-l:#9DBAF5;
--teal:#2896A8;  --teal-s:#E2F4F7;  --teal-l:#8FD2DD;
--border:rgba(110,80,200,.10); --border-m:rgba(110,80,200,.18); --border-s:rgba(110,80,200,.28);
--sh-xs:0 1px 4px rgba(110,80,200,.07); --sh-sm:0 2px 16px rgba(110,80,200,.08);
--sh-md:0 6px 28px rgba(110,80,200,.11); --sh-lg:0 16px 56px rgba(110,80,200,.14);
--r-sm:6px; --r-md:10px; --r-lg:14px; --r-xl:20px; --r-2xl:28px; --r-f:999px;
--font:'Epilogue',sans-serif; --mono:'JetBrains Mono',monospace;
--ease:cubic-bezier(.4,0,.2,1); --overshoot:cubic-bezier(.22,.68,0,1.2);
```

**Principe :** tout est teinté violet (bordures, ombres, rampe de texte). Les sombres utilisent `--night` avec un glow violet radial.

---

## 2. Typographie

| Usage | Police | Réglage |
|-------|--------|---------|
| Display / scores géants | **Epilogue 900** | `letter-spacing:-.03/-.04em`, `line-height:1.05` |
| Titres de carte | Epilogue 700/800 | 13-15px |
| Corps | Epilogue 400 | 12-13px, `line-height:1.6` |
| Eyebrows / labels / données / scores | **JetBrains Mono** | 9-11px, `uppercase`, `letter-spacing:.1-.12em`, couleur `--violet` ou `--t3` |

Import : `Epilogue:wght@300;400;600;700;900 & JetBrains+Mono:wght@400;500;700`.

---

## 3. Catalogue de composants

- **`.hero-header` / header sombre** — `--night`, radius `--r-2xl`, glow violet radial. Score géant Epilogue 900 (couleur sémantique selon valeur), anneau de confiance en `conic-gradient` violet, badges sources (sage = connecté, ghost = absent).
- **`.levier`** — ruban insight : fond dégradé blanc→`--violet-s`, bord gauche 3px violet, eyebrow mono.
- **`.csec`** (section collapsible) — carte blanche, radius `--r-xl`, header cliquable (`toggleSec`), chevron qui pivote. Ouverte = `max-height:5000px`.
- **`.acard`** (carte de navigation unifiée) — **gabarit unique** pour Participant et Compte : avatar `--r-f` + eyebrow mono + nom Epilogue 800 + sous-titre + score + « → ». Hover : `translateY(-2px)` + ombre. Même partout = affordance cliquable claire.
- **`.chip`** (rôles Miller Heiman) — pilule mono uppercase, couleur par rôle (cf. §5).
- **Barres** (`.bar-track` / `.bar-fill`) — fill `linear-gradient(90deg,--violet-l,--violet)`, radius pill, animation `width 1.1s var(--overshoot)` au load. Variante `.sage`.
- **`.tom-wrap`** (Theory of Mind, signature) — header `--night` + glow, 3 colonnes (sait sage / ne sait pas violet / croit amber), callouts humeur (violet) + risque (coral).
- **`.mrow`** (ligne réunion) — date mono en pastille violette + objet + présents (tags) + « Ouvrir → ».
- **`.more-btn`** — bouton « voir plus » pointillé, révèle un bloc masqué inline.
- **`.panel`** (Compte) — carte blanche avec header (icône + titre + sous-titre mono + meta).

---

## 4. Composants canvas (réutilisables)

### `drawMR(canvasId, tooltipId, DATA, line, fillA)` — graphe Mémoire Relationnelle
Courbe d'historique relationnel (bézier lissée), zones colorées par palier, points d'événement (sage = positif, coral = friction), tooltip mono. **Échelle auto** (min/max sur les données).
- **Personne** : `line='#2EA86A'` (sage), `fillA='rgba(46,168,106,0.22)'`.
- **Compte** : `line='#6E50C8'` (violet), `fillA='rgba(110,80,200,0.22)'`.
- Données : `[{d:'Avr 26', s:66, ev:'…', type:'pos|neg'}]` — alimentées par `relational_score_history`.

### Radar MBTI 8 branches — profil comportemental
4 axes bipolaires (Résultat↔Relation · Rapidité↔Analyse · Assertivité↔Adaptation · Innovation↔Conformité). Pôle dominant **violet**, pôle inverse `--t4`, accent secondaire amber. Rings violet-teintés. Labels Epilogue, scores JetBrains Mono. Un pôle à 100 % est mathématiquement impossible.

---

## 5. Mapping rôle → couleur (Miller Heiman + ONA)

| Élément | Couleur |
|---------|---------|
| **Optee (Vous)** — nœud hub ONA | **coral** `--coral` (toutes les lignes en partent) |
| Economic Buyer | violet `--violet` |
| Champion / Coach | sage `--sage` |
| User Buyer | blue `--blue` |
| Technical Buyer | teal `--teal` |
| Président / direction non contactée | amber `--amber` |
| Rôle inconnu / inactif | muted `--t3` |
| White space (jamais contacté) | ligne coral pointillée fine |

---

## 6. À éviter
- Aucune trace de l'ancienne DA : pas de Fraunces / Cabinet Grotesk / DM Mono, pas de `#1D4ED8` / `#1A5C4A` / `#171B26` / `#F0F2F5`.
- Pas de violet en aplat plein sur grande surface (cliché) — le violet est l'accent ; les fonds sont `--bg` / `--white` / `--night`.
