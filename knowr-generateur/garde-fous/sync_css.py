#!/usr/bin/env python3
"""
Knowr — pipeline de coherence (Option 2).
Source unique de design (knowr-design-system.full.css = polices base64 + design system),
recopiee a l'identique dans chaque page. Garde-fous qui BLOQUENT le zip en cas de divergence.

Regles :
  - Le 1er <style> de chaque page = le maitre, au bit pres (MD5 verifie).
  - Tout AUTRE <style> ne doit JAMAIS redefinir une primitive partagee
    (.page/.rail/.col-main/.hero-header/.nav). S'il le fait -> on neutralise la regle fautive.
  - Les <link> Google Fonts sont supprimes (rendu 100% autonome / hors-ligne).
  - Si apres nettoyage une primitive partagee est encore redefinie hors maitre -> ECHEC.
"""
import re, hashlib, sys, os

# --- À ADAPTER ---------------------------------------------------------------
# OUT : dossier contenant tes 3 fiches HTML (par défaut : le dossier courant).
# MASTER : la charte unique. Si tu n'as pas de fichier maître séparé, le script
#          prend automatiquement le <style> de la 1re page comme référence.
# PAGES : les noms de tes 3 fiches. Remplace-les par les tiens.
OUT = os.environ.get("KNOWR_OUT", ".")
import glob as _glob
_m = _glob.glob(os.path.join(OUT, "*design-system*.css"))
MASTER = _m[0] if _m else None   # None => on prendra le <style> de la 1re page
PAGES = [
    "knowr-personne.html",
    "knowr-reunion.html",
    "knowr-compte.html",
]
# -----------------------------------------------------------------------------
SHARED = ["page", "rail", "col-main", "hero-header", "nav"]
SHARED_RULE = re.compile(r'\.(?:' + "|".join(re.escape(s) for s in SHARED) + r')\{[^}]*\}')
GF_LINK = re.compile(r'\s*<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>', re.I)

def main():
    if MASTER:
        master = open(MASTER, encoding="utf-8").read()
    else:
        # pas de fichier maître : on prend le <style> de la 1re page comme référence
        first_html = open(os.path.join(OUT, PAGES[0]), encoding="utf-8").read()
        m0 = re.search(r"<style>(.*?)</style>", first_html, re.S)
        if not m0:
            print("X Aucun maître CSS et aucun <style> dans la 1re page."); sys.exit(1)
        master = m0.group(1)
    master_md5 = hashlib.md5(master.encode()).hexdigest()
    print("Maitre CSS : %d octets - md5=%s" % (len(master), master_md5[:10]))

    style_md5 = {}
    for p in PAGES:
        path = os.path.join(OUT, p)
        html = open(path, encoding="utf-8").read()
        html, n_gf = GF_LINK.subn("", html)

        blocks = list(re.finditer(r"<style>(.*?)</style>", html, re.S))
        if not blocks:
            print("  X %s : aucun <style>" % p); sys.exit(1)
        first = blocks[0]
        html = html[:first.start()] + "<style>" + master + "</style>" + html[first.end():]

        stripped = [0]
        def clean_extra(m):
            inner = m.group(1)
            new, k = SHARED_RULE.subn("", inner)
            stripped[0] += k
            return "" if new.strip() == "" else "<style>" + new + "</style>"

        parts = re.split(r"(<style>.*?</style>)", html, flags=re.S)
        rebuilt, seen = [], False
        for seg in parts:
            if seg.startswith("<style>"):
                if not seen:
                    seen = True; rebuilt.append(seg)
                else:
                    rebuilt.append(re.sub(r"<style>(.*?)</style>", clean_extra, seg, flags=re.S))
            else:
                rebuilt.append(seg)
        html = "".join(rebuilt)
        open(path, "w", encoding="utf-8").write(html)

        css0 = re.search(r"<style>(.*?)</style>", html, re.S).group(1)
        style_md5[p] = hashlib.md5(css0.encode()).hexdigest()
        extra = re.findall(r"<style>(.*?)</style>", html, re.S)[1:]
        leaks = sum(len(SHARED_RULE.findall(b)) for b in extra)
        note = "%d GF retire(s)" % n_gf
        if stripped[0]: note += " - %d regle(s) primitive parasite nettoyee(s)" % stripped[0]
        flag = "OK" if leaks == 0 else "X"
        print("  %s %s : %s - style#1 md5=%s - fuites=%d" % (flag, p, note, style_md5[p][:10], leaks))
        if leaks:
            print("      -> primitive partagee encore redefinie hors maitre."); sys.exit(1)

    uniq = set(style_md5.values())
    if len(uniq) != 1 or uniq.pop() != master_md5:
        print("\nX ECHEC : CSS partage != maitre. Zip bloque.")
        for p, h in style_md5.items(): print("    %s  %s" % (h[:10], p))
        sys.exit(1)
    print("\nOK - CSS partage identique au maitre (md5 %s)." % master_md5[:10])
    print("   Aucune primitive partagee redefinie ailleurs. Rendu autonome hors-ligne.")

if __name__ == "__main__":
    main()
