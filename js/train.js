/**
 * Génération et rendu des trains style TGV
 */
const TrainFactory = (() => {
  const PALETTES = [
    { body: '#0055A4', stripe: '#EF4135', roof: '#FFFFFF', windows: '#1a1a2e' },
    { body: '#FFD700', stripe: '#003DA5', roof: '#F5F5F5', windows: '#222' },
    { body: '#E4002B', stripe: '#FFFFFF', roof: '#CCCCCC', windows: '#111' },
    { body: '#009639', stripe: '#FFD700', roof: '#EEEEEE', windows: '#1a1a1a' },
    { body: '#6B2D5B', stripe: '#F4A460', roof: '#DDD', windows: '#222' },
    { body: '#FF6600', stripe: '#003087', roof: '#FFF', windows: '#111' },
    { body: '#1B4332', stripe: '#D4A574', roof: '#E8E8E8', windows: '#0a0a0a' },
    { body: '#7209B7', stripe: '#F72585', roof: '#FFF', windows: '#111' },
    { body: '#023E8A', stripe: '#90E0EF', roof: '#CAF0F8', windows: '#001' },
    { body: '#BC4749', stripe: '#F2E8CF', roof: '#FFF', windows: '#222' },
  ];

  const CAR_COUNTS = [3, 4, 5];

  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generateConfig() {
    const palette = randomItem(PALETTES);
    const carCount = randomItem(CAR_COUNTS);
    const hasStripe = Math.random() > 0.3;
    const stripePosition = Math.random() > 0.5 ? 'middle' : 'bottom';
    const noseStyle = Math.random() > 0.5 ? 'pointed' : 'rounded';

    return {
      body: palette.body,
      stripe: palette.stripe,
      roof: palette.roof,
      windows: palette.windows,
      carCount,
      hasStripe,
      stripePosition,
      noseStyle,
    };
  }

  function configsEqual(a, b) {
    return (
      a.body === b.body &&
      a.stripe === b.stripe &&
      a.roof === b.roof &&
      a.windows === b.windows &&
      a.carCount === b.carCount &&
      a.hasStripe === b.hasStripe &&
      a.stripePosition === b.stripePosition &&
      a.noseStyle === b.noseStyle
    );
  }

  function generateDecoys(target, count) {
    const decoys = [];
    let attempts = 0;
    while (decoys.length < count && attempts < 200) {
      attempts++;
      const cfg = generateConfig();
      if (configsEqual(cfg, target)) continue;
      if (decoys.some((d) => configsEqual(d, cfg))) continue;
      decoys.push(cfg);
    }
    return decoys;
  }

  function getDimensions(scale) {
    return {
      carW: 28 * scale,
      carH: 14 * scale,
      locoW: 34 * scale,
      gap: 2 * scale,
    };
  }

  /** Segments du train de l'avant vers l'arrière (distances en px le long du rail) */
  function getSegmentLayout(config, scale) {
    const { carW, locoW, gap } = getDimensions(scale);
    const segments = [{ type: 'loco', length: locoW, centerFromFront: locoW / 2 }];

    for (let i = 0; i < config.carCount; i++) {
      const fromFront = locoW + gap + i * (carW + gap) + carW / 2;
      segments.push({
        type: 'car',
        length: carW,
        centerFromFront: fromFront,
        isLast: i === config.carCount - 1,
      });
    }

    return segments;
  }

  function getTrainLength(config, scale) {
    const { carW, locoW, gap } = getDimensions(scale);
    return locoW + gap + config.carCount * (carW + gap);
  }

  function drawTrain(ctx, config, x, y, scale, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const s = scale;
    const { carW, carH, locoW, gap } = getDimensions(s);
    const totalCars = config.carCount;
    const totalW = locoW + gap + totalCars * (carW + gap);

    ctx.translate(-totalW / 2, 0);

    drawLocomotive(ctx, config, 0, 0, locoW, carH, s);

    for (let i = 0; i < totalCars; i++) {
      const cx = locoW + gap + i * (carW + gap);
      drawCar(ctx, config, cx, 0, carW, carH, s, i === totalCars - 1);
    }

    ctx.restore();
  }

  /**
   * Dessine le train segment par segment le long d'un chemin courbe.
   * Chaque voiture/locomotive est orientée selon la tangente locale au rail.
   */
  function drawTrainOnPath(ctx, config, getPointAtDistance, path, distance, scale, direction) {
    const s = scale;
    const { carH } = getDimensions(s);
    const segments = getSegmentLayout(config, s);
    const total = path.length;
    const trainLength = getTrainLength(config, s);
    const frontDist = distance + (trainLength / 2) * direction;

    segments.forEach((seg) => {
      const centerDist = frontDist - seg.centerFromFront * direction;
      const wrapped = ((centerDist % total) + total) % total;
      const pos = getPointAtDistance(path, wrapped);
      const angle = direction === 1 ? pos.angle : pos.angle + Math.PI;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(angle);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
      ctx.shadowBlur = 2 * s;
      ctx.shadowOffsetX = 0.8 * s;
      ctx.shadowOffsetY = 0.8 * s;

      if (seg.type === 'loco') {
        drawLocomotive(ctx, config, -seg.length / 2, -carH / 2, seg.length, carH, s);
      } else {
        drawCar(ctx, config, -seg.length / 2, -carH / 2, seg.length, carH, s, seg.isLast);
      }

      ctx.restore();
    });
  }
  function getTrainHitPoints(config, getPointAtDistance, path, distance, scale, direction) {
    const segments = getSegmentLayout(config, scale);
    const total = path.length;
    const trainLength = getTrainLength(config, scale);
    const frontDist = distance + (trainLength / 2) * direction;

    return segments.map((seg) => {
      const centerDist = frontDist - seg.centerFromFront * direction;
      const wrapped = ((centerDist % total) + total) % total;
      const pos = getPointAtDistance(path, wrapped);
      return { x: pos.x, y: pos.y, radius: Math.max(seg.length, 14 * scale) * 0.65 };
    });
  }

  function drawLocomotive(ctx, config, x, y, w, h, s) {
    ctx.save();
    ctx.translate(x, y);

    const noseH = h;
    ctx.beginPath();
    if (config.noseStyle === 'pointed') {
      ctx.moveTo(0, noseH * 0.15);
      ctx.lineTo(w * 0.35, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, noseH);
      ctx.lineTo(w * 0.35, noseH);
      ctx.closePath();
    } else {
      ctx.moveTo(0, noseH * 0.2);
      ctx.quadraticCurveTo(w * 0.15, 0, w * 0.4, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, noseH);
      ctx.lineTo(w * 0.4, noseH);
      ctx.closePath();
    }
    ctx.fillStyle = config.body;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 0.8 * s;
    ctx.stroke();

    ctx.fillStyle = config.roof;
    ctx.fillRect(w * 0.35, 0, w * 0.6, h * 0.25);

    if (config.hasStripe) {
      const sy = config.stripePosition === 'middle' ? h * 0.45 : h * 0.72;
      ctx.fillStyle = config.stripe;
      ctx.fillRect(w * 0.3, sy, w * 0.65, h * 0.12);
    }

    ctx.fillStyle = config.windows;
    ctx.beginPath();
    ctx.ellipse(w * 0.12, h * 0.42, w * 0.08, h * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawCar(ctx, config, x, y, w, h, s, isLast) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = config.body;
    if (isLast) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.85, 0);
      ctx.lineTo(w, h * 0.3);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, w, h);
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 0.6 * s;
    ctx.strokeRect(0, 0, w, h);

    ctx.fillStyle = config.roof;
    ctx.fillRect(1, 0, w - 2, h * 0.22);

    if (config.hasStripe) {
      const sy = config.stripePosition === 'middle' ? h * 0.45 : h * 0.72;
      ctx.fillStyle = config.stripe;
      ctx.fillRect(0, sy, w, h * 0.12);
    }

    const winCount = 3;
    const winW = w * 0.18;
    const winH = h * 0.35;
    const winY = h * 0.3;
    const spacing = (w - winCount * winW) / (winCount + 1);
    ctx.fillStyle = config.windows;
    for (let i = 0; i < winCount; i++) {
      const wx = spacing + i * (winW + spacing);
      ctx.fillRect(wx, winY, winW, winH);
    }

    ctx.restore();
  }

  function renderToCanvas(canvas, config, scale) {
    const carW = 28 * scale;
    const locoW = 34 * scale;
    const gap = 2 * scale;
    const totalW = locoW + gap + config.carCount * (carW + gap) + 20;
    const totalH = 14 * scale + 20;

    canvas.width = totalW * (window.devicePixelRatio || 1);
    canvas.height = totalH * (window.devicePixelRatio || 1);
    canvas.style.width = totalW + 'px';
    canvas.style.height = totalH + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, totalW, totalH);
    drawTrain(ctx, config, totalW / 2, totalH / 2 + 2, scale, 0);
  }

  function getTrainBounds(config, scale) {
    const carW = 28 * scale;
    const locoW = 34 * scale;
    const gap = 2 * scale;
    const w = locoW + gap + config.carCount * (carW + gap);
    const h = 14 * scale;
    return { width: w, height: h };
  }

  return {
    generateConfig,
    generateDecoys,
    configsEqual,
    drawTrain,
    drawTrainOnPath,
    getTrainHitPoints,
    getTrainLength,
    renderToCanvas,
    getTrainBounds,
  };
})();
