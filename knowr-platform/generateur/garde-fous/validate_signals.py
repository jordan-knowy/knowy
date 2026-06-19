#!/usr/bin/env python3
"""
Knowr — garde-fou Signaux (spec 23). Valide les rails AVANT packaging.
Regles : R3 matrice surface×tag · R2 provenance (source+date+pastille) · R4 tri · cardinalite 3..6.
Echec = exit 1 (zip bloque), comme le garde-fou CSS.
"""
import re, sys, os

OUT = os.environ.get("KNOWR_OUT", ".")
SURF = {  # nom de fichier -> scope (À ADAPTER à tes fichiers)
 "knowr-personne.html": "personne",
 "knowr-compte.html":   "compte",
 "knowr-reunion.html":  "reunion",
}
# R3 matrice : tag -> surfaces autorisees (vocabulaire FAIT-DATÉ, spec 23 §2)
MATRIX = {
 "Churn":     {"personne","compte","reunion"},
 "Risque":    {"personne","compte","reunion"},
 "Levier":    {"personne","compte","reunion"},
 "Mobilite":  {"personne"},
 "Mobilité":  {"personne"},
 "Reseau":    {"personne","compte","reunion"},
 "Réseau":    {"personne","compte","reunion"},
 "Marche":    {"compte","reunion"},
 "Marché":    {"compte","reunion"},
 "Croissance":{"compte","reunion"},
 "Presence":  {"personne","compte","reunion"},
 "Présence":  {"personne","compte","reunion"},
}
# Tags explicitement BANNIS (traits/conseils déguisés en signaux)
BANNED_TAGS = {"Profil","Relation","JTBD"}
# Formulations impératives = recommandation, pas un signal (spec 23 §0)
IMPERATIVE = re.compile(r'^\s*(reconna\w+|cadr\w+|teni?r|convainc\w+|embarqu\w+|propos\w+|'
                        r'sécuris\w+|securis\w+|activ\w+|réactiv\w+|reactiv\w+|prépar\w+|'
                        r'prepar\w+|fair\w+|évit\w+|evit\w+|clarifi\w+|verrouill\w+|sortir)\b', re.I)
PRIORITY = {"Churn":0,"Risque":1,"Levier":2}  # R4 ; le reste = 3

def parse(html):
    body = html.split("</style>")[-1]
    out=[]
    for c in body.split('<div class="sig-item">')[1:]:
        t=re.search(r'sig-it-t">([^<]*)',c)
        tag=re.search(r'sig-tag">([^<]*)',c)
        src=re.search(r'sig-src">([^<]*)',c)
        date=re.search(r'sig-date">([^<]*)',c)
        conf=re.search(r'sig-conf" style="background:var\(--([a-z]+)\)',c)
        out.append({"title":t.group(1) if t else None,
                    "tag":tag.group(1) if tag else None,
                    "src":src.group(1) if src else None,
                    "date":date.group(1) if date else None,
                    "conf":conf.group(1) if conf else None})
    return out

ok=True
for f,scope in SURF.items():
    sigs=parse(open(os.path.join(OUT,f),encoding="utf-8").read())
    errs=[]
    # cardinalite (1..6 : un rail court vaut mieux qu'un signal invente, spec 23 §3)
    if not (1<=len(sigs)<=6): errs.append(f"cardinalite {len(sigs)} hors [1..6]")
    prio_seq=[]
    for s in sigs:
        if not s["tag"]: errs.append(f"[{s['title']}] sans tag (R3)"); continue
        if s["tag"] in BANNED_TAGS:
            errs.append(f"[{s['title']}] tag '{s['tag']}' BANNI : c'est un trait/conseil, pas un signal (spec 23 §0)")
        allowed=MATRIX.get(s["tag"])
        if allowed is None: errs.append(f"[{s['title']}] tag '{s['tag']}' hors vocabulaire ferme (R3)")
        elif scope not in allowed: errs.append(f"[{s['title']}] tag '{s['tag']}' interdit sur surface '{scope}' (R3)")
        if not s["src"] or not s["date"] or not s["conf"]:
            errs.append(f"[{s['title']}] provenance incomplete src/date/pastille (R2)")
        # titre impératif = recommandation déguisée
        if s["title"] and IMPERATIVE.match(s["title"]):
            errs.append(f"[{s['title']}] titre impératif -> recommandation, pas un signal (spec 23 §0)")
        prio_seq.append(PRIORITY.get(s["tag"],3))
    # R4 tri croissant
    if prio_seq!=sorted(prio_seq):
        errs.append(f"tri R4 non respecte : ordre={prio_seq}")
    flag="OK" if not errs else "X"
    print(f"  {flag} {scope:9} ({len(sigs)} signaux)")
    for e in errs: print(f"       - {e}"); 
    if errs: ok=False

if not ok:
    print("\nX ECHEC garde-fou Signaux (spec 23). Zip bloque."); sys.exit(1)
print("\nOK - Signaux conformes spec 23 : scope, provenance, vocabulaire, tri.")
