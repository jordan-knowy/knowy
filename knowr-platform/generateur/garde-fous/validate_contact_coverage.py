#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
validate_contact_coverage.py — Garde-fou « Couverture relationnelle » (spec 26).

Pourquoi ce script existe
-------------------------
Knowr est un OS *relationnel* : sa valeur est le graphe de contacts, pas le seul
décideur. Une erreur réelle a eu lieu sur le compte Calomatech : les contacts
secondaires (Dolbet, Descottes…) ont été affichés avec un titre et un rôle
Miller-Heiman DEVINÉS depuis l'en-tête des mails, sans jamais analyser leurs
propres fils. Résultat : un titre faux (« Stratégie » au lieu de « Chargée de
marketing »), un rôle inventé (« champion »), et un contact entièrement raté
(Lylia, l'utilisatrice finale citée dans un corps de mail). La fiche passait
pourtant les 6 autres garde-fous : la FORME était bonne, la COUVERTURE non.

Doctrine (spec 26) : compte + TOUS les contacts identifiés + chacun scoré ET
analysé depuis ses propres messages. Les personnes importantes de la réunion ont
chacune leur fiche Personne. On n'affiche jamais un rôle qu'on n'a pas lu.

Ce que ce script vérifie (sur le `.ct-tbl` du Compte)
-----------------------------------------------------
Pour CHAQUE ligne de contact :
  1. SCORE — la cellule Score MR porte un nombre (= contact analysé), SINON la
     ligne porte un flag explicite « à confirmer » / « non analysé ».
     Ni l'un ni l'autre -> ECHEC (score muet non assumé).
  2. RÔLE DE POUVOIR — si la ligne affiche un rôle fort (Economic Buyer,
     Champion, Décideur, Coach, Prescripteur), elle DOIT être analysée (score
     numérique). Affirmer un rôle de pouvoir sans analyse -> ECHEC.
  3. FICHE DES CONTACTS CLÉS — toute ligne « clé » (rôle de pouvoir OU étoile ★)
     doit lier une fiche Personne (lien .btn-view / href knowr-personne*.html).
     Un contact clé qui n'a qu'un bouton « Générer » -> ECHEC (spec 26 : les
     personnes importantes de la réunion ont chacune leur fiche, générée et scorée).
  4. AU MOINS une fiche Personne liée depuis le compte (l'EB au minimum).

Avertissements (non bloquants) :
  - Un contact non scoré mais marqué « à confirmer » : toléré, mais signalé
    (l'objectif spec 26 est que TOUT contact affiché finisse scoré + analysé).

Ce que ce script NE PEUT PAS vérifier (assumé) :
  - La complétude réelle vs la boîte mail (« a-t-on bien récupéré tout le monde,
    dont les acteurs cités seulement dans un corps de mail ? »). Ça se joue à la
    génération : voir spec 26 « Phase 0 — Cartographie » + INSTRUCTIONS-CLAUDE.md.
    Un garde-fou HTML statique impose la DISCIPLINE de sourcing, pas la collecte.

Usage
-----
  KNOWR_OUT=/chemin/vers/tes/fiches python3 validate_contact_coverage.py
"""
import os, re, sys

OUT = os.environ.get("KNOWR_OUT", ".")

SURF = {  # nom de fichier -> scope (À ADAPTER à tes fichiers)
    "knowr-compte.html": "compte",
}

POWER_ROLE = re.compile(r"economic buyer|champion|d[ée]cideur|decision|coach|prescripteur", re.I)
UNVERIFIED = re.compile(r"à confirmer|a confirmer|non analys", re.I)
HAS_DIGIT  = re.compile(r"\d")

ROW_RE   = re.compile(r"<tr>(.*?)</tr>", re.S)
NAME_RE  = re.compile(r'class="ct-name"[^>]*>\s*([^<]+?)\s*<', re.S)
STAR_RE  = re.compile(r'class="ct-star"')
CHIP_RE  = re.compile(r'class="chip[^"]*"[^>]*>\s*([^<]+?)\s*<', re.S)
SCORE_RE = re.compile(r'class="ct-score"[^>]*>\s*([^<]+?)\s*<', re.S)
FICHE_RE = re.compile(r'(btn-view|href="knowr-personne[^"]*\.html")')


def grab_table(html):
    body = html[html.find("<body>"):] if "<body>" in html else html
    i = body.find('class="ct-tbl"')
    if i == -1:
        return None
    j = body.find("</table>", i)
    return body[i:j] if j != -1 else body[i:]


def main():
    if not os.path.isdir(OUT):
        print("X dossier introuvable : %s" % OUT); sys.exit(2)

    total_err = 0
    for fname, scope in SURF.items():
        path = os.path.join(OUT, fname)
        if not os.path.exists(path):
            print("  ? %s : absent (ignore)" % fname); continue

        html = open(path, encoding="utf-8").read()
        table = grab_table(html)
        if table is None:
            print("  X %-8s (%s) : aucune table .ct-tbl trouvée — section Contacts requise (spec 26)" % (scope, fname))
            total_err += 1; continue

        rows = ROW_RE.findall(table)
        # 1re ligne = thead -> on garde celles qui ont un .ct-name
        rows = [r for r in rows if "ct-name" in r]
        if not rows:
            print("  X %-8s (%s) : table de contacts vide" % (scope, fname)); total_err += 1; continue

        errs, warns = [], []
        n_fiches = 0
        for r in rows:
            name = NAME_RE.search(r).group(1) if NAME_RE.search(r) else "?"
            chip = " ".join(CHIP_RE.findall(r))
            score = (SCORE_RE.search(r).group(1) if SCORE_RE.search(r) else "")
            analysed = bool(HAS_DIGIT.search(score))
            flagged  = bool(UNVERIFIED.search(r))
            is_power = bool(POWER_ROLE.search(chip))
            is_star  = bool(STAR_RE.search(r))
            has_fiche = bool(FICHE_RE.search(r))
            if has_fiche:
                n_fiches += 1

            # (1) score muet non assumé
            if not analysed and not flagged:
                errs.append("« %s » : pas de score ni flag « à confirmer » (score muet non assumé)" % name)
            # (2) rôle de pouvoir sans analyse
            if is_power and not analysed:
                errs.append("« %s » : rôle de pouvoir affirmé (%s) sans analyse — score requis (spec 26)" % (name, chip.strip()))
            # (3) contact clé sans fiche
            if (is_power or is_star) and not has_fiche:
                errs.append("« %s » : contact clé sans fiche Personne liée — générer + scorer sa fiche (spec 26)" % name)
            # (warn) non scoré mais flaggué
            if not analysed and flagged:
                warns.append("« %s » : listé « à confirmer » mais pas encore scoré/analysé (objectif spec 26 : tout contact scoré)" % name)

        # (4) au moins une fiche liée
        if n_fiches == 0:
            errs.append("aucune fiche Personne liée depuis le compte — l'EB au minimum doit avoir sa fiche (spec 26)")

        if errs:
            total_err += len(errs)
            print("  X %-8s (%s) : %d contact(s) non conforme(s)" % (scope, fname, len(rows)))
            for e in errs:
                print("       - " + e)
        else:
            print("  OK %-8s (%s) : %d contacts, %d fiche(s) liée(s), tous scorés ou assumés" % (scope, fname, len(rows), n_fiches))
        for w in warns:
            print("       ⚠ " + w)

    if total_err:
        print("\nX ECHEC garde-fou Couverture relationnelle (%d). "
              "Compte + tous les contacts scorés ET analysés ; rôle jamais affirmé sans lecture ; "
              "contacts clés = une fiche chacun (spec 26). Zip bloque." % total_err)
        sys.exit(1)
    print("\nOK - Couverture relationnelle conforme spec 26 : chaque contact est scoré ou explicitement à confirmer, "
          "aucun rôle de pouvoir non sourcé, contacts clés dotés de leur fiche.")


if __name__ == "__main__":
    main()
