/**
 * Parcours de rails sur la grille
 */
const Rails = (() => {
  const STATIONS = [
    { col: 20, row: 3, color: '#6366f1', label: 'Nord' },
    { col: 35, row: 10, color: '#f97316', label: 'NE' },
    { col: 37, row: 26, color: '#ef4444', label: 'Est' },
    { col: 32, row: 44, color: '#8b5cf6', label: 'SE' },
    { col: 20, row: 48, color: '#14b8a6', label: 'Sud' },
    { col: 8, row: 44, color: '#3b82f6', label: 'SO' },
    { col: 3, row: 26, color: '#64748b', label: 'Ouest' },
    { col: 8, row: 10, color: '#ec4899', label: 'NO' },
  ];

  const HOUSE_CLUSTERS = [
    { cells: [[14, 6], [15, 6], [14, 7], [15, 7]], color: '#6366f1' },
    { cells: [[26, 12], [27, 12], [26, 13]], color: '#f97316' },
    { cells: [[30, 22], [31, 22], [30, 23], [31, 23]], color: '#ef4444' },
    { cells: [[16, 36], [17, 36], [16, 37]], color: '#8b5cf6' },
    { cells: [[10, 30], [11, 30], [10, 31], [11, 31]], color: '#3b82f6' },
    { cells: [[24, 40], [25, 40], [24, 41]], color: '#14b8a6' },
  ];

  /** Parcours en coordonnées grille [col, row] */
  const ROUTES = [
    {
      id: 'outer',
      color: '#6366f1',
      width: 1.1,
      points: [
        [20, 3], [28, 3], [35, 10], [37, 18], [37, 26], [32, 44], [20, 48],
        [8, 44], [3, 34], [3, 26], [3, 18], [8, 10], [14, 3], [20, 3],
      ],
    },
    {
      id: 'cross-ns',
      color: '#ec4899',
      width: 1,
      points: [[20, 3], [20, 16], [20, 26], [20, 36], [20, 48]],
    },
    {
      id: 'cross-ew',
      color: '#14b8a6',
      width: 1,
      points: [[3, 26], [12, 26], [20, 26], [28, 26], [37, 26]],
    },
    {
      id: 'loop-ne',
      color: '#f97316',
      width: 0.9,
      points: [
        [35, 10], [28, 10], [28, 16], [32, 16], [32, 22],
        [28, 22], [28, 26], [32, 30], [37, 26], [37, 18], [35, 10],
      ],
    },
    {
      id: 'loop-sw',
      color: '#3b82f6',
      width: 0.9,
      points: [
        [8, 44], [12, 44], [12, 38], [8, 38], [8, 34],
        [12, 34], [12, 26], [8, 26], [3, 26], [3, 34], [8, 44],
      ],
    },
    {
      id: 'inner-ring',
      color: '#8b5cf6',
      width: 0.85,
      points: [
        [14, 16], [26, 16], [26, 22], [32, 22], [32, 30],
        [26, 30], [26, 36], [14, 36], [14, 30], [8, 30], [8, 22], [14, 22], [14, 16],
      ],
    },
    {
      id: 'service',
      color: '#64748b',
      width: 0.85,
      points: [
        [8, 10], [14, 10], [14, 16], [20, 16], [20, 22],
        [14, 22], [14, 30], [8, 30], [8, 34], [12, 38], [20, 36], [26, 36], [32, 44],
      ],
    },
  ];

  function gridPathToPixels(points) {
    const ortho = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = Grid.toPixel(points[i][0], points[i][1]);
      const b = Grid.toPixel(points[i + 1][0], points[i + 1][1]);
      if (ortho.length === 0) ortho.push(a);
      if (Math.abs(a.x - b.x) < 0.5 || Math.abs(a.y - b.y) < 0.5) {
        ortho.push(b);
      } else {
        ortho.push({ x: b.x, y: a.y });
        ortho.push(b);
      }
    }
    return ortho;
  }

  function buildRouteGeometry(route) {
    const pixels = gridPathToPixels(route.points);
    let length = 0;
    for (let i = 1; i < pixels.length; i++) {
      length += Math.hypot(pixels[i].x - pixels[i - 1].x, pixels[i].y - pixels[i - 1].y);
    }
    return { ...route, pixels, length };
  }

  function getAllRoutes() {
    return ROUTES.map(buildRouteGeometry);
  }

  function getPointAtDistance(route, dist) {
    const { pixels, length } = route;
    if (length === 0) return { x: 0, y: 0, angle: 0 };
    dist = ((dist % length) + length) % length;

    let acc = 0;
    for (let i = 1; i < pixels.length; i++) {
      const dx = pixels[i].x - pixels[i - 1].x;
      const dy = pixels[i].y - pixels[i - 1].y;
      const seg = Math.hypot(dx, dy);
      if (acc + seg >= dist) {
        const t = (dist - acc) / seg;
        return {
          x: pixels[i - 1].x + dx * t,
          y: pixels[i - 1].y + dy * t,
          angle: Math.atan2(dy, dx),
        };
      }
      acc += seg;
    }
    return { x: pixels[0].x, y: pixels[0].y, angle: 0 };
  }

  function strokePixels(ctx, pixels) {
    if (pixels.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pixels[0].x, pixels[0].y);
    for (let i = 1; i < pixels.length; i++) ctx.lineTo(pixels[i].x, pixels[i].y);
    ctx.stroke();
  }

  function drawRailSegment(ctx, pixels, width) {
    const mid = pixels[Math.floor(pixels.length / 2)];
    const isBridge = Grid.isOverWater(mid.x, mid.y);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = Grid.cellSize * 0.2;
    ctx.shadowOffsetX = Grid.cellSize * 0.06;
    ctx.shadowOffsetY = Grid.cellSize * 0.08;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = width + Grid.cellSize * 0.18;
    strokePixels(ctx, pixels);

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = width;
    strokePixels(ctx, pixels);

    if (isBridge) {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      const off = width * 0.38;
      for (let i = 1; i < pixels.length; i++) {
        const a = pixels[i - 1];
        const b = pixels[i];
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        const px = Math.sin(ang) * off;
        const py = -Math.cos(ang) * off;
        ctx.beginPath();
        ctx.moveTo(a.x + px, a.y + py);
        ctx.lineTo(b.x + px, b.y + py);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(a.x - px, a.y - py);
        ctx.lineTo(b.x - px, b.y - py);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function drawAll(ctx) {
    const drawn = new Set();
    const baseW = Grid.cellSize * 0.72;

    ROUTES.forEach((route) => {
      const pixels = gridPathToPixels(route.points);
      for (let i = 0; i < route.points.length - 1; i++) {
        const key = [route.points[i].join(','), route.points[i + 1].join(',')].sort().join('|');
        if (drawn.has(key)) continue;
        drawn.add(key);
        const segPixels = gridPathToPixels([route.points[i], route.points[i + 1]]);
        drawRailSegment(ctx, segPixels, baseW * (route.width || 1));
      }
    });

    HOUSE_CLUSTERS.forEach((cluster) => Grid.drawHouseCluster(ctx, cluster.cells, cluster.color));
    STATIONS.forEach((st) => Grid.drawStation(ctx, st.col, st.row, st.color, 1.5));
  }

  return {
    getAllRoutes,
    getPointAtDistance,
    drawAll,
    STATIONS,
    ROUTES,
  };
})();
