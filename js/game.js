/**
 * Train Spotter — jeu de repérage de trains
 */
(() => {
  const MEMORIZE_DURATION = 3500;
  const WIN_DISPLAY_DURATION = 1200;
  const TRAIN_COUNT = 7;
  const TRAIN_SCALE = 0.82;

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
  let roundConfigs = [];
  let trains = [];
  let tracks = [];
  let animFrameId = null;
  let gameState = 'idle';
  let dpr = 1;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tracks = TrackFactory.generateTracks(TRAIN_COUNT, rect.width, rect.height);
  }

  function drawAllTracks() {
    tracks.forEach((track) => {
      TrackFactory.drawTrack(ctx, track, dpr, { width: 9, drawSleepers: true });
    });
  }

  /** Génère le train cible et les leurres pour la manche en cours */
  function setupRound() {
    targetConfig = TrainFactory.generateConfig();
    const decoys = TrainFactory.generateDecoys(targetConfig, TRAIN_COUNT - 1);
    roundConfigs = [...decoys];
    targetIndex = Math.floor(Math.random() * TRAIN_COUNT);
    roundConfigs.splice(targetIndex, 0, targetConfig);
  }

  /** Place les trains sur leurs circuits (configs déjà fixées) */
  function placeTrainsOnTracks() {
    if (tracks.length === 0) resizeCanvas();

    trains = roundConfigs.map((config, i) => {
      const track = tracks[i];
      return {
        config,
        trackIndex: i,
        distance: track.length * (0.15 + Math.random() * 0.7),
        speed: 0.5 + Math.random() * 0.7,
        direction: Math.random() > 0.5 ? 1 : -1,
      };
    });
  }

  function showPhase(name) {
    Object.values(phases).forEach((el) => el.classList.remove('active'));
    phases[name].classList.add('active');
  }

  function renderTargetPreview() {
    if (!targetConfig) return;
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
    placeTrainsOnTracks();
    startAnimation();
  }

  function startAnimation() {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    function loop() {
      if (gameState !== 'search') return;

      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      drawAllTracks();

      trains.forEach((train) => {
        const track = tracks[train.trackIndex];
        train.distance += train.speed * train.direction;
        if (train.distance < 0) train.distance += track.length;
        if (train.distance > track.length) train.distance -= track.length;

        TrainFactory.drawTrainOnPath(
          ctx,
          train.config,
          TrackFactory.getPointAtDistance,
          track,
          train.distance,
          TRAIN_SCALE,
          train.direction
        );
      });

      animFrameId = requestAnimationFrame(loop);
    }

    loop();
  }

  function getTrainAtPoint(px, py) {
    let closest = null;
    let closestDist = Infinity;

    trains.forEach((train, index) => {
      const track = tracks[train.trackIndex];
      const hitPoints = TrainFactory.getTrainHitPoints(
        train.config,
        TrackFactory.getPointAtDistance,
        track,
        train.distance,
        TRAIN_SCALE,
        train.direction
      );

      for (const pt of hitPoints) {
        const dist = Math.hypot(px - pt.x, py - pt.y);
        if (dist < pt.radius && dist < closestDist) {
          closestDist = dist;
          closest = index;
        }
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
      setupRound();
      startMemorizePhase();
    }, WIN_DISPLAY_DURATION);
  }

  function startGame() {
    score = 0;
    scoreEl.textContent = '0';
    btnStart.classList.add('hidden');
    setupRound();
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
      trains.forEach((train) => {
        train.distance = Math.min(train.distance, tracks[train.trackIndex].length * 0.95);
      });
    }
  });

  btnStart.classList.remove('hidden');
})();
