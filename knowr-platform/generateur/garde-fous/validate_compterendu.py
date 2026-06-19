#!/usr/bin/env python3
# validate_compterendu.py (v8) — Surface Compte-rendu (etat "Apres"), spec-27.
# Exige : bascule Preparation/Compte-rendu + au moins un bloc "par personne presente",
# et que CHAQUE bloc personne porte : impact score + atteinte objectif + taches.
import os, re, glob, sys
OUT = os.environ.get('KNOWR_OUT', '.')
files = sorted(glob.glob(os.path.join(OUT, '*compte-rendu*.html')))
if not files:
    print("? aucun fichier *compte-rendu*.html dans", OUT, "(ignore)"); sys.exit(0)
errors, warns = [], []
for f in files:
    s = open(f, encoding='utf-8').read(); name = os.path.basename(f); E, W = [], []
    if 'cr-toggle' not in s and 'Compte-rendu' not in s:
        E.append("pas de bascule Preparation/Compte-rendu")
    blocks = [b for b in re.split(r'(?=<div class="pcard">)', s) if 'class="pcard"' in b]
    if not blocks:
        E.append("aucun bloc 'par personne presente' (.pcard)")
    for i, b in enumerate(blocks, 1):
        miss = []
        if 'Impact sur le score' not in b and 'id="aft-' not in b: miss.append("impact score")
        if 'objchip' not in b and "Atteinte de l'objectif" not in b: miss.append("atteinte objectif")
        if 'Tâches' not in b and 'class="tsk' not in b: miss.append("taches")
        if miss: E.append("bloc personne #%d sans : %s" % (i, ", ".join(miss)))
    low = s.lower()
    if not ('tendance' in low and ('réunion' in low or 'reunion' in low)):
        W.append("pas de mention 'alimente la tendance derniere reunion'")
    if 'objchip' not in s:
        W.append("pas de statut d'objectif cliquable (objchip)")
    if E: errors.append((name, E))
    if W: warns.append((name, W))
    if not E:
        print("  OK %-32s : %d personne(s) presente(s), impact+objectif+taches presents%s"
              % (name, len(blocks), " (warn)" if W else ""))
for n, W in warns:
    for w in W: print("  ! %s : %s" % (n, w))
if errors:
    print("\nX ECHEC - surface Compte-rendu non conforme (spec-27) :")
    for n, E in errors:
        for e in E: print("   - %s : %s" % (n, e))
    sys.exit(1)
print("\nOK - Compte-rendu conforme spec-27 : chaque personne presente a impact score + atteinte objectif + taches ; bascule presente.")
