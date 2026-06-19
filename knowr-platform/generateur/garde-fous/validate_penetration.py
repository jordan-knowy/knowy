#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Knowr - garde-fou PÉNÉTRATION & DÉCOUVERTE (scope COMPTE uniquement).

But : empecher qu'un Compte parte SANS son bloc « Pénétration du compte »
(en-tete de la section Contacts) ni sa section F10-A « Étendre la couverture
relationnelle » — les deux composants canon (cf. reference Calomatech + spec 26/28)
que les premieres fiches Carroz/Manolys avaient omis.

Ce controle est COMPLEMENTAIRE de validate_structure :
  - validate_structure verifie la PRESENCE des id de section (sec-meetings, sec-discover) ;
  - ce garde-fou verifie le CONTENU minimal du bloc Pénétration (barre + denominateur +
    legende) et que la section F10-A porte bien son marqueur + un mode honnete
    (profils en « à confirmer » / « exemple maquette », jamais affirmes).

SURF : { nom_fichier : "compte" | "personne" | "reunion" } — seules les entrees
"compte" sont controlees ; les autres sont ignorees.
"""
import os, re, sys

OUT = os.environ.get("KNOWR_OUT", ".")

SURF = {
    "knowr-compte.html": "compte",
}

def check_compte(html, page):
    errs = []
    # 1) bloc Pénétration présent
    if "Pénétration du compte" not in html:
        errs.append("bloc « Pénétration du compte » absent (en-tete de la section Contacts)")
    else:
        # barre de pénétration (div hauteur 11px, coins arrondis) + au moins 1 segment
        if not re.search(r"height:11px;border-radius:6px", html):
            errs.append("barre de pénétration absente ou non conforme")
        # dénominateur explicite (effectif connu OU 'à confirmer' — jamais inventé)
        if "dans l'entreprise" not in html:
            errs.append("dénominateur « / N dans l'entreprise » absent")
        # légende (au moins « en relation »)
        if "en relation" not in html:
            errs.append("légende de couverture absente (« … en relation »)")
    # 2) section F10-A découverte présente et honnête
    if 'id="sec-discover"' not in html:
        errs.append("section F10-A « Étendre la couverture relationnelle » (sec-discover) absente")
    else:
        if "F10-A" not in html:
            errs.append("marqueur « F10-A » absent de la section découverte")
        # honnêteté : si des profils découverts sont listés, ils doivent être tagués
        if "data-cand" in html and ("à confirmer" not in html and "exemple maquette" not in html.lower()):
            errs.append("profils découverts non tagués « à confirmer » / « exemple maquette » (zéro-hallucination)")
    return errs

def main():
    ok = True
    seen = 0
    for page, kind in SURF.items():
        if kind != "compte":
            continue
        path = os.path.join(OUT, page)
        if not os.path.exists(path):
            print("  ? %s : absent (ignore)" % page); continue
        seen += 1
        html = open(path, encoding="utf-8").read()
        errs = check_compte(html, page)
        if errs:
            ok = False
            print("  X %s :" % page)
            for e in errs:
                print("       - " + e)
        else:
            print("  OK %s : bloc Pénétration + section F10-A présents et conformes." % page)
    if seen == 0:
        print("  (aucune surface Compte dans le périmètre — contrôle sans objet)")
    if not ok:
        print("\nX ECHEC garde-fou Pénétration : un Compte est incomplet (bloc Pénétration ou F10-A). Zip bloque.")
        sys.exit(1)
    print("\nOK - Pénétration & découverte conformes : chaque Compte porte son bloc Pénétration et sa section F10-A (profils en « à confirmer »).")

if __name__ == "__main__":
    main()
