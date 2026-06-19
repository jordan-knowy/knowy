#!/usr/bin/env python3
"""
Knowr - garde-fou HYGIÈNE CSS (additif). Attrape les erreurs vécues :
  1. var(--x) utilisée mais NON définie, DANS UN CONTEXTE VISIBLE
     (background/color/border/box-shadow/fill/stroke/outline) -> ECHEC (bloque le zip).
     C'est le bug var(--bg1) : fond transparent, brief visible à travers la modale.
  2. var(--x) non définie dans un contexte non-visible (ex. font-family:var(--sans))
     -> AVERTISSEMENT seulement (retombe proprement sur un défaut).
  3. font-size:<n>px en dur dans le <body> -> AVERTISSEMENT (dérive typo possible).

Adapter PAGES si besoin.
"""
import re, sys, os

OUT = os.environ.get("KNOWR_OUT", ".")
PAGES = ["knowr-personne.html", "knowr-reunion.html", "knowr-compte.html"]
VISIBLE = {"background","background-color","background-image","color","border","border-color",
           "border-left","border-right","border-top","border-bottom","box-shadow","fill","stroke","outline"}

def styles(html): return "\n".join(re.findall(r"<style>(.*?)</style>", html, re.S))
def body(html):   return html[html.find("<body>"):] if "<body>" in html else html

def main():
    fail = False; warn_total = 0
    for p in PAGES:
        path = os.path.join(OUT, p)
        if not os.path.exists(path):
            print("  ? %s : absent (ignore)" % p); continue
        html = open(path, encoding="utf-8").read()
        defined = set(re.findall(r'--([A-Za-z][\w-]*)\s*:', styles(html)))
        used = set(re.findall(r'var\(\s*--([A-Za-z][\w-]*)', html))
        missing = sorted(used - defined)
        block, warn = [], []
        for n in missing:
            props = re.findall(r'([a-z-]+)\s*:\s*[^;{}"\']*var\(\s*--'+re.escape(n)+r'\b', html)
            (block if any(pr in VISIBLE for pr in props) else warn).append(n)
        b_nostyle = re.sub(r'<style>.*?</style>', '', body(html), flags=re.S)
        inline_fs = len(re.findall(r'font-size:\s*\d+(?:\.\d+)?px', b_nostyle))
        warn_total += inline_fs
        if block:
            fail = True
            print("  X %s : variable(s) fantôme(s) en contexte visible : %s" % (p, ", ".join("--"+m for m in block)))
        else:
            extras = []
            if warn: extras.append("%d var non-bloquante(s): %s" % (len(warn), ", ".join("--"+m for m in warn)))
            if inline_fs: extras.append("%d font-size px inline" % inline_fs)
            print("  OK %s%s" % (p, ("  (⚠ "+" · ".join(extras)+")") if extras else ""))
    if fail:
        print("\nX ECHEC garde-fou Hygiène CSS : variable fantôme en contexte visible. Zip bloqué.")
        print("   -> n'utiliser que des var(--x) définies dans la charte (ex. --white, --bg2 ; PAS --bg1).")
        sys.exit(1)
    print("\nOK - Hygiène CSS : aucune variable fantôme en contexte visible.")

if __name__ == "__main__":
    main()
