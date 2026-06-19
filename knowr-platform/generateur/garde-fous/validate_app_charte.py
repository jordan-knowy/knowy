#!/usr/bin/env python3
# validate_app_charte.py (v8) — Couche Application : fidelite a la charte Violet Trust.
# Garantit que le shell d'app reste EXACTEMENT sur la meme charte : memes tokens, memes polices
# embarquees, ZERO dependance reseau, ZERO framework UI etranger. (spec-29 + section 0ter)
import os, glob, sys, re
OUT = os.environ.get('KNOWR_APP', os.environ.get('KNOWR_OUT', '.'))
files = sorted(glob.glob(os.path.join(OUT, 'knowr-app*.html')))
if not files:
    print("? aucun fichier knowr-app*.html dans", OUT, "(ignore)"); sys.exit(0)
REQUIRED = ['--violet','--bg','--white','--t1','--t3','--border','--font','--mono']
FONTS = ['Epilogue','JetBrains']
FORBIDDEN = ['fonts.googleapis.com','cdn.tailwindcss','tailwindcss.com','cdn.jsdelivr',
             'cdnjs.cloudflare','unpkg.com','bootstrap']
errors = []
for f in files:
    s = open(f, encoding='utf-8').read(); name = os.path.basename(f); E = []
    root = re.search(r':root\s*\{([^}]*)\}', s)
    defined = set(re.findall(r'(--[a-z0-9-]+)\s*:', root.group(1))) if root else set()
    miss = [t for t in REQUIRED if t not in defined]
    if miss: E.append("tokens charte manquants dans :root : " + ", ".join(miss))
    for fo in FONTS:
        if fo not in s: E.append("police charte absente : " + fo)
    for fb in FORBIDDEN:
        if fb in s: E.append("dependance / framework UI etranger interdit : " + fb)
    if 'base64' not in s and 'data:font' not in s and '@font-face' not in s:
        E.append("polices non embarquees (pas de @font-face/base64) — la charte doit etre autonome")
    if E: errors.append((name, E))
    else: print("  OK %-22s : charte Violet Trust respectee (tokens + polices embarquees + 0 dependance)" % name)
if errors:
    print("\nX ECHEC - couche Application HORS CHARTE (interdit de devier de la charte unique) :")
    for n, E in errors:
        for e in E: print("   - %s : %s" % (n, e))
    sys.exit(1)
print("\nOK - Couche Application fidele a la charte Violet Trust : aucun ecart, aucune UI etrangere.")
