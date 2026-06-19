#!/usr/bin/env python3
"""
Knowr - garde-fou COUVERTURE CSS (additif, ne modifie rien).
But : empecher le bug "primitive utilisee sans sa regle CSS" (ex. .ct-av rendu en barre
pleine largeur parce que la regle .ct-av{width:30px...} etait absente de la fiche).

Principe :
  - La CHARTE de reference = le <style> de templates-reference/exemple-compte.html
    (c'est le SUPERSET : il contient toutes les primitives des 3 surfaces).
  - Pour chaque fiche, toute classe employee dans le <body> qui EST definie dans la charte
    DOIT aussi etre definie dans le <style> de la fiche. Sinon -> ECHEC (zip bloque).

Adapter PAGES si besoin. REF_DIR est auto-detecte.
"""
import re, sys, os

OUT = os.environ.get("KNOWR_OUT", ".")
HERE = os.path.dirname(os.path.abspath(__file__))
REF_DIR = os.environ.get("KNOWR_REF", os.path.join(HERE, "..", "templates-reference"))
MASTER_REF = os.path.join(REF_DIR, "exemple-compte.html")  # superset

PAGES = [
    "knowr-personne.html",
    "knowr-reunion.html",
    "knowr-compte.html",
]

def all_styles(html):
    return "\n".join(re.findall(r"<style>(.*?)</style>", html, re.S))

def defined_classes(css):
    # noms de classes apparaissant comme selecteur : .nom suivi d'un delimiteur de selecteur
    return set(re.findall(r'\.([A-Za-z][\w-]*)(?=[\s,{:.>+~\)\[])', css))

def used_classes(body):
    used = set()
    for attr in re.findall(r'class="([^"]+)"', body):
        for tok in attr.split():
            used.add(tok)
    return used

def main():
    if not os.path.exists(MASTER_REF):
        print("X Charte de reference introuvable : %s" % MASTER_REF); sys.exit(1)
    charte_css = all_styles(open(MASTER_REF, encoding="utf-8").read())
    charte_defined = defined_classes(charte_css)
    print("Charte (exemple-compte) : %d classes definies." % len(charte_defined))

    ok = True
    for p in PAGES:
        path = os.path.join(OUT, p)
        if not os.path.exists(path):
            print("  ? %s : absent (ignore)" % p); continue
        html = open(path, encoding="utf-8").read()
        body = html[html.find("<body>"):] if "<body>" in html else html
        page_css = all_styles(html)
        page_defined = defined_classes(page_css)
        used = used_classes(body)
        # on ne controle que les classes de la CHARTE reellement utilisees
        to_check = (used & charte_defined)
        missing = sorted(c for c in to_check if c not in page_defined)
        if missing:
            ok = False
            print("  X %s : %d primitive(s) utilisee(s) SANS regle CSS dans la fiche :" % (p, len(missing)))
            for c in missing: print("        .%s" % c)
        else:
            print("  OK %s : %d primitives de charte utilisees, toutes definies." % (p, len(to_check)))
    if not ok:
        print("\nX ECHEC garde-fou Couverture CSS : une primitive utilisee n'a pas sa regle.")
        print("   -> le <style> maitre doit etre le SUPERSET (exemple-compte). Zip bloque.")
        sys.exit(1)
    print("\nOK - Couverture CSS conforme : chaque primitive utilisee a sa regle dans la fiche.")

if __name__ == "__main__":
    main()
