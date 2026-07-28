/**
 * Réseau style Mini Motorways — grille, voies blanches, eau, hubs colorés
 */
const TrackFactory = (() => {
  const DENSITY = 5;
  const MARGIN = 10;
  const GRID_STEP = 18 / DENSITY;
  const ROAD_WIDTH = 13 / DENSITY;

  const STATION_COLORS = {
    st_n: '#6366f1', st_ne: '#ec4899', st_e: '#f59e0b', st_se: '#ef4444',
    st_s: '#8b5cf6', st_sw: '#14b8a6', st_w: '#3b82f6', st_nw: '#f97316',
  };

  const NODES = {
    st_n:  { x: 0.50, y: 0.06, type: 'station' },
    st_ne: { x: 0.82, y: 0.06, type: 'station' },
    st_e:  { x: 0.94, y: 0.50, type: 'station' },
    st_se: { x: 0.82, y: 0.94, type: 'station' },
    st_s:  { x: 0.50, y: 0.94, type: 'station' },
    st_sw: { x: 0.18, y: 0.94, type: 'station' },
    st_w:  { x: 0.06, y: 0.50, type: 'station' },
    st_nw: { x: 0.18, y: 0.06, type: 'station' },

    j_n:  { x: 0.50, y: 0.20, type: 'junction' },
    j_ne: { x: 0.82, y: 0.20, type: 'junction' },
    j_e:  { x: 0.82, y: 0.50, type: 'junction' },
    j_se: { x: 0.82, y: 0.80, type: 'junction' },
    j_s:  { x: 0.50, y: 0.80, type: 'junction' },
    j_sw: { x: 0.18, y: 0.80, type: 'junction' },
    j_w:  { x: 0.18, y: 0.50, type: 'junction' },
    j_nw: { x: 0.18, y: 0.20, type: 'junction' },

    hub:  { x: 0.50, y: 0.50, type: 'hub' },
    hub_n: { x: 0.50, y: 0.34, type: 'junction' },
    hub_s: { x: 0.50, y: 0.66, type: 'junction' },
    hub_e: { x: 0.66, y: 0.50, type: 'junction' },
    hub_w: { x: 0.34, y: 0.50, type: 'junction' },
  };

  const SEGMENTS = [
    ['st_n', 'j_n'], ['j_n', 'j_ne'], ['j_ne', 'st_ne'],
    ['st_ne', 'j_ne'], ['j_ne', 'j_e'], ['j_e', 'st_e'],
    ['st_e', 'j_e'], ['j_e', 'j_se'], ['j_se', 'st_se'],
    ['st_se', 'j_se'], ['j_se', 'j_s'], ['j_s', 'st_s'],
    ['st_s', 'j_s'], ['j_s', 'j_sw'], ['j_sw', 'st_sw'],
    ['st_sw', 'j_sw'], ['j_sw', 'j_w'], ['j_w', 'st_w'],
    ['st_w', 'j_w'], ['j_w', 'j_nw'], ['j_nw', 'st_nw'],
    ['st_nw', 'j_nw'], ['j_nw', 'j_n'], ['j_n', 'st_n'],

    ['j_n', 'hub_n'], ['hub_n', 'hub'], ['hub', 'hub_s'], ['hub_s', 'j_s'],
    ['hub', 'hub_e'], ['hub_e', 'j_e'], ['hub', 'hub_w'], ['hub_w', 'j_w'],

    ['j_ne', 'hub_n'], ['hub_n', 'hub_e'], ['j_se', 'hub_s'], ['hub_s', 'hub_e'],
    ['j_sw', 'hub_s'], ['hub_s', 'hub_w'], ['j_nw', 'hub_n'], ['hub_n', 'hub_w'],
    ['j_ne', 'hub_e'], ['j_se', 'hub_e'], ['j_sw', 'hub_w'], ['j_nw', 'hub_w'],
  ];

  const ROUTES = [
    { name: 'Grande boucle', nodes: [
      'st_n', 'j_n', 'j_ne', 'st_ne', 'j_e', 'st_e', 'j_se', 'st_se',
      'j_s', 'st_s', 'j_sw', 'st_sw', 'j_w', 'st_w', 'j_nw', 'st_nw', 'j_n', 'st_n',
    ]},
    { name: 'Boucle nord-est', nodes: [
      'st_ne', 'j_ne', 'hub_n', 'hub_e', 'j_e', 'st_e', 'j_e', 'j_se',
      'hub_e', 'hub_n', 'j_ne', 'st_ne',
    ]},
    { name: 'Boucle sud-ouest', nodes: [
      'st_sw', 'j_sw', 'hub_s', 'hub_w', 'j_w', 'st_w', 'j_w', 'j_nw',
      'hub_w', 'hub_s', 'j_sw', 'st_sw',
    ]},
    { name: 'Traversée est-ouest', nodes: [
      'st_w', 'j_w', 'hub_w', 'hub', 'hub_e', 'j_e', 'st_e', 'j_e',
      'hub_e', 'hub', 'hub_w', 'j_w', 'st_w',
    ]},
    { name: 'Traversée nord-sud', nodes: [
      'st_n', 'j_n', 'hub_n', 'hub', 'hub_s', 'j_s', 'st_s', 'j_s',
      'hub_s', 'hub', 'hub_n', 'j_n', 'st_n',
    ]},
    { name: 'Anneau intérieur', nodes: [
      'j_nw', 'hub_n', 'j_ne', 'hub_e', 'j_se', 'hub_s', 'j_sw', 'hub_w', 'j_nw',
    ]},
    { name: 'Ligne de service', nodes: [
      'st_nw', 'j_nw', 'j_n', 'hub_n', 'hub', 'hub_s', 'j_s', 'j_sw',
      'st_sw', 'j_sw', 'hub_s', 'hub_w', 'j_w', 'j_nw', 'st_nw',
    ]},
  ];

  const TERRAIN = [
    { cx: 0.22, cy: 0.32, rx: 0.07, ry: 0.06, color: '#fce7f3' },
    { cx: 0.38, cy: 0.42, rx: 0.05, ry: 0.04, color: '#fce7f3' },
    { cx: 0.74, cy: 0.58, rx: 0.08, ry: 0.06, color: '#fef9c3' },
    { cx: 0.62, cy: 0.28, rx: 0.06, ry: 0.05, color: '#fef9c3' },
    { cx: 0.48, cy: 0.68, rx: 0.05, ry: 0.04, color: '#fce7f3' },
    { cx: 0.15, cy: 0.65, rx: 0.06, ry: 0.05, color: '#fef9c3' },
  ];

  const WATER = [
    { cx: 0.35, cy: 0.52, rx: 0.09, ry: 0.045 },
    { cx: 0.52, cy: 0.58, rx: 0.06, ry: 0.035 },
    { cx: 0.68, cy: 0.34, rx: 0.10, ry: 0.035 },
    { cx: 0.58, cy: 0.74, rx: 0.07, ry: 0.04 },
    { cx: 0.25, cy: 0.48, rx: 0.06, ry: 0.03 },
  ];

  function scalePoint(nx, ny, w, h) {
    const innerW = w - MARGIN * 2;
    const innerH = h - MARGIN * 2;
    return { x: MARGIN + nx * innerW, y: MARGIN + ny * innerH };
  }

  function orthoCorner(a, b, preferHorizontalFirst) {
    if (Math.abs(a.x - b.x) < 1) return [a, b];
    if (Math.abs(a.y - b.y) < 1) return [a, b];
    if (preferHorizontalFirst) return [a, { x: b.x, y: a.y }, b];
    return [a, { x: a.x, y: b.y }, b];
  }

  function buildSegmentPoints(fromId, toId, w, h) {
    const a = scalePoint(NODES[fromId].x, NODES[fromId].y, w, h);
    const b = scalePoint(NODES[toId].x, NODES[toId].y, w, h);
    const dx = Math.abs(b.x - a.x);
    const dy = Math.abs(b.y - a.y);
    const preferH = dx >= dy;
    return orthoCorner(a, b, preferH);
  }

  function appendPoints(pathPoints, newPoints) {
    if (newPoints.length === 0) return;
    if (pathPoints.length === 0) {
      pathPoints.push(...newPoints);
      return;
    }
    const last = pathPoints[pathPoints.length - 1];
    const startIdx = Math.hypot(last.x - newPoints[0].x, last.y - newPoints[0].y) < 1 ? 1 : 0;
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
    for (let i = 0; i < route.nodes.length - 1; i++) {
      appendPoints(points, buildSegmentPoints(route.nodes[i], route.nodes[i + 1], w, h));
    }
    return { points, length: computeLength(points), closed: true, name: route.name };
  }

  function buildNetworkGeometry(w, h) {
    const stations = Object.entries(NODES)
      .filter(([, n]) => n.type === 'station')
      .map(([id, n]) => ({
        id, color: STATION_COLORS[id] || '#64748b', ...scalePoint(n.x, n.y, w, h),
      }));

    const junctions = Object.entries(NODES)
      .filter(([, n]) => n.type === 'junction' || n.type === 'hub')
      .map(([id, n]) => ({ id, ...scalePoint(n.x, n.y, w, h) }));

    const terrain = TERRAIN.map((t) => ({
      ...t,
      ...scalePoint(t.cx, t.cy, w, h),
      rx: t.rx * (w - MARGIN * 2),
      ry: t.ry * (h - MARGIN * 2),
    }));

    const water = WATER.map((t) => ({
      ...t,
      ...scalePoint(t.cx, t.cy, w, h),
      rx: t.rx * (w - MARGIN * 2),
      ry: t.ry * (h - MARGIN * 2),
    }));

    return { stations, junctions, terrain, water };
  }

  function generateTracks(count, width, height) {
    return {
      tracks: ROUTES.slice(0, count).map((route, i) => ({
        ...buildRoutePath(route, width, height),
        index: i,
      })),
      network: buildNetworkGeometry(width, height),
    };
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

  function isInWater(x, y, w, h) {
    const innerW = w - MARGIN * 2;
    const innerH = h - MARGIN * 2;
    return WATER.some((zone) => {
      const cx = MARGIN + zone.cx * innerW;
      const cy = MARGIN + zone.cy * innerH;
      const rx = zone.rx * innerW;
      const ry = zone.ry * innerH;
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      return nx * nx + ny * ny <= 1;
    });
  }

  function strokePath(ctx, points, close = false) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    if (close) ctx.closePath();
    ctx.stroke();
  }

  function drawGrid(ctx, w, h, dpr) {
    ctx.fillStyle = '#f4f4f5';
    ctx.fillRect(0, 0, w, h);

    const step = GRID_STEP * dpr;
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 0.8;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  function drawBlob(ctx, cx, cy, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWaterZones(ctx, network) {
    network.water.forEach((zone) => {
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.ellipse(zone.x, zone.y, zone.rx, zone.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawRoadSegment(ctx, pts, w, h, dpr, isBridge) {
    const width = ROAD_WIDTH * dpr;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
    ctx.shadowBlur = (5 / DENSITY) * dpr;
    ctx.shadowOffsetX = (2 / DENSITY) * dpr;
    ctx.shadowOffsetY = (3 / DENSITY) * dpr;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = width;
    strokePath(ctx, pts);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    if (isBridge) {
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 0.8 * dpr;
      const offset = (width / 2 - 0.8 * dpr);
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const px = Math.sin(angle);
        const py = -Math.cos(angle);
        ctx.beginPath();
        ctx.moveTo(a.x + px * offset, a.y + py * offset);
        ctx.lineTo(b.x + px * offset, b.y + py * offset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(a.x - px * offset, a.y - py * offset);
        ctx.lineTo(b.x - px * offset, b.y - py * offset);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function drawHub(ctx, x, y, dpr) {
    const size = (11 / DENSITY) * dpr;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = (4 / DENSITY) * dpr;
    ctx.shadowOffsetX = (2 / DENSITY) * dpr;
    ctx.shadowOffsetY = (2 / DENSITY) * dpr;
    ctx.fillStyle = '#fafafa';
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 0.8 * dpr;
    ctx.beginPath();
    ctx.roundRect(x - size, y - size, size * 2, size * 2, (4 / DENSITY) * dpr);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#a1a1aa';
    ctx.beginPath();
    ctx.arc(x, y, (3 / DENSITY) * dpr, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStation(ctx, st, dpr) {
    const size = (9 / DENSITY) * dpr;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = (5 / DENSITY) * dpr;
    ctx.shadowOffsetX = (2 / DENSITY) * dpr;
    ctx.shadowOffsetY = (3 / DENSITY) * dpr;
    ctx.fillStyle = st.color;
    ctx.beginPath();
    ctx.roundRect(st.x - size, st.y - size, size * 2, size * 2, (3 / DENSITY) * dpr);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.roundRect(st.x - size * 0.45, st.y - size * 0.45, size * 0.9, size * 0.9, (2 / DENSITY) * dpr);
    ctx.fill();
  }

  function drawNetwork(ctx, network, w, h, dpr) {
    drawGrid(ctx, w, h, dpr);

    network.terrain.forEach((t) => drawBlob(ctx, t.x, t.y, t.rx, t.ry, t.color));
    drawWaterZones(ctx, network);

    const drawn = new Set();
    SEGMENTS.forEach(([fromId, toId]) => {
      const key = [fromId, toId].sort().join('|');
      if (drawn.has(key)) return;
      drawn.add(key);

      const pts = buildSegmentPoints(fromId, toId, w, h);
      if (pts.length < 2) return;

      const mid = pts[Math.floor(pts.length / 2)];
      const bridge = isInWater(mid.x, mid.y, w, h);
      drawRoadSegment(ctx, pts, w, h, dpr, bridge);
    });

    network.junctions.forEach((j) => {
      if (j.id !== 'hub') {
        ctx.fillStyle = '#d4d4d8';
        ctx.beginPath();
        ctx.arc(j.x, j.y, (2.5 / DENSITY) * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const hub = network.junctions.find((j) => j.id === 'hub');
    if (hub) drawHub(ctx, hub.x, hub.y, dpr);

    network.stations.forEach((st) => drawStation(ctx, st, dpr));
  }

  function drawTrack() {}

  return {
    generateTracks,
    getPointAtDistance,
    drawTrack,
    drawNetwork,
  };
})();
