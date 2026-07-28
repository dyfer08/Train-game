/**
 * Réseau ferroviaire interconnecté — hub central, boucles et embranchements
 */
const TrackFactory = (() => {
  const MARGIN = 14;

  /** Nœuds du réseau (coords normalisées 0–1) */
  const NODES = {
    st_n:  { x: 0.50, y: 0.07, type: 'station' },
    st_ne: { x: 0.74, y: 0.13, type: 'station' },
    st_e:  { x: 0.93, y: 0.50, type: 'station' },
    st_se: { x: 0.74, y: 0.87, type: 'station' },
    st_s:  { x: 0.50, y: 0.93, type: 'station' },
    st_sw: { x: 0.26, y: 0.87, type: 'station' },
    st_w:  { x: 0.07, y: 0.50, type: 'station' },
    st_nw: { x: 0.26, y: 0.13, type: 'station' },

    j_n:  { x: 0.50, y: 0.21, type: 'junction' },
    j_ne: { x: 0.67, y: 0.21, type: 'junction' },
    j_e:  { x: 0.79, y: 0.50, type: 'junction' },
    j_se: { x: 0.67, y: 0.79, type: 'junction' },
    j_s:  { x: 0.50, y: 0.79, type: 'junction' },
    j_sw: { x: 0.33, y: 0.79, type: 'junction' },
    j_w:  { x: 0.21, y: 0.50, type: 'junction' },
    j_nw: { x: 0.33, y: 0.21, type: 'junction' },

    hub:  { x: 0.50, y: 0.50, type: 'hub' },
    hub_n: { x: 0.50, y: 0.35, type: 'junction' },
    hub_s: { x: 0.50, y: 0.65, type: 'junction' },
    hub_e: { x: 0.65, y: 0.50, type: 'junction' },
    hub_w: { x: 0.35, y: 0.50, type: 'junction' },
  };

  /**
   * Segments du réseau : [de, vers, courbure]
   * courbure = décalage perpendiculaire pour adoucir les virages
   */
  const SEGMENTS = [
    ['st_n', 'j_n', 0], ['j_n', 'j_ne', 0.02], ['j_ne', 'st_ne', 0.02],
    ['st_ne', 'j_ne', 0], ['j_ne', 'j_e', 0.03], ['j_e', 'st_e', 0],
    ['st_e', 'j_e', 0], ['j_e', 'j_se', 0.03], ['j_se', 'st_se', 0.02],
    ['st_se', 'j_se', 0], ['j_se', 'j_s', 0.02], ['j_s', 'st_s', 0],
    ['st_s', 'j_s', 0], ['j_s', 'j_sw', 0.02], ['j_sw', 'st_sw', 0.02],
    ['st_sw', 'j_sw', 0], ['j_sw', 'j_w', 0.03], ['j_w', 'st_w', 0],
    ['st_w', 'j_w', 0], ['j_w', 'j_nw', 0.03], ['j_nw', 'st_nw', 0.02],
    ['st_nw', 'j_nw', 0], ['j_nw', 'j_n', 0.02], ['j_n', 'st_n', 0],

    ['j_n', 'hub_n', 0], ['hub_n', 'hub', 0], ['hub', 'hub_s', 0],
    ['hub_s', 'j_s', 0], ['hub', 'hub_e', 0], ['hub_e', 'j_e', 0],
    ['hub', 'hub_w', 0], ['hub_w', 'j_w', 0],

    ['j_ne', 'hub_n', 0.015], ['hub_n', 'hub_e', 0.015],
    ['j_se', 'hub_s', 0.015], ['hub_s', 'hub_e', 0.015],
    ['j_sw', 'hub_s', 0.015], ['hub_s', 'hub_w', 0.015],
    ['j_nw', 'hub_n', 0.015], ['hub_n', 'hub_w', 0.015],

    ['j_ne', 'hub_e', 0.02], ['j_se', 'hub_e', 0.02],
    ['j_sw', 'hub_w', 0.02], ['j_nw', 'hub_w', 0.02],
  ];

  /** 7 itinéraires fermés — chaque train a le sien */
  const ROUTES = [
    {
      name: 'Grande boucle',
      nodes: [
        'st_n', 'j_n', 'j_ne', 'st_ne', 'j_e', 'st_e', 'j_se', 'st_se',
        'j_s', 'st_s', 'j_sw', 'st_sw', 'j_w', 'st_w', 'j_nw', 'st_nw', 'j_n', 'st_n',
      ],
    },
    {
      name: 'Boucle nord-est',
      nodes: [
        'st_ne', 'j_ne', 'hub_n', 'hub_e', 'j_e', 'st_e', 'j_e', 'j_se',
        'hub_e', 'hub_n', 'j_ne', 'st_ne',
      ],
    },
    {
      name: 'Boucle sud-ouest',
      nodes: [
        'st_sw', 'j_sw', 'hub_s', 'hub_w', 'j_w', 'st_w', 'j_w', 'j_nw',
        'hub_w', 'hub_s', 'j_sw', 'st_sw',
      ],
    },
    {
      name: 'Traversée est-ouest',
      nodes: [
        'st_w', 'j_w', 'hub_w', 'hub', 'hub_e', 'j_e', 'st_e', 'j_e',
        'hub_e', 'hub', 'hub_w', 'j_w', 'st_w',
      ],
    },
    {
      name: 'Traversée nord-sud',
      nodes: [
        'st_n', 'j_n', 'hub_n', 'hub', 'hub_s', 'j_s', 'st_s', 'j_s',
        'hub_s', 'hub', 'hub_n', 'j_n', 'st_n',
      ],
    },
    {
      name: 'Anneau intérieur',
      nodes: [
        'j_nw', 'hub_n', 'j_ne', 'hub_e', 'j_se', 'hub_s', 'j_sw', 'hub_w', 'j_nw',
      ],
    },
    {
      name: 'Ligne de service',
      nodes: [
        'st_nw', 'j_nw', 'j_n', 'hub_n', 'hub', 'hub_s', 'j_s', 'j_sw',
        'st_sw', 'j_sw', 'hub_s', 'hub_w', 'j_w', 'j_nw', 'st_nw',
      ],
    },
  ];

  function scalePoint(nx, ny, w, h) {
    const innerW = w - MARGIN * 2;
    const innerH = h - MARGIN * 2;
    return { x: MARGIN + nx * innerW, y: MARGIN + ny * innerH };
  }

  function sampleSegment(fromId, toId, bulge, steps = 22) {
    const a = NODES[fromId];
    const b = NODES[toId];
    if (!a || !b) return [];

    const points = [];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const cx = (a.x + b.x) / 2 + nx * bulge;
    const cy = (a.y + b.y) / 2 + ny * bulge;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      const px = u * u * a.x + 2 * u * t * cx + t * t * b.x;
      const py = u * u * a.y + 2 * u * t * cy + t * t * b.y;
      points.push(px, py);
    }
    return points;
  }

  function findSegment(fromId, toId) {
    return SEGMENTS.find(([f, t]) => f === fromId && t === toId)
      || SEGMENTS.find(([f, t]) => f === toId && t === fromId);
  }

  function buildSegmentPoints(fromId, toId, w, h) {
    const seg = findSegment(fromId, toId);
    if (!seg) return [];

    const [f, t, bulge = 0] = seg;
    const reversed = f !== fromId;
    const raw = sampleSegment(f, t, bulge * (reversed ? -1 : 1));
    const coords = [];
    for (let i = 0; i < raw.length; i += 2) {
      const p = scalePoint(raw[i], raw[i + 1], w, h);
      coords.push(p);
    }
    if (reversed) coords.reverse();
    return coords;
  }

  function appendPoints(pathPoints, newPoints) {
    if (newPoints.length === 0) return;
    if (pathPoints.length === 0) {
      pathPoints.push(...newPoints);
      return;
    }
    const last = pathPoints[pathPoints.length - 1];
    const startIdx = (Math.hypot(last.x - newPoints[0].x, last.y - newPoints[0].y) < 1) ? 1 : 0;
    for (let i = startIdx; i < newPoints.length; i++) pathPoints.push(newPoints[i]);
  }

  function computeLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    return length;
  }

  function buildRoutePath(route, w, h) {
    const points = [];
    const nodeIds = route.nodes;

    for (let i = 0; i < nodeIds.length - 1; i++) {
      appendPoints(points, buildSegmentPoints(nodeIds[i], nodeIds[i + 1], w, h));
    }

    return { points, length: computeLength(points), closed: true, name: route.name };
  }

  function buildNetworkGeometry(w, h) {
    const drawn = new Set();
    const allPoints = [];

    SEGMENTS.forEach(([fromId, toId, bulge]) => {
      const key = [fromId, toId].sort().join('|');
      if (drawn.has(key)) return;
      drawn.add(key);

      const raw = sampleSegment(fromId, toId, bulge);
      for (let i = 0; i < raw.length; i += 2) {
        allPoints.push(scalePoint(raw[i], raw[i + 1], w, h));
      }
    });

    const stations = Object.entries(NODES)
      .filter(([, n]) => n.type === 'station')
      .map(([id, n]) => ({ id, ...scalePoint(n.x, n.y, w, h) }));

    const junctions = Object.entries(NODES)
      .filter(([, n]) => n.type === 'junction' || n.type === 'hub')
      .map(([id, n]) => ({ id, ...scalePoint(n.x, n.y, w, h) }));

    return { allPoints, stations, junctions, segments: SEGMENTS };
  }

  function generateTracks(count, width, height) {
    const network = buildNetworkGeometry(width, height);
    const tracks = ROUTES.slice(0, count).map((route, i) => ({
      ...buildRoutePath(route, width, height),
      index: i,
      color: '#64748b',
    }));
    return { tracks, network };
  }

  function getPointAtDistance(path, dist) {
    const { points } = path;
    const total = path.length;
    if (total === 0) return { x: 0, y: 0, angle: 0 };
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

  function strokePolyline(ctx, points, close = false) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    if (close) ctx.closePath();
    ctx.stroke();
  }

  function drawTerrain(ctx, w, h, dpr) {
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#1a2e1a');
    grd.addColorStop(0.5, '#243424');
    grd.addColorStop(1, '#1a2818');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(34, 55, 38, 0.55)';
    [
      [0.15, 0.35, 28], [0.85, 0.25, 22], [0.12, 0.72, 24],
      [0.88, 0.78, 26], [0.45, 0.45, 18], [0.62, 0.62, 16],
    ].forEach(([nx, ny, r]) => {
      const x = MARGIN + nx * (w - MARGIN * 2);
      const y = MARGIN + ny * (h - MARGIN * 2);
      ctx.beginPath();
      ctx.arc(x, y, r * dpr, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawStation(ctx, x, y, dpr) {
    const s = 5 * dpr;
    ctx.fillStyle = '#3d2b1f';
    ctx.fillRect(x - s, y - s * 0.6, s * 2, s * 1.2);
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(x - s * 1.1, y - s * 0.6);
    ctx.lineTo(x, y - s * 1.5);
    ctx.lineTo(x + s * 1.1, y - s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
    ctx.fillRect(x - s * 0.35, y - s * 0.2, s * 0.7, s * 0.5);
  }

  function drawNetwork(ctx, network, w, h, dpr) {
    drawTerrain(ctx, w, h, dpr);

    const trackW = 10 * dpr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawn = new Set();
    SEGMENTS.forEach(([fromId, toId, bulge]) => {
      const key = [fromId, toId].sort().join('|');
      if (drawn.has(key)) return;
      drawn.add(key);

      const pts = buildSegmentPoints(fromId, toId, w, h);
      if (pts.length < 2) return;

      ctx.strokeStyle = '#0f1419';
      ctx.lineWidth = trackW + 5 * dpr;
      strokePolyline(ctx, pts);

      ctx.strokeStyle = '#5c4a32';
      ctx.lineWidth = trackW * 0.35;
      strokePolyline(ctx, pts);

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2 * dpr;
      strokePolyline(ctx, pts);

      for (let i = 0; i < pts.length; i += 6) {
        const p = pts[i];
        const p2 = pts[Math.min(i + 1, pts.length - 1)];
        const angle = Math.atan2(p2.y - p.y, p2.x - p.x) + Math.PI / 2;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(-4 * dpr, -1.2 * dpr, 8 * dpr, 2.4 * dpr);
        ctx.restore();
      }
    });

    network.junctions.forEach((j) => {
      if (j.id === 'hub') {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(j.x, j.y, 6 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
      } else {
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(j.x, j.y, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    network.stations.forEach((st) => drawStation(ctx, st.x, st.y, dpr));
  }

  function drawTrack(ctx, path, dpr, options = {}) {
    if (options.highlight) {
      const { points } = path;
      ctx.strokeStyle = options.highlight;
      ctx.lineWidth = 3 * dpr;
      ctx.globalAlpha = 0.35;
      strokePolyline(ctx, points, path.closed);
      ctx.globalAlpha = 1;
    }
  }

  return {
    generateTracks,
    getPointAtDistance,
    drawTrack,
    drawNetwork,
  };
})();
