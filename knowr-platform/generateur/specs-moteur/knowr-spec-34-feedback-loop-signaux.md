# Spec-34 — Feedback loop sur signaux (✅/❌)

> Statut : draft v1 · transverse (app + email + moteur spec-30/32).
> Principe : chaque signal détecté porte un verdict utilisateur **✅ pertinent / ❌ hors sujet** → boucle d'amélioration continue du moteur.

## 1. Objectif

Transformer chaque signal en point d'apprentissage. L'utilisateur valide ou écarte le signal d'un clic ; ces verdicts pondèrent la fiabilité des patterns et calibrent le moteur dans le temps. Sans feedback, le moteur reste statique ; avec, il s'aligne sur le terrain de chaque équipe.

## 2. Surfaces (obligatoires)

Le contrôle ✅/❌ est présent **sous chaque signal**, partout où un signal est affiché :
1. **Rail Home** — « Signaux · Portefeuille ».
2. **Fiches** — compte, personne, réunion (section Signaux).
3. **Notifications email** — chaque signal embarque deux liens **✅ / ❌ one-click, tokenisés** (voir §5).

UX in-app : au clic, confirmation inline (« ✅ Signal confirmé · merci » / « ❌ Signal écarté · merci »), sans rechargement, sans déclencher le clic de la ligne/fiche (stopPropagation).

## 3. Donnée captée

```
{ signal_id, pattern_type, entity_type:{account|person|meeting}, entity_id,
  user_id, verdict:{confirmed|dismissed}, surface:{home|fiche|email},
  timestamp }
```

## 4. Exploitation moteur (spec-30 / spec-32)

- **Fiabilité par pattern** : précision observée = confirmés / (confirmés + écartés) par `pattern_type`. Un pattern souvent écarté voit sa **sévérité pondérée à la baisse** ou son **seuil de déclenchement relevé**.
- **Calibration** : les retours alimentent l'ajustement des seuils (courbe de Hill, demi-vies) par type de signal et par segment.
- **Débruitage personnalisé** : un signal récurrent systématiquement écarté par un utilisateur est **dé-priorisé / masqué** pour lui (sans l'effacer pour les autres).
- **Zéro-hallu préservé** : le feedback ne crée jamais un signal ni n'invente de fait — il **pondère** l'affichage et la priorité. Un signal écarté reste traçable (audit).

## 5. Notifications email (one-click)

- Chaque signal dans l'email contient deux liens : `…/signal/{id}/feedback?v=ok&t={token}` et `…&v=no&t={token}`.
- **Tokenisés** (signés, liés au user + signal), **one-click sans login**, **idempotents**, **expirant** (ex. 30 j).
- Le clic enregistre le verdict côté serveur et affiche une page de confirmation légère.
- Même schéma de donnée captée (§3) avec `surface:email`.

## 6. Garde-fous

- Le feedback est une **donnée d'usage interne** → assistance à la préparation, pas de décision automatisée (Art. 22 RGPD).
- Idempotence : un même verdict rejoué ne compte qu'une fois.
- Réversibilité : l'utilisateur peut changer son verdict (dernier gagne).
