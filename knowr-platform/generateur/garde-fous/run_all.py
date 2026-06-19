#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
run_all.py — Runner des 9 garde-fous sur un SET de surfaces Knowr
=================================================================

Encode le harness PROUVÉ sur Carroz (triade) et Manolys (4 surfaces).

Ce que fait le runner :
  1. copie les validateurs + les surfaces du set dans un dossier de travail jetable ;
  2. patche `SURF`/`PAGES` en tête de chaque validateur pour pointer le set ;
  3. force `validate_contact_coverage` à ne porter QUE sur le Compte (il vérifie la
     table .ct-tbl du compte — l'appliquer aux Personne/Réunion produit un faux échec) ;
  4. exporte KNOWR_REF vers templates-reference ;
  5. lance la batterie applicable et résume.

USAGE
-----
  python3 run_all.py \
      --ref ../templates-reference \
      --out-dir ../../sorties \
      compte=knowr-compte-xxx.html \
      personne=knowr-personne-aaa.html \
      personne=knowr-personne-bbb.html \
      reunion=knowr-reunion-xxx.html

Notes :
  - 'compte=' / 'personne=' / 'reunion=' déclarent le scope de chaque fichier.
  - `compterendu` et `app_charte` ne s'appliquent qu'à la 4e surface / au shell :
    ils sont lancés seulement si un fichier de ce type est présent.
"""
import argparse, glob, os, re, shutil, subprocess, sys, tempfile

GF_DEFAULT = os.path.dirname(os.path.abspath(__file__))
CORE = ["sync_css", "validate_hero", "validate_css_primitives", "validate_css_hygiene",
        "validate_structure", "validate_signals", "validate_contact_coverage",
        "validate_penetration"]

def parse_pairs(items):
    surf = {}
    for it in items:
        if "=" not in it:
            sys.exit(f"argument invalide (attendu scope=fichier): {it}")
        scope, fn = it.split("=", 1)
        surf[fn] = scope
    return surf

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", required=True, help="chemin de templates-reference")
    ap.add_argument("--out-dir", required=True, help="dossier contenant les surfaces générées")
    ap.add_argument("--gf-dir", default=GF_DEFAULT, help="dossier des garde-fous")
    ap.add_argument("pairs", nargs="+", help="scope=fichier (compte=..., personne=..., reunion=...)")
    a = ap.parse_args()

    surf = parse_pairs(a.pairs)
    compte_files = [f for f, s in surf.items() if s == "compte"]

    work = tempfile.mkdtemp(prefix="knowr_gf_")
    for py in glob.glob(os.path.join(a.gf_dir, "*.py")):
        if os.path.basename(py) == "run_all.py":
            continue
        shutil.copy(py, work)
    for fn in surf:
        src = os.path.join(a.out_dir, fn)
        if not os.path.exists(src):
            sys.exit(f"surface introuvable: {src}")
        shutil.copy(src, work)

    SURF = "SURF = {" + ", ".join(f'"{f}": "{s}"' for f, s in surf.items()) + "}"
    PAGES = "PAGES = [" + ", ".join(f'"{f}"' for f in surf) + "]"
    for py in glob.glob(os.path.join(work, "*.py")):
        s = open(py, encoding="utf-8").read(); o = s
        s = re.sub(r"SURF\s*=\s*\{.*?\}", SURF, s, count=1, flags=re.S)
        s = re.sub(r"PAGES\s*=\s*\[.*?\]", PAGES, s, count=1, flags=re.S)
        if s != o:
            open(py, "w", encoding="utf-8").write(s)
    # contact_coverage : COMPTE uniquement
    cc = os.path.join(work, "validate_contact_coverage.py")
    if os.path.exists(cc) and compte_files:
        s = open(cc, encoding="utf-8").read()
        cc_surf = "SURF = {" + ", ".join(f'"{f}": "compte"' for f in compte_files) + "}"
        s = re.sub(r"SURF\s*=\s*\{.*?\}", cc_surf, s, count=1, flags=re.S)
        open(cc, "w", encoding="utf-8").write(s)

    env = dict(os.environ, KNOWR_REF=os.path.abspath(a.ref))
    checks = list(CORE)
    if any(s == "compterendu" or "compte-rendu" in f for f, s in surf.items()):
        checks.append("validate_compterendu")
    if any("app" in f for f in surf):
        checks.append("validate_app_charte")

    ok = True
    for g in checks:
        print(f"\n##### {g} #####")
        r = subprocess.run([sys.executable, f"{g}.py"], cwd=work, env=env,
                           capture_output=True, text=True)
        out = (r.stdout + r.stderr).strip()
        print("\n".join(out.splitlines()[-12:]))
        if r.returncode != 0:
            ok = False
    print("\n" + ("✅ SET CONFORME — tous les garde-fous applicables au vert."
                  if ok else "❌ ÉCHEC — au moins un garde-fou a bloqué (voir ci-dessus)."))
    shutil.rmtree(work, ignore_errors=True)
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
