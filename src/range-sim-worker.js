const CHUNK_SIZE = 32;
const EPSILON = 0.00001;
const GROWTH_LUT_SIZE = 4096;
const MAX_CHANNELS = 3;
const MAX_RULES = 16;
const MAX_RULE_RADIUS = 64;
const MAX_WORLD_SIZE = 2048;
const DEFAULT_COLORS = ["#080618", "#231c49", "#3e3f77", "#8889bc", "#f0efd6"];
const DEFAULT_RULE = {
  id: "rule-0",
  sourceChannelId: "channel-0",
  destinationChannelId: "channel-0",
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
  weight: 1,
  positiveOnly: false,
};

let worldWidth = 768;
let worldHeight = 768;
let chunksX = 24;
let chunksY = 24;
let channels = [];
let channelMap = new Map();
let rules = [];
let wrapAround = true;
let selectedChannelId = "channel-0";
let metricScope = "selected";
let simTime = 0;
let metrics = emptyMetrics();
let lastGrowthByChannel = new Map();
let protocolRevision = 0;

self.onmessage = (event) => {
  const message = event.data || {};
  try {
    if (message.type !== "step" && Number.isSafeInteger(message.revision)) protocolRevision = message.revision;
    if (message.type === "init") {
      initWorld(message.width, message.height, message.model || legacyModel(message.config, message.colors));
    } else if (message.type === "model") {
      setModel(message.model);
    } else if (message.type === "resize") {
      resizeWorld(message.width, message.height);
    } else if (message.type === "clear") {
      clearWorld();
    } else if (message.type === "randomize") {
      randomizeWorld(message.rect, message.channelId);
    } else if (message.type === "place") {
      placeCells(message.placement);
    } else if (message.type === "brush") {
      brushAt(message);
    } else if (message.type === "sample") {
      sampleAt(message.x, message.y, message.channelId, message.scope, message.requestId);
    } else if (message.type === "snapshot") {
      postSnapshot(message.requestId);
    } else if (message.type === "loadSnapshot") {
      loadSnapshot(message.snapshot);
    } else if (message.type === "step") {
      stepMany(message.count, normalizeRect(message.safeRect), message.revision);
    } else {
      throw new TypeError(`Unknown worker message type "${String(message.type || "")}".`);
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      requestId: message.requestId,
      revision: Number.isSafeInteger(message.revision) ? message.revision : protocolRevision,
      message: String(error?.message || error),
    });
  }
};

function initWorld(width, height, model) {
  worldWidth = normalizeWorldDimension(width, "width");
  worldHeight = normalizeWorldDimension(height, "height");
  updateChunkGrid();
  setModel(model || legacyModel(), { post: false });
  clearWorld(false);
  self.postMessage({ type: "ready", revision: protocolRevision });
  postFrame({ reset: true });
}

function updateChunkGrid() {
  chunksX = Math.ceil(worldWidth / CHUNK_SIZE);
  chunksY = Math.ceil(worldHeight / CHUNK_SIZE);
}

function legacyModel(config = DEFAULT_RULE, colors = DEFAULT_COLORS) {
  const rule = normalizeRule({ ...DEFAULT_RULE, ...config });
  return {
    selectedChannelId: "channel-0",
    metricScope: "selected",
    wrapAround: config?.wrapAround !== false,
    channels: [
      {
        id: "channel-0",
        name: "Layer 1",
        palette: colors && colors.length ? colors : DEFAULT_COLORS,
        visible: true,
      },
    ],
    rules: [
      {
        ...rule,
        id: "rule-0",
        sourceChannelId: "channel-0",
        destinationChannelId: "channel-0",
      },
    ],
  };
}

function setModel(nextModel = {}, { post = true } = {}) {
  const normalized = normalizeModel(nextModel);
  const previous = channelMap;
  const nextChannels = [];
  const nextMap = new Map();

  for (const info of normalized.channels) {
    const existing = previous.get(info.id);
    const channel = existing || allocateChannel(info.id);
    channel.name = info.name;
    channel.visible = info.visible;
    channel.palette = info.palette;
    rebuildColorLut(channel);
    nextChannels.push(channel);
    nextMap.set(channel.id, channel);
  }

  channels = nextChannels;
  channelMap = nextMap;
  selectedChannelId = channelMap.has(normalized.selectedChannelId) ? normalized.selectedChannelId : channels[0]?.id || "channel-0";
  metricScope = normalized.metricScope;
  wrapAround = normalized.wrapAround;
  rules = normalized.rules.filter((rule) => channelMap.has(rule.sourceChannelId) && channelMap.has(rule.destinationChannelId));
  if (!rules.length && channels.length) {
    rules = [normalizeRule({ sourceChannelId: channels[0].id, destinationChannelId: channels[0].id })];
  }
  for (const rule of rules) {
    rebuildKernel(rule);
    rebuildGrowthLut(rule);
  }
  for (const channel of channels) {
    if (isDiscreteChannel(channel.id)) quantizeChannel(channel);
    rebuildChannelActivity(channel);
  }
  measureMetrics();
  if (post) postFrame({ reset: true, dirtyChunks: allChunks() });
}

function normalizeModel(model = {}) {
  const sourceChannels = Array.isArray(model.channels) && model.channels.length ? model.channels : legacyModel(model).channels;
  const normalizedChannels = sourceChannels.slice(0, MAX_CHANNELS).map((channel, index) => ({
    id: String(channel.id || `channel-${index}`),
    name: String(channel.name || `Layer ${index + 1}`),
    palette: normalizePalette(channel.palette || channel.colors || (index === 0 ? DEFAULT_COLORS : DEFAULT_COLORS)),
    visible: channel.visible !== false,
  }));
  const ids = new Set(normalizedChannels.map((channel) => channel.id));
  if (ids.size !== normalizedChannels.length) throw new TypeError("Channel ids must be unique.");
  const sourceRules = Array.isArray(model.rules) && model.rules.length ? model.rules : [model.rule || DEFAULT_RULE];
  if (sourceRules.length > MAX_RULES) throw new RangeError(`CPU backend supports up to ${MAX_RULES} rules.`);
  const normalizedRules = sourceRules.map((rule, index) => {
    const fallbackId = normalizedChannels[0]?.id || "channel-0";
    const sourceId = String(rule.sourceChannelId || rule.src || rule.source || fallbackId);
    const destinationId = String(rule.destinationChannelId || rule.dst || rule.destination || fallbackId);
    return normalizeRule({
      ...rule,
      id: rule.id || `rule-${index}`,
      sourceChannelId: ids.has(sourceId) ? sourceId : fallbackId,
      destinationChannelId: ids.has(destinationId) ? destinationId : fallbackId,
    });
  });
  return {
    channels: normalizedChannels,
    rules: normalizedRules,
    selectedChannelId: String(model.selectedChannelId || normalizedChannels[0]?.id || "channel-0"),
    metricScope: model.metricScope === "aggregate" ? "aggregate" : "selected",
    wrapAround: model.wrapAround !== false,
  };
}

function normalizeRule(rule = {}) {
  const radius = finiteNumber(rule.radius ?? 13, "Rule radius", 1, MAX_RULE_RADIUS);
  const alpha = finiteNumber(rule.alpha ?? 4, "Rule alpha", 0.01, 64);
  const mu = finiteNumber(rule.mu ?? 0.15, "Rule mu", -4, 4);
  const sigma = finiteNumber(rule.sigma ?? 0.017, "Rule sigma", Number.EPSILON, 4);
  const dt = finiteNumber(rule.dt ?? 0.1, "Rule time step", 0.000001, 4);
  const gain = finiteNumber(rule.gain ?? 1, "Rule gain", -16, 16);
  const decay = finiteNumber(rule.decay ?? 0, "Rule decay", 0, 4);
  const weight = finiteNumber(rule.weight ?? 1, "Rule weight", -16, 16);
  return {
    id: String(rule.id || "rule-0"),
    sourceChannelId: String(rule.sourceChannelId || rule.source || "channel-0"),
    destinationChannelId: String(rule.destinationChannelId || rule.destination || "channel-0"),
    radius,
    alpha,
    mu,
    sigma,
    dt,
    gain,
    decay,
    limitValue: rule.limitValue !== false,
    deltaName: rule.deltaName || "gaus",
    coreName: rule.coreName || "bump4",
    layer: Number(rule.layer || 0),
    beta: [...(rule.beta || [1, 0, 0, 0])],
    eta: [...(rule.eta || [0, 0, 0, 0])],
    weight,
    positiveOnly: Boolean(rule.positiveOnly),
    kernelOx: new Int16Array(0),
    kernelOy: new Int16Array(0),
    kernelOffset: new Int32Array(0),
    kernelWeight: new Float32Array(0),
    growthLut: new Float32Array(GROWTH_LUT_SIZE),
  };
}

function normalizePalette(colors) {
  const palette = colors && colors.length ? colors : DEFAULT_COLORS;
  return palette.slice(0, 8).map((color) => String(color || DEFAULT_COLORS[0]));
}

function allocateChannel(id) {
  return {
    id,
    name: id,
    visible: true,
    palette: [...DEFAULT_COLORS],
    colorLut: new Uint8Array(256 * 3),
    field: new Float32Array(worldWidth * worldHeight),
    next: new Float32Array(worldWidth * worldHeight),
    activeChunks: new Set(),
    fieldTouchedChunks: new Set(),
  };
}

function resizeChannel(channel, oldWidth, oldHeight, oldField) {
  channel.field = new Float32Array(worldWidth * worldHeight);
  channel.next = new Float32Array(worldWidth * worldHeight);
  channel.activeChunks = new Set();
  channel.fieldTouchedChunks = new Set();

  const copyWidth = Math.min(oldWidth, worldWidth);
  const copyHeight = Math.min(oldHeight, worldHeight);
  const oldX = Math.floor((oldWidth - copyWidth) / 2);
  const oldY = Math.floor((oldHeight - copyHeight) / 2);
  const newX = Math.floor((worldWidth - copyWidth) / 2);
  const newY = Math.floor((worldHeight - copyHeight) / 2);

  for (let y = 0; y < copyHeight; y += 1) {
    const oldRow = (oldY + y) * oldWidth + oldX;
    const newRow = (newY + y) * worldWidth + newX;
    for (let x = 0; x < copyWidth; x += 1) {
      const value = oldField[oldRow + x];
      channel.field[newRow + x] = value;
    }
  }
  rebuildChannelActivity(channel);
  channel.fieldTouchedChunks = new Set(channel.activeChunks);
}

function resizeWorld(width, height) {
  const oldWidth = worldWidth;
  const oldHeight = worldHeight;
  const oldFields = new Map(channels.map((channel) => [channel.id, channel.field]));
  worldWidth = normalizeWorldDimension(width, "width");
  worldHeight = normalizeWorldDimension(height, "height");
  updateChunkGrid();
  for (const channel of channels) resizeChannel(channel, oldWidth, oldHeight, oldFields.get(channel.id));
  for (const rule of rules) rebuildKernel(rule);
  measureMetrics();
  postFrame({ reset: true, dirtyChunks: allChunks() });
}

function clearWorld(shouldPost = true) {
  for (const channel of channels) {
    channel.field.fill(0);
    channel.next.fill(0);
    channel.activeChunks.clear();
    channel.fieldTouchedChunks.clear();
  }
  simTime = 0;
  metrics = emptyMetrics();
  lastGrowthByChannel = new Map();
  if (shouldPost) postFrame({ reset: true });
}

function clearChannel(channel, shouldTouch = true) {
  channel.field.fill(0);
  channel.next.fill(0);
  channel.activeChunks.clear();
  if (shouldTouch) channel.fieldTouchedChunks = allChunks();
}

function randomizeWorld(rect, channelId = selectedChannelId) {
  const channel = channelMap.get(channelId) || channelMap.get(selectedChannelId) || channels[0];
  if (!channel) return;
  clearChannel(channel, false);
  const safeRect = normalizeRect(rect);
  const dirtyChunks = chunksForRect(safeRect);
  const discrete = isDiscreteChannel(channel.id);

  for (let y = safeRect.top; y < safeRect.bottom; y += 1) {
    const row = y * worldWidth;
    for (let x = safeRect.left; x < safeRect.right; x += 1) {
      if (Math.random() > 0.86) {
        const value = discrete ? 1 : Math.random();
        channel.field[row + x] = value;
      }
    }
  }

  rebuildChannelActivity(channel);
  channel.fieldTouchedChunks = unionSets(dirtyChunks, channel.activeChunks);
  measureMetrics();
  postFrame({ reset: true, dirtyChunks: unionSets(dirtyChunks, channel.activeChunks) });
}

function placeCells(placement) {
  if (!placement || !placement.cells) return;
  const channel = channelMap.get(placement.channelId) || channelMap.get(selectedChannelId) || channels[0];
  if (!channel) return;
  const cells = placement.cells;
  const discrete = isDiscreteChannel(channel.id);
  const width = placement.width;
  const height = placement.height;
  const halfW = width / 2;
  const halfH = height / 2;
  const scale = placement.scale || 1;
  const angle = placement.angle || 0;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const reach = Math.ceil(Math.hypot(width * scale, height * scale) / 2) + 2;
  const left = Math.floor(placement.x - reach);
  const right = Math.ceil(placement.x + reach);
  const top = Math.floor(placement.y - reach);
  const bottom = Math.ceil(placement.y + reach);
  const dirtyChunks = wrapAround
    ? new Set()
    : chunksForRect({
        left: Math.max(0, left),
        top: Math.max(0, top),
        right: Math.min(worldWidth, right),
        bottom: Math.min(worldHeight, bottom),
      });

  for (let y = top; y < bottom; y += 1) {
    if (!wrapAround && (y < 0 || y >= worldHeight)) continue;
    for (let x = left; x < right; x += 1) {
      if (!wrapAround && (x < 0 || x >= worldWidth)) continue;
      const dx = x + 0.5 - placement.x;
      const dy = y + 0.5 - placement.y;
      const sx = Math.floor((cos * dx + sin * dy) / scale + halfW);
      const sy = Math.floor((-sin * dx + cos * dy) / scale + halfH);
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
      const sourceValue = cells[sy * width + sx] || 0;
      const value = discrete ? (sourceValue >= 0.5 ? 1 : 0) : sourceValue;
      if (value <= 0) continue;
      const wx = wrapAround ? modulo(x, worldWidth) : x;
      const wy = wrapAround ? modulo(y, worldHeight) : y;
      const index = wy * worldWidth + wx;
      channel.field[index] = discrete ? 1 : Math.max(channel.field[index], value);
      if (wrapAround) dirtyChunks.add(chunkIdForCell(wx, wy));
    }
  }

  rebuildChunkActivity(channel, dirtyChunks);
  channel.fieldTouchedChunks = unionSets(channel.fieldTouchedChunks, dirtyChunks);
  measureMetrics();
  postFrame({ dirtyChunks });
}

function brushAt(message) {
  const channel = channelMap.get(message.channelId) || channelMap.get(selectedChannelId) || channels[0];
  if (!channel) return;
  const x = message.x;
  const y = message.y;
  const radius = Math.max(0, message.radius ?? 0);
  const power = Math.max(0, message.power || 0);
  const mode = message.mode;
  const discrete = isDiscreteChannel(channel.id);
  const left = Math.floor(x - radius);
  const right = Math.ceil(x + radius + 1);
  const top = Math.floor(y - radius);
  const bottom = Math.ceil(y + radius + 1);
  const dirtyChunks = wrapAround
    ? new Set()
    : chunksForRect({
        left: Math.max(0, left),
        top: Math.max(0, top),
        right: Math.min(worldWidth, right),
        bottom: Math.min(worldHeight, bottom),
      });

  for (let yy = top; yy < bottom; yy += 1) {
    if (!wrapAround && (yy < 0 || yy >= worldHeight)) continue;
    for (let xx = left; xx < right; xx += 1) {
      if (!wrapAround && (xx < 0 || xx >= worldWidth)) continue;
      const distance = Math.hypot(xx - x, yy - y);
      if (distance > radius) continue;
      const falloff = radius <= 0 ? 1 : 1 - distance / radius;
      const wx = wrapAround ? modulo(xx, worldWidth) : xx;
      const wy = wrapAround ? modulo(yy, worldHeight) : yy;
      const index = wy * worldWidth + wx;
      if (discrete && mode === "paint") {
        channel.field[index] = 1;
      } else if (discrete && mode === "erase") {
        channel.field[index] = 0;
      } else if (mode === "paint") {
        channel.field[index] = clamp(channel.field[index] + falloff * power);
      } else if (mode === "erase") {
        channel.field[index] = clamp(channel.field[index] * (1 - falloff * power));
      }
      if (wrapAround) dirtyChunks.add(chunkIdForCell(wx, wy));
    }
  }

  rebuildChunkActivity(channel, dirtyChunks);
  channel.fieldTouchedChunks = unionSets(channel.fieldTouchedChunks, dirtyChunks);
  measureMetrics();
  postFrame({ dirtyChunks });
}

function sampleAt(x, y, channelId, scope, requestId) {
  let value = 0;
  if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight) {
    const index = y * worldWidth + x;
    if (scope === "aggregate") {
      for (const channel of channels) {
        if (channel.visible !== false) value += channel.field[index] || 0;
      }
      value = clamp(value);
    } else {
      const channel = channelMap.get(channelId) || channelMap.get(selectedChannelId) || channels[0];
      value = channel?.field[index] || 0;
    }
  }
  self.postMessage({ type: "sample", requestId, revision: protocolRevision, value });
}

function postSnapshot(requestId) {
  const snapshotChannels = [];
  const transfers = [];
  for (const channel of channels) {
    const values = new Float32Array(channel.field);
    snapshotChannels.push({
      id: channel.id,
      name: channel.name,
      visible: channel.visible,
      palette: [...channel.palette],
      width: worldWidth,
      height: worldHeight,
      values: values.buffer,
    });
    transfers.push(values.buffer);
  }
  self.postMessage(
    {
      type: "snapshot",
      requestId,
      revision: protocolRevision,
      width: worldWidth,
      height: worldHeight,
      channels: snapshotChannels,
      values: snapshotChannels[0]?.values || new ArrayBuffer(0),
      simTime,
      metrics,
    },
    transfers,
  );
}

function loadSnapshot(snapshot = {}) {
  if (snapshot.width && snapshot.height && (snapshot.width !== worldWidth || snapshot.height !== worldHeight)) {
    worldWidth = normalizeWorldDimension(snapshot.width, "snapshot.width");
    worldHeight = normalizeWorldDimension(snapshot.height, "snapshot.height");
    updateChunkGrid();
    channels = [];
    channelMap = new Map();
  }
  if (snapshot.model) setModel(snapshot.model, { post: false });
  else if (!channels.length) setModel(legacyModel(), { post: false });
  for (const channel of channels) clearChannel(channel, false);
  const incoming = Array.isArray(snapshot.channels)
    ? snapshot.channels
    : [{ id: channels[0]?.id || "channel-0", values: snapshot.values }];
  for (const item of incoming) {
    const channel = channelMap.get(item.id) || channels[0];
    if (!channel || !item.values) continue;
    const values = item.values instanceof Float32Array ? item.values : new Float32Array(item.values);
    if (values.length !== worldWidth * worldHeight) continue;
    channel.field.set(values);
    channel.next.set(values);
    rebuildChannelActivity(channel);
    channel.fieldTouchedChunks = new Set(channel.activeChunks);
  }
  simTime = Number(snapshot.simTime || 0);
  measureMetrics();
  postFrame({ reset: true, dirtyChunks: allChunks() });
}

function stepMany(count, safeRect, requestedRevision = protocolRevision) {
  const stepStart = performance.now();
  let dirtyChunks = new Set();
  let simChunksTotal = 0;
  const stepCount = Math.max(1, Math.min(8, count || 1));

  for (let i = 0; i < stepCount; i += 1) {
    const result = stepOnce(safeRect);
    dirtyChunks = unionSets(dirtyChunks, result.dirtyChunks);
    simChunksTotal += result.simChunks;
  }

  measureMetrics();
  const stepMs = performance.now() - stepStart;
  postFrame({
    dirtyChunks,
    stepped: true,
    profile: {
      stepSimulationMs: stepMs,
      steps: stepCount,
      activeChunks: totalActiveChunks(),
      simChunks: Math.round(simChunksTotal / stepCount),
    },
    revision: Number.isSafeInteger(requestedRevision) ? requestedRevision : protocolRevision,
  });
}

function stepOnce(safeRect) {
  const activeBefore = new Map(channels.map((channel) => [channel.id, new Set(channel.activeChunks)]));
  const touchedBefore = new Map(channels.map((channel) => [channel.id, new Set(channel.fieldTouchedChunks)]));
  let dirtyChunks = new Set();
  let simChunks = new Set();
  const growthTotals = new Map();
  const initializedDestinations = new Set();
  const destinationChunks = new Map();
  const destinationRules = new Map();

  for (const rule of rules) {
    const source = channelMap.get(rule.sourceChannelId);
    const dest = channelMap.get(rule.destinationChannelId);
    if (!source || !dest) continue;
    const ruleChunks = buildSimulationChunks(activeBefore.get(source.id) || new Set(), safeRect, rule);
    if (!ruleChunks.size) continue;
    simChunks = unionSets(simChunks, ruleChunks);
    if (!initializedDestinations.has(dest.id)) {
      dest.next.set(dest.field);
      initializedDestinations.add(dest.id);
    }
    destinationChunks.set(dest.id, unionSets(destinationChunks.get(dest.id) || new Set(), ruleChunks));
    const ruleList = destinationRules.get(dest.id) || [];
    ruleList.push(rule);
    destinationRules.set(dest.id, ruleList);
    applyRuleContribution(rule, source, dest, ruleChunks, safeRect, growthTotals);
  }

  for (const channelId of initializedDestinations) {
    const dest = channelMap.get(channelId);
    if (!dest) continue;
    const changedChunks = destinationChunks.get(channelId) || new Set();
    const touchedChunks = touchedBefore.get(channelId) || new Set();
    const finalChunks = unionSets(changedChunks, touchedChunks);
    dirtyChunks = unionSets(dirtyChunks, finalChunks);
    finalizeDestination(dest, finalChunks, destinationRules.get(channelId) || [], safeRect);
    [dest.field, dest.next] = [dest.next, dest.field];
    dest.fieldTouchedChunks = new Set(changedChunks);
    rebuildChunkActivity(dest, finalChunks);
  }

  for (const channel of channels) {
    if (initializedDestinations.has(channel.id)) continue;
    const touchedChunks = touchedBefore.get(channel.id) || new Set();
    if (!touchedChunks.size) continue;
    dirtyChunks = unionSets(dirtyChunks, touchedChunks);
    channel.fieldTouchedChunks.clear();
    rebuildChunkActivity(channel, touchedChunks);
  }

  lastGrowthByChannel = new Map();
  for (const [channelId, total] of growthTotals) {
    lastGrowthByChannel.set(channelId, total / (worldWidth * worldHeight));
  }
  simTime += maxRuleDt();
  return { dirtyChunks, simChunks: simChunks.size };
}

function applyRuleContribution(rule, source, dest, simChunks, safeRect, growthTotals) {
  let growthTotal = growthTotals.get(dest.id) || 0;
  const weight = Number.isFinite(rule.weight) ? rule.weight : 1;
  const needsFullModulo = rule.radius >= worldWidth || rule.radius >= worldHeight;
  for (const chunkId of simChunks) {
    const bounds = intersectRects(chunkBounds(chunkId), safeRect);
    if (!bounds) continue;
    for (let y = bounds.top; y < bounds.bottom; y += 1) {
      const row = y * worldWidth;
      for (let x = bounds.left; x < bounds.right; x += 1) {
        const index = row + x;
        let neighborhood = 0;
        if (wrapAround) {
          for (let k = 0; k < rule.kernelWeight.length; k += 1) {
            let sx = x + rule.kernelOx[k];
            let sy = y + rule.kernelOy[k];
            if (needsFullModulo) {
              sx = modulo(sx, worldWidth);
              sy = modulo(sy, worldHeight);
            } else {
              if (sx < 0) sx += worldWidth;
              else if (sx >= worldWidth) sx -= worldWidth;
              if (sy < 0) sy += worldHeight;
              else if (sy >= worldHeight) sy -= worldHeight;
            }
            neighborhood += source.field[sy * worldWidth + sx] * rule.kernelWeight[k];
          }
        } else {
          for (let k = 0; k < rule.kernelWeight.length; k += 1) {
            const sx = x + rule.kernelOx[k];
            const sy = y + rule.kernelOy[k];
            if (sx < 0 || sx >= worldWidth || sy < 0 || sy >= worldHeight) continue;
            neighborhood += source.field[index + rule.kernelOffset[k]] * rule.kernelWeight[k];
          }
        }

        const current = dest.field[index];
        const rawGrowth = growthFromLut(rule, neighborhood) * rule.gain;
        const growth = rule.positiveOnly ? Math.max(0, rawGrowth) : rawGrowth;
        growthTotal += growth * weight;
        dest.next[index] += rule.dt * growth * weight - rule.decay * current;
      }
    }
  }
  growthTotals.set(dest.id, growthTotal);
}

function finalizeDestination(channel, chunks, rulesForChannel, safeRect) {
  const discrete = rulesForChannel.some(isDiscreteRule);
  const shouldLimit = rulesForChannel.every((rule) => rule.limitValue !== false);
  for (const chunkId of chunks) {
    const bounds = intersectRects(chunkBounds(chunkId), safeRect);
    if (!bounds) continue;
    for (let y = bounds.top; y < bounds.bottom; y += 1) {
      const row = y * worldWidth;
      for (let x = bounds.left; x < bounds.right; x += 1) {
        const index = row + x;
        const value = channel.next[index];
        channel.next[index] = discrete ? (value > 0.5 ? 1 : 0) : shouldLimit ? clamp(value) : Math.max(0, value);
      }
    }
  }
}

function buildSimulationChunks(sourceChunks, safeRect, rule) {
  const result = new Set();
  if (!sourceChunks.size) return result;
  const radius = Math.ceil(rule.radius);

  if (wrapAround) {
    const chunkReach = Math.ceil(radius / CHUNK_SIZE);
    for (const chunkId of sourceChunks) {
      const sourceX = chunkId % chunksX;
      const sourceY = Math.floor(chunkId / chunksX);
      for (let offsetY = -chunkReach; offsetY <= chunkReach; offsetY += 1) {
        for (let offsetX = -chunkReach; offsetX <= chunkReach; offsetX += 1) {
          const chunkX = modulo(sourceX + offsetX, chunksX);
          const chunkY = modulo(sourceY + offsetY, chunksY);
          const nextId = chunkY * chunksX + chunkX;
          if (intersectRects(chunkBounds(nextId), safeRect)) result.add(nextId);
        }
      }
    }
    return result;
  }

  for (const chunkId of sourceChunks) {
    const bounds = chunkBounds(chunkId);
    const minCx = Math.max(0, Math.floor((bounds.left - radius) / CHUNK_SIZE));
    const maxCx = Math.min(chunksX - 1, Math.floor((bounds.right - 1 + radius) / CHUNK_SIZE));
    const minCy = Math.max(0, Math.floor((bounds.top - radius) / CHUNK_SIZE));
    const maxCy = Math.min(chunksY - 1, Math.floor((bounds.bottom - 1 + radius) / CHUNK_SIZE));

    for (let ny = minCy; ny <= maxCy; ny += 1) {
      for (let nx = minCx; nx <= maxCx; nx += 1) {
        const id = ny * chunksX + nx;
        if (intersectRects(chunkBounds(id), safeRect)) result.add(id);
      }
    }
  }

  return result;
}

function rebuildChunkActivity(channel, chunks) {
  for (const chunkId of chunks) {
    if (chunkHasMass(channel, chunkId)) channel.activeChunks.add(chunkId);
    else channel.activeChunks.delete(chunkId);
  }
}

function rebuildChannelActivity(channel) {
  channel.activeChunks.clear();
  for (let i = 0; i < channel.field.length; i += 1) {
    if (channel.field[i] > EPSILON) {
      const x = i % worldWidth;
      const y = Math.floor(i / worldWidth);
      channel.activeChunks.add(chunkIdForCell(x, y));
    }
  }
}

function chunkHasMass(channel, chunkId) {
  const bounds = chunkBounds(chunkId);
  for (let y = bounds.top; y < bounds.bottom; y += 1) {
    const row = y * worldWidth;
    for (let x = bounds.left; x < bounds.right; x += 1) {
      if (channel.field[row + x] > EPSILON) return true;
    }
  }
  return false;
}

function quantizeChannel(channel) {
  for (let i = 0; i < channel.field.length; i += 1) {
    channel.field[i] = channel.field[i] >= 0.5 ? 1 : 0;
  }
}

function measureMetrics() {
  const perChannel = {};
  let aggregateMass = 0;
  let aggregateEnergy = 0;
  for (const channel of channels) {
    let mass = 0;
    let energy = 0;
    for (let i = 0; i < channel.field.length; i += 1) {
      const value = channel.field[i];
      mass += value;
      energy += value * value;
    }
    const nextMetrics = {
      mass: mass / channel.field.length,
      growth: lastGrowthByChannel.get(channel.id) || 0,
      energy: energy / channel.field.length,
    };
    perChannel[channel.id] = nextMetrics;
    if (channel.visible !== false) {
      aggregateMass += nextMetrics.mass;
      aggregateEnergy += nextMetrics.energy;
    }
  }
  const aggregate = {
    mass: aggregateMass,
    growth: channels.reduce((sum, channel) => (channel.visible === false ? sum : sum + (perChannel[channel.id]?.growth || 0)), 0),
    energy: aggregateEnergy,
  };
  metrics = {
    selectedChannelId,
    scope: metricScope,
    perChannel,
    aggregate,
    ...metricForScope(perChannel, aggregate),
  };
}

function metricForScope(perChannel, aggregate) {
  if (metricScope === "aggregate") return aggregate;
  return perChannel[selectedChannelId] || aggregate || emptyMetrics();
}

function emptyMetrics() {
  return {
    mass: 0,
    growth: 0,
    energy: 0,
    selectedChannelId,
    scope: metricScope,
    perChannel: {},
    aggregate: { mass: 0, growth: 0, energy: 0 },
  };
}

function postFrame({
  dirtyChunks = new Set(),
  reset = false,
  stepped = false,
  profile: nextProfile = null,
  revision = protocolRevision,
} = {}) {
  const chunks = reset ? allChunks() : dirtyChunks;
  const patches = [];
  const transfers = [];
  const colorizeStart = performance.now();

  for (const chunkId of chunks) {
    const patch = renderChunk(chunkId);
    if (!patch) continue;
    patches.push(patch);
    transfers.push(patch.pixels.buffer);
  }
  const colorizeMs = performance.now() - colorizeStart;

  self.postMessage(
    {
      type: "frame",
      revision,
      reset,
      stepped,
      patches,
      metrics,
      simTime,
      profile: {
        stepSimulationMs: nextProfile?.stepSimulationMs ?? 0,
        colorizeMs,
        steps: nextProfile?.steps ?? 0,
        activeChunks: totalActiveChunks(),
        simChunks: nextProfile?.simChunks ?? 0,
      },
    },
    transfers,
  );
}

function renderChunk(chunkId) {
  if (chunkId < 0 || chunkId >= chunksX * chunksY) return null;
  const bounds = chunkBounds(chunkId);
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  if (width <= 0 || height <= 0) return null;

  const visibleChannels = channels.filter((channel) => channel.visible);
  const background = hexToRgb(channels[0]?.palette?.[0] || DEFAULT_COLORS[0]);
  const single = visibleChannels.length === 1 ? visibleChannels[0] : null;
  const pixels = new Uint8ClampedArray(width * height * 4);
  let p = 0;
  for (let y = bounds.top; y < bounds.bottom; y += 1) {
    const row = y * worldWidth;
    for (let x = bounds.left; x < bounds.right; x += 1) {
      if (single) {
        const valueIndex = Math.max(0, Math.min(255, Math.round(single.field[row + x] * 255)));
        const lutIndex = valueIndex * 3;
        pixels[p] = single.colorLut[lutIndex];
        pixels[p + 1] = single.colorLut[lutIndex + 1];
        pixels[p + 2] = single.colorLut[lutIndex + 2];
      } else {
        let red = background[0];
        let green = background[1];
        let blue = background[2];
        for (const channel of visibleChannels) {
          const value = clamp(channel.field[row + x]);
          if (value <= EPSILON) continue;
          const valueIndex = Math.max(0, Math.min(255, Math.round(value * 255)));
          const lutIndex = valueIndex * 3;
          const alpha = clamp(value * 0.86);
          red = red * (1 - alpha) + channel.colorLut[lutIndex] * alpha;
          green = green * (1 - alpha) + channel.colorLut[lutIndex + 1] * alpha;
          blue = blue * (1 - alpha) + channel.colorLut[lutIndex + 2] * alpha;
        }
        pixels[p] = Math.round(red);
        pixels[p + 1] = Math.round(green);
        pixels[p + 2] = Math.round(blue);
      }
      pixels[p + 3] = 255;
      p += 4;
    }
  }

  return {
    x: bounds.left,
    y: bounds.top,
    width,
    height,
    pixels,
  };
}

function rebuildKernel(rule) {
  const offsets = [];
  let total = 0;
  const radius = Math.max(1, Math.round(rule.radius));

  for (let oy = -radius; oy <= radius; oy += 1) {
    for (let ox = -radius; ox <= radius; ox += 1) {
      const distance = Math.hypot(ox, oy);
      if (distance > radius) continue;
      const weight = kernelValue(rule, distance / radius);
      if (weight <= 0) continue;
      offsets.push({ ox, oy, weight });
      total += weight;
    }
  }

  rule.kernelOx = new Int16Array(offsets.length);
  rule.kernelOy = new Int16Array(offsets.length);
  rule.kernelOffset = new Int32Array(offsets.length);
  rule.kernelWeight = new Float32Array(offsets.length);
  for (let i = 0; i < offsets.length; i += 1) {
    rule.kernelOx[i] = offsets[i].ox;
    rule.kernelOy[i] = offsets[i].oy;
    rule.kernelOffset[i] = offsets[i].oy * worldWidth + offsets[i].ox;
    rule.kernelWeight[i] = total > 0 ? offsets[i].weight / total : 0;
  }
}

function coreValue(rule, r) {
  const alpha = rule.alpha;
  if (r < 0 || r > 1) return 0;
  const k = 4 * r * (1 - r);
  switch (rule.coreName) {
    case "quad4":
      return k <= 0 ? 0 : Math.pow(k, alpha);
    case "trap1/5": {
      const q = 1 / 5;
      if (r < q || r > 1 - q) return 0;
      if (r < 2 * q) return (r - q) / q;
      if (r > 1 - 2 * q) return (1 - q - r) / q;
      return 1;
    }
    case "stpz1/4": {
      const q = 1 / 4;
      return r >= q && r <= 1 - q ? 1 : 0;
    }
    case "life": {
      const q = 1 / 4;
      if (r < q) return 0.5;
      return r > 1 - q ? 0 : 1;
    }
    case "bump4":
    default:
      if (r <= 0 || r >= 1 || k <= 0) return 0;
      return Math.exp(alpha * (1 - 1 / k));
  }
}

function kernelValue(rule, r) {
  const distance = Math.abs(r);
  if (rule.layer === 0) return coreValue(rule, distance);
  if (distance >= 1) return 0;
  const layers = rule.layer + 1;
  const scaled = distance * layers;
  const betaIndex = Math.floor(scaled);
  const etaIndex = Math.floor(scaled + 0.5);
  const eta = etaIndex <= rule.layer ? rule.eta[etaIndex] : 0;
  return coreValue(rule, scaled % 1) * ((rule.beta[betaIndex] || 0) - eta) + eta;
}

function rebuildGrowthLut(rule) {
  for (let i = 0; i < GROWTH_LUT_SIZE; i += 1) {
    rule.growthLut[i] = growthCurve(rule, i / (GROWTH_LUT_SIZE - 1));
  }
}

function growthFromLut(rule, n) {
  if (n <= 0) return rule.growthLut[0];
  if (n >= 1) return rule.growthLut[GROWTH_LUT_SIZE - 1];
  return rule.growthLut[Math.round(n * (GROWTH_LUT_SIZE - 1))];
}

function growthCurve(rule, n) {
  const mu = rule.mu;
  const sigma = rule.sigma;
  const distance = Math.abs(n - mu);
  const squared = distance * distance;
  switch (rule.deltaName) {
    case "quad4": {
      const reach = 9 * sigma * sigma;
      return squared > reach ? -1 : Math.pow(1 - squared / reach, rule.alpha) * 2 - 1;
    }
    case "trap": {
      const p = sigma / 2;
      const q = sigma * 2;
      if (distance <= p) return 1;
      return distance <= q ? (2 * (q - distance)) / (q - p) - 1 : -1;
    }
    case "stpz":
      return distance <= sigma ? 1 : -1;
    case "gaus":
    default:
      return 2 * Math.exp(-squared / (2 * sigma * sigma)) - 1;
  }
}

function rebuildColorLut(channel) {
  const rgbPalette = channel.palette.map(hexToRgb);
  for (let i = 0; i < 256; i += 1) {
    const scaled = (i / 255) * (rgbPalette.length - 1);
    const base = Math.floor(scaled);
    const t = scaled - base;
    const a = rgbPalette[base];
    const b = rgbPalette[Math.min(base + 1, rgbPalette.length - 1)];
    const p = i * 3;
    channel.colorLut[p] = Math.round(a[0] + (b[0] - a[0]) * t);
    channel.colorLut[p + 1] = Math.round(a[1] + (b[1] - a[1]) * t);
    channel.colorLut[p + 2] = Math.round(a[2] + (b[2] - a[2]) * t);
  }
}

function hexToRgb(hex) {
  const clean = String(hex || "#000000").replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((part) => part + part).join("") : clean;
  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function normalizeRect(rect) {
  const source = rect || { left: 0, top: 0, right: worldWidth, bottom: worldHeight };
  const left = Math.max(0, Math.min(worldWidth, Math.floor(source.left || 0)));
  const top = Math.max(0, Math.min(worldHeight, Math.floor(source.top || 0)));
  const right = Math.max(left, Math.min(worldWidth, Math.ceil(source.right ?? worldWidth)));
  const bottom = Math.max(top, Math.min(worldHeight, Math.ceil(source.bottom ?? worldHeight)));
  return { left, top, right, bottom };
}

function intersectRects(a, b) {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.right, b.right);
  const bottom = Math.min(a.bottom, b.bottom);
  if (left >= right || top >= bottom) return null;
  return { left, top, right, bottom };
}

function chunksForRect(rect) {
  const chunks = new Set();
  const safeRect = normalizeRect(rect);
  if (safeRect.left >= safeRect.right || safeRect.top >= safeRect.bottom) return chunks;
  const minCx = Math.floor(safeRect.left / CHUNK_SIZE);
  const maxCx = Math.floor((safeRect.right - 1) / CHUNK_SIZE);
  const minCy = Math.floor(safeRect.top / CHUNK_SIZE);
  const maxCy = Math.floor((safeRect.bottom - 1) / CHUNK_SIZE);
  for (let cy = minCy; cy <= maxCy; cy += 1) {
    for (let cx = minCx; cx <= maxCx; cx += 1) {
      if (cx >= 0 && cy >= 0 && cx < chunksX && cy < chunksY) chunks.add(cy * chunksX + cx);
    }
  }
  return chunks;
}

function allChunks() {
  const chunks = new Set();
  for (let i = 0; i < chunksX * chunksY; i += 1) chunks.add(i);
  return chunks;
}

function chunkBounds(chunkId) {
  const cx = chunkId % chunksX;
  const cy = Math.floor(chunkId / chunksX);
  const left = cx * CHUNK_SIZE;
  const top = cy * CHUNK_SIZE;
  return {
    left,
    top,
    right: Math.min(worldWidth, left + CHUNK_SIZE),
    bottom: Math.min(worldHeight, top + CHUNK_SIZE),
  };
}

function chunkIdForCell(x, y) {
  return Math.floor(y / CHUNK_SIZE) * chunksX + Math.floor(x / CHUNK_SIZE);
}

function modulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function unionSets(a, b) {
  const result = new Set(a);
  for (const item of b) result.add(item);
  return result;
}

function clamp(value, low = 0, high = 1) {
  return Math.max(low, Math.min(high, value));
}

function isDiscreteRule(rule) {
  return rule.coreName === "life";
}

function isDiscreteChannel(channelId) {
  return rules.some((rule) => rule.destinationChannelId === channelId && isDiscreteRule(rule));
}

function maxRuleDt() {
  return rules.reduce((max, rule) => Math.max(max, rule.dt || 0), 0);
}

function totalActiveChunks() {
  return channels.reduce((total, channel) => total + channel.activeChunks.size, 0);
}

/** @param {unknown} value @param {string} label @param {number} low @param {number} high */
function finiteNumber(value, label, low, high) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < low || number > high) {
    throw new RangeError(`${label} must be between ${low} and ${high}.`);
  }
  return number;
}

/** @param {unknown} value @param {string} label */
function normalizeWorldDimension(value, label) {
  const number = finiteNumber(value, `World ${label}`, 1, MAX_WORLD_SIZE);
  if (!Number.isSafeInteger(number)) throw new TypeError(`World ${label} must be an integer.`);
  return number;
}
