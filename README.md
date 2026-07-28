# Train Spotter

Jeu web mobile où il faut mémoriser un train TGV puis le retrouver parmi plusieurs trains en mouvement, chacun sur son propre circuit.

## Jouer

Ouvrez `index.html` dans un navigateur, ou servez le dossier avec un serveur local :

```bash
python3 -m http.server 8080
```

Puis ouvrez http://localhost:8080

## Règles

1. Mémorisez le train affiché (couleurs, forme, nombre de voitures)
2. Trouvez-le parmi les 7 circuits (double boucle, serpentin, trèfle, zigzag…)
3. Touchez le bon train pour marquer un point
4. Une nouvelle manche commence avec un train différent

## Fichiers

- `index.html` — structure de la page
- `css/style.css` — styles mobile-first
- `js/train.js` — génération et rendu des trains TGV
- `js/tracks.js` — génération des circuits complexes (un par train)
- `js/game.js` — logique du jeu et animation
