# Accimoto — Triumph Daytona 675 · Éclaté 3D interactif

Visualiseur 3D web d'une Triumph Daytona 675 (édition noir & or), avec vue éclatée
du moteur inspirée des visuels d'atelier Triumph.

## Moteur partagé `js/moteur660.js` — source unique

La géométrie du trois-cylindres 660 vit dans **un seul module** exporté,
`buildMoteur660()`, qui renvoie `{ group, parts }` (le bloc assemblé + la liste
des ~44 pièces avec leur vecteur d'éclatement, repère, description et matière).
Les deux pages l'importent :

- `moteur.html` l'utilise pour la scène cinématique dédiée (le bloc seul) ;
- `index.html` l'insère dans la moto complète, à la place du bloc scanné (voir
  la constante `ENG` : orientation, échelle et position dans le cadre).

Modifier une pièce du moteur = éditer `js/moteur660.js`, et les deux vues sont
mises à jour. Chaque page applique son propre facteur d'éclatement (moteur.html
`×0.85`, index.html `×0.5` pour rester lisible au milieu de la moto).

## Page `moteur.html` — moteur 660 seul, éclaté cinématique

Modèle 3D procédural haute-fidélité du trois cylindres Triumph 660 (type
Daytona/Trident 660), construit d'après les photos d'atelier et la microfiche
« carter moteur et pièces » du dossier : carters supérieur/inférieur au plan de
joint horizontal, bloc incliné 12°, vilebrequin calé à 120° avec coussinets
(rep. 16), pistons/bielles positionnés à leur vraie hauteur de maneton, embrayage
complet (cloche, disques garnis/lisses, noix, couvercle rond au badge Triumph),
alternateur avec décalque « Triumph recommends », boîte 6 rapports, barillet,
pompes à eau/huile, reniflard (rep. 2–6), gicleurs (rep. 9), pions (rep. 8)…
**44 pièces nommées** avec info-bulle et fiche au clic.

- Glisser verticalement (ou curseur) : séparation continue des pièces — le bloc
  lévite au-dessus de son support bois pendant l'éclatement.
- **Mode cinéma** : plan-séquence de 27 s (letterbox, bokeh, grain, éclairage
  studio suiveur, séparation puis réassemblage choréographiés).
- Post-traitement : ACES, bloom, profondeur de champ, grain argentique.
- Géométrie importée de `js/moteur660.js` ; le reste (scène, lumières, caméra,
  cinéma) est propre à la page. Three.js r160 via CDN.
- Debug : `window.moteur.set(azimut, éclaté01, distance)` / `window.moteur.cinema()`.

Dans la moto complète (`index.html`), le compromis retenu privilégie le rendu :

- **Assemblé** (éclaté < 8 %, même zoomé « mécanique à nu ») → on garde le
  **bloc moteur scanné**, qui remplit exactement la baie, aux bonnes proportions,
  sans jeu ni pièce qui dépasse.
- **À l'éclaté** (≥ 8 %) → le **moteur détaillé** (module) prend le relais, aligné
  sur le centre du bloc scanné pour une transition sans « pop », puis se sépare en
  ses ~44 pièces nommées.

Raison : le moteur détaillé a une silhouette trop fine pour combler la baie du
scan (0,33 vs 0,51 de profondeur) — superposé au châssis semi-transparent, des
jeux apparaissaient. Le montrer uniquement pendant la séparation (là où il
brille) évite ce défaut.

Orientation du bloc (`ENG`) : lacet 90° (vilebrequin transverse) **puis cant
avant de 12° autour de l'axe vilebrequin** (composé par quaternions). Combiné aux
12° d'inclinaison des fûts, cela amène les cylindres à ~24° de la verticale —
**parallèles au radiateur** (mesuré à 23,7° sur le scan), comme sur la vraie
moto où le moteur est incliné vers l'avant. Ce cant n'est appliqué que dans la
moto ; sur le banc (`moteur.html`) le bloc reste à plat. Debug :
`window.daytona.set(rotation, éclaté01, distance)`.

## Lancer

```bash
python3 -m http.server 8123
# puis ouvrir http://localhost:8123
```

Aucun build : un seul fichier `index.html`. Three.js est chargé depuis le CDN
jsdelivr (connexion internet requise au premier chargement).

## Commandes

| Geste | Action |
|---|---|
| Glisser **horizontalement** | Rotation 360° de la moto |
| Glisser **verticalement** | Éclater / réassembler le moteur (espacement continu des pièces) |
| Molette / pincer | Zoom |
| **Zoom fort** (rapproché) | Les carénages s'effacent → mécanique à nu (radiateur, moteur, cadre) |
| Double-clic | Réinitialiser la vue |
| Survol d'une pièce | Info-bulle avec le nom de la pièce |
| **Clic sur une pièce** | Fiche pièce + lien vers le catalogue de références d'origine (pieces-triumph.com) |
| Curseur vertical (à droite) | Réglage précis du taux d'éclaté |

Boutons : **Vue éclatée** (0 ↔ 100 %), **Rotation auto**, **Réinitialiser**.

## Mode catalogue (désactivé)

L'expérience est 100 % 3D. Un mode « photo catalogue » existe en dormant :
ajoutez des entrées dans `PHOTO_DEFS` (index.html) pointant vers des images
de `photos/` pour qu'à 0 % d'éclaté, aligné sur l'angle défini, la vraie
photo se fonde à l'écran.

## Rendu photoréaliste

`models/daytona.glb` (10,5 Mo, ~455 k triangles) provient du modèle Sketchfab
« 2009 Triumph Daytona 675 » de williz.17 (CC-BY) : le STL source fusionné a été
converti par [tools/convert_daytona.py](tools/convert_daytona.py) — double
classification géométrique des faces :

- **16 blocs « catalogue » éclatables** (comme chez un vendeur de pièces
  détachées) : 3 disques de frein (présentés à côté de leurs roues), roue
  avant, roue arrière, fourche, guidon, radiateur, carénage avant & optiques,
  réservoir, selle-coque & échappement, bras oscillant & chaîne, deux flancs,
  **bloc moteur & boîte** (décimation 2× plus fine, mis en valeur au centre)
  et cadre & périphériques. Frontières nettoyées topologiquement (votes
  majoritaires + absorption des fragments < 15 cm²) ; pneus verrouillés 100 %
  gomme noire ; le garde-boue avant, le support de plaque et les petits
  éléments orphelins sont **supprimés**. NB : sur ce scan, le silencieux est
  fusionné à la coque arrière — il reste solidaire du bloc selle/coque ;
- **5 matériaux PBR** conservés dans chaque bloc : noir laqué (clearcoat),
  or, acier, alu, gomme ;

puis décimation 1,5 M → 455 k triangles avec normales lissées et correction
d'orientation.

À l'éclaté, quatre blocs scannés sont **substitués par des pièces vitrines
dessinées d'après les microfiches du catalogue** (`SWAPS` dans index.html) :
bloc moteur & boîte, radiateur (faisceau à ailettes, vases, ventilateur,
durites), fourche (tubes or, fourreaux, tés, axe) et guidon (demi-guidons,
leviers, maître-cylindre). Les autres blocs (roues, disques, réservoir,
selle…) proviennent directement du scan.

L'éclaté déplace **les blocs entiers du modèle réel** (offsets nommés dans
`REAL_OFFSETS` de `index.html`) : les flancs s'écartent, les trains roulants
glissent, le réservoir et la selle se soulèvent — le bloc moteur reste au
centre, dévoilé. À 0 % aligné sur un angle photo, la vraie photo s'affiche
plein cadre (mode catalogue) ; en rotation, c'est le modèle 3D réel
(HDRI studio, sol miroir, ACES).

Note : le panneau navigateur intégré de Claude bride `requestAnimationFrame`
(≈1 img/s) ; ouvrez la page dans un navigateur normal pour la fluidité réelle
(rendu mesuré ≈ 3-4 ms/image).

## Technique

- Three.js r160, matériaux PBR (`MeshPhysicalMaterial` clearcoat pour la peinture),
  tone mapping ACES, ombres douces PCF 2048², environnement `RoomEnvironment`.
- Modèle 100 % procédural (~40 pièces nommées) : roues, fourche, cadre, carénages,
  et un moteur trois-cylindres décomposable (couvre-culasse, arbres à cames,
  pistons/bielles, vilebrequin, boîte de vitesses, embrayage, alternateur,
  collecteur 3-en-1, visserie…).
- Chaque pièce porte un vecteur d'éclatement et un décalage temporel (`stagger`) ;
  le facteur global 0..1 est piloté par l'axe vertical du pointeur.
- Hook de debug : `window.daytona.set(rotationY, eclate01, distance)` dans la console.
