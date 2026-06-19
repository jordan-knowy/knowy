#!/usr/bin/env bash
# =============================================================================
# check-reference-sets.sh — Gate qualité Knowr (garde-fous obligatoires)
# =============================================================================
# Lance la batterie complete des garde-fous sur les SETS DE REFERENCE
# (Carroz + Manolys). Si l'un d'eux passe au rouge, le script sort en erreur
# -> le commit (hook pre-commit) ou la CI est BLOQUE.
#
# C'est ce qui rend run_all.py « non-contournable » : la conformite des fiches
# de reference est verifiee automatiquement, sans dependre de la discipline.
#
# Usage : bash generateur/garde-fous/check-reference-sets.sh
# (depuis la racine du repo, apres decompression du handoff)
# =============================================================================
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GF="$ROOT/generateur/garde-fous"
REF="$ROOT/generateur/templates-reference"
PY="${PYTHON:-python3}"
fail=0

run_set () {
  local label="$1"; shift
  local dir="$1"; shift
  echo "==================================================================="
  echo "  GATE · $label"
  echo "==================================================================="
  "$PY" "$GF/run_all.py" --ref "$REF" --out-dir "$dir" "$@"
  if [ $? -ne 0 ]; then echo "  >>> ECHEC sur $label"; fail=1; fi
}

run_set "Set Carroz" "$ROOT/exemples-reels/set-carroz" \
  compte=knowr-compte-carroz-immobilier.html \
  personne=knowr-personne-bertrand-pate.html \
  reunion=knowr-reunion-carroz-immobilier.html

run_set "Set Manolys" "$ROOT/exemples-reels/set-manolys" \
  compte=knowr-compte-manolys-immobilier.html \
  personne=knowr-personne-brigitte-bruyeres.html \
  personne=knowr-personne-elisabeth-rodrigues.html \
  reunion=knowr-reunion-manolys-immobilier.html

echo
if [ "$fail" -ne 0 ]; then
  echo "❌ GATE ROUGE — au moins un set de reference a echoue. Commit/CI bloque."
  exit 1
fi
echo "✅ GATE VERT — tous les sets de reference sont conformes."
exit 0
