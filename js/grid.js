/**
 * Rendu de la grille style KAZ
 */
const GridRenderer = (() => {
  let cellSize = 40;
  let offsetX = 0;
  let offsetY = 0;

  function layout(cols, rows, width, height) {
    const pad = 16;
    cellSize = Math.floor(Math.min((width - pad * 2) / cols, (height - pad * 2) / rows));
    const mapW = cellSize * cols;
    const mapH = cellSize * rows;
    offsetX = Math.floor((width - mapW) / 2);
    offsetY = Math.floor((height - mapH) / 2);
  }

  function cellCenter(col, row) {
    return {
      x: offsetX + col * cellSize + cellSize / 2,
      y: offsetY + row * cellSize + cellSize / 2,
    };
  }

  function draw(ctx, cols, rows, width, height) {
    layout(cols, rows, width, height);

    ctx.fillStyle = '#0f0f16';
    ctx.fillRect(0, 0, width, height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const { x, y } = cellCenter(c, r);
        const pulse = 0.04 * Math.sin((c + r) * 0.8);

        ctx.fillStyle = `rgba(168, 85, 247, ${0.06 + pulse})`;
        ctx.beginPath();
        ctx.roundRect(
          x - cellSize * 0.42,
          y - cellSize * 0.42,
          cellSize * 0.84,
          cellSize * 0.84,
          cellSize * 0.14
        );
        ctx.fill();

        ctx.strokeStyle = 'rgba(113, 113, 122, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  function drawCard(ctx, col, row, color, isPlayer = false) {
    const { x, y } = cellCenter(col, row);
    const size = cellSize * (isPlayer ? 0.38 : 0.32);

    ctx.save();
    if (isPlayer) {
      ctx.shadowColor = color;
      ctx.shadowBlur = cellSize * 0.5;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - size, y - size, size * 2, size * 2, cellSize * 0.1);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x - size * 0.35, y - size * 0.35, size * 0.7, size * 0.7);

    if (isPlayer) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawEnemy(ctx, col, row, color) {
    drawCard(ctx, col, row, color, false);
  }

  return {
    draw,
    drawCard,
    drawEnemy,
    get cellSize() { return cellSize; },
  };
})();
