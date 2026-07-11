const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const codec = require("../src/map-codec.js");

function validMap(values = new Float32Array(16 * 16)) {
  return {
    type: codec.MAP_TYPE,
    version: codec.MAP_VERSION,
    world: { width: 16, height: 16 },
    configuration: {
      rule: {
        radius: 13,
        alpha: 4,
        mu: 0.15,
        sigma: 0.017,
        dt: 0.1,
        gain: 1,
        decay: 0,
        limitValue: true,
        deltaName: "gaus",
        coreName: "bump4",
        layer: 0,
        beta: [1, 0, 0, 0],
        eta: [0, 0, 0, 0],
      },
      advanced: { colors: ["#080618", "#231c49", "#f0efd6"] },
    },
    fields: [{
      channelId: "channel-0",
      encoding: "float32-base64",
      littleEndian: true,
      length: values.length,
      data: codec.encodeFloat32(values),
    }],
  };
}

test("round-trips a finite Float32 field", () => {
  const source = new Float32Array(256);
  source[17] = 0.75;
  const decoded = codec.decodeMap(validMap(source));
  assert.equal(decoded.width, 16);
  assert.equal(decoded.height, 16);
  assert.equal(decoded.fields[0].values[17], 0.75);
});

test("rejects unsupported versions", () => {
  const map = validMap();
  map.version += 1;
  assert.throws(() => codec.decodeMap(map), /Unsupported map version/);
});

test("rejects oversized worlds", () => {
  const map = validMap();
  map.world.width = codec.MAX_WORLD_SIZE + 1;
  assert.throws(() => codec.decodeMap(map), /world\.width/);
});

test("does not trust serialized allocation lengths", () => {
  const map = validMap();
  map.fields[0].length = 2 ** 32;
  assert.throws(() => codec.decodeMap(map), /length does not match/);
});

test("rejects truncated field payloads", () => {
  const map = validMap();
  map.fields[0].data = codec.encodeFloat32(new Float32Array(4));
  assert.throws(() => codec.decodeMap(map), /exactly 256 Float32 values/);
});

test("rejects non-finite field values", () => {
  const values = new Float32Array(256);
  values[0] = Number.NaN;
  assert.throws(() => codec.decodeMap(validMap(values)), /non-finite value/);
});

test("decodes the bundled sample map", () => {
  const asset = JSON.parse(fs.readFileSync(
    path.join(__dirname, "..", "assets", "maps", "leniency-scutium-solidus-2026-07-09_22-41-37Z.map"),
    "utf8",
  ));
  const decoded = codec.decodeMap(asset);
  assert.equal(decoded.fields.length, decoded.model.channels.length);
  assert.equal(decoded.expectedLength, decoded.width * decoded.height);
});
