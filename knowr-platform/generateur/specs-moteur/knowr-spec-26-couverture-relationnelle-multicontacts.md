# Knowr — Spec 26 · Couverture relationnelle multi-contacts (v7)

> **v7 — nouveau.** Cette spec est née d'une erreur réelle sur le compte **Calomatech**.
> Elle est *additive* : elle ne remplace rien, elle ajoute une obligation de
> **couverture** par-dessus la doctrine existante (zéro-hallucination, double source,
> ancienneté). Garde-fou associé : `validate_contact_coverage.py`.

---

## 0. Le problème qu'on corrige (cas Calomatech)

Sur le brief Calomatech, le décideur (Breton) a été correctement analysé, mais les
contacts secondaires ont été remplis **depuis l'en-tête des mails**, sans lecture de
leurs propres fils :

- **Titre faux** : Clémence Dolbet affichée « Stratégie » alors que sa signature dit
  **« Chargée de marketing et communication »**.
- **Rôle inventé** : « champion potentiel » attribué sans aucune lecture de ses messages.
- **Réalité ratée** : son mail du 27/04 portait l'**objection produit centrale**
  (refus de l'approche LinkedIn, demande de pivot emailing) — le vrai « pourquoi maintenant ».
- **Contact fantôme** : « Lylia », utilisatrice finale qui reçoit les leads, citée
  **dans un corps de mail** (donc invisible aux en-têtes) et jamais identifiée.

La fiche passait pourtant les 6 garde-fous : **la forme était bonne, la couverture non.**
Pour un OS *relationnel*, c'est le pire endroit où se tromper.

---

## 1. Doctrine (la règle)

> **Un brief = le compte + TOUS ses contacts identifiés, chacun SCORÉ et ANALYSÉ
> depuis ses propres messages. Les personnes importantes de la réunion ont chacune
> leur fiche Personne. On n'affiche jamais un rôle, un titre ou un comportement
> qu'on n'a pas lu.**

Corollaires :
- Le sourcing zéro-hallucination ne s'applique pas qu'aux *faits chiffrés* : il
  s'applique aussi au **graphe relationnel** (titre, rôle Miller-Heiman, score, lecture
  comportementale). Un rôle déduit d'un en-tête est une hallucination.
- « Listé » ≠ « analysé ». Un contact peut apparaître sans être encore analysé, **mais
  alors il est explicitement marqué `à confirmer / non analysé`**, sans score inventé,
  sans rôle de pouvoir, sans lecture de personnalité.

---

## 2. Phase 0 — Cartographie des contacts (AVANT tout build)

Étape obligatoire, en tête du pipeline, **avant** de choisir l'angle ou de coder une surface :

1. **Recenser tout le monde.** Parcourir l'ensemble des fils du compte et collecter
   toutes les adresses internes en **To + Cc** → liste dédupliquée.
2. **Inclure les acteurs cités dans les corps.** Les noms qui n'apparaissent que dans
   le texte d'un mail (« Lylia nous fera un retour… ») font partie du roster. Les
   en-têtes seuls ne suffisent pas.
3. **Récupérer par expéditeur.** Pour chaque contact qui apparaîtra sur une surface :
   recherche `sender:<email>` (ou équivalent Outlook/Gmail), puis **lecture de ses
   propres messages** — signature (titre réel), ton, posture, demandes, objections.
4. **Scorer chacun.** Score relationnel (Intensité / Réciprocité / Récence) calculé sur
   *son* historique, pas sur celui du compte. Pas d'historique propre → score `—` +
   `à confirmer`, jamais un chiffre plausible.
5. **Classer le rôle depuis ses mots.** Rôle Miller-Heiman (EB, Champion, Coach,
   Utilisateur, Bloqueur…) justifié par **ce qu'il écrit**, avec tag de provenance.

### Distinction de provenance (deux états)
- **Échange direct analysé** — on a lu ses propres messages. Autorise titre, rôle, score,
  lecture comportementale (avec tags `Observable` / `Inféré`).
- **Vu en copie (en-tête seul)** — jamais d'écrit propre lu. Autorise *seulement* :
  nom, e-mail, présence sur le compte. Tout le reste → `à confirmer`.

---

## 3. Fiches à générer (les « personnes concernées »)

> Le brief ne se limite pas à une fiche Personne pour le décideur.

- **Tout contact clé** — partie prenante de la réunion, rôle de pouvoir (EB / Champion /
  Coach / décideur), ou marqué d'une étoile dans le tableau Compte — **a sa propre fiche
  Personne**, générée, scorée et analysée. Le tableau Compte la lie (bouton « Voir le brief »),
  il ne se contente pas d'un bouton « Générer ».
- **Les contacts mineurs** (cités, en copie, sans enjeu) peuvent rester en ligne de tableau
  marquée `à confirmer`, sans fiche, tant qu'aucun rôle de pouvoir ne leur est attribué.
- Règle pratique : si une personne est nommée dans le bloc « participants » de la Réunion ou
  porte un rôle de pouvoir sur le Compte → **fiche obligatoire**.

---

## 4. Ce que le garde-fou vérifie (et ce qu'il ne peut pas)

`validate_contact_coverage.py`, sur le `.ct-tbl` du Compte :
1. chaque ligne **scorée** (nombre) **ou** explicitement `à confirmer` ;
2. **aucun rôle de pouvoir** sans score (= sans analyse) ;
3. **tout contact clé** (rôle de pouvoir ou ★) **lie une fiche Personne** ;
4. **au moins une fiche** liée depuis le compte (l'EB au minimum).

**Limite assumée** : un garde-fou HTML statique impose la *discipline de sourcing*
(on n'affiche pas ce qu'on n'a pas lu), **pas la complétude réelle** vs la boîte mail
(« a-t-on récupéré tout le monde, dont Lylia ? »). Cette complétude se joue en **Phase 0**,
à la génération — d'où l'obligation process ci-dessus, non délégable au script.

---

## 5. Rappel — articulation avec les autres specs
- **spec-21 (provenance)** : chaque champ porte sa source ; ici on l'étend au rôle/score.
- **spec-15 / hero** : Personne & Compte = Score + Confiance + Dernier contact (3 blocs).
- **spec-23 (signaux)** : un signal reste un fait daté ; l'analyse par contact en produit de meilleurs.
- **spec-H (ancienneté)** : `order:oldest` par **expéditeur** s'applique désormais **par contact**, pas seulement au compte.
