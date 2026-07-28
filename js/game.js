/**
 * KAZ Grid — déplacement d'une carte sur une grille
 */
(() => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const targetEl = document.getElementById('target');
  const timerEl = document.getElementById('timer');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlaySub = document.getElementById('overlay-sub');
  const btnRestart = document.getElementById('btn-restart');

  const PLAYER_COLOR = '#a855f7';
  const ENEMY_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#ec4899'];

  const ROUND_TIME = 15;
  const BASE_TARGET = 10;
  const BASE_SIZE = 5;

  let dpr = 1;
  let cols = BASE_SIZE;
  let rows = BASE_SIZE;
  let player = { col: 2, row: 2 };
  let enemies = [];
  let score = 0;
  let target = BASE_TARGET;
  let timeLeft = ROUND_TIME;
  let round = 1;
  let state = 'playing';
  let lastTick = 0;

  const DIR = {
    up: { dc: 0, dr: -1 },
    down: { dc: 0, dr: 1 },
    left: { dc: -1, dr: 0 },
    right: { dc: 1, dr: 0 },
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function randomEmptyCell() {
    const occupied = new Set([
      `${player.col},${player.row}`,
      ...enemies.map((e) => `${e.col},${e.row}`),
    ]);
    const free = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${c},${r}`;
        if (!occupied.has(key)) free.push({ col: c, row: r });
      }
    }
    if (free.length === 0) return null;
    return free[Math.floor(Math.random() * free.length)];
  }

  function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
      const cell = randomEmptyCell();
      if (!cell) break;
      enemies.push({
        ...cell,
        color: ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)],
      });
    }
  }

  function initRound() {
    cols = BASE_SIZE + Math.min(round - 1, 4);
    rows = cols;
    player = { col: Math.floor(cols / 2), row: Math.floor(rows / 2) };
    enemies = [];
    timeLeft = ROUND_TIME;
    target = BASE_TARGET + (round - 1) * 8;
    spawnEnemies(Math.min(3 + round, cols * rows - 1));

    if (state === 'playing') {
      overlay.classList.add('hidden');
    }
    updateHud();
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    targetEl.textContent = String(target);
    timerEl.textContent = String(Math.ceil(timeLeft));
  }

  function showOverlay(title, sub) {
    overlayTitle.textContent = title;
    overlaySub.textContent = sub;
    overlay.classList.remove('hidden');
  }

  function move(dirName) {
    if (state !== 'playing') return;

    const { dc, dr } = DIR[dirName];
    const nc = player.col + dc;
    const nr = player.row + dr;

    if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) return;

    player.col = nc;
    player.row = nr;

    const hitIdx = enemies.findIndex((e) => e.col === nc && e.row === nr);
    if (hitIdx !== -1) {
      enemies.splice(hitIdx, 1);
      score += 1;
      spawnEnemies(1);
      updateHud();

      if (score >= target) {
        state = 'roundWin';
        round += 1;
        score = 0;
        showOverlay(`Manche ${round - 1} !`, 'Objectif atteint — manche suivante');
        setTimeout(() => {
          state = 'playing';
          initRound();
        }, 1200);
      }
    }
  }

  function gameOver() {
    state = 'gameover';
    showOverlay('Partie terminée', `Score final : manche ${round}`);
  }

  function tick(time) {
    if (state !== 'playing') return;

    if (!lastTick) lastTick = time;
    const dt = (time - lastTick) / 1000;
    lastTick = time;

    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateHud();
      gameOver();
      return;
    }
    updateHud();
  }

  function render(time) {
    tick(time);

    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;

    GridRenderer.draw(ctx, cols, rows, w, h);

    enemies.forEach((e) => GridRenderer.drawEnemy(ctx, e.col, e.row, e.color));
    GridRenderer.drawCard(ctx, player.col, player.row, PLAYER_COLOR, true);

    requestAnimationFrame(render);
  }

  function restart() {
    score = 0;
    round = 1;
    state = 'playing';
    lastTick = 0;
    initRound();
  }

  document.addEventListener('keydown', (e) => {
    const map = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    };
    const dir = map[e.key];
    if (dir) {
      e.preventDefault();
      move(dir);
    }
  });

  document.querySelectorAll('.pad').forEach((btn) => {
    btn.addEventListener('click', () => move(btn.dataset.dir));
  });

  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;

    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? 'right' : 'left');
    } else {
      move(dy > 0 ? 'down' : 'up');
    }
  }, { passive: false });

  btnRestart.addEventListener('click', restart);
  window.addEventListener('resize', resize);

  resize();
  initRound();
  requestAnimationFrame(render);
})();
