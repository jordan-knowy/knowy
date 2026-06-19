#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
assembler-surface.py — Assembleur de surface Knowr (moteur gouverné)
=====================================================================

Encode le pattern d'assemblage PROUVÉ sur les sets Carroz et Manolys.

PRINCIPE
--------
Une surface Knowr = HEAD MAÎTRE (identique partout) + CORPS (rédigé par surface,
données réelles) + SCRIPT du template correspondant, dans lequel on substitue
UNIQUEMENT les globales de données canvas (les fonctions de dessin ne changent JAMAIS).

- Le HEAD MAÎTRE est celui de `templates-reference/exemple-compte.html` : c'est le
  superset (polices base64 + 2 <style> couvrant compte + personne + réunion).
  L'utiliser partout garantit `sync_css` (CSS md5 identique sur toutes les surfaces).
- Les FONCTIONS de dessin (drawMR / drawRadar / drawONA / moteur d'action) sont
  recopiées VERBATIM depuis le template. On ne touche qu'aux variables de données.

GLOBALES À SUBSTITUER, PAR TYPE DE SURFACE
------------------------------------------
- compte   : MRC (timeline), drawONA nodes[] + edges[]
- personne : RADAR_AXES (4 axes), MRP (timeline)
- reunion  : ANGLES (mail du moteur d'action), MRS (timeline du snap)

COULEUR DE COURBE drawMR : violet #6E50C8 sur compte + snap réunion ;
sage #2EA86A sur personne (déjà câblé dans le template, ne pas changer).

RADAR_AXES : 4 objets {score:0-100} = [Résultat↔Relation, Rapidité↔Analyse,
Assertivité↔Adaptation, Innovation↔Conformité]. score>50 => pôle 1 dominant.

USAGE
-----
  python3 assembler-surface.py \
      --type compte \
      --body  corps/mon-compte.body.html \
      --data  data/mon-compte.data.json \
      --out   ../sorties/knowr-compte-xxx.html \
      --ref   templates-reference

Le JSON de données contient les globales sous forme de texte JS prêt à injecter.
Exemples de clés attendues :
  compte   : {"MRC": "[{d:'..',s:54,ev:'..',type:'pos'}, ...]",
              "nodes": "[ {x:cx-W*0.04,y:cy,r:28,c:'#2EA86A',l:'..',sub:'..',tc:'#fff'}, ... ]",
              "edges": "[[0,1,2.4],[0,2,1.8]]"}
  personne : {"RADAR_AXES": "[{score:60},{score:40},{score:62},{score:28}]",
              "MRP": "[{d:'..',s:54,ev:'..',type:'pos'}, ...]"}
  reunion  : {"ANGLES": "{\"rebond\":{...},\"valeur\":{...}}",
              "MRS": "[{d:'..',s:54,ev:'..',type:'pos'}, ...]"}

GARDE-FOU INTÉGRÉ : refus d'écrire si une fuite inter-client est détectée
(--audit "AAEP,Vanessa,Carroz,..."). La signature "Pisteur.io" de Maxime est tolérée.
"""
import argparse, json, os, re, sys

TEMPLATE = {
    "compte":   "exemple-compte.html",
    "personne": "exemple-personne.html",
    "reunion":  "exemple-reunion-commerciale.html",
    "reunion-productivite": "exemple-reunion-productivite.html",
}
# nom de la globale -> regex de capture (non-greedy), par clé fournie dans le JSON
PATTERNS = {
    "MRC":        r"const MRC=\[.*?\];",
    "MRP":        r"const MRP=\[.*?\];",
    "MRS":        r"var MRS=\[.*?\];",
    "RADAR_AXES": r"var RADAR_AXES=\[.*?\];",
    "nodes":      r"const nodes=\[.*?\];",
    "edges":      r"const edges=\[.*?\];",
    "ANGLES":     r"var ANGLES=\{.*?\}\};",
}
# enveloppe d'écriture (reconstitue la déclaration complète) pour chaque clé
WRAP = {
    "MRC":        lambda v: "const MRC=" + v + ";",
    "MRP":        lambda v: "const MRP=" + v + ";",
    "MRS":        lambda v: "var MRS=" + v + ";",
    "RADAR_AXES": lambda v: "var RADAR_AXES=" + v + ";",
    "nodes":      lambda v: "const nodes=" + v + ";",
    "edges":      lambda v: "const edges=" + v + ";",
    "ANGLES":     lambda v: "var ANGLES=" + v + ";",
}

def build(stype, body_path, data, ref_dir, out_path, audit_terms):
    comp = open(os.path.join(ref_dir, "exemple-compte.html"), encoding="utf-8").read()
    head = comp[:comp.find("</head>") + len("</head>")]            # HEAD MAÎTRE (superset)

    tpl = open(os.path.join(ref_dir, TEMPLATE[stype]), encoding="utf-8").read()
    s0 = tpl.rfind("<script>")
    script = tpl[s0:tpl.find("</script>", s0) + len("</script>")]

    for key, val in data.items():
        if key not in PATTERNS:
            print(f"  ! clé inconnue ignorée: {key}", file=sys.stderr); continue
        # 'val' peut être un littéral JS (str) ou une structure JSON -> on attend du str JS
        js = val if isinstance(val, str) else json.dumps(val, ensure_ascii=False)
        # on ne wrappe que si l'utilisateur a fourni le coeur (sans 'const X=' ); sinon brut
        repl = WRAP[key](js) if not js.lstrip().startswith(("const ", "var ")) else js
        new, n = re.subn(PATTERNS[key], lambda m: repl, script, count=1, flags=re.S)
        if n == 0:
            print(f"  ! globale {key} introuvable dans le template {stype}", file=sys.stderr)
        script = new

    body = open(body_path, encoding="utf-8").read()
    out = head + "<body>\n" + body + "\n" + script + "</body></html>\n"

    leaks = [t for t in audit_terms if t and t in out]
    if leaks:
        print(f"  ✗ FUITE inter-client détectée: {leaks} — écriture annulée", file=sys.stderr)
        sys.exit(2)

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    open(out_path, "w", encoding="utf-8").write(out)
    print(f"  ✓ {out_path} ({len(out)} octets) — type={stype} — fuites=0")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--type", required=True, choices=list(TEMPLATE))
    ap.add_argument("--body", required=True)
    ap.add_argument("--data", required=True, help="JSON des globales (texte JS par clé)")
    ap.add_argument("--out", required=True)
    ap.add_argument("--ref", default="templates-reference")
    ap.add_argument("--audit", default="", help="termes inter-clients interdits, séparés par des virgules")
    a = ap.parse_args()
    data = json.load(open(a.data, encoding="utf-8"))
    audit = [t.strip() for t in a.audit.split(",")] if a.audit else []
    build(a.type, a.body, data, a.ref, a.out, audit)
