#!/usr/bin/env python3
"""
Knowr - garde-fou STRUCTURE des surfaces (additif, ne modifie rien).
But : empecher qu'une SECTION entiere disparaisse silencieusement
(ex. la section "Contacts & fiches" absente d'une fiche Compte).

Principe :
  - Chaque surface a un exemple de reference dans templates-reference/.
  - La fiche generee doit contenir AU MOINS tous les id de sections (sec-*) de son exemple.
    (Des sections en plus sont tolerees ; une section manquante -> ECHEC.)

Adapter SURF : { nom_fichier_genere : "personne" | "compte" | "reunion" }
Pour "reunion", l'exemple par defaut est la reunion COMMERCIALE ; mettre
"reunion-productivite" pour l'autre gabarit.
"""
import re, sys, os

OUT = os.environ.get("KNOWR_OUT", ".")
HERE = os.path.dirname(os.path.abspath(__file__))
REF_DIR = os.environ.get("KNOWR_REF", os.path.join(HERE, "..", "templates-reference"))

REF_FILE = {
    "personne":            "exemple-personne.html",
    "compte":              "exemple-compte.html",
    "reunion":             "exemple-reunion-commerciale.html",
    "reunion-commerciale": "exemple-reunion-commerciale.html",
    "reunion-productivite":"exemple-reunion-productivite.html",
}

SURF = {
    "knowr-personne.html": "personne",
    "knowr-compte.html":   "compte",
    "knowr-reunion.html":  "reunion",
}

# Sections CANONIQUES exigees EN PLUS de celles du template de reference.
# DEPUIS P0 (juin 2026) : exemple-compte.html EST regenere au canon 8 sections
# (sec-meetings + sec-discover inclus). La reference porte donc deja le canon et
# ce dictionnaire est VIDE — la garantie ne depend plus d'un override ici, mais
# du template lui-meme. (Laisse vide ; ne re-ajoute un id que si tu retires une
# section du template sans pouvoir le regenerer.)
REQUIRED_EXTRA = {}

def sec_ids(html):
    body = html[html.find("<body>"):] if "<body>" in html else html
    return [m.group(1) for m in re.finditer(r'id="(sec-[a-z0-9]+)"', body)]

def main():
    ok = True
    for page, kind in SURF.items():
        path = os.path.join(OUT, page)
        if not os.path.exists(path):
            print("  ? %s : absent (ignore)" % page); continue
        ref_name = REF_FILE.get(kind)
        ref_path = os.path.join(REF_DIR, ref_name) if ref_name else None
        if not ref_path or not os.path.exists(ref_path):
            print("  X %s : exemple de reference introuvable (%s)" % (page, ref_name)); ok = False; continue
        ref_ids = sec_ids(open(ref_path, encoding="utf-8").read())
        for extra_id in REQUIRED_EXTRA.get(kind, []):
            if extra_id not in ref_ids:
                ref_ids.append(extra_id)
        page_ids = sec_ids(open(path, encoding="utf-8").read())
        missing = [s for s in ref_ids if s not in page_ids]
        if missing:
            ok = False
            print("  X %-10s (%s) : sections manquantes vs reference : %s" % (kind, page, ", ".join(missing)))
            print("        reference : %s" % ", ".join(ref_ids))
            print("        fiche     : %s" % ", ".join(page_ids))
        else:
            extra = [s for s in page_ids if s not in ref_ids]
            note = "" if not extra else "  (+ en plus : %s)" % ", ".join(extra)
            print("  OK %-10s (%s) : %d/%d sections de reference presentes%s" % (kind, page, len(ref_ids), len(ref_ids), note))
    if not ok:
        print("\nX ECHEC garde-fou Structure : une surface a perdu une section de son exemple. Zip bloque.")
        sys.exit(1)
    print("\nOK - Structure conforme : chaque surface couvre les sections de son exemple de reference.")

if __name__ == "__main__":
    main()
