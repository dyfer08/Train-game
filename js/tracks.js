/**
 * Génération de circuits ferroviaires complexes — un circuit par train
 */
const TrackFactory = (() => {
  const TRACK_COLORS = [
    '#64748b', '#6b7280', '#78716c', '#71717a',
    '#6366f1', '#0d9488', '#b45309',
  ];

  /** Modèles de circuits (points normalisés, boucle fermée) */
  const TEMPLATES = [
    // 0 — Double boucle entrelacée
    [
      [0, -0.9], [0.55, -0.75], [0.95, -0.2], [0.7, 0.45],
      [0.2, 0.85], [-0.45, 0.7], [-0.85, 0.15], [-0.6, -0.5],
      [-0.15, -0.35], [0.35, -0.15], [0.15, 0.25], [-0.35, 0.35],
      [-0.1, 0.05], [0, -0.9],
    ],
    // 1 — Serpentin avec boucle centrale
    [
      [-0.95, 0.1], [-0.6, -0.85], [-0.1, -0.5], [0.35, -0.9],
      [0.75, -0.35], [0.95, 0.25], [0.55, 0.75], [0, 0.95],
      [-0.55, 0.65], [-0.85, 0.05], [-0.45, -0.15], [0.05, 0.15],
      [0.45, 0.05], [0.25, -0.35], [-0.25, -0.55], [-0.95, 0.1],
    ],
    // 2 — Gare avec voies de service
    [
      [-0.85, -0.35], [-0.35, -0.85], [0.45, -0.75], [0.9, -0.15],
      [0.75, 0.55], [0.15, 0.9], [-0.55, 0.75], [-0.9, 0.2],
      [-0.55, -0.05], [-0.15, 0.35], [0.35, 0.45], [0.55, 0.05],
      [0.25, -0.25], [-0.15, -0.45], [-0.55, -0.25], [-0.85, -0.35],
    ],
    // 3 — Trèfle à quatre boucles
    [
      [0, -0.95], [0.45, -0.55], [0.95, -0.45], [0.55, -0.05],
      [0.95, 0.45], [0.45, 0.55], [0, 0.95], [-0.45, 0.55],
      [-0.95, 0.45], [-0.55, 0.05], [-0.95, -0.45], [-0.45, -0.55],
      [0, -0.95],
    ],
    // 4 — Zigzag montagne
    [
      [-0.9, 0.75], [-0.5, 0.35], [-0.85, -0.05], [-0.35, -0.45],
      [-0.75, -0.85], [-0.05, -0.65], [0.45, -0.95], [0.85, -0.45],
      [0.35, -0.05], [0.8, 0.35], [0.4, 0.75], [0.85, 0.95],
      [0.05, 0.55], [-0.45, 0.95], [-0.9, 0.75],
    ],
    // 5 — Circuit ovale + épingle à cheveux
    [
      [0, -0.95], [0.65, -0.7], [0.95, 0], [0.6, 0.75],
      [0, 0.95], [-0.6, 0.75], [-0.95, 0], [-0.65, -0.7],
      [-0.25, -0.35], [0.25, -0.35], [0.45, 0], [0.2, 0.4],
      [-0.2, 0.4], [-0.45, 0], [-0.25, -0.35], [0, -0.95],
    ],
    // 6 — Rectangle arrondi avec diagonale
    [
      [-0.85, -0.65], [0, -0.95], [0.85, -0.65], [0.95, 0],
      [0.65, 0.85], [0, 0.95], [-0.65, 0.85], [-0.95, 0],
      [-0.65, -0.15], [0, 0.15], [0.65, -0.15], [0.35, -0.55],
      [-0.35, -0.55], [-0.85, -0.65],
    ],
  ];

  /** Emplacement de chaque circuit sur la carte */
  const LAYOUTS = [
    { cx: 0.24, cy: 0.24, scale: 0.19, template: 0, rotation: 0.05 },
    { cx: 0.76, cy: 0.22, scale: 0.18, template: 1, rotation: -0.15 },
    { cx: 0.50, cy: 0.40, scale: 0.21, template: 2, rotation: 0 },
    { cx: 0.20, cy: 0.58, scale: 0.17, template: 3, rotation: 0.25 },
    { cx: 0.80, cy: 0.56, scale: 0.18, template: 4, rotation: -0.1 },
    { cx: 0.34, cy: 0.82, scale: 0.16, template: 5, rotation: 0.1 },
    { cx: 0.70, cy: 0.84, scale: 0.17, template: 6, rotation: -0.2 },
  ];

  function catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return {
      x: 0.5 * (
        2 * p1.x + (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      ),
      y: 0.5 * (
        2 * p1.y + (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      ),
    };
  }

  function transformPoint(x, y, layout, w, h) {
    const cos = Math.cos(layout.rotation);
    const sin = Math.sin(layout.rotation);
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    const sx = layout.scale * Math.min(w, h);
    return {
      x: layout.cx * w + rx * sx,
      y: layout.cy * h + ry * sx,
    };
  }

  function buildPathFromTemplate(template, layout, w, h, segmentsPerSpan = 24) {
    const pts = template.map(([x, y]) => ({ x, y }));
    const n = pts.length - 1;
    const points = [];

    for (let i = 0; i < n; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(n, i + 2)];

      for (let j = 0; j < segmentsPerSpan; j++) {
        const t = j / segmentsPerSpan;
        const local = catmullRom(p0, p1, p2, p3, t);
        points.push(transformPoint(local.x, local.y, layout, w, h));
      }
    }

    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += Math.hypot(
        points[i].x - points[i - 1].x,
        points[i].y - points[i - 1].y
      );
    }

    return { points, length, closed: true };
  }

  function generateTracks(count, width, height) {
    return LAYOUTS.slice(0, count).map((layout, i) => ({
      ...buildPathFromTemplate(TEMPLATES[layout.template], layout, width, height),
      color: TRACK_COLORS[i % TRACK_COLORS.length],
      index: i,
    }));
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
        return {
          x: points[i - 1].x + dx * t,
          y: points[i - 1].y + dy * t,
          angle: Math.atan2(dy, dx),
        };
      }
      accumulated += segLen;
    }
    return { x: points[0].x, y: points[0].y, angle: 0 };
  }

  function drawTrack(ctx, path, dpr, options = {}) {
    const { points } = path;
    const trackW = (options.width || 9) * dpr;
    const railColor = path.color || '#475569';

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = '#141c2b';
    ctx.lineWidth = trackW + 4 * dpr;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = railColor;
    ctx.lineWidth = trackW;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(148,163,184,0.45)';
    ctx.lineWidth = 1 * dpr;
    ctx.setLineDash([5 * dpr, 8 * dpr]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    if (options.drawSleepers) {
      points.forEach((p, i) => {
        if (i % 18 === 0) {
          ctx.fillStyle = '#2d3748';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  }

  return {
    generateTracks,
    getPointAtDistance,
    drawTrack,
  };
})();
