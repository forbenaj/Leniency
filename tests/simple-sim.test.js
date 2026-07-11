const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const core = require("../src/lenia-core.js");
const catalog = require("../src/lifeform-catalog.js");
const { SimpleSimulation, chooseWorldSize } = require("../src/simple-sim.js");

test("chooses worlds that preserve large lifeforms without resampling", () => {
  assert.equal(chooseWorldSize({ width: 40, height: 30 }), 64);
  assert.equal(chooseWorldSize({ width: 230, height: 227 }), 256);
  assert.equal(chooseWorldSize({ width: 256, height: 22 }), 288);
});

test("keeps catalogue growth parameters outside the original UI ranges", () => {
  const simulation = new SimpleSimulation({ size: 64 });
  const rule = core.parseRule("R=13;k=bump4;d=gaus(0.808,0.367)*0.1");
  simulation.setRule(rule);
  assert.equal(simulation.rule.mu, 0.808);
  assert.equal(simulation.rule.sigma, 0.367);
  assert.equal(simulation.rule.dt, 0.1);
});

test("places decoded cells exactly at the center", () => {
  const cells = core.parseCellArray("0,0.25,1/0.5,0,0");
  const simulation = new SimpleSimulation({ size: 64 });
  simulation.placeCells(cells);
  const startX = Math.floor((simulation.size - cells.width) / 2);
  const startY = Math.floor((simulation.size - cells.height) / 2);
  assert.equal(simulation.field[startY * simulation.size + startX + 1], 0.25);
  assert.equal(simulation.field[startY * simulation.size + startX + 2], 1);
  assert.equal(simulation.field[(startY + 1) * simulation.size + startX], 0.5);
});

test("resizing recenters the field and resets derived history", () => {
  const simulation = new SimpleSimulation({ size: 64 });
  simulation.field[32 * 64 + 32] = 1;
  simulation.measure();
  simulation.simTime = 4.2;
  simulation.massTrace.push(0.1, 0.2);
  simulation.growth.fill(1);

  simulation.resize(96, true);

  assert.equal(simulation.field[48 * 96 + 48], 1);
  assert.equal(simulation.simTime, 0);
  assert.deepEqual(simulation.massTrace, []);
  assert.equal(simulation.metrics.mass, 1 / (96 * 96));
  assert.ok(simulation.growth.every((value) => value === 0));
});

test("normalizes kernels and advances finite simulation metrics", () => {
  const simulation = new SimpleSimulation({ size: 32, rule: { ...core.DEFAULT_RULE, radius: 4 } });
  const totalWeight = simulation.kernel.weights.reduce((total, weight) => total + weight, 0);
  assert.ok(Math.abs(totalWeight - 1) < 1e-5);
  simulation.field[simulation.indexOf(16, 16)] = 1;
  simulation.step();
  assert.ok(Number.isFinite(simulation.metrics.mass));
  assert.ok(Number.isFinite(simulation.metrics.growth));
  assert.ok(Number.isFinite(simulation.metrics.energy));
  assert.equal(simulation.simTime, simulation.rule.dt);
  assert.equal(simulation.massTrace.length, 1);
});

test("wraps kernels that are larger than the world without producing NaN", () => {
  const simulation = new SimpleSimulation({ size: 4, rule: { ...core.DEFAULT_RULE, radius: 6 } });
  simulation.field[0] = 1;
  simulation.step();
  assert.ok(simulation.field.every(Number.isFinite));
  assert.ok(Object.values(simulation.metrics).every(Number.isFinite));
});

test("all bundled lifeforms decode into exact, supported worlds", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve("../src/lenia-lifeforms.js"), "utf8"), context);
  const forms = catalog.buildLibraryForms([{ id: "legacy", title: "Bundled", entries: context.animalArr }]);
  assert.equal(forms.length, 330);
  for (const form of forms) {
    const cells = core.parseCellArray(form.cells);
    const size = chooseWorldSize(cells, 24, Math.max(64, form.ruleInfo.radius * 2 + 1));
    assert.ok(size >= cells.width, form.name);
    assert.ok(size >= cells.height, form.name);
  }
});
