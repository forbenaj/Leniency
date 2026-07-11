const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const workerSource = fs.readFileSync(path.join(__dirname, "..", "src", "range-sim-worker.js"), "utf8");

function createWorkerHarness() {
  const messages = [];
  const self = {
    postMessage(message) {
      messages.push(message);
    },
  };
  const context = vm.createContext({
    self,
    performance,
    Float32Array,
    Int16Array,
    Int32Array,
    Uint8Array,
    Uint8ClampedArray,
    Map,
    Set,
    Math,
    Number,
    String,
    Array,
    Boolean,
    Object,
    Error,
    TypeError,
    RangeError,
  });
  vm.runInContext(workerSource, context, { filename: "range-sim-worker.js" });
  return {
    messages,
    send(data) {
      self.onmessage({ data });
    },
    last(type) {
      return messages.findLast((message) => message.type === type);
    },
  };
}

function model(radius = 13, channelCount = 1) {
  const channels = Array.from({ length: channelCount }, (_, index) => ({
    id: `channel-${index}`,
    name: `Layer ${index + 1}`,
    palette: ["#000000", "#ffffff"],
    visible: true,
  }));
  return {
    wrapAround: true,
    selectedChannelId: "channel-0",
    channels,
    rules: channels.map((channel, index) => ({
      id: `rule-${index}`,
      sourceChannelId: channel.id,
      destinationChannelId: channel.id,
      radius,
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
      weight: 1,
      positiveOnly: false,
    })),
  };
}

function snapshotValues(harness, requestId, channelIndex = 0) {
  harness.send({ type: "snapshot", requestId, revision: 1 });
  const snapshot = harness.last("snapshot");
  return new Float32Array(snapshot.channels[channelIndex].values);
}

test("large-radius toroidal convolution stays finite", () => {
  const harness = createWorkerHarness();
  harness.send({ type: "init", width: 16, height: 16, model: model(36), revision: 1 });
  assert.deepEqual(harness.messages.slice(0, 2).map(({ type }) => type), ["ready", "frame"]);
  harness.send({
    type: "place",
    revision: 1,
    placement: {
      channelId: "channel-0",
      x: 8,
      y: 8,
      width: 1,
      height: 1,
      scale: 1,
      angle: 0,
      cells: new Float32Array([1]),
    },
  });
  harness.send({
    type: "step",
    revision: 1,
    count: 1,
    safeRect: { left: 0, top: 0, right: 16, bottom: 16 },
  });
  const values = snapshotValues(harness, 1);
  assert.equal(values.length, 256);
  assert.ok(values.every(Number.isFinite), "toroidal convolution must not create NaN/Infinity");
  assert.equal(harness.messages.some(({ type }) => type === "error"), false);
});

test("snapshot loading clears omitted channels", () => {
  const harness = createWorkerHarness();
  const nextModel = model(2, 2);
  harness.send({ type: "init", width: 16, height: 16, model: nextModel, revision: 1 });
  harness.send({
    type: "brush",
    revision: 1,
    channelId: "channel-1",
    x: 4,
    y: 4,
    radius: 0,
    power: 1,
    mode: "paint",
  });
  assert.ok(snapshotValues(harness, 2, 1).some((value) => value > 0));
  harness.send({
    type: "loadSnapshot",
    revision: 2,
    snapshot: {
      width: 16,
      height: 16,
      model: nextModel,
      channels: [{ id: "channel-0", values: new Float32Array(256) }],
    },
  });
  const omittedChannel = snapshotValues(harness, 3, 1);
  assert.ok(omittedChannel.every((value) => value === 0), "omitted snapshot channels must be cleared");
});

test("wrapped sparse fields simulate only nearby chunks", () => {
  const harness = createWorkerHarness();
  harness.send({ type: "init", width: 256, height: 256, model: model(2), revision: 1 });
  harness.send({
    type: "place",
    revision: 1,
    placement: {
      channelId: "channel-0",
      x: 128,
      y: 128,
      width: 1,
      height: 1,
      scale: 1,
      angle: 0,
      cells: new Float32Array([1]),
    },
  });
  harness.send({
    type: "step",
    revision: 1,
    count: 1,
    safeRect: { left: 0, top: 0, right: 256, bottom: 256 },
  });
  const frame = harness.last("frame");
  assert.ok(frame.profile.simChunks <= 9, `expected at most 9 nearby chunks, got ${frame.profile.simChunks}`);
});
