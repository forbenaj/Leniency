const assert = require("node:assert/strict");
const test = require("node:test");

const {
  colorRamp,
  growthCurve,
  kernelValue,
  parseCellArray,
  parseRule,
  splitLifeformPayload,
} = require("../src/lenia-core.js");

test("decodes CSV, zip, zip2, and RLE lifeform cells", () => {
  assert.deepEqual(parseCellArray("0,0.5,1/1,0,0").rows, [
    [0, 0.5, 1],
    [1, 0, 0],
  ]);
  assert.deepEqual(parseCellArray("(zip)01/10").rows, [
    [0, 1],
    [1, 0],
  ]);
  assert.deepEqual(parseCellArray("(zip2)01").rows, [
    [0, 0, 1, 1],
    [0, 0, 1, 1],
  ]);
  assert.deepEqual(parseCellArray("bo$2o!").rows, [
    [0, 1],
    [1, 1],
  ]);
});

test("parses rule aliases, layers, fractions, and unclamped growth", () => {
  const rule = parseRule("R=26;k=bimo4(1,1/2)(0,1/4);d=gaus(0.2,0.03)*0.05+");
  assert.equal(rule.radius, 26);
  assert.equal(rule.coreName, "quad4");
  assert.equal(rule.layer, 1);
  assert.deepEqual(rule.beta, [1, 0.5, 0, 0]);
  assert.deepEqual(rule.eta, [0, 0.25, 0, 0]);
  assert.equal(rule.dt, 0.05);
  assert.equal(rule.limitValue, false);
});

test("splits only the lifeform payload delimiter", () => {
  assert.deepEqual(splitLifeformPayload("R=13;k=bump4;cells=(zip)01"), {
    rule: "R=13;k=bump4",
    cells: "(zip)01",
  });
  assert.deepEqual(splitLifeformPayload("plain-cells"), { rule: "", cells: "plain-cells" });
});

test("shared simulation curves return finite bounded samples", () => {
  const rule = parseRule("R=13;k=bump4;d=gaus(0.15,0.017)*0.1");
  assert.equal(kernelValue(rule, 0), 0);
  assert.ok(kernelValue(rule, 0.5) > 0.99);
  assert.ok(growthCurve(rule, rule.mu) > 0.99);
  assert.ok(growthCurve(rule, 1) < 0);
  assert.deepEqual(colorRamp(0.5, ["#000000", "#ffffff"]), [128, 128, 128]);
});

test("rejects pathological compressed allocations", () => {
  const repeatToken = String.fromCharCode(0xffff);
  assert.throws(() => parseCellArray(`(zip)${repeatToken}${repeatToken}.1`), RangeError);
  assert.throws(() => parseCellArray("99999999o!"), RangeError);
});
