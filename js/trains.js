/**
 * Trains animés le long des rails
 */
const Trains = (() => {
  const CAR_LENGTH_FACTOR = 0.55;

  function createFleet(routes) {
    return routes.map((route, i) => ({
      routeId: route.id,
      route,
      color: route.color,
      distance: route.length * (0.1 + (i * 0.11) % 0.8),
      speed: 0.35 + (i % 4) * 0.12,
      direction: i % 2 === 0 ? 1 : -1,
      cars: 2 + (i % 3),
    }));
  }

  function drawCar(ctx, x, y, angle, color, len) {
    const w = len;
    const h = len * 0.42;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = len * 0.15;
    ctx.shadowOffsetX = len * 0.06;
    ctx.shadowOffsetY = len * 0.08;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, h * 0.25);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-w * 0.28, -h * 0.22, w * 0.22, h * 0.44);

    ctx.restore();
  }

  function draw(ctx, fleet) {
    const carLen = Grid.cellSize * CAR_LENGTH_FACTOR;

    fleet.forEach((train) => {
      for (let c = 0; c < train.cars; c++) {
        const offset = c * carLen * 1.15 * train.direction;
        let dist = train.distance - offset;
        const { length } = train.route;
        dist = ((dist % length) + length) % length;

        const pos = Rails.getPointAtDistance(train.route, dist);
        const angle = train.direction === 1 ? pos.angle : pos.angle + Math.PI;
        drawCar(ctx, pos.x, pos.y, angle, train.color, carLen);
      }
    });
  }

  function update(fleet, dt) {
    fleet.forEach((train) => {
      train.distance += train.speed * train.direction * dt * 0.06;
      if (train.distance < 0) train.distance += train.route.length;
      if (train.distance > train.route.length) train.distance -= train.route.length;
    });
  }

  return { createFleet, draw, update };
})();
