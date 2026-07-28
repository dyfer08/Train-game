/**
 * Grille et décor style Mini Motorways
 */
const Grid = (() => {
  const COLS = 40;
  const ROWS = 52;

  const TERRAIN = [
    { cx: 9, cy: 14, rx: 7, ry: 6, color: '#fdcfe0' },
    { cx: 30, cy: 18, rx: 8, ry: 5, color: '#fdcfe0' },
    { cx: 22, cy: 38, rx: 9, ry: 7, color: '#fdcfe0' },
    { cx: 12, cy: 42, rx: 6, ry: 5, color: '#fef08a' },
    { cx: 33, cy: 40, rx: 7, ry: 6, color: '#fef08a' },
  ];

  const WATER = [
    { points: [[6, 22], [6, 26], [14, 26], [18, 30], [22, 30], [26, 34], [32, 34], [36, 38], [36, 42]] },
    { points: [[28, 8], [32, 8], [34, 12], [34, 16], [30, 18]] },
  ];

  let cellSize = 10;
  let offsetX = 0;
  let offsetY = 0;
  let mapW = 0;
  let mapH = 0;

  function layout(width, height) {
    const pad = 8;
    cellSize = Math.floor(Math.min((width - pad * 2) / COLS, (height - pad * 2) / ROWS));
    mapW = cellSize * COLS;
    mapH = cellSize * ROWS;
    offsetX = Math.floor((width - mapW) / 2);
    offsetY = Math.floor((height - mapH) / 2);
  }

  function toPixel(col, row) {
    return {
      x: offsetX + col * cellSize + cellSize / 2,
      y: offsetY + row * cellSize + cellSize / 2,
    };
  }

  function drawStripedBorder(ctx, width, height) {
    const stripe = 6;
    ctx.save();
    ctx.beginPath();
    ctx.rect(offsetX, offsetY, mapW, mapH);
    ctx.clip();

    for (let i = -height; i < width + height; i += stripe * 2) {
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.lineTo(i + height + stripe, height);
      ctx.lineTo(i + stripe, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX + 0.5, offsetY + 0.5, mapW - 1, mapH - 1);
  }

  function drawGrid(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(offsetX, offsetY, mapW, mapH);

    ctx.strokeStyle = '#ececec';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= COLS; c++) {
      const x = offsetX + c * cellSize + 0.5;
      ctx.moveTo(x, offsetY);
      ctx.lineTo(x, offsetY + mapH);
    }
    for (let r = 0; r <= ROWS; r++) {
      const y = offsetY + r * cellSize + 0.5;
      ctx.moveTo(offsetX, y);
      ctx.lineTo(offsetX + mapW, y);
    }
    ctx.stroke();
  }

  function drawTerrain(ctx) {
    TERRAIN.forEach((zone) => {
      const p = toPixel(zone.cx, zone.cy);
      ctx.fillStyle = zone.color;
      ctx.beginPath();
      ctx.ellipse(
        p.x, p.y,
        zone.rx * cellSize * 0.55,
        zone.ry * cellSize * 0.55,
        0, 0, Math.PI * 2
      );
      ctx.fill();
    });
  }

  function drawWaterPath(ctx, points, width) {
    if (points.length < 2) return;

    const pixels = points.map(([c, r]) => toPixel(c, r));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#98ded9';
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(pixels[0].x, pixels[0].y);
    for (let i = 1; i < pixels.length; i++) ctx.lineTo(pixels[i].x, pixels[i].y);
    ctx.stroke();
  }

  function drawWater(ctx) {
    drawWaterPath(ctx, WATER[0].points, cellSize * 2.2);
    drawWaterPath(ctx, WATER[1].points, cellSize * 1.8);
  }

  function isOverWater(x, y) {
    return WATER.some((river) => {
      const pixels = river.points.map(([c, r]) => toPixel(c, r));
      for (let i = 1; i < pixels.length; i++) {
        const dist = pointToSegmentDistance(x, y, pixels[i - 1], pixels[i]);
        if (dist < cellSize * 1.3) return true;
      }
      return false;
    });
  }

  function pointToSegmentDistance(px, py, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - a.x, py - a.y);
    let t = ((px - a.x) * dx + (py - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
  }

  function drawStation(ctx, col, row, color, sizeCells = 1.4) {
    const p = toPixel(col, row);
    const size = cellSize * sizeCells * 0.42;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = cellSize * 0.35;
    ctx.shadowOffsetX = cellSize * 0.12;
    ctx.shadowOffsetY = cellSize * 0.15;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(p.x - size, p.y - size, size * 2, size * 2, cellSize * 0.18);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.roundRect(p.x - size * 0.4, p.y - size * 0.4, size * 0.8, size * 0.8, cellSize * 0.1);
    ctx.fill();
  }

  function drawHouseCluster(ctx, cells, color) {
    cells.forEach(([c, r]) => {
      const p = toPixel(c, r);
      const s = cellSize * 0.28;
      ctx.fillStyle = color;
      ctx.fillRect(p.x - s, p.y - s, s * 2, s * 2);
    });
  }

  function drawBackground(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    drawStripedBorder(ctx, width, height);
    drawGrid(ctx);
    drawTerrain(ctx);
    drawWater(ctx);
  }

  return {
    COLS,
    ROWS,
    layout,
    toPixel,
    isOverWater,
    drawBackground,
    drawStation,
    drawHouseCluster,
    get cellSize() { return cellSize; },
    get offsetX() { return offsetX; },
    get offsetY() { return offsetY; },
  };
})();
