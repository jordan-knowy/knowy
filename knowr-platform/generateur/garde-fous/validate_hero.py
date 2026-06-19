#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
validate_hero.py — Garde-fou « Hero canonique » (spec 15 + spec 24).

Pourquoi ce script existe
-------------------------
Le hero de chaque surface doit TOUJOURS porter le bloc Confiance (l'anneau %).
C'est le « score de confiance du brief » (spec 19 R12). Il a déjà été perdu une
fois en réduisant le hero de 3 blocs à 2 : erreur invisible à l'œil pressé,
mais critique (la crédibilité du brief tient à l'affichage honnête de la confiance).
Ce qui est vérifiable sur le HTML doit être bloqué par un script, pas confié à la mémoire.

Ce qu'il vérifie, par page
--------------------------
  1. Il existe un .hero-header.
  2. Le hero contient .hero-conf-block  →  .hero-conf-val (non vide) + .hero-conf-label.
     (Réunion : label « Brief prêt » ; Personne/Compte : label « Confiance » — peu importe le texte.)
  3. Le hero contient .hero-last-block (Dernier contact).
  4. Surfaces 'personne' et 'compte' : le hero contient AUSSI .hero-score-block (le score relationnel/compte).
     → invariant spec 15 : Personne/Compte = score + confiance + dernier contact.
  5. Bonus qualité : si l'anneau porte un % et un conic-gradient inline, l'arc doit
     correspondre au % (sinon WARN, non bloquant) — évite l'anneau figé à 75 %.

Usage
-----
  KNOWR_OUT=/chemin/vers/tes/fiches python3 validate_hero.py
  (édite le dict SURF ci-dessous pour pointer tes noms de fichiers)
"""
import os, re, sys

OUT = os.environ.get("KNOWR_OUT", ".")

SURF = {  # nom de fichier -> scope (À ADAPTER à tes fichiers)
    "knowr-personne.html": "personne",
    "knowr-compte.html":   "compte",
    "knowr-reunion.html":  "reunion",
}

HERO_RE = re.compile(r'<div class="hero-header".*?(?=<div class="access2"|<div class="csec|<div class="levier|<aside class="rail"|</div>\s*<script)', re.S)
CONF_VAL_RE = re.compile(r'class="hero-conf-val"[^>]*>\s*([^<]+?)\s*<', re.S)
RING_RE = re.compile(r'class="hero-conf-ring"[^>]*style="[^"]*conic-gradient\([^)]*?\s(\d+(?:\.\d+)?)%')

def grab_hero(html):
    m = HERO_RE.search(html)
    if m:
        return m.group(0)
    # fallback : du hero-header jusqu'au premier gros bloc
    i = html.find('class="hero-header"')
    return html[i:i+6000] if i != -1 else ""

def main():
    if not os.path.isdir(OUT):
        print(f"X dossier introuvable : {OUT}"); sys.exit(2)

    total_err = 0
    for fname, scope in SURF.items():
        path = os.path.join(OUT, fname)
        if not os.path.exists(path):
            print(f"  X {scope:9s} : fichier absent ({fname})"); total_err += 1; continue

        html = open(path, encoding="utf-8").read()
        hero = grab_hero(html)
        errs, warns = [], []

        if 'class="hero-header"' not in html:
            errs.append(".hero-header absent")

        # (2) bloc Confiance + valeur + label
        if "hero-conf-block" not in hero:
            errs.append("bloc Confiance absent (.hero-conf-block) — l'anneau de confiance du brief a sauté")
        else:
            mv = CONF_VAL_RE.search(hero)
            if not mv or not mv.group(1).strip():
                errs.append(".hero-conf-val vide ou absent (pas de score de confiance affiché)")
            if "hero-conf-label" not in hero:
                errs.append(".hero-conf-label absent")

        # (3) Dernier contact
        if "hero-last-block" not in hero:
            errs.append("bloc Dernier contact absent (.hero-last-block)")

        # (4) score relationnel obligatoire sur Personne/Compte
        if scope in ("personne", "compte") and "hero-score-block" not in hero:
            errs.append("bloc Score absent (.hero-score-block) — requis sur Personne/Compte (spec 15)")

        # (5) cohérence arc / valeur (non bloquant)
        mv = CONF_VAL_RE.search(hero); mr = RING_RE.search(hero)
        if mv and mr:
            digits = re.findall(r"\d+", mv.group(1))
            if digits:
                val = float(digits[0]); arc = float(mr.group(1))
                if abs(val - arc) > 1.0:
                    warns.append(f"arc de l'anneau ({arc:.0f}%) ≠ valeur affichée ({val:.0f}%) — conic-gradient figé ?")
        elif mv and "conic-gradient" not in hero:
            warns.append("anneau de confiance sans conic-gradient inline : arc visuel non piloté par la valeur")

        if errs:
            total_err += len(errs)
            print(f"  X {scope:9s} ({fname})")
            for e in errs: print(f"       - {e}")
        else:
            print(f"  OK {scope:9s} ({fname})" + (f"  · {len(warns)} warn" if warns else ""))
        for w in warns: print(f"       ! {w}")

    print()
    if total_err:
        print(f"X ECHEC garde-fou Hero ({total_err} manque(s)). Hero canonique = Score + Confiance + Dernier contact (spec 15/24). Zip bloque.")
        sys.exit(1)
    print("OK - Hero canonique conforme : anneau de Confiance present sur les 3 surfaces (spec 15/19 R12/24).")

if __name__ == "__main__":
    main()
