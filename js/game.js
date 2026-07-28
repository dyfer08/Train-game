/**
 * Train Spotter — jeu de repérage de trains
 */
(() => {
  const MEMORIZE_DURATION = 3500;
  const WIN_DISPLAY_DURATION = 1200;
  const TRAIN_COUNT = 7;
  const TRAIN_SCALE = 1.1;

  const phases = {
    memorize: document.getElementById('phase-memorize'),
    search: document.getElementById('phase-search'),
    win: document.getElementById('phase-win'),
  };

  const targetContainer = document.getElementById('target-train-container');
  const countdownFill = document.getElementById('countdown-fill');
  const canvas = document.getElementById('circuit-canvas');
  const feedback = document.getElementById('feedback');
  const scoreEl = document.getElementById('score');
  const btnStart = document.getElementById('btn-start');

  const ctx = canvas.getContext('2d');

  let score = 0;
  let targetConfig = null;
  let targetIndex = 0;
  let trains = [];
  let trackPath = null;
  let trackLength = 0;
  let animFrameId = null;
  let gameState = 'idle';
  let dpr = 1;

  // --- Circuit en forme de 8 (lemniscate) ---
  function buildTrackPath(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const rx = w * 0.38;
    const ry = h * 0.32;

    const points = [];
    const segments = 360;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const denom = 1 + Math.sin(t) * Math.sin(t);
      const px = cx + (rx * Math.cos(t)) / denom;
      const py = cy + (ry * Math.sin(t) * Math.cos(t)) / denom;
      points.push({ x: px, y: py });
    }

    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.hypot(dx, dy);
    }

    return { points, length };
  }

  function getPointAtDistance(path, dist) {
    const { points } = path;
    const total = path.length;
    dist = ((dist % total) + total) % total;

    let accumulated = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const segLen = Math.hypot(dx, dy);
      if (accumulated + segLen >= dist) {
        const t = (dist - accumulated) / segLen;
        const x = points[i - 1].x + dx * t;
        const y = points[i - 1].y + dy * t;
        const angle = Math.atan2(dy, dx);
        return { x, y, angle };
      }
      accumulated += segLen;
    }
    return { x: points[0].x, y: points[0].y, angle: 0 };
  }

  function drawTrack() {
    const { points } = trackPath;
    const trackW = 14 * dpr;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = '#1a2332';
    ctx.lineWidth = trackW + 6 * dpr;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = trackW;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5 * dpr;
    ctx.setLineDash([8 * dpr, 12 * dpr]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    points.forEach((p, i) => {
      if (i % 30 === 0) {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    trackPath = buildTrackPath(rect.width, rect.height);
    trackLength = trackPath.length;
  }

  function setupTrains() {
    targetConfig = TrainFactory.generateConfig();
    const decoys = TrainFactory.generateDecoys(targetConfig, TRAIN_COUNT - 1);
    const allConfigs = [...decoys];
    targetIndex = Math.floor(Math.random() * TRAIN_COUNT);
    allConfigs.splice(targetIndex, 0, targetConfig);

    trains = allConfigs.map((config, i) => ({
      config,
      distance: (trackLength / TRAIN_COUNT) * i + Math.random() * 40,
      speed: 0.6 + Math.random() * 0.8,
      direction: Math.random() > 0.5 ? 1 : -1,
    }));
  }

  function showPhase(name) {
    Object.values(phases).forEach((el) => el.classList.remove('active'));
    phases[name].classList.add('active');
  }

  function renderTargetPreview() {
    targetContainer.innerHTML = '';
    const c = document.createElement('canvas');
    targetContainer.appendChild(c);
    TrainFactory.renderToCanvas(c, targetConfig, 2.2);
  }

  function startMemorizePhase() {
    gameState = 'memorize';
    showPhase('memorize');
    renderTargetPreview();
    feedback.textContent = '';
    feedback.className = 'feedback';

    countdownFill.style.transition = 'none';
    countdownFill.style.transform = 'scaleX(1)';
    requestAnimationFrame(() => {
      countdownFill.style.transition = `transform ${MEMORIZE_DURATION}ms linear`;
      countdownFill.style.transform = 'scaleX(0)';
    });

    setTimeout(startSearchPhase, MEMORIZE_DURATION);
  }

  function startSearchPhase() {
    gameState = 'search';
    showPhase('search');
    btnStart.classList.add('hidden');
    resizeCanvas();
    startAnimation();
  }

  function startAnimation() {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    function loop() {
      if (gameState !== 'search') return;

      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      drawTrack();

      trains.forEach((train) => {
        train.distance += train.speed * train.direction;
        if (train.distance < 0) train.distance += trackLength;
        if (train.distance > trackLength) train.distance -= trackLength;

        const pos = getPointAtDistance(trackPath, train.distance);
        ctx.save();
        ctx.scale(1 / dpr, 1 / dpr);
        TrainFactory.drawTrain(ctx, train.config, pos.x * dpr, pos.y * dpr, TRAIN_SCALE * dpr, pos.angle);
        ctx.restore();
      });

      animFrameId = requestAnimationFrame(loop);
    }

    loop();
  }

  function getTrainAtPoint(px, py) {
    const hitRadius = 30;
    let closest = null;
    let closestDist = Infinity;

    trains.forEach((train, index) => {
      const pos = getPointAtDistance(trackPath, train.distance);
      const dist = Math.hypot(px - pos.x, py - pos.y);
      if (dist < hitRadius && dist < closestDist) {
        closestDist = dist;
        closest = index;
      }
    });

    return closest;
  }

  function handleCanvasClick(clientX, clientY) {
    if (gameState !== 'search') return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const hit = getTrainAtPoint(x, y);

    if (hit === null) return;

    if (hit === targetIndex) {
      onWin();
    } else {
      feedback.textContent = 'Ce n\'est pas le bon train !';
      feedback.className = 'feedback error';
      setTimeout(() => {
        if (gameState === 'search') {
          feedback.textContent = '';
          feedback.className = 'feedback';
        }
      }, 800);
    }
  }

  function onWin() {
    gameState = 'win';
    if (animFrameId) cancelAnimationFrame(animFrameId);
    score++;
    scoreEl.textContent = score;
    showPhase('win');

    setTimeout(() => {
      setupTrains();
      startMemorizePhase();
    }, WIN_DISPLAY_DURATION);
  }

  function startGame() {
    score = 0;
    scoreEl.textContent = '0';
    setupTrains();
    btnStart.classList.add('hidden');
    startMemorizePhase();
  }

  btnStart.addEventListener('click', startGame);

  canvas.addEventListener('click', (e) => {
    handleCanvasClick(e.clientX, e.clientY);
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleCanvasClick(touch.clientX, touch.clientY);
  }, { passive: false });

  window.addEventListener('resize', () => {
    if (gameState === 'search') {
      resizeCanvas();
    }
  });

  btnStart.classList.remove('hidden');
})();
