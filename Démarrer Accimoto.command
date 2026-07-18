#!/bin/bash
# ---------------------------------------------------------------
#  Accimoto — lanceur double-clic (macOS)
#  Double-cliquez ce fichier : le mini-serveur démarre et la moto
#  3D s'ouvre toute seule dans votre navigateur.
#  Pour arrêter : fermez cette fenêtre (ou Ctrl+C).
# ---------------------------------------------------------------

# Se placer dans le dossier du projet (là où vit ce fichier)
cd "$(dirname "$0")" || exit 1

PORT=8123
URL="http://localhost:$PORT"

echo ""
echo "  🏍  Accimoto — démarrage…"
echo "  Ne fermez pas cette fenêtre tant que vous utilisez la moto 3D."
echo "  Adresse : $URL"
echo ""

# Ouvrir le navigateur une fois le serveur prêt (petit délai)
( sleep 1; open "$URL" ) &

# Démarrer un mini-serveur avec ce qui est disponible sur le Mac.
# Ruby est fourni d'origine sur macOS -> aucune installation nécessaire.
if command -v ruby >/dev/null 2>&1; then
  ruby -run -e httpd . -p "$PORT"
elif command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  python -m SimpleHTTPServer "$PORT" 2>/dev/null || python -m http.server "$PORT"
else
  echo ""
  echo "  ⚠️  Impossible de démarrer : ni Ruby ni Python trouvés sur ce Mac."
  echo "  Appelle Adrien 😉"
  echo ""
  echo "  (Appuyez sur une touche pour fermer.)"
  read -n 1 -s
fi
