/**
 * Train Grid — jeu HTML5 Canvas
 */
(() => {
  const canvas = document.getElementById('canvas');
  const scoreEl = document.getElementById('score');
  const ctx = canvas.getContext('2d');

  let dpr = 1;
  let fleet = [];
  let lastTime = 0;
  let score = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Grid.layout(rect.width, rect.height);
    fleet = Trains.createFleet(Rails.getAllRoutes());
  }

  function render(time) {
    const dt = lastTime ? time - lastTime : 16;
    lastTime = time;

    Trains.update(fleet, dt);
    score = Math.floor(time / 1000);
    scoreEl.textContent = String(score);

    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;

    Grid.drawBackground(ctx, w, h);
    Rails.drawAll(ctx);
    Trains.draw(ctx, fleet);

    requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(render);
})();
