# KAZ Grid

Jeu de grille inspiré de [KAZ](https://store.steampowered.com/app/3633760/KAZ/) — déplacez votre carte sur une grille pour éliminer les cases ennemies.

## Jouer

```bash
python3 -m http.server 8080
```

Ouvrez http://localhost:8080

## Contrôles

- **Clavier** : flèches ou ZQSD / WASD
- **Mobile** : swipe sur la grille ou boutons directionnels
- Atteignez l'objectif de score avant la fin du timer

## Fichiers

- `index.html` — page du jeu
- `css/style.css` — interface sombre minimaliste
- `js/grid.js` — rendu de la grille et des cartes
- `js/game.js` — logique, déplacements, score
