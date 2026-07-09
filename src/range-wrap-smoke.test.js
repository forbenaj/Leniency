const assert = require("node:assert/strict");

function modulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function brushAt(field, size, x, y, radius, power, wrapAround) {
  const left = Math.floor(x - radius);
  const right = Math.ceil(x + radius + 1);
  const top = Math.floor(y - radius);
  const bottom = Math.ceil(y + radius + 1);

  for (let yy = top; yy < bottom; yy += 1) {
    if (!wrapAround && (yy < 0 || yy >= size)) continue;
    for (let xx = left; xx < right; xx += 1) {
      if (!wrapAround && (xx < 0 || xx >= size)) continue;
      const distance = Math.hypot(xx - x, yy - y);
      if (distance > radius) continue;
      const falloff = radius <= 0 ? 1 : 1 - distance / radius;
      const wx = wrapAround ? modulo(xx, size) : xx;
      const wy = wrapAround ? modulo(yy, size) : yy;
      field[wy * size + wx] = Math.max(0, Math.min(1, field[wy * size + wx] + falloff * power));
    }
  }
}

function run() {
  const size = 64;
  const wrapField = new Float32Array(size * size);
  const boundedField = new Float32Array(size * size);
  const singleField = new Float32Array(size * size);

  brushAt(wrapField, size, 1, 1, 4, 1, true);
  brushAt(boundedField, size, 1, 1, 4, 1, false);
  brushAt(singleField, size, 8, 8, 0, 1, false);

  assert.ok(wrapField[1 * size + 1] > 0.99, "wrap brush paints the center");
  assert.ok(wrapField[1 * size + 63] > 0, "wrap brush reaches the opposite x edge");
  assert.ok(wrapField[63 * size + 1] > 0, "wrap brush reaches the opposite y edge");
  assert.equal(boundedField[1 * size + 63], 0, "bounded brush does not wrap across x");
  assert.equal(boundedField[63 * size + 1], 0, "bounded brush does not wrap across y");
  assert.equal(singleField[8 * size + 8], 1, "radius zero brush paints the center");
  assert.equal(singleField[8 * size + 9], 0, "radius zero brush does not paint neighbors");
}

run();
