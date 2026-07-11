const canvas = document.querySelector("#fieldCanvas");
const glCanvas = document.querySelector("#glFieldCanvas");
const ctx = canvas.getContext("2d", { alpha: true });
const LeniaCore = window.LeniaCore;
const LifeformCatalog = window.LifeformCatalog;
const MapCodec = window.LeniencyMapCodec;

if (!LeniaCore || !LifeformCatalog || !MapCodec) {
  throw new Error("Range playground dependencies failed to load.");
}

const ui = {
  gameModeBtn: document.querySelector("#gameModeBtn"),
  stateLabel: document.querySelector("#stateLabel"),
  timeLabel: document.querySelector("#timeLabel"),
  timeTabBtn: document.querySelector("#timeTabBtn"),
  gameTabBtn: document.querySelector("#gameTabBtn"),
  advancedTabBtn: document.querySelector("#advancedTabBtn"),
  timeTab: document.querySelector("#timeTab"),
  gameTab: document.querySelector("#gameTab"),
  advancedTab: document.querySelector("#advancedTab"),
  runBtn: document.querySelector("#runBtn"),
  runIcon: document.querySelector("#runIcon"),
  stepBtn: document.querySelector("#stepBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  randomBtn: document.querySelector("#randomBtn"),
  speedSlider: document.querySelector("#speedSlider"),
  speedValue: document.querySelector("#speedValue"),
  backendSelect: document.querySelector("#backendSelect"),
  backendLabel: document.querySelector("#backendLabel"),
  worldSizeSelect: document.querySelector("#worldSizeSelect"),
  customWorldSizeFields: document.querySelector("#customWorldSizeFields"),
  customWorldWidth: document.querySelector("#customWorldWidth"),
  customWorldHeight: document.querySelector("#customWorldHeight"),
  radiusSlider: document.querySelector("#radiusSlider"),
  radiusValue: document.querySelector("#radiusValue"),
  alphaSlider: document.querySelector("#alphaSlider"),
  alphaValue: document.querySelector("#alphaValue"),
  muSlider: document.querySelector("#muSlider"),
  muValue: document.querySelector("#muValue"),
  sigmaSlider: document.querySelector("#sigmaSlider"),
  sigmaValue: document.querySelector("#sigmaValue"),
  dtSlider: document.querySelector("#dtSlider"),
  dtValue: document.querySelector("#dtValue"),
  gainSlider: document.querySelector("#gainSlider"),
  gainValue: document.querySelector("#gainValue"),
  decaySlider: document.querySelector("#decaySlider"),
  decayValue: document.querySelector("#decayValue"),
  safeSlider: document.querySelector("#safeSlider"),
  safeValue: document.querySelector("#safeValue"),
  gameBackgroundSelect: document.querySelector("#gameBackgroundSelect"),
  gameStarDensitySlider: document.querySelector("#gameStarDensitySlider"),
  gameStarDensityValue: document.querySelector("#gameStarDensityValue"),
  gameStarSpeedSlider: document.querySelector("#gameStarSpeedSlider"),
  gameStarSpeedValue: document.querySelector("#gameStarSpeedValue"),
  gameStarBrightnessSlider: document.querySelector("#gameStarBrightnessSlider"),
  gameStarBrightnessValue: document.querySelector("#gameStarBrightnessValue"),
  gameAccelSlider: document.querySelector("#gameAccelSlider"),
  gameAccelValue: document.querySelector("#gameAccelValue"),
  gameSpeedSlider: document.querySelector("#gameSpeedSlider"),
  gameSpeedValue: document.querySelector("#gameSpeedValue"),
  gameFrictionSlider: document.querySelector("#gameFrictionSlider"),
  gameFrictionValue: document.querySelector("#gameFrictionValue"),
  gameMouseSensitivitySlider: document.querySelector("#gameMouseSensitivitySlider"),
  gameMouseSensitivityValue: document.querySelector("#gameMouseSensitivityValue"),
  gameBrushIntervalSlider: document.querySelector("#gameBrushIntervalSlider"),
  gameBrushIntervalValue: document.querySelector("#gameBrushIntervalValue"),
  gameCameraCenterPullSlider: document.querySelector("#gameCameraCenterPullSlider"),
  gameCameraCenterPullValue: document.querySelector("#gameCameraCenterPullValue"),
  gameCameraEdgePullSlider: document.querySelector("#gameCameraEdgePullSlider"),
  gameCameraEdgePullValue: document.querySelector("#gameCameraEdgePullValue"),
  gameCameraInnerZoneSlider: document.querySelector("#gameCameraInnerZoneSlider"),
  gameCameraInnerZoneValue: document.querySelector("#gameCameraInnerZoneValue"),
  gameCameraEdgeZoneSlider: document.querySelector("#gameCameraEdgeZoneSlider"),
  gameCameraEdgeZoneValue: document.querySelector("#gameCameraEdgeZoneValue"),
  gameCameraGuardZoneSlider: document.querySelector("#gameCameraGuardZoneSlider"),
  gameCameraGuardZoneValue: document.querySelector("#gameCameraGuardZoneValue"),
  gameZoomSlider: document.querySelector("#gameZoomSlider"),
  gameZoomValue: document.querySelector("#gameZoomValue"),
  gameMinZoomSlider: document.querySelector("#gameMinZoomSlider"),
  gameMinZoomValue: document.querySelector("#gameMinZoomValue"),
  gameMaxZoomSlider: document.querySelector("#gameMaxZoomSlider"),
  gameMaxZoomValue: document.querySelector("#gameMaxZoomValue"),
  limitToggle: document.querySelector("#limitToggle"),
  wrapToggle: document.querySelector("#wrapToggle"),
  colorInputs: [
    document.querySelector("#color0"),
    document.querySelector("#color1"),
    document.querySelector("#color2"),
    document.querySelector("#color3"),
    document.querySelector("#color4"),
  ],
  resetAdvancedBtn: document.querySelector("#resetAdvancedBtn"),
  libraryCount: document.querySelector("#libraryCount"),
  panToolBtn: document.querySelector("#panToolBtn"),
  lifeToolBtn: document.querySelector("#lifeToolBtn"),
  paintToolBtn: document.querySelector("#paintToolBtn"),
  eraseToolBtn: document.querySelector("#eraseToolBtn"),
  sampleToolBtn: document.querySelector("#sampleToolBtn"),
  saveMapBtn: document.querySelector("#saveMapBtn"),
  loadMapBtn: document.querySelector("#loadMapBtn"),
  loadMapInput: document.querySelector("#loadMapInput"),
  brushSizeSlider: document.querySelector("#brushSizeSlider"),
  brushSizeValue: document.querySelector("#brushSizeValue"),
  brushPowerSlider: document.querySelector("#brushPowerSlider"),
  brushPowerValue: document.querySelector("#brushPowerValue"),
  formSearch: document.querySelector("#formSearch"),
  collectionSelect: document.querySelector("#collectionSelect"),
  groupSelect: document.querySelector("#groupSelect"),
  prevGroupBtn: document.querySelector("#prevGroupBtn"),
  nextGroupBtn: document.querySelector("#nextGroupBtn"),
  groupRule: document.querySelector("#groupRule"),
  selectedForm: document.querySelector("#selectedForm"),
  formList: document.querySelector("#formList"),
  groupChangeDialog: document.querySelector("#groupChangeDialog"),
  groupChangeMessage: document.querySelector("#groupChangeMessage"),
  skipGroupAlert: document.querySelector("#skipGroupAlert"),
  cancelGroupChangeBtn: document.querySelector("#cancelGroupChangeBtn"),
  confirmGroupChangeBtn: document.querySelector("#confirmGroupChangeBtn"),
  sampleLabel: document.querySelector("#sampleLabel"),
  placementControls: document.querySelector("#placementControls"),
  scaleDownBtn: document.querySelector("#scaleDownBtn"),
  rotateLeftBtn: document.querySelector("#rotateLeftBtn"),
  commitPlacementBtn: document.querySelector("#commitPlacementBtn"),
  rotateRightBtn: document.querySelector("#rotateRightBtn"),
  scaleUpBtn: document.querySelector("#scaleUpBtn"),
  cancelPlacementBtn: document.querySelector("#cancelPlacementBtn"),
  massLabel: document.querySelector("#massLabel"),
  growthLabel: document.querySelector("#growthLabel"),
  energyLabel: document.querySelector("#energyLabel"),
  toggleMetricsBtn: document.querySelector("#toggleMetricsBtn"),
  fieldMetricRows: [...document.querySelectorAll("[data-field-metric]")],
  fpsLabel: document.querySelector("#fpsLabel"),
  simFpsLabel: document.querySelector("#simFpsLabel"),
  simMsLabel: document.querySelector("#simMsLabel"),
  colorizeMsLabel: document.querySelector("#colorizeMsLabel"),
  bufferMsLabel: document.querySelector("#bufferMsLabel"),
  renderMsLabel: document.querySelector("#renderMsLabel"),
  chunkLabel: document.querySelector("#chunkLabel"),
  patchLabel: document.querySelector("#patchLabel"),
  layerList: document.querySelector("#layerList"),
  addLayerBtn: document.querySelector("#addLayerBtn"),
  removeLayerBtn: document.querySelector("#removeLayerBtn"),
  layerNameInput: document.querySelector("#layerNameInput"),
  layerVisibleToggle: document.querySelector("#layerVisibleToggle"),
  layerSourceSelect: document.querySelector("#layerSourceSelect"),
  layerDestinationLabel: document.querySelector("#layerDestinationLabel"),
  metricScopeSelect: document.querySelector("#metricScopeSelect"),
  layerColorInputs: [
    document.querySelector("#layerColor0"),
    document.querySelector("#layerColor1"),
    document.querySelector("#layerColor2"),
    document.querySelector("#layerColor3"),
    document.querySelector("#layerColor4"),
  ],
};

const COMPATIBLE_GROUPS_URL = "docs/strictly-compatible-groups.txt";
const LIFEFORM_ASSET_BASE = "assets/lifeforms/";
const SKIP_GROUP_ALERT_KEY = "leniency.skipGroupChangeAlert";
const DEFAULT_WORLD_SIZE = 128;
const MIN_WORLD_SIZE = 16;
const MAX_WORLD_SIZE = 2048;
const DEFAULT_FORM_NAME = "Orbium unicaudatus";
const MAP_FILE_VERSION = MapCodec.MAP_VERSION;
const MAX_CHANNELS = 3;
const WEBGL_MAX_RULES = 8;
const SNAPSHOT_TIMEOUT_MS = 8000;
const DEFAULT_COLORS = ["#080618", "#231c49", "#3e3f77", "#8889bc", "#f0efd6"];
const NEW_LAYER_PALETTES = [
  ["#140704", "#4c160b", "#a23a16", "#e98331", "#ffe0a3"],
  ["#170604", "#5a120a", "#b42713", "#ff6d2a", "#ffd39b"],
  ["#180b02", "#5a2508", "#b65213", "#f39a2e", "#ffe6a8"],
];
const DEFAULT_RULE = {
  id: "rule-0",
  sourceChannelId: "channel-0",
  destinationChannelId: "channel-0",
  radius: 13,
  ts: 10,
  dt: 0.1,
  limitValue: true,
  deltaName: "gaus",
  mu: 0.15,
  sigma: 0.017,
  coreName: "bump4",
  layer: 0,
  beta: [1, 0, 0, 0],
  eta: [0, 0, 0, 0],
  weight: 1,
  positiveOnly: false,
};
const DEFAULT_ADVANCED = {
  radius: 13,
  alpha: 4,
  mu: 0.15,
  sigma: 0.017,
  dt: 0.1,
  gain: 1,
  decay: 0,
  safe: 64,
  limitValue: true,
  wrapAround: true,
};
const DEFAULT_GAME = {
  background: "stars",
  starDensity: 55,
  starSpeed: 1,
  starBrightness: 0.6,
  accel: 175,
  maxSpeed: 36,
  friction: 3.2,
  mouseSensitivity: 0.025,
  brushInterval: 30,
  cameraCenterPull: 0.35,
  cameraEdgePull: 5.2,
  cameraInnerZone: 0.28,
  cameraEdgeZone: 0.86,
  cameraGuardZone: 0.94,
  zoom: 18,
  minZoom: 6,
  maxZoom: 36,
};

let worldWidth = DEFAULT_WORLD_SIZE;
let worldHeight = DEFAULT_WORLD_SIZE;
let fieldBuffer = document.createElement("canvas");
let fieldBufferCtx = fieldBuffer.getContext("2d", { alpha: false });
let viewDirty = true;
let palette = DEFAULT_COLORS.map(hexToRgb);
let paletteVersion = 0;

let cssWidth = 1;
let cssHeight = 1;
let dpr = 1;
let camera = { x: worldWidth / 2, y: worldHeight / 2, scale: 6 };
let currentRule = { ...DEFAULT_RULE, beta: [...DEFAULT_RULE.beta], eta: [...DEFAULT_RULE.eta] };
let channels = [
  {
    id: "channel-0",
    name: "Layer 1",
    palette: [...DEFAULT_COLORS],
    visible: true,
  },
];
let rules = [
  {
    ...DEFAULT_RULE,
    beta: [...DEFAULT_RULE.beta],
    eta: [...DEFAULT_RULE.eta],
  },
];
let selectedChannelId = "channel-0";
let nextChannelSerial = 1;
let nextLayerPaletteIndex = 0;
let metricScope = "selected";
let metricsEnabled = true;
let catalogForms = [];
let lifeformCollections = [];
let activeCollectionIndex = -1;
let activeGroupIndex = -1;
let pendingCollectionIndex = -1;
let pendingGroupIndex = -1;
let selectedForm = null;
let pendingPlacement = null;
let currentTool = "form";
let isRunning = false;
let simTime = 0;
let accumulator = 0;
let pendingStepCount = 0;
let workerBusy = false;
let workerReady = false;
let simWorker = null;
let snapshotRequestId = 0;
const pendingSnapshotRequests = new Map();
let backendRevision = 0;
let webglSim = null;
let webglUnavailableReason = "";
let configureBackendFrame = 0;
let formSearchFrame = 0;
let backendPreference = "cpu";
let activeBackend = "cpu";
let lastFrameAt = 0;
let renderFrameCount = 0;
let simStepCount = 0;
let fpsClock = 0;
let metrics = { mass: 0, growth: 0, energy: 0 };
let profile = {
  stepSimulationMs: 0,
  colorizeMs: 0,
  updateFieldBufferMs: 0,
  renderMs: 0,
  activeChunks: 0,
  simChunks: 0,
  patches: 0,
};
let pointerState = null;
let sampleRequestId = 0;
let gameMode = false;
let gameWasRunning = false;
let gameSavedCamera = null;
let gameSavedWrapAround = null;
let gameBrushClock = DEFAULT_GAME.brushInterval;
let gameZoom = DEFAULT_GAME.zoom;
let gamePlayer = {
  x: worldWidth / 2,
  y: worldHeight / 2,
  vx: 0,
  vy: 0,
  initialized: false,
};
const gameKeys = new Set();
let gameMouse = { locked: false, dx: 0, dy: 0 };
let groupDialogReturnFocus = null;
let inertDialogSiblings = [];

function clamp(value, low = 0, high = 1) {
  return Math.max(low, Math.min(high, value));
}

function smoothstep(value) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

function modulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

class GameStarfield {
  constructor() {
    this.stars = [];
    this.width = 0;
    this.height = 0;
    this.density = -1;
    this.layers = 3;
  }

  reset() {
    this.stars = [];
    this.width = 0;
    this.height = 0;
    this.density = -1;
  }

  ensure(width, height, density) {
    const nextWidth = Math.max(1, Math.round(width));
    const nextHeight = Math.max(1, Math.round(height));
    const nextDensity = Math.round(density);
    if (this.width === nextWidth && this.height === nextHeight && this.density === nextDensity) return;
    this.width = nextWidth;
    this.height = nextHeight;
    this.density = nextDensity;
    this.stars = [];

    const areaFactor = (this.width * this.height) / (1280 * 720);
    const baseCount = Math.round(36 * areaFactor * (this.density / 55));
    for (let layer = 0; layer < this.layers; layer += 1) {
      const depth = (layer + 1) / this.layers;
      const count = Math.max(0, Math.round(baseCount * (1.25 - depth * 0.35)));
      const size = 0.8 + depth * 2.4;
      const speed = 0.15 + depth * 0.85;
      const alpha = 0.25 + depth * 0.75;
      for (let i = 0; i < count; i += 1) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size,
          speed,
          alpha,
          twinkle: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  update(cameraDeltaX, cameraDeltaY, settings) {
    if (settings.background !== "stars") return;
    this.ensure(cssWidth, cssHeight, settings.starDensity);
    const speed = settings.starSpeed;
    for (const star of this.stars) {
      const parallax = star.speed >= 1 ? 1 : Math.min(0.96, star.speed * speed);
      star.x -= cameraDeltaX * parallax;
      star.y -= cameraDeltaY * parallax;
      if (star.x < 0) {
        star.x += this.width;
        star.y = Math.random() * this.height;
      } else if (star.x >= this.width) {
        star.x -= this.width;
        star.y = Math.random() * this.height;
      }
      if (star.y < 0) {
        star.y += this.height;
        star.x = Math.random() * this.width;
      } else if (star.y >= this.height) {
        star.y -= this.height;
        star.x = Math.random() * this.width;
      }
    }
  }

  draw(ctx, settings) {
    if (settings.background !== "stars") return;
    this.ensure(cssWidth, cssHeight, settings.starDensity);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const star of this.stars) {
      const alpha = clamp(settings.starBrightness * star.alpha * (0.82 + Math.sin(star.twinkle) * 0.08), 0, 1);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.restore();
  }
}

const gameStarfield = new GameStarfield();

function parseCellArray(cellText) {
  return { ...LeniaCore.parseCellArray(cellText), flat: null };
}

function slugify(value) {
  return LifeformCatalog.slugify(value);
}

function cleanGroupName(value) {
  return LifeformCatalog.cleanGroupName(value);
}

function normalizeLookupText(value) {
  return LifeformCatalog.normalizeLookupText(value);
}

function ruleLabel(info) {
  const beta = info.beta.slice(0, info.layer + 1).map((value) => Number(value.toFixed(4))).join(", ");
  return `R ${info.radius} | mu ${info.mu.toFixed(3)} | sigma ${info.sigma.toFixed(3)} | dt ${info.dt.toFixed(3)} | ${info.coreName} | b ${beta}`;
}

function groupRuleLabel(group) {
  if (group.perFormRule) {
    const form = group.forms.includes(selectedForm) ? selectedForm : group.forms[0];
    const info = form?.ruleInfo || group.ruleInfo;
    return `Per-form field values | ${ruleLabel(info)}`;
  }
  return ruleLabel(group.ruleInfo);
}

function parseCompatibleGroups(text, forms) {
  return LifeformCatalog.parseCompatibleGroups(text, forms, DEFAULT_RULE);
}

async function buildCompatibleGroups(forms) {
  const response = await fetch(COMPATIBLE_GROUPS_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${COMPATIBLE_GROUPS_URL}`);
  return parseCompatibleGroups(await response.text(), forms);
}

function buildLegacyCompatibleGroup(forms) {
  const legacyForms = forms.filter((form) => isCompatibleRule(form.ruleInfo));
  if (!legacyForms.length) return null;
  return {
    id: "legacy-compatible-forms",
    title: "Legacy form rules",
    ruleText: "Original range playground set. Selecting a lifeform applies that lifeform's field values.",
    ruleInfo: legacyForms[0].ruleInfo,
    items: [],
    forms: legacyForms,
    missingItems: [],
    perFormRule: true,
  };
}

function collectionFormCount(collection) {
  return new Set((collection?.groups || []).flatMap((group) => group.forms.map((form) => form.id))).size;
}

function buildStrictCompatibleCollection(groups) {
  return {
    id: "strictly-compatible",
    title: "Strictly compatible",
    groups: groups.map((group, index) => ({
      ...group,
      id: `strictly-compatible-${index}`,
      collectionId: "strictly-compatible",
      collectionTitle: "Strictly compatible",
    })),
  };
}

function buildLegacyCollection(group) {
  if (!group) return null;
  return {
    id: "legacy",
    title: "Legacy",
    groups: [
      {
        ...group,
        collectionId: "legacy",
        collectionTitle: "Legacy",
      },
    ],
  };
}

function repositoryGroupKey(form) {
  const groups = (form.groups || []).map(cleanGroupName).filter(Boolean);
  return groups.length ? groups.join(" / ") : form.sourceTitle || "Lenia repository";
}

function buildAllLifeformsCollection(forms) {
  if (!forms.length) return null;
  const groupMap = new Map();
  for (const form of forms) {
    const key = repositoryGroupKey(form);
    if (!groupMap.has(key)) {
      const parts = key.split(" / ");
      groupMap.set(key, {
        title: parts[parts.length - 1] || "Unclassified",
        path: key,
        forms: [],
      });
    }
    groupMap.get(key).forms.push(form);
  }

  const groups = [...groupMap.values()].map((entry, index) => ({
    id: `all-lifeforms-${index}-${slugify(entry.path)}`,
    collectionId: "all-lifeforms",
    collectionTitle: "All lifeforms",
    title: entry.title,
    ruleText: `Lenia repository catalog: ${entry.path}. Selecting a lifeform applies that lifeform's field values.`,
    ruleInfo: entry.forms[0].ruleInfo,
    items: [],
    forms: entry.forms,
    missingItems: [],
    perFormRule: true,
  }));

  return {
    id: "all-lifeforms",
    title: "All lifeforms",
    groups,
  };
}

function buildLifeformCollections(strictGroups, legacyGroup, repositoryForms) {
  return [
    buildStrictCompatibleCollection(strictGroups),
    buildLegacyCollection(legacyGroup),
    buildAllLifeformsCollection(repositoryForms),
  ].filter((collection) => collection?.groups.length);
}

function activeCollection() {
  return lifeformCollections[activeCollectionIndex] || null;
}

function collectionGroups(collection = activeCollection()) {
  return collection?.groups || [];
}

function defaultCollectionIndex() {
  const legacyIndex = lifeformCollections.findIndex((collection) => collection.id === "legacy");
  return legacyIndex >= 0 ? legacyIndex : 0;
}

function defaultGroupIndex(collection = activeCollection()) {
  const groups = collectionGroups(collection);
  const defaultName = normalizeLookupText(DEFAULT_FORM_NAME);
  const index = groups.findIndex((group) => group.forms.some((form) => normalizeLookupText(form.name) === defaultName));
  return index >= 0 ? index : 0;
}

function defaultFormForGroup(group) {
  if (!group?.forms.length) return null;
  const defaultName = normalizeLookupText(DEFAULT_FORM_NAME);
  return group.forms.find((form) => normalizeLookupText(form.name) === defaultName) || group.forms[0];
}

function baseLifeformSources() {
  const animalArr = Array.isArray(window.animalArr) ? window.animalArr : [];
  return [
    {
      id: "bundled-lenia",
      title: "Bundled Lenia",
      entries: animalArr,
      indexOffset: 0,
      assetPrefix: "",
    },
    {
      id: "compatible-extra",
      title: "Compatible extras",
      entries: Array.isArray(window.extraCompatibleAnimalArr) ? window.extraCompatibleAnimalArr : [],
      indexOffset: animalArr.length,
      assetPrefix: "",
    },
  ];
}

function repositoryLifeformSources() {
  return [
    {
      id: "lenia-repository",
      title: "Lenia repository",
      entries: Array.isArray(window.leniaRepositoryAnimalArr) ? window.leniaRepositoryAnimalArr : [],
      indexOffset: 0,
      assetPrefix: "lenia",
    },
  ];
}

function buildLibraryForms(sources = baseLifeformSources()) {
  return LifeformCatalog.buildLibraryForms(sources, { assetBase: LIFEFORM_ASSET_BASE, defaults: DEFAULT_RULE });
}

function isCompatibleRule(rule) {
  return LifeformCatalog.isCompatibleRule(rule);
}

function isLifeRule(rule = currentRule) {
  return rule.coreName === "life";
}

function hexToRgb(hex) {
  return LeniaCore.hexToRgb(hex);
}

function cloneRule(rule) {
  const sourceChannelId = String(rule?.sourceChannelId || rule?.src || rule?.source || DEFAULT_RULE.sourceChannelId);
  const destinationChannelId = String(
    rule?.destinationChannelId || rule?.dst || rule?.destination || DEFAULT_RULE.destinationChannelId,
  );
  return {
    ...DEFAULT_RULE,
    ...rule,
    sourceChannelId,
    destinationChannelId,
    beta: [...(rule?.beta || DEFAULT_RULE.beta)],
    eta: [...(rule?.eta || DEFAULT_RULE.eta)],
    weight: Number(rule?.weight ?? DEFAULT_RULE.weight),
    positiveOnly: Boolean(rule?.positiveOnly),
  };
}

function cloneChannel(channel) {
  return {
    id: String(channel.id),
    name: String(channel.name || "Layer"),
    palette: normalizePalette(channel.palette || channel.colors || DEFAULT_COLORS),
    visible: channel.visible !== false,
  };
}

function normalizePalette(colors) {
  const paletteColors = colors && colors.length ? colors : DEFAULT_COLORS;
  const result = paletteColors.slice(0, 5).map((color, index) => String(color || DEFAULT_COLORS[index] || DEFAULT_COLORS[0]));
  while (result.length < 5) result.push(DEFAULT_COLORS[result.length] || DEFAULT_COLORS[0]);
  return result;
}

function selectedChannel() {
  return channels.find((channel) => channel.id === selectedChannelId) || channels[0];
}

function channelById(channelId) {
  return channels.find((channel) => channel.id === channelId) || null;
}

function ensureLayerRule(channelId = selectedChannelId) {
  let rule =
    rules.find((item) => item.sourceChannelId === channelId && item.destinationChannelId === channelId) ||
    rules.find((item) => item.destinationChannelId === channelId);
  if (!rule) {
    rule = cloneRule({
      id: `rule-${channelId}`,
      sourceChannelId: channelId,
      destinationChannelId: channelId,
      wrapAround: ui.wrapToggle?.checked ?? DEFAULT_ADVANCED.wrapAround,
    });
    rules.push(rule);
  }
  return rule;
}

function selectedRule() {
  return ensureLayerRule(selectedChannelId);
}

function hasCrossChannelRule(src, dst) {
  return rules.some((rule) => rule.sourceChannelId === src && rule.destinationChannelId === dst);
}

function createCrossChannelRule(src, dst, overrides = {}) {
  return cloneRule({
    ...selectedRule(),
    ...overrides,
    id: `rule-${src}-to-${dst}`,
    sourceChannelId: src,
    destinationChannelId: dst,
    weight: Number(overrides.weight ?? 0.35),
    positiveOnly: overrides.positiveOnly !== false,
  });
}

function crossRulesForChannel(channelId) {
  return rules.filter(
    (rule) =>
      rule.sourceChannelId !== rule.destinationChannelId &&
      (rule.sourceChannelId === channelId || rule.destinationChannelId === channelId),
  );
}

function writeSelectedRuleFromControls() {
  const rule = selectedRule();
  rule.radius = Number(ui.radiusSlider.value);
  rule.alpha = Number(ui.alphaSlider.value);
  rule.mu = Number(ui.muSlider.value);
  rule.sigma = Number(ui.sigmaSlider.value);
  rule.dt = Number(ui.dtSlider.value);
  rule.gain = Number(ui.gainSlider.value);
  rule.decay = Number(ui.decaySlider.value);
  rule.limitValue = ui.limitToggle.checked;
  rule.wrapAround = ui.wrapToggle.checked;
  currentRule = rule;
}

function syncRuleControls(rule = selectedRule()) {
  currentRule = rule;
  setSliderValue(ui.radiusSlider, rule.radius);
  setSliderValue(ui.alphaSlider, rule.alpha);
  setSliderValue(ui.muSlider, rule.mu);
  setSliderValue(ui.sigmaSlider, rule.sigma);
  setSliderValue(ui.dtSlider, rule.dt);
  setSliderValue(ui.gainSlider, rule.gain);
  setSliderValue(ui.decaySlider, rule.decay);
  ui.limitToggle.checked = rule.limitValue !== false;
  syncLabels();
}

function syncPaletteControls() {
  const channel = selectedChannel();
  if (!channel) return;
  const colors = normalizePalette(channel.palette);
  channel.palette = colors;
  ui.colorInputs.forEach((input, index) => {
    input.value = colors[index];
  });
  ui.layerColorInputs.forEach((input, index) => {
    if (input) input.value = colors[index];
  });
  palette = colors.map(hexToRgb);
}

function backgroundColor() {
  return channels[0]?.palette?.[0] || DEFAULT_COLORS[0];
}

function simulationModel() {
  writeSelectedRuleFromControls();
  return {
    selectedChannelId,
    metricScope,
    metricsEnabled,
    wrapAround: ui.wrapToggle.checked,
    channels: channels.slice(0, MAX_CHANNELS).map((channel) => ({
      id: channel.id,
      name: channel.name,
      palette: normalizePalette(channel.palette),
      visible: channel.visible !== false,
    })),
    rules: rules.map((rule) => ({
      id: rule.id,
      src: rule.sourceChannelId,
      dst: rule.destinationChannelId,
      sourceChannelId: rule.sourceChannelId,
      destinationChannelId: rule.destinationChannelId,
      radius: rule.radius,
      alpha: rule.alpha,
      mu: rule.mu,
      sigma: rule.sigma,
      dt: rule.dt,
      gain: rule.gain,
      decay: rule.decay,
      limitValue: rule.limitValue,
      deltaName: rule.deltaName,
      coreName: rule.coreName,
      layer: rule.layer,
      beta: [...rule.beta],
      eta: [...rule.eta],
      weight: Number(rule.weight ?? 1),
      positiveOnly: Boolean(rule.positiveOnly),
    })),
  };
}

function colorRamp(value) {
  return LeniaCore.colorRamp(value, palette);
}

function currentColors() {
  return normalizePalette(selectedChannel()?.palette || DEFAULT_COLORS);
}

function currentRadius() {
  return Number(ui.radiusSlider.value);
}

function maximumRuleRadius() {
  writeSelectedRuleFromControls();
  return rules.reduce((maximum, rule) => Math.max(maximum, Number(rule.radius) || 0), currentRadius());
}

function currentDt() {
  return Number(ui.dtSlider.value);
}

function currentStepDt() {
  writeSelectedRuleFromControls();
  return rules.reduce((max, rule) => Math.max(max, Number(rule.dt) || 0), currentDt());
}

function currentSafeArea() {
  return Number(ui.safeSlider.value);
}

function percentSlider(slider) {
  return Number(slider.value) / 100;
}

function gameSettings() {
  const minZoom = Number(ui.gameMinZoomSlider.value);
  const maxZoom = Math.max(minZoom, Number(ui.gameMaxZoomSlider.value));
  const cameraInnerZone = percentSlider(ui.gameCameraInnerZoneSlider);
  const cameraEdgeZone = Math.max(cameraInnerZone + 0.01, percentSlider(ui.gameCameraEdgeZoneSlider));
  const cameraGuardZone = Math.max(cameraEdgeZone + 0.01, percentSlider(ui.gameCameraGuardZoneSlider));
  const cameraCenterPull = Number(ui.gameCameraCenterPullSlider.value);
  return {
    background: ui.gameBackgroundSelect.value,
    starDensity: Number(ui.gameStarDensitySlider.value),
    starSpeed: Number(ui.gameStarSpeedSlider.value),
    starBrightness: Number(ui.gameStarBrightnessSlider.value),
    accel: Number(ui.gameAccelSlider.value),
    maxSpeed: Number(ui.gameSpeedSlider.value),
    friction: Number(ui.gameFrictionSlider.value),
    mouseSensitivity: Number(ui.gameMouseSensitivitySlider.value),
    brushInterval: Number(ui.gameBrushIntervalSlider.value),
    cameraCenterPull,
    cameraEdgePull: Math.max(cameraCenterPull, Number(ui.gameCameraEdgePullSlider.value)),
    cameraInnerZone,
    cameraEdgeZone,
    cameraGuardZone,
    zoom: gameZoom,
    minZoom,
    maxZoom,
  };
}

function setGameZoom(value) {
  const minZoom = Number(ui.gameMinZoomSlider.value);
  let maxZoom = Number(ui.gameMaxZoomSlider.value);
  if (maxZoom < minZoom) {
    maxZoom = minZoom;
    ui.gameMaxZoomSlider.value = String(maxZoom);
  }
  gameZoom = clamp(value, minZoom, maxZoom);
  ui.gameZoomSlider.min = String(minZoom);
  ui.gameZoomSlider.max = String(maxZoom);
  ui.gameZoomSlider.value = String(gameZoom);
  syncLabels();
  if (gameMode) {
    camera.scale = gameZoom;
    requestRender();
  }
}

function syncGameZoomRange() {
  setGameZoom(clamp(gameZoom, Number(ui.gameMinZoomSlider.value), Number(ui.gameMaxZoomSlider.value)));
}

function currentConfig() {
  writeSelectedRuleFromControls();
  const rule = selectedRule();
  return {
    radius: Number(ui.radiusSlider.value),
    alpha: Number(ui.alphaSlider.value),
    mu: Number(ui.muSlider.value),
    sigma: Number(ui.sigmaSlider.value),
    dt: Number(ui.dtSlider.value),
    gain: Number(ui.gainSlider.value),
    decay: Number(ui.decaySlider.value),
    limitValue: ui.limitToggle.checked,
    wrapAround: ui.wrapToggle.checked,
    deltaName: rule.deltaName,
    coreName: rule.coreName,
    layer: rule.layer,
    beta: [...rule.beta],
    eta: [...rule.eta],
    weight: Number(rule.weight ?? 1),
    positiveOnly: Boolean(rule.positiveOnly),
    id: rule.id,
    src: rule.sourceChannelId,
    dst: rule.destinationChannelId,
    sourceChannelId: rule.sourceChannelId,
    destinationChannelId: rule.destinationChannelId,
  };
}

function currentBrushConfig() {
  return {
    size: Number(ui.brushSizeSlider.value),
    power: Number(ui.brushPowerSlider.value),
  };
}

function formMapInfo(form) {
  if (!form) return null;
  return {
    id: form.id,
    index: form.index,
    code: form.code,
    rawCode: form.rawCode,
    name: form.name,
    section: form.section,
    rule: form.rule,
    assetPath: form.assetPath,
  };
}

function pendingPlacementMapInfo() {
  if (!pendingPlacement) return null;
  return {
    form: formMapInfo(pendingPlacement.form),
    x: pendingPlacement.x,
    y: pendingPlacement.y,
    scale: pendingPlacement.scale,
    angle: pendingPlacement.angle,
  };
}

function buildMapConfiguration(snapshot) {
  const collection = activeCollection();
  const group = activeGroup();
  const model = simulationModel();
  return {
    speed: Number(ui.speedSlider.value),
    backendPreference,
    activeBackend,
    rule: currentConfig(),
    layers: model,
    advanced: {
      safe: currentSafeArea(),
      colors: channels[0]?.palette || DEFAULT_COLORS,
    },
    brush: currentBrushConfig(),
    game: gameSettings(),
    state: {
      simTime: snapshot.simTime ?? simTime,
      isRunning,
      gameMode,
      currentTool,
      metrics: snapshot.metrics || metrics,
    },
    camera: { ...camera },
    gamePlayer: { ...gamePlayer },
    library: {
      activeCollectionIndex,
      activeGroupIndex,
      collectionId: collection?.id || null,
      collectionTitle: collection?.title || null,
      groupId: group?.id || null,
      groupTitle: group?.title || null,
      groupRule: group?.ruleText || null,
      selectedForm: formMapInfo(selectedForm),
    },
    pendingPlacement: pendingPlacementMapInfo(),
  };
}

function float32ArrayToBase64(values) {
  return MapCodec.encodeFloat32(values);
}

function fileSafeName(value) {
  return String(value || "map")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "map";
}

function mapTimestamp(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/[:.]/g, "-").replace("T", "_");
}

function downloadMapFile(map, savedAt) {
  const blob = new Blob([JSON.stringify(map, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const formName = selectedForm ? `-${fileSafeName(selectedForm.name)}` : "";
  link.href = url;
  link.download = `leniency${formName}-${mapTimestamp(savedAt)}.map`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function requestWorkerSnapshot() {
  if (!simWorker) return Promise.reject(new Error("Simulation worker is not available."));
  const requestId = ++snapshotRequestId;
  const revision = backendRevision;
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      pendingSnapshotRequests.delete(requestId);
      reject(new Error("Timed out while saving the map."));
    }, SNAPSHOT_TIMEOUT_MS);

    pendingSnapshotRequests.set(requestId, { resolve, reject, timeoutId, revision });
    postWorker("snapshot", { requestId });
  });
}

function rejectPendingSnapshotRequests(reason) {
  const error = reason instanceof Error ? reason : new Error(String(reason || "Snapshot request was cancelled."));
  for (const [requestId, pending] of pendingSnapshotRequests) {
    window.clearTimeout(pending.timeoutId);
    pending.reject(error);
    pendingSnapshotRequests.delete(requestId);
  }
}

async function readFieldSnapshot() {
  if (usingWebgl()) {
    const snapshot = webglSim.snapshot();
    return {
      ...snapshot,
      simTime,
      metrics,
    };
  }
  return requestWorkerSnapshot();
}

async function saveMapFile() {
  ui.saveMapBtn.disabled = true;
  ui.saveMapBtn.setAttribute("aria-busy", "true");
  try {
    const snapshot = await readFieldSnapshot();
    const savedAt = new Date();
    const map = {
      type: "leniency-map",
      name: "Leniency Map",
      version: MAP_FILE_VERSION,
      savedAt: savedAt.toISOString(),
      world: {
        width: snapshot.width,
        height: snapshot.height,
      },
      configuration: buildMapConfiguration(snapshot),
      fields: (snapshot.channels || []).map((channel) => ({
        channelId: channel.id,
        encoding: "float32-base64",
        littleEndian: true,
        length: channel.values.length,
        data: float32ArrayToBase64(channel.values),
      })),
    };
    downloadMapFile(map, savedAt);
  } catch (error) {
    console.error(error);
    ui.stateLabel.textContent = "Save failed";
    ui.stateLabel.title = String(error?.message || error);
  } finally {
    ui.saveMapBtn.disabled = false;
    ui.saveMapBtn.removeAttribute("aria-busy");
  }
}

function applyLoadedModel(model) {
  channels = model.channels.map(cloneChannel);
  rules = model.rules.map(cloneRule);
  selectedChannelId = channels.some((channel) => channel.id === model.selectedChannelId)
    ? model.selectedChannelId
    : channels[0]?.id || "channel-0";
  metricScope = model.metricScope === "aggregate" ? "aggregate" : "selected";
  ui.wrapToggle.checked = model.wrapAround !== false;
  nextChannelSerial =
    channels.reduce((max, channel) => {
      const match = String(channel.id).match(/channel-(\d+)/);
      return Math.max(max, match ? Number(match[1]) + 1 : 0);
    }, 0) || channels.length;
  for (const channel of channels) ensureLayerRule(channel.id);
  syncSelectedLayerControls();
}

function restoreMapInterface(configuration = {}) {
  setSliderValue(ui.speedSlider, configuration.speed);
  setSliderValue(ui.safeSlider, configuration.advanced?.safe);
  setSliderValue(ui.brushSizeSlider, configuration.brush?.size);
  setSliderValue(ui.brushPowerSlider, configuration.brush?.power);

  const game = configuration.game || {};
  if (["stars", "none"].includes(game.background)) ui.gameBackgroundSelect.value = game.background;
  for (const [input, value, percent = false] of [
    [ui.gameStarDensitySlider, game.starDensity],
    [ui.gameStarSpeedSlider, game.starSpeed],
    [ui.gameStarBrightnessSlider, game.starBrightness],
    [ui.gameAccelSlider, game.accel],
    [ui.gameSpeedSlider, game.maxSpeed],
    [ui.gameFrictionSlider, game.friction],
    [ui.gameMouseSensitivitySlider, game.mouseSensitivity],
    [ui.gameBrushIntervalSlider, game.brushInterval],
    [ui.gameCameraCenterPullSlider, game.cameraCenterPull],
    [ui.gameCameraEdgePullSlider, game.cameraEdgePull],
    [ui.gameCameraInnerZoneSlider, game.cameraInnerZone, true],
    [ui.gameCameraEdgeZoneSlider, game.cameraEdgeZone, true],
    [ui.gameCameraGuardZoneSlider, game.cameraGuardZone, true],
    [ui.gameMinZoomSlider, game.minZoom],
    [ui.gameMaxZoomSlider, game.maxZoom],
  ]) {
    setSliderValue(input, percent && Number.isFinite(Number(value)) ? Number(value) * 100 : value);
  }
  syncGameZoomRange();
  setGameZoom(Number.isFinite(Number(game.zoom)) ? Number(game.zoom) : gameZoom);

  const savedCamera = configuration.camera;
  if (savedCamera && typeof savedCamera === "object") {
    if (Number.isFinite(Number(savedCamera.x))) camera.x = Number(savedCamera.x);
    if (Number.isFinite(Number(savedCamera.y))) camera.y = Number(savedCamera.y);
    if (Number.isFinite(Number(savedCamera.scale))) camera.scale = clamp(Number(savedCamera.scale), 0.65, 64);
  }
  const savedPlayer = configuration.gamePlayer;
  if (savedPlayer && typeof savedPlayer === "object") {
    if (Number.isFinite(Number(savedPlayer.x))) gamePlayer.x = Number(savedPlayer.x);
    if (Number.isFinite(Number(savedPlayer.y))) gamePlayer.y = Number(savedPlayer.y);
    if (Number.isFinite(Number(savedPlayer.vx))) gamePlayer.vx = Number(savedPlayer.vx);
    if (Number.isFinite(Number(savedPlayer.vy))) gamePlayer.vy = Number(savedPlayer.vy);
    gamePlayer.initialized = Boolean(savedPlayer.initialized);
  }

  const savedTool = configuration.state?.currentTool;
  setTool(["pan", "form", "paint", "erase", "sample"].includes(savedTool) ? savedTool : currentTool);

  const savedLibrary = configuration.library;
  if (savedLibrary && typeof savedLibrary === "object") {
    const collectionIndex = lifeformCollections.findIndex((collection) => collection.id === savedLibrary.collectionId);
    if (collectionIndex >= 0) {
      activeCollectionIndex = collectionIndex;
      const groupIndex = lifeformCollections[collectionIndex].groups.findIndex((group) => group.id === savedLibrary.groupId);
      activeGroupIndex = groupIndex >= 0 ? groupIndex : 0;
    }
    const formId = savedLibrary.selectedForm?.id;
    const restoredForm = catalogForms.find((form) => form.id === formId);
    if (restoredForm) selectedForm = restoredForm;
    renderGroupOrganizer();
    renderFormList();
    if (selectedForm) {
      const collection = activeCollection();
      const group = activeGroup();
      ui.selectedForm.textContent = `${selectedForm.code} - ${selectedForm.name}\n${
        collection && group ? `${collection.title} / ${group.title}` : group?.title || ""
      }`;
    }
  }

  const savedPlacement = configuration.pendingPlacement;
  if (savedPlacement && typeof savedPlacement === "object") {
    const form = catalogForms.find((candidate) => candidate.id === savedPlacement.form?.id);
    if (form) {
      if (!form.cellData) form.cellData = parseCellArray(form.cells);
      pendingPlacement = {
        form,
        cellData: form.cellData,
        x: clamp(Number.isFinite(Number(savedPlacement.x)) ? Number(savedPlacement.x) : worldWidth / 2, 0, worldWidth),
        y: clamp(Number.isFinite(Number(savedPlacement.y)) ? Number(savedPlacement.y) : worldHeight / 2, 0, worldHeight),
        scale: clamp(Number(savedPlacement.scale) || 1, 0.25, 5),
        angle: Number.isFinite(Number(savedPlacement.angle)) ? Number(savedPlacement.angle) : 0,
      };
    }
  } else {
    pendingPlacement = null;
  }

  syncLabels();
  return typeof configuration.state?.isRunning === "boolean" ? configuration.state.isRunning : null;
}

async function loadMapFile(file) {
  if (!file) return;
  const wasRunning = isRunning;
  ui.loadMapBtn.disabled = true;
  ui.loadMapBtn.setAttribute("aria-busy", "true");
  try {
    const decoded = await MapCodec.readMapFile(file);
    const { map, width, height, fields: loadedFields } = decoded;
    const model = decoded.model;
    setRunning(false);
    pendingStepCount = 0;
    workerBusy = false;
    backendRevision += 1;
    applyLoadedModel(model);
    worldWidth = width;
    worldHeight = height;
    syncWorldSizeControl(width);
    camera.x = worldWidth / 2;
    camera.y = worldHeight / 2;
    gamePlayer.x = worldWidth / 2;
    gamePlayer.y = worldHeight / 2;
    makeBuffers();
    const restoredRunning = restoreMapInterface(map.configuration);
    clampCamera();
    const savedTime = Number(map.configuration?.state?.simTime);
    simTime = Number.isFinite(savedTime) && savedTime >= 0 ? savedTime : 0;
    metrics = { mass: 0, growth: 0, energy: 0 };
    const savedPreference = map.configuration?.backendPreference;
    if (["auto", "webgl", "cpu"].includes(savedPreference)) {
      backendPreference = savedPreference;
      ui.backendSelect.value = savedPreference;
      startBackend({ resetField: false });
    }
    sendBackend(
      "loadSnapshot",
      {
        snapshot: {
          width,
          height,
          simTime,
          model: simulationModel(),
          channels: loadedFields,
        },
      },
      loadedFields.map((field) => field.values.buffer),
    );
    requestRender();
    updateMetrics();
    setRunning(restoredRunning ?? wasRunning);
  } catch (error) {
    console.error(error);
    setRunning(wasRunning);
    ui.stateLabel.textContent = "Load failed";
    ui.stateLabel.title = String(error?.message || error);
  } finally {
    ui.loadMapBtn.disabled = false;
    ui.loadMapBtn.removeAttribute("aria-busy");
  }
}

function setSliderValue(slider, value) {
  if (value == null || Number.isNaN(value)) return;
  const min = Number(slider.min);
  const max = Number(slider.max);
  slider.value = String(clamp(value, min, max));
}

function normalizeWorldSize(value) {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed)) return worldWidth;
  return Math.round(clamp(parsed, MIN_WORLD_SIZE, MAX_WORLD_SIZE));
}

function syncWorldSizeControl(width = worldWidth, height = worldHeight, { forceCustom = false } = {}) {
  const text = String(width);
  const hasPreset =
    !forceCustom && width === height && [...ui.worldSizeSelect.options].some((option) => option.value === text);
  ui.worldSizeSelect.value = hasPreset ? text : "custom";
  if (ui.customWorldSizeFields) ui.customWorldSizeFields.hidden = hasPreset;
  if (ui.customWorldWidth) ui.customWorldWidth.value = String(width);
  if (ui.customWorldHeight) ui.customWorldHeight.value = String(height);
}

function resizeFromCustomWorldSize() {
  const width = normalizeWorldSize(ui.customWorldWidth?.value);
  const height = normalizeWorldSize(ui.customWorldHeight?.value);
  resizeWorld(width, height);
}

function postWorker(type, payload = {}, transfer = []) {
  if (!simWorker) return false;
  simWorker.postMessage({ type, revision: backendRevision, ...payload }, transfer);
  return true;
}

function usingWebgl() {
  return Boolean(activeBackend === "webgl" && webglSim);
}

function backendReady() {
  return usingWebgl() || workerReady;
}

function webglUnavailableForModel(model = simulationModel()) {
  if (model.channels.length < 1) return "Model has no layers.";
  if (model.channels.length > MAX_CHANNELS) return `WebGL v1 supports up to ${MAX_CHANNELS} layers.`;
  if (model.rules.length > WEBGL_MAX_RULES) return `WebGL v1 supports up to ${WEBGL_MAX_RULES} rules.`;
  const ids = new Set(model.channels.map((channel) => channel.id));
  if (model.rules.some((rule) => !ids.has(rule.sourceChannelId) || !ids.has(rule.destinationChannelId))) {
    return "WebGL rules need valid source and destination layers.";
  }
  return "";
}

function modelCanUseWebgl(model = simulationModel()) {
  return !webglUnavailableForModel(model);
}

function switchFromWebglToCpu(model, { reason = "", replay = null } = {}) {
  let snapshot = null;
  try {
    snapshot = webglSim?.snapshot() || null;
  } catch (snapshotError) {
    console.error("Could not preserve the WebGL field during fallback.", snapshotError);
  }
  if (reason) webglUnavailableReason = reason;
  activeBackend = "cpu";
  glCanvas.hidden = true;
  startWorker();
  if (snapshot) {
    postWorker("loadSnapshot", {
      snapshot: {
        ...snapshot,
        model,
        simTime,
      },
    });
  }
  if (replay) postWorker(replay.type, replay.payload, replay.transfer || []);
  setStateLabel();
  syncBackendLabel();
  if (reason) {
    ui.stateLabel.textContent = "CPU fallback";
    ui.stateLabel.title = `WebGL failed: ${reason}`;
  }
}

function backendName() {
  return usingWebgl() ? "WebGL" : "CPU";
}

function syncBackendLabel() {
  const suffix = backendPreference === "auto" ? " auto" : "";
  ui.backendLabel.textContent = `${backendName()}${suffix}`;
  ui.backendLabel.title = usingWebgl()
    ? "WebGL packed float-texture simulation. Step sim is CPU dispatch time unless GPU timer support is added."
    : webglUnavailableReason
      ? `CPU worker fallback. WebGL unavailable: ${webglUnavailableReason}`
      : "CPU worker simulation";
  ui.simMsLabel.title = usingWebgl() ? "WebGL dispatch time, not a blocking GPU timer." : "CPU worker step time.";
}

function setStateLabel() {
  if (!backendReady()) {
    ui.stateLabel.textContent = usingWebgl() ? "Loading WebGL" : "Loading worker";
    return;
  }
  ui.stateLabel.textContent = isRunning ? "Running" : "Paused";
}

function configureBackend() {
  const model = simulationModel();
  if (usingWebgl() && modelCanUseWebgl(model)) {
    try {
      webglSim.setModel(model);
    } catch (error) {
      console.error(error);
      switchFromWebglToCpu(model, { reason: String(error?.message || error) });
    }
    return;
  }
  if (usingWebgl()) {
    webglUnavailableReason = webglUnavailableForModel(model);
    switchFromWebglToCpu(model);
    return;
  }
  postWorker("model", { model });
}

function scheduleBackendConfiguration() {
  if (configureBackendFrame) return;
  configureBackendFrame = requestAnimationFrame(() => {
    configureBackendFrame = 0;
    configureBackend();
  });
}

function setBackendPalette() {
  configureBackend();
}

function sendBackend(type, payload = {}, transfer = []) {
  if (!usingWebgl()) {
    return postWorker(type, payload, transfer);
  }

  try {
    if (type === "resize") {
      webglSim.resize(payload.width, payload.height);
      metrics = webglSim.metrics;
      profile = { ...profile, ...webglSim.profile };
    } else if (type === "clear") {
      webglSim.clear();
      metrics = webglSim.metrics;
      profile = { ...profile, ...webglSim.profile };
    } else if (type === "randomize") {
      webglSim.randomize(payload.rect, payload.channelId);
      metrics = webglSim.metrics;
      profile = { ...profile, ...webglSim.profile };
    } else if (type === "place") {
      webglSim.place(payload.placement);
      profile = { ...profile, ...webglSim.profile };
    } else if (type === "brush") {
      webglSim.brush(payload);
      profile = { ...profile, ...webglSim.profile };
    } else if (type === "sample") {
      ui.sampleLabel.textContent = webglSim.sample(payload.x, payload.y, payload.channelId, payload.scope).toFixed(3);
    } else if (type === "loadSnapshot") {
      webglSim.loadSnapshot(payload.snapshot);
      if (metricsEnabled) metrics = webglSim.readMetrics(performance.now(), true) || webglSim.metrics;
      profile = { ...profile, ...webglSim.profile };
    } else {
      throw new TypeError(`Unsupported WebGL command "${type}".`);
    }
    return true;
  } catch (error) {
    console.error(error);
    switchFromWebglToCpu(simulationModel(), {
      reason: String(error?.message || error),
      replay: { type, payload, transfer },
    });
    return false;
  }
}

function syncLabels() {
  ui.speedValue.textContent = ui.speedSlider.value;
  ui.radiusValue.textContent = ui.radiusSlider.value;
  ui.alphaValue.textContent = Number(ui.alphaSlider.value).toFixed(1);
  ui.muValue.textContent = Number(ui.muSlider.value).toFixed(3);
  ui.sigmaValue.textContent = Number(ui.sigmaSlider.value).toFixed(3);
  ui.dtValue.textContent = Number(ui.dtSlider.value).toFixed(3);
  ui.gainValue.textContent = Number(ui.gainSlider.value).toFixed(2);
  ui.decayValue.textContent = Number(ui.decaySlider.value).toFixed(3);
  ui.safeValue.textContent = ui.safeSlider.value;
  ui.gameStarDensityValue.textContent = ui.gameStarDensitySlider.value;
  ui.gameStarSpeedValue.textContent = Number(ui.gameStarSpeedSlider.value).toFixed(1);
  ui.gameStarBrightnessValue.textContent = Number(ui.gameStarBrightnessSlider.value).toFixed(2);
  ui.gameAccelValue.textContent = ui.gameAccelSlider.value;
  ui.gameSpeedValue.textContent = ui.gameSpeedSlider.value;
  ui.gameFrictionValue.textContent = Number(ui.gameFrictionSlider.value).toFixed(1);
  ui.gameMouseSensitivityValue.textContent = Number(ui.gameMouseSensitivitySlider.value).toFixed(3);
  ui.gameBrushIntervalValue.textContent = ui.gameBrushIntervalSlider.value;
  ui.gameCameraCenterPullValue.textContent = Number(ui.gameCameraCenterPullSlider.value).toFixed(2);
  ui.gameCameraEdgePullValue.textContent = Number(ui.gameCameraEdgePullSlider.value).toFixed(2);
  ui.gameCameraInnerZoneValue.textContent = ui.gameCameraInnerZoneSlider.value;
  ui.gameCameraEdgeZoneValue.textContent = ui.gameCameraEdgeZoneSlider.value;
  ui.gameCameraGuardZoneValue.textContent = ui.gameCameraGuardZoneSlider.value;
  ui.gameMinZoomValue.textContent = Number(ui.gameMinZoomSlider.value).toFixed(1);
  ui.gameMaxZoomValue.textContent = Number(ui.gameMaxZoomSlider.value).toFixed(1);
  ui.gameZoomValue.textContent = Number(gameZoom).toFixed(1);
  ui.brushSizeValue.textContent = ui.brushSizeSlider.value;
  ui.brushPowerValue.textContent = Number(ui.brushPowerSlider.value).toFixed(2);
}

function updateMetrics() {
  ui.toggleMetricsBtn.textContent = metricsEnabled ? "Disable field metrics" : "Enable field metrics";
  ui.toggleMetricsBtn.setAttribute("aria-pressed", String(metricsEnabled));
  for (const row of ui.fieldMetricRows) row.hidden = !metricsEnabled;
  const scopedMetrics =
    metricScope === "aggregate" ? metrics.aggregate || metrics : metrics.perChannel?.[selectedChannelId] || metrics;
  ui.massLabel.textContent = Number(scopedMetrics.mass || 0).toFixed(4);
  ui.growthLabel.textContent = usingWebgl() ? "—" : Number(scopedMetrics.growth || 0).toFixed(4);
  ui.growthLabel.title = usingWebgl() ? "Growth reduction is available on the CPU backend." : "";
  ui.energyLabel.textContent = Number(scopedMetrics.energy || 0).toFixed(4);
  ui.timeLabel.textContent = `t ${simTime.toFixed(1)}`;
  ui.simMsLabel.textContent = profile.stepSimulationMs.toFixed(1);
  ui.colorizeMsLabel.textContent = profile.colorizeMs.toFixed(1);
  ui.bufferMsLabel.textContent = profile.updateFieldBufferMs.toFixed(1);
  ui.renderMsLabel.textContent = profile.renderMs.toFixed(1);
  ui.chunkLabel.textContent = usingWebgl() ? "GPU" : `${profile.simChunks}/${profile.activeChunks}`;
  ui.patchLabel.textContent = usingWebgl() ? "—" : String(profile.patches);
}

function resetRenderBuffer() {
  const [r, g, b] = hexToRgb(backgroundColor());
  fieldBufferCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  fieldBufferCtx.fillRect(0, 0, worldWidth, worldHeight);
  viewDirty = true;
}

function makeBuffers() {
  fieldBuffer.width = worldWidth;
  fieldBuffer.height = worldHeight;
  fieldBufferCtx = fieldBuffer.getContext("2d", { alpha: false });
  fieldBufferCtx.imageSmoothingEnabled = false;
  resetRenderBuffer();
}

function applyRuleInfo(info) {
  const rule = selectedRule();
  Object.assign(
    rule,
    cloneRule({
      ...rule,
      ...info,
      id: rule.id,
      sourceChannelId: rule.sourceChannelId,
      destinationChannelId: selectedChannelId,
    }),
  );
  currentRule = rule;
  syncRuleControls(rule);
  configureBackend();
  renderLayerPanel();
}

function rebuildPalette() {
  const channel = selectedChannel();
  if (!channel) return;
  channel.palette = ui.colorInputs.map((input) => input.value);
  syncPaletteControls();
  paletteVersion += 1;
  for (const form of catalogForms) {
    form.previewVersion = -1;
  }
  resetRenderBuffer();
  setBackendPalette();
  renderLayerPanel();
}

function resetAdvanced() {
  ui.radiusSlider.value = String(DEFAULT_ADVANCED.radius);
  ui.alphaSlider.value = String(DEFAULT_ADVANCED.alpha);
  ui.muSlider.value = String(DEFAULT_ADVANCED.mu);
  ui.sigmaSlider.value = String(DEFAULT_ADVANCED.sigma);
  ui.dtSlider.value = String(DEFAULT_ADVANCED.dt);
  ui.gainSlider.value = String(DEFAULT_ADVANCED.gain);
  ui.decaySlider.value = String(DEFAULT_ADVANCED.decay);
  ui.safeSlider.value = String(DEFAULT_ADVANCED.safe);
  ui.limitToggle.checked = DEFAULT_ADVANCED.limitValue;
  ui.wrapToggle.checked = DEFAULT_ADVANCED.wrapAround;
  const channel = selectedChannel();
  const defaultPalette = channel?.id === "channel-0" ? DEFAULT_COLORS : NEW_LAYER_PALETTES[nextLayerPaletteIndex % NEW_LAYER_PALETTES.length];
  defaultPalette.forEach((color, index) => {
    ui.colorInputs[index].value = color;
  });
  if (channel) channel.palette = normalizePalette(defaultPalette);
  const rule = selectedRule();
  Object.assign(
    rule,
    cloneRule({
      ...DEFAULT_RULE,
      id: rule.id,
      sourceChannelId: selectedChannelId,
      destinationChannelId: selectedChannelId,
    }),
  );
  currentRule = rule;
  syncLabels();
  rebuildPalette();
  configureBackend();
  syncSelectedLayerControls();
}

function syncSelectedLayerControls() {
  const channel = selectedChannel();
  if (!channel) return;
  selectedChannelId = channel.id;
  ensureLayerRule(channel.id);
  syncPaletteControls();
  syncRuleControls(selectedRule());
  if (ui.layerNameInput) ui.layerNameInput.value = channel.name;
  if (ui.layerVisibleToggle) ui.layerVisibleToggle.checked = channel.visible !== false;
  if (ui.metricScopeSelect) ui.metricScopeSelect.value = metricScope;
  renderLayerPanel();
  updateMetrics();
  requestRender();
}

function renderLayerPanel() {
  if (!ui.layerList) return;
  ui.layerList.innerHTML = "";
  for (const channel of channels) {
    const rule = ensureLayerRule(channel.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "layer-item";
    const isSelected = channel.id === selectedChannelId;
    if (isSelected) button.classList.add("selected");
    if (channel.visible === false) button.classList.add("muted");
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(isSelected));
    button.setAttribute("aria-label", `${channel.name}, ${channel.visible === false ? "hidden" : "visible"}`);

    const swatch = document.createElement("span");
    swatch.className = "layer-swatch";
    swatch.style.background = channel.palette[3] || channel.palette[0] || DEFAULT_COLORS[3];
    const name = document.createElement("span");
    name.className = "layer-name";
    name.textContent = channel.name;
    const link = document.createElement("span");
    link.className = "layer-link";
    const crossLinks = crossRulesForChannel(channel.id)
      .slice(0, 2)
      .map(
        (crossRule) =>
          `${channelById(crossRule.sourceChannelId)?.name || "Missing"} -> ${
            channelById(crossRule.destinationChannelId)?.name || "Missing"
          }`,
      );
    link.textContent = crossLinks.length
      ? `${channelById(rule.sourceChannelId)?.name || "Missing"} -> ${channel.name}; ${crossLinks.join(", ")}`
      : `${channelById(rule.sourceChannelId)?.name || "Missing"} -> ${channel.name}`;
    button.append(swatch, name, link);
    button.addEventListener("click", () => selectLayer(channel.id));
    ui.layerList.append(button);
  }

  const channel = selectedChannel();
  const rule = selectedRule();
  ui.addLayerBtn.disabled = channels.length >= MAX_CHANNELS;
  ui.removeLayerBtn.disabled = channels.length <= 1;
  ui.layerDestinationLabel.textContent = channel?.name || "-";
  ui.layerSourceSelect.innerHTML = "";
  for (const optionChannel of channels) {
    const option = document.createElement("option");
    option.value = optionChannel.id;
    option.textContent = optionChannel.name;
    ui.layerSourceSelect.append(option);
  }
  ui.layerSourceSelect.value = channelById(rule.sourceChannelId) ? rule.sourceChannelId : channel?.id || "";
}

function selectLayer(channelId) {
  if (!channelById(channelId)) return;
  writeSelectedRuleFromControls();
  selectedChannelId = channelId;
  syncSelectedLayerControls();
  configureBackend();
}

function addLayer() {
  if (channels.length >= MAX_CHANNELS) return;
  writeSelectedRuleFromControls();
  const baseChannelId = channels[0]?.id || "channel-0";
  const id = `channel-${nextChannelSerial}`;
  nextChannelSerial += 1;
  const paletteSource = NEW_LAYER_PALETTES[nextLayerPaletteIndex % NEW_LAYER_PALETTES.length];
  nextLayerPaletteIndex += 1;
  channels.push({
    id,
    name: `Layer ${channels.length + 1}`,
    palette: normalizePalette(paletteSource),
    visible: true,
  });
  rules.push(
    cloneRule({
      ...selectedRule(),
      id: `rule-${id}`,
      sourceChannelId: id,
      destinationChannelId: id,
    }),
  );
  if (baseChannelId !== id && !hasCrossChannelRule(id, baseChannelId)) {
    rules.push(
      createCrossChannelRule(id, baseChannelId, {
        id: `rule-${id}-feeds-${baseChannelId}`,
        weight: 0.16,
        positiveOnly: true,
      }),
    );
  }
  if (baseChannelId !== id && !hasCrossChannelRule(baseChannelId, id)) {
    rules.push(
      createCrossChannelRule(baseChannelId, id, {
        id: `rule-${baseChannelId}-feeds-${id}`,
        weight: 0.12,
        positiveOnly: true,
      }),
    );
  }
  selectedChannelId = id;
  syncSelectedLayerControls();
  configureBackend();
}

function removeSelectedLayer() {
  if (channels.length <= 1) return;
  const removeIndex = channels.findIndex((channel) => channel.id === selectedChannelId);
  if (removeIndex < 0) return;
  const removedId = selectedChannelId;
  channels.splice(removeIndex, 1);
  rules = rules.filter((rule) => rule.sourceChannelId !== removedId && rule.destinationChannelId !== removedId);
  selectedChannelId = channels[Math.max(0, removeIndex - 1)]?.id || channels[0].id;
  for (const channel of channels) ensureLayerRule(channel.id);
  syncSelectedLayerControls();
  configureBackend();
}

function renameSelectedLayer(value) {
  const channel = selectedChannel();
  if (!channel) return;
  channel.name = String(value || "Layer").slice(0, 36);
  renderLayerPanel();
}

function setSelectedLayerVisible(value) {
  const channel = selectedChannel();
  if (!channel) return;
  channel.visible = Boolean(value);
  renderLayerPanel();
  configureBackend();
  requestRender();
}

function setSelectedLayerSource(sourceChannelId) {
  if (!channelById(sourceChannelId)) return;
  selectedRule().sourceChannelId = sourceChannelId;
  renderLayerPanel();
  configureBackend();
}

function setMetricScope(value) {
  metricScope = value === "aggregate" ? "aggregate" : "selected";
  scheduleBackendConfiguration();
  updateMetrics();
}

function setMetricsEnabled(value) {
  metricsEnabled = Boolean(value);
  if (!metricsEnabled) metrics = { mass: 0, growth: 0, energy: 0 };
  scheduleBackendConfiguration();
  updateMetrics();
}

function clearField() {
  pendingStepCount = 0;
  pendingPlacement = null;
  simTime = 0;
  metrics = { mass: 0, growth: 0, energy: 0 };
  profile = {
    ...profile,
    stepSimulationMs: 0,
    colorizeMs: 0,
    updateFieldBufferMs: 0,
    activeChunks: 0,
    simChunks: 0,
    patches: 0,
  };
  resetRenderBuffer();
  updateMetrics();
  sendBackend("clear");
  requestRender();
}

function randomizeField() {
  pendingStepCount = 0;
  pendingPlacement = null;
  resetRenderBuffer();
  sendBackend("randomize", { rect: getActiveRect(currentSafeArea()), channelId: selectedChannelId });
  requestRender();
}

function resizeWorld(newWidth, newHeight = newWidth) {
  newWidth = normalizeWorldSize(newWidth);
  newHeight = normalizeWorldSize(newHeight);
  const oldWidth = worldWidth;
  const oldHeight = worldHeight;
  worldWidth = newWidth;
  worldHeight = newHeight;
  camera.x += (worldWidth - oldWidth) / 2;
  camera.y += (worldHeight - oldHeight) / 2;
  gamePlayer.x += (worldWidth - oldWidth) / 2;
  gamePlayer.y += (worldHeight - oldHeight) / 2;
  makeBuffers();
  clampCamera();
  syncWorldSizeControl(worldWidth, worldHeight);
  sendBackend("resize", { width: worldWidth, height: worldHeight });
  requestRender();
}

function setRunning(value) {
  isRunning = value;
  syncRunButton();
  setStateLabel();
  syncBackendLabel();
}

function syncRunButton() {
  const label = isRunning ? "Pause" : "Play";
  ui.runBtn.setAttribute("aria-label", label);
  ui.runBtn.title = label;
  ui.runBtn.querySelector(".sr-only").textContent = label;
  if (ui.runIcon) ui.runIcon.src = isRunning ? "assets/pause.png" : "assets/play.png";
}

function syncGameModeButton() {
  ui.gameModeBtn.classList.toggle("active", gameMode);
  ui.gameModeBtn.setAttribute("aria-pressed", gameMode ? "true" : "false");
  ui.gameModeBtn.textContent = gameMode ? "Exit" : "Game";
  ui.gameModeBtn.setAttribute("aria-label", gameMode ? "Exit Game Mode" : "Enter Game Mode");
  ui.gameModeBtn.title = gameMode ? "Exit Game Mode" : "Game Mode";
  document.body.classList.toggle("game-mode", gameMode);
}

function requestGamePointerLock() {
  if (!gameMode || document.pointerLockElement === canvas || !canvas.requestPointerLock) return;
  const request = canvas.requestPointerLock();
  if (request?.catch) request.catch(() => {});
}

function handlePointerLockChange() {
  const wasLocked = gameMouse.locked;
  gameMouse.locked = document.pointerLockElement === canvas;
  if (!gameMouse.locked) {
    gameMouse.dx = 0;
    gameMouse.dy = 0;
  }
  if (gameMode && wasLocked && !gameMouse.locked) setGameMode(false);
}

function handleGameMouseMove(event) {
  if (!gameMode || document.pointerLockElement !== canvas) return;
  gameMouse.dx += event.movementX || 0;
  gameMouse.dy += event.movementY || 0;
}

function setGameMode(value) {
  if (gameMode === value) return;
  gameMode = value;
  pendingPlacement = null;
  pointerState = null;
  gameKeys.clear();
  gameMouse.dx = 0;
  gameMouse.dy = 0;
  gameStarfield.reset();

  if (gameMode) {
    gameWasRunning = isRunning;
    gameSavedCamera = { ...camera };
    gameSavedWrapAround = ui.wrapToggle.checked;
    if (!gamePlayer.initialized) {
      gamePlayer.x = camera.x;
      gamePlayer.y = camera.y;
      gamePlayer.initialized = true;
    }
    gameBrushClock = gameSettings().brushInterval;
    setGameZoom(Number(ui.gameZoomSlider.value));
    camera.scale = gameZoom;
    ui.wrapToggle.checked = true;
    configureBackend();
    setRunning(true);
  } else {
    if (document.pointerLockElement === canvas && document.exitPointerLock) document.exitPointerLock();
    if (gameSavedWrapAround != null) {
      ui.wrapToggle.checked = gameSavedWrapAround;
      gameSavedWrapAround = null;
      configureBackend();
    }
    if (gameSavedCamera) camera = { ...gameSavedCamera };
    camera.scale = clamp(camera.scale, 0.65, 28);
    clampCamera();
    setRunning(gameWasRunning);
  }

  syncGameModeButton();
  requestRender();
}

function handleGameKeyDown(event) {
  const key = event.key.toLowerCase();
  if (!["w", "a", "s", "d"].includes(key)) return false;
  gameKeys.add(key);
  event.preventDefault();
  return true;
}

function handleGameKeyUp(event) {
  const key = event.key.toLowerCase();
  if (!["w", "a", "s", "d"].includes(key)) return false;
  gameKeys.delete(key);
  event.preventDefault();
  return true;
}

function gameCameraAxisDelta(offset, playerDelta, halfView, settings, dt) {
  const viewRadius = Math.max(0.001, halfView);
  const screenFraction = Math.abs(offset) / viewRadius;
  const outside = smoothstep((screenFraction - settings.cameraInnerZone) / (settings.cameraEdgeZone - settings.cameraInnerZone));
  const pull = settings.cameraCenterPull + (settings.cameraEdgePull - settings.cameraCenterPull) * outside;
  const follow = 1 - Math.exp(-dt * pull);
  const drag = smoothstep((screenFraction - settings.cameraInnerZone) / (settings.cameraGuardZone - settings.cameraInnerZone));
  const movingOutward = Math.abs(playerDelta) > 0.000001 && Math.sign(playerDelta) === Math.sign(offset);
  let cameraDelta = offset * follow;
  if (movingOutward) cameraDelta += playerDelta * drag;

  const guardedOffset = offset - cameraDelta;
  const guardLimit = viewRadius * settings.cameraGuardZone;
  const guardExcess = Math.abs(guardedOffset) - guardLimit;
  if (guardExcess > 0) {
    const guardFollow = 1 - Math.exp(-dt * 18);
    cameraDelta += Math.sign(guardedOffset) * guardExcess * guardFollow;
  }

  return cameraDelta;
}

function updateGameCamera(settings, dt, playerDeltaX, playerDeltaY) {
  const oldCameraX = camera.x;
  const oldCameraY = camera.y;
  camera.scale = settings.zoom;

  const halfViewX = cssWidth / (2 * camera.scale);
  const halfViewY = cssHeight / (2 * camera.scale);
  const cameraDeltaX = gameCameraAxisDelta(gamePlayer.x - camera.x, playerDeltaX, halfViewX, settings, dt);
  const cameraDeltaY = gameCameraAxisDelta(gamePlayer.y - camera.y, playerDeltaY, halfViewY, settings, dt);
  camera.x += cameraDeltaX;
  camera.y += cameraDeltaY;

  gameStarfield.update((camera.x - oldCameraX) * camera.scale, (camera.y - oldCameraY) * camera.scale, settings);
}

function updateGameMode(elapsed) {
  if (!gameMode) return;
  const settings = gameSettings();
  const dt = Math.min(0.05, elapsed / 1000);
  let inputX = 0;
  let inputY = 0;
  if (gameKeys.has("a")) inputX -= 1;
  if (gameKeys.has("d")) inputX += 1;
  if (gameKeys.has("w")) inputY -= 1;
  if (gameKeys.has("s")) inputY += 1;
  if (gameMouse.dx || gameMouse.dy) {
    inputX += clamp(gameMouse.dx * settings.mouseSensitivity, -1, 1);
    inputY += clamp(gameMouse.dy * settings.mouseSensitivity, -1, 1);
    gameMouse.dx = 0;
    gameMouse.dy = 0;
  }
  const inputLength = Math.hypot(inputX, inputY);
  if (inputLength > 0) {
    inputX /= inputLength;
    inputY /= inputLength;
  }

  gamePlayer.vx += inputX * settings.accel * dt;
  gamePlayer.vy += inputY * settings.accel * dt;
  const friction = Math.max(0, 1 - settings.friction * dt);
  gamePlayer.vx *= friction;
  gamePlayer.vy *= friction;
  const speed = Math.hypot(gamePlayer.vx, gamePlayer.vy);
  if (speed > settings.maxSpeed) {
    const ratio = settings.maxSpeed / speed;
    gamePlayer.vx *= ratio;
    gamePlayer.vy *= ratio;
  }

  const moveX = gamePlayer.vx * dt;
  const moveY = gamePlayer.vy * dt;
  gamePlayer.x += moveX;
  gamePlayer.y += moveY;

  gameBrushClock += elapsed;
  if (backendReady() && gameBrushClock >= settings.brushInterval) {
    paintAt(gamePlayer, "paint");
    gameBrushClock = 0;
  }

  updateGameCamera(settings, dt, moveX, moveY);
  requestRender();
}

function setTab(name) {
  for (const entry of [
    { name: "time", button: ui.timeTabBtn, panel: ui.timeTab },
    { name: "game", button: ui.gameTabBtn, panel: ui.gameTab },
    { name: "advanced", button: ui.advancedTabBtn, panel: ui.advancedTab },
  ]) {
    const active = name === entry.name;
    entry.button.classList.toggle("active", active);
    entry.button.setAttribute("aria-selected", String(active));
    entry.button.tabIndex = active ? 0 : -1;
    entry.panel.classList.toggle("active", active);
    entry.panel.hidden = !active;
    entry.panel.setAttribute("aria-hidden", String(!active));
  }
}

function setTool(tool) {
  currentTool = tool;
  ui.panToolBtn.classList.toggle("active", tool === "pan");
  ui.lifeToolBtn.classList.toggle("active", tool === "form");
  ui.paintToolBtn.classList.toggle("active", tool === "paint");
  ui.eraseToolBtn.classList.toggle("active", tool === "erase");
  ui.sampleToolBtn.classList.toggle("active", tool === "sample");
  ui.panToolBtn.setAttribute("aria-pressed", String(tool === "pan"));
  ui.lifeToolBtn.setAttribute("aria-pressed", String(tool === "form"));
  ui.paintToolBtn.setAttribute("aria-pressed", String(tool === "paint"));
  ui.eraseToolBtn.setAttribute("aria-pressed", String(tool === "erase"));
  ui.sampleToolBtn.setAttribute("aria-pressed", String(tool === "sample"));
  canvas.style.cursor = tool === "pan" ? "grab" : tool === "form" ? "copy" : tool === "sample" ? "crosshair" : "cell";
}

function selectForm(form) {
  selectedForm = form;
  setTool("form");
  if (!selectedForm.cellData) selectedForm.cellData = parseCellArray(selectedForm.cells);
  const group = activeGroup();
  if (group?.perFormRule) applyRuleInfo(selectedForm.ruleInfo);
  const collection = activeCollection();
  ui.selectedForm.textContent = `${selectedForm.code} - ${selectedForm.name}\n${
    collection && group ? `${collection.title} / ${group.title}` : group?.title || ""
  }`;
  renderGroupOrganizer();
  renderFormList();
}

function activeGroup() {
  return collectionGroups()[activeGroupIndex] || null;
}

function formSearchText(form) {
  return `${form.code} ${form.rawCode} ${form.name} ${form.section} ${(form.groups || []).join(" ")} ${
    form.sourceTitle || ""
  }`.toLowerCase();
}

function renderFormList() {
  const query = ui.formSearch.value.trim().toLowerCase();
  const group = activeGroup();
  const forms = group ? group.forms : [];
  const fragment = document.createDocumentFragment();
  let renderedCount = 0;
  for (const form of forms) {
    if (query && !formSearchText(form).includes(query)) continue;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "form-item";
    if (selectedForm === form) button.classList.add("selected");

    const image = document.createElement("img");
    image.className = "form-preview";
    image.src = form.assetPath;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      image.hidden = true;
    });
    const code = document.createElement("span");
    code.className = "form-code";
    code.textContent = form.code;
    const name = document.createElement("span");
    name.className = "form-name";
    name.textContent = form.name;
    const label = document.createElement("span");
    label.className = "form-label";
    label.append(code, name);
    button.append(image, label);
    button.title = `${form.code} ${form.name}\n${form.rule}`;
    button.addEventListener("click", () => selectForm(form));
    fragment.append(button);
    renderedCount += 1;
  }

  if (!renderedCount) {
    const empty = document.createElement("div");
    empty.className = "form-empty";
    empty.textContent = query ? "No forms match this search." : "No forms in this group.";
    fragment.append(empty);
  }
  ui.formList.replaceChildren(fragment);
}

function renderGroupOrganizer() {
  ui.collectionSelect.innerHTML = "";
  lifeformCollections.forEach((collection, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${collection.title} (${collectionFormCount(collection)})`;
    ui.collectionSelect.append(option);
  });

  const collection = activeCollection();
  const groups = collectionGroups(collection);
  ui.collectionSelect.disabled = lifeformCollections.length <= 1;
  if (collection) ui.collectionSelect.value = String(activeCollectionIndex);

  ui.groupSelect.innerHTML = "";
  groups.forEach((group, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index + 1}. ${group.title} (${group.forms.length})`;
    ui.groupSelect.append(option);
  });

  const group = activeGroup();
  ui.groupSelect.disabled = groups.length <= 1;
  ui.prevGroupBtn.disabled = groups.length <= 1;
  ui.nextGroupBtn.disabled = groups.length <= 1;
  ui.libraryCount.textContent = collection
    ? `${collectionFormCount(collection)} forms | ${groups.length} subcollections`
    : "0 forms";
  if (group) {
    ui.groupSelect.value = String(activeGroupIndex);
    ui.groupRule.textContent = groupRuleLabel(group);
    ui.groupRule.title = `${group.ruleText}${group.missingItems.length ? `\nMissing: ${group.missingItems.join(", ")}` : ""}`;
  } else {
    ui.groupRule.textContent = "No subcollection selected";
    ui.groupRule.title = "";
  }
}

function groupAlertDisabled() {
  try {
    return localStorage.getItem(SKIP_GROUP_ALERT_KEY) === "1";
  } catch {
    return false;
  }
}

function setGroupAlertDisabled(value) {
  try {
    if (value) localStorage.setItem(SKIP_GROUP_ALERT_KEY, "1");
  } catch {
    // Ignore storage failures; the dialog still works for this session.
  }
}

function commitCatalogSelection(collectionIndex, groupIndex, { selectFirst = true } = {}) {
  const collection = lifeformCollections[collectionIndex];
  const group = collection?.groups[groupIndex];
  if (!group) return;
  activeCollectionIndex = collectionIndex;
  activeGroupIndex = groupIndex;
  pendingCollectionIndex = -1;
  pendingGroupIndex = -1;
  pendingPlacement = null;
  const query = ui.formSearch.value.trim().toLowerCase();
  const firstVisible = group.forms.find((form) => {
    return !query || formSearchText(form).includes(query);
  });
  if (selectFirst) selectedForm = firstVisible || null;
  applyRuleInfo(group.perFormRule && firstVisible ? firstVisible.ruleInfo : group.ruleInfo);
  renderGroupOrganizer();
  renderFormList();
  if (selectFirst) {
    if (firstVisible) selectForm(firstVisible);
    else {
      selectedForm = null;
      ui.selectedForm.textContent = "No form selected";
      renderGroupOrganizer();
    }
  }
  requestRender();
}

function setDialogBackgroundInert(value) {
  if (value) {
    inertDialogSiblings = [...document.body.children].filter(
      (element) => element !== ui.groupChangeDialog && !element.inert,
    );
    for (const element of inertDialogSiblings) element.inert = true;
    return;
  }
  for (const element of inertDialogSiblings) element.inert = false;
  inertDialogSiblings = [];
}

function hideGroupChangeDialog() {
  ui.groupChangeDialog.hidden = true;
  ui.groupChangeDialog.setAttribute("aria-hidden", "true");
  setDialogBackgroundInert(false);
  pendingCollectionIndex = -1;
  pendingGroupIndex = -1;
  ui.skipGroupAlert.checked = false;
  ui.collectionSelect.value = String(activeCollectionIndex);
  ui.groupSelect.value = String(activeGroupIndex);
  groupDialogReturnFocus?.focus?.();
  groupDialogReturnFocus = null;
}

function showGroupChangeDialog(collectionIndex, groupIndex) {
  const collection = lifeformCollections[collectionIndex];
  const group = collection?.groups[groupIndex];
  if (!group) return;
  pendingCollectionIndex = collectionIndex;
  pendingGroupIndex = groupIndex;
  groupDialogReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  ui.groupChangeMessage.textContent = `Changing to ${collection.title} / ${group.title} updates the field's simulation values to ${groupRuleLabel(group)}. Existing lifeforms may become unstable.`;
  ui.groupChangeDialog.hidden = false;
  ui.groupChangeDialog.setAttribute("aria-hidden", "false");
  setDialogBackgroundInert(true);
  ui.confirmGroupChangeBtn.focus();
}

function requestCatalogSelection(collectionIndex, groupIndex) {
  const collection = lifeformCollections[collectionIndex];
  const group = collection?.groups[groupIndex];
  if (!group) {
    renderGroupOrganizer();
    return;
  }

  if (collectionIndex === activeCollectionIndex && groupIndex === activeGroupIndex) {
    ui.groupSelect.value = String(activeGroupIndex);
    return;
  }

  if (activeGroupIndex < 0 || groupAlertDisabled()) {
    commitCatalogSelection(collectionIndex, groupIndex);
    return;
  }

  showGroupChangeDialog(collectionIndex, groupIndex);
}

function requestCollectionChange(index) {
  const collection = lifeformCollections[index];
  requestCatalogSelection(index, defaultGroupIndex(collection));
}

function requestGroupChange(index) {
  requestCatalogSelection(activeCollectionIndex, index);
}

function moveGroup(offset) {
  const groups = collectionGroups();
  if (!groups.length) return;
  const nextIndex = (activeGroupIndex + offset + groups.length) % groups.length;
  requestGroupChange(nextIndex);
}

function screenToWorld(screenX, screenY) {
  return {
    x: (screenX - cssWidth / 2) / camera.scale + camera.x,
    y: (screenY - cssHeight / 2) / camera.scale + camera.y,
  };
}

function worldToScreen(worldX, worldY) {
  return {
    x: (worldX - camera.x) * camera.scale + cssWidth / 2,
    y: (worldY - camera.y) * camera.scale + cssHeight / 2,
  };
}

function eventPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function clampCamera() {
  if (gameMode || !cssWidth || !cssHeight) return;
  const margin = 80;
  const halfW = cssWidth / (2 * camera.scale);
  const halfH = cssHeight / (2 * camera.scale);
  const minX = -margin + halfW;
  const maxX = worldWidth + margin - halfW;
  const minY = -margin + halfH;
  const maxY = worldHeight + margin - halfH;
  camera.x = minX > maxX ? worldWidth / 2 : clamp(camera.x, minX, maxX);
  camera.y = minY > maxY ? worldHeight / 2 : clamp(camera.y, minY, maxY);
}

function getActiveRect(extraCells = 0) {
  const topLeft = screenToWorld(0, 0);
  const bottomRight = screenToWorld(cssWidth, cssHeight);
  const left = Math.max(0, Math.floor(Math.min(topLeft.x, bottomRight.x) - extraCells));
  const top = Math.max(0, Math.floor(Math.min(topLeft.y, bottomRight.y) - extraCells));
  const right = Math.min(worldWidth, Math.ceil(Math.max(topLeft.x, bottomRight.x) + extraCells));
  const bottom = Math.min(worldHeight, Math.ceil(Math.max(topLeft.y, bottomRight.y) + extraCells));
  return {
    left: Math.min(left, right),
    top: Math.min(top, bottom),
    right,
    bottom,
  };
}

function visibleWorldRect() {
  return getActiveRect(1);
}

function requestRender() {
  viewDirty = true;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  cssWidth = Math.max(1, rect.width);
  cssHeight = Math.max(1, rect.height);
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  if (!gameMode) clampCamera();
  requestRender();
}

function buildPreviewCanvas(form) {
  if (form.previewCanvas && form.previewVersion === paletteVersion) return form.previewCanvas;
  if (!form.cellData) form.cellData = parseCellArray(form.cells);

  const preview = document.createElement("canvas");
  preview.width = Math.max(1, form.cellData.width);
  preview.height = Math.max(1, form.cellData.height);
  const previewCtx = preview.getContext("2d");
  const image = previewCtx.createImageData(preview.width, preview.height);

  for (let y = 0; y < form.cellData.height; y += 1) {
    for (let x = 0; x < form.cellData.width; x += 1) {
      const value = form.cellData.rows[y]?.[x] || 0;
      const [r, g, b] = colorRamp(value);
      const p = (y * preview.width + x) * 4;
      image.data[p] = r;
      image.data[p + 1] = g;
      image.data[p + 2] = b;
      image.data[p + 3] = value > 0 ? 210 : 0;
    }
  }

  previewCtx.putImageData(image, 0, 0);
  form.previewCanvas = preview;
  form.previewVersion = paletteVersion;
  return preview;
}

function drawPendingPlacement() {
  if (!pendingPlacement) return;
  const preview = buildPreviewCanvas(pendingPlacement.form);
  const point = worldToScreen(pendingPlacement.x, pendingPlacement.y);
  const screenScale = pendingPlacement.scale * camera.scale;

  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(pendingPlacement.angle);
  ctx.scale(screenScale, screenScale);
  ctx.globalAlpha = 0.72;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(preview, -preview.width / 2, -preview.height / 2);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#8889bc";
  ctx.lineWidth = 1 / Math.max(1, screenScale);
  ctx.strokeRect(-preview.width / 2, -preview.height / 2, preview.width, preview.height);
  ctx.restore();
}

function updatePlacementControls() {
  if (gameMode || !pendingPlacement) {
    ui.placementControls.hidden = true;
    return;
  }
  const point = worldToScreen(pendingPlacement.x, pendingPlacement.y);
  ui.placementControls.hidden = false;
  ui.placementControls.style.left = `${point.x}px`;
  ui.placementControls.style.top = `${point.y}px`;
}

function drawWrappedFieldBuffer() {
  const topLeft = screenToWorld(0, 0);
  const bottomRight = screenToWorld(cssWidth, cssHeight);
  const left = Math.min(topLeft.x, bottomRight.x);
  const right = Math.max(topLeft.x, bottomRight.x);
  const top = Math.min(topLeft.y, bottomRight.y);
  const bottom = Math.max(topLeft.y, bottomRight.y);
  const firstTileX = Math.floor(left / worldWidth);
  const lastTileX = Math.floor(right / worldWidth);
  const firstTileY = Math.floor(top / worldHeight);
  const lastTileY = Math.floor(bottom / worldHeight);

  for (let tileY = firstTileY; tileY <= lastTileY; tileY += 1) {
    for (let tileX = firstTileX; tileX <= lastTileX; tileX += 1) {
      const origin = worldToScreen(tileX * worldWidth, tileY * worldHeight);
      ctx.drawImage(fieldBuffer, origin.x, origin.y, worldWidth * camera.scale, worldHeight * camera.scale);
    }
  }
}

function drawGameBackground() {
  if (!gameMode) return;
  gameStarfield.draw(ctx, gameSettings());
}

function render() {
  const drawStart = performance.now();
  if (usingWebgl()) {
    try {
      webglSim.render({
        cssWidth,
        cssHeight,
        dpr,
        camera,
        background: backgroundColor(),
      });
    } catch (error) {
      console.error(error);
      switchFromWebglToCpu(simulationModel(), { reason: String(error?.message || error) });
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (!usingWebgl()) {
    ctx.fillStyle = backgroundColor();
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    ctx.imageSmoothingEnabled = false;
    if (gameMode && ui.wrapToggle.checked) {
      drawWrappedFieldBuffer();
    } else {
      const rect = visibleWorldRect();
      const sw = Math.max(0, rect.right - rect.left);
      const sh = Math.max(0, rect.bottom - rect.top);
      if (sw > 0 && sh > 0) {
        const origin = worldToScreen(rect.left, rect.top);
        ctx.drawImage(fieldBuffer, rect.left, rect.top, sw, sh, origin.x, origin.y, sw * camera.scale, sh * camera.scale);
      }
    }
  }

  drawGameBackground();

  if (!gameMode) {
    const origin = worldToScreen(0, 0);
    ctx.strokeStyle = "#231c49";
    ctx.lineWidth = 1;
    ctx.strokeRect(origin.x, origin.y, worldWidth * camera.scale, worldHeight * camera.scale);

    drawPendingPlacement();
  }
  updatePlacementControls();
  profile.renderMs = performance.now() - drawStart;
  renderFrameCount += 1;
  updateMetrics();
  viewDirty = false;
}

function placePendingAt(point) {
  if (!selectedForm) return;
  if (!selectedForm.cellData) selectedForm.cellData = parseCellArray(selectedForm.cells);
  pendingPlacement = {
    form: selectedForm,
    cellData: selectedForm.cellData,
    x: clamp(point.x, 0, worldWidth),
    y: clamp(point.y, 0, worldHeight),
    scale: pendingPlacement?.scale || 1,
    angle: pendingPlacement?.angle || 0,
  };
  requestRender();
}

function flattenCellData(cellData) {
  if (cellData.flat) return cellData.flat;
  const flat = new Float32Array(cellData.width * cellData.height);
  for (let y = 0; y < cellData.height; y += 1) {
    for (let x = 0; x < cellData.width; x += 1) {
      flat[y * cellData.width + x] = cellData.rows[y]?.[x] || 0;
    }
  }
  cellData.flat = flat;
  return flat;
}

function sendCellPlacement(cellData, x, y, scale = 1, angle = 0) {
  const baseCells = flattenCellData(cellData);
  const cells = new Float32Array(baseCells.length);
  cells.set(baseCells);
  if (isLifeRule()) {
    for (let i = 0; i < cells.length; i += 1) cells[i] = cells[i] >= 0.5 ? 1 : 0;
  }
  sendBackend(
    "place",
    {
      placement: {
        channelId: selectedChannelId,
        x,
        y,
        scale,
        angle,
        width: cellData.width,
        height: cellData.height,
        cells,
      },
    },
    [cells.buffer],
  );
}

function commitPendingPlacement() {
  if (!pendingPlacement) return;
  sendCellPlacement(
    pendingPlacement.cellData,
    pendingPlacement.x,
    pendingPlacement.y,
    pendingPlacement.scale,
    pendingPlacement.angle,
  );
  pendingPlacement = null;
  requestRender();
}

function placeFormAtCenter(form) {
  if (!form) return;
  if (!form.cellData) form.cellData = parseCellArray(form.cells);
  sendCellPlacement(form.cellData, worldWidth / 2, worldHeight / 2);
  requestRender();
}

function paintAt(point, tool = currentTool) {
  let wx = Math.floor(point.x);
  let wy = Math.floor(point.y);
  if (ui.wrapToggle.checked) {
    wx = modulo(wx, worldWidth);
    wy = modulo(wy, worldHeight);
  } else if (wx < 0 || wy < 0 || wx >= worldWidth || wy >= worldHeight) {
    return;
  }

  if (tool === "sample") {
    const requestId = ++sampleRequestId;
    sendBackend("sample", { x: wx, y: wy, channelId: selectedChannelId, scope: "selected", requestId });
    return;
  }

  sendBackend("brush", {
    channelId: selectedChannelId,
    x: wx,
    y: wy,
    radius: Math.max(0, Number(ui.brushSizeSlider.value) - 1),
    power: Number(ui.brushPowerSlider.value),
    mode: tool,
  });
  requestRender();
}

function handlePointerDown(event) {
  if (gameMode) {
    event.preventDefault();
    requestGamePointerLock();
    return;
  }
  const point = eventPoint(event);
  const world = screenToWorld(point.x, point.y);
  const isPan = currentTool === "pan" || event.button === 1 || event.button === 2 || event.shiftKey;
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);

  if (isPan) {
    pointerState = { kind: "pan", id: event.pointerId, x: point.x, y: point.y };
    canvas.style.cursor = "grabbing";
    return;
  }

  if (currentTool === "form") {
    placePendingAt(world);
    pointerState = { kind: "place", id: event.pointerId };
    return;
  }

  pointerState = { kind: "paint", id: event.pointerId };
  paintAt(world);
}

function handlePointerMove(event) {
  if (gameMode) return;
  if (!pointerState || pointerState.id !== event.pointerId) return;
  const point = eventPoint(event);
  const world = screenToWorld(point.x, point.y);

  if (pointerState.kind === "pan") {
    const dx = point.x - pointerState.x;
    const dy = point.y - pointerState.y;
    camera.x -= dx / camera.scale;
    camera.y -= dy / camera.scale;
    pointerState.x = point.x;
    pointerState.y = point.y;
    clampCamera();
    requestRender();
    return;
  }

  if (pointerState.kind === "place" && pendingPlacement) {
    pendingPlacement.x = clamp(world.x, 0, worldWidth);
    pendingPlacement.y = clamp(world.y, 0, worldHeight);
    requestRender();
    return;
  }

  if (pointerState.kind === "paint") paintAt(world);
}

function handlePointerUp(event) {
  if (pointerState?.id === event.pointerId) {
    pointerState = null;
    canvas.releasePointerCapture(event.pointerId);
    setTool(currentTool);
  }
}

function handleWheel(event) {
  event.preventDefault();
  if (gameMode) {
    const zoom = Math.exp(-event.deltaY * 0.001);
    setGameZoom(gameZoom * zoom);
    return;
  }
  const point = eventPoint(event);
  const before = screenToWorld(point.x, point.y);
  const zoom = Math.exp(-event.deltaY * 0.001);
  camera.scale = clamp(camera.scale * zoom, 0.65, 28);
  const after = screenToWorld(point.x, point.y);
  camera.x += before.x - after.x;
  camera.y += before.y - after.y;
  clampCamera();
  requestRender();
}

function updateFieldBuffer(patches, reset = false) {
  const updateStart = performance.now();
  if (reset) resetRenderBuffer();
  for (const patch of patches) {
    if (!patch.pixels || patch.width <= 0 || patch.height <= 0) continue;
    fieldBufferCtx.putImageData(new ImageData(patch.pixels, patch.width, patch.height), patch.x, patch.y);
  }
  profile.updateFieldBufferMs = performance.now() - updateStart;
}

function applyFrame(message) {
  const patches = message.patches || [];
  updateFieldBuffer(patches, Boolean(message.reset));
  profile.patches = patches.length;
  if (message.metrics) metrics = message.metrics;
  if (message.simTime != null) simTime = message.simTime;
  if (message.profile) {
    profile.stepSimulationMs = message.profile.stepSimulationMs ?? profile.stepSimulationMs;
    profile.colorizeMs = message.profile.colorizeMs ?? profile.colorizeMs;
    profile.activeChunks = message.profile.activeChunks ?? profile.activeChunks;
    profile.simChunks = message.profile.simChunks ?? profile.simChunks;
    simStepCount += message.profile.steps ?? 0;
  }
  requestRender();
  updateMetrics();
}

function handleWorkerMessage(event) {
  if (activeBackend !== "cpu") return;
  const message = event.data;
  if (Number.isSafeInteger(message.revision) && message.revision !== backendRevision) return;
  if (message.type === "ready") {
    workerReady = true;
    setStateLabel();
    syncBackendLabel();
    drainStepQueue();
    return;
  }

  if (message.type === "frame") {
    applyFrame(message);
    if (message.stepped) {
      workerBusy = false;
      drainStepQueue();
    }
    return;
  }

  if (message.type === "sample" && message.requestId === sampleRequestId) {
    ui.sampleLabel.textContent = Number(message.value || 0).toFixed(3);
    return;
  }

  if (message.type === "snapshot") {
    const pending = pendingSnapshotRequests.get(message.requestId);
    if (!pending) return;
    window.clearTimeout(pending.timeoutId);
    pendingSnapshotRequests.delete(message.requestId);
    const snapshotChannels = (message.channels || []).map((channel) => ({
      ...channel,
      values: new Float32Array(channel.values),
    }));
    pending.resolve({
      width: message.width,
      height: message.height,
      channels: snapshotChannels,
      values: snapshotChannels[0]?.values || new Float32Array(message.values || 0),
      simTime: message.simTime,
      metrics: message.metrics,
    });
    return;
  }

  if (message.type === "error") {
    workerBusy = false;
    rejectPendingSnapshotRequests(new Error(message.message || "Simulation worker error."));
    ui.stateLabel.textContent = "Worker error";
    ui.stateLabel.title = message.message || "Simulation worker error.";
  }
}

function startWorker() {
  rejectPendingSnapshotRequests(new Error("Simulation worker restarted."));
  if (simWorker) simWorker.terminate();
  backendRevision += 1;
  simWorker = null;
  workerReady = false;
  workerBusy = false;
  const worker = new Worker("src/range-sim-worker.js?v=0.2.0");
  simWorker = worker;
  worker.addEventListener("message", (event) => {
    if (simWorker === worker) handleWorkerMessage(event);
  });
  worker.addEventListener("error", (event) => {
    if (simWorker !== worker) return;
    workerReady = false;
    workerBusy = false;
    rejectPendingSnapshotRequests(new Error(event.message || "Simulation worker crashed."));
    ui.stateLabel.textContent = "Worker error";
    ui.stateLabel.title = event.message || "Simulation worker crashed.";
  });
  postWorker("init", {
    width: worldWidth,
    height: worldHeight,
    model: simulationModel(),
  });
}

function startBackend({ resetField = true } = {}) {
  const model = simulationModel();
  const wantsWebgl = backendPreference === "webgl" || backendPreference === "auto";
  const modelWebglReason = webglUnavailableForModel(model);
  const canTryWebgl = wantsWebgl && !modelWebglReason && window.WebGLLeniaSim && glCanvas;
  if (wantsWebgl && modelWebglReason) {
    webglUnavailableReason = modelWebglReason;
  }

  pendingStepCount = 0;
  workerBusy = false;
  workerReady = false;

  if (canTryWebgl) {
    try {
      if (simWorker) {
        rejectPendingSnapshotRequests(new Error("Simulation backend changed."));
        simWorker.terminate();
        simWorker = null;
      }
      backendRevision += 1;
      if (!webglSim) webglSim = new window.WebGLLeniaSim(glCanvas);
      activeBackend = "webgl";
      glCanvas.hidden = false;
      webglUnavailableReason = "";
      if (resetField) {
        simTime = 0;
        metrics = { mass: 0, growth: 0, energy: 0 };
      }
      webglSim.init(worldWidth, worldHeight, model);
      profile = { ...profile, ...webglSim.profile };
      workerReady = false;
      resetRenderBuffer();
      setStateLabel();
      syncBackendLabel();
      requestRender();
      return;
    } catch (error) {
      webglUnavailableReason = String(error?.message || error);
      if (backendPreference === "webgl") {
        ui.stateLabel.textContent = "WebGL failed";
      }
    }
  }

  activeBackend = "cpu";
  glCanvas.hidden = true;
  if (resetField) {
    simTime = 0;
    metrics = { mass: 0, growth: 0, energy: 0 };
    resetRenderBuffer();
  }
  startWorker();
  setStateLabel();
  syncBackendLabel();
}

function queueSteps(count) {
  if (!backendReady() || count <= 0) return;
  pendingStepCount = Math.min(8, pendingStepCount + count);
  drainStepQueue();
}

function drainStepQueue() {
  if (!backendReady() || pendingStepCount <= 0) return;
  if (usingWebgl()) {
    const count = Math.min(4, pendingStepCount);
    pendingStepCount -= count;
    try {
      const nextProfile = webglSim.step(count);
      profile = {
        ...profile,
        ...webglSim.profile,
        stepSimulationMs: nextProfile.stepSimulationMs,
        colorizeMs: 0,
        updateFieldBufferMs: 0,
        patches: 0,
      };
      if (metricsEnabled) {
        const nextMetrics = webglSim.readMetrics(performance.now());
        if (nextMetrics) metrics = nextMetrics;
      }
      simTime += currentStepDt() * nextProfile.steps;
      simStepCount += nextProfile.steps;
      requestRender();
      updateMetrics();
      if (pendingStepCount > 0) drainStepQueue();
    } catch (error) {
      console.error(error);
      pendingStepCount = Math.min(8, pendingStepCount + count);
      switchFromWebglToCpu(simulationModel(), { reason: String(error?.message || error) });
    }
    return;
  }

  if (workerBusy) return;
  const count = Math.min(4, pendingStepCount);
  pendingStepCount -= count;
  workerBusy = true;
  postWorker("step", {
    count,
    safeRect: ui.wrapToggle.checked
      ? { left: 0, top: 0, right: worldWidth, bottom: worldHeight }
        : getActiveRect(currentSafeArea() + maximumRuleRadius() + 2),
  });
}

function bindEvents() {
  ui.gameModeBtn.addEventListener("click", () => setGameMode(!gameMode));
  ui.timeTabBtn.addEventListener("click", () => setTab("time"));
  ui.gameTabBtn.addEventListener("click", () => setTab("game"));
  ui.advancedTabBtn.addEventListener("click", () => setTab("advanced"));
  const tabEntries = [
    { name: "time", button: ui.timeTabBtn },
    { name: "game", button: ui.gameTabBtn },
    { name: "advanced", button: ui.advancedTabBtn },
  ];
  tabEntries.forEach((entry, index) => {
    entry.button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabEntries.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + tabEntries.length) % tabEntries.length;
      setTab(tabEntries[nextIndex].name);
      tabEntries[nextIndex].button.focus();
    });
  });
  ui.runBtn.addEventListener("click", () => setRunning(!isRunning));
  ui.stepBtn.addEventListener("click", () => queueSteps(1));
  ui.clearBtn.addEventListener("click", clearField);
  ui.randomBtn.addEventListener("click", randomizeField);
  ui.speedSlider.addEventListener("input", syncLabels);

  ui.worldSizeSelect.addEventListener("change", () => {
    if (ui.worldSizeSelect.value === "custom") {
      syncWorldSizeControl(worldWidth, worldHeight, { forceCustom: true });
      return;
    }
    resizeWorld(Number(ui.worldSizeSelect.value));
  });
  ui.customWorldWidth?.addEventListener("change", resizeFromCustomWorldSize);
  ui.customWorldHeight?.addEventListener("change", resizeFromCustomWorldSize);

  ui.backendSelect.addEventListener("change", () => {
    backendPreference = ui.backendSelect.value;
    setRunning(false);
    clearField();
    startBackend({ resetField: true });
  });

  for (const slider of [
    ui.radiusSlider,
    ui.alphaSlider,
    ui.muSlider,
    ui.sigmaSlider,
    ui.dtSlider,
    ui.gainSlider,
    ui.decaySlider,
  ]) {
    slider.addEventListener("input", () => {
      syncLabels();
      scheduleBackendConfiguration();
    });
  }
  ui.safeSlider.addEventListener("input", syncLabels);

  ui.limitToggle.addEventListener("change", configureBackend);
  ui.wrapToggle.addEventListener("change", configureBackend);
  ui.gameBackgroundSelect.addEventListener("change", () => {
    gameStarfield.reset();
    requestRender();
  });
  for (const slider of [ui.gameStarDensitySlider, ui.gameStarSpeedSlider, ui.gameStarBrightnessSlider]) {
    slider.addEventListener("input", () => {
      if (slider === ui.gameStarDensitySlider) gameStarfield.reset();
      syncLabels();
      requestRender();
    });
  }
  for (const slider of [
    ui.gameAccelSlider,
    ui.gameSpeedSlider,
    ui.gameFrictionSlider,
    ui.gameMouseSensitivitySlider,
    ui.gameBrushIntervalSlider,
    ui.gameCameraCenterPullSlider,
    ui.gameCameraEdgePullSlider,
    ui.gameCameraInnerZoneSlider,
    ui.gameCameraEdgeZoneSlider,
    ui.gameCameraGuardZoneSlider,
  ]) {
    slider.addEventListener("input", () => {
      syncLabels();
      requestRender();
    });
  }
  ui.gameZoomSlider.addEventListener("input", () => setGameZoom(Number(ui.gameZoomSlider.value)));
  ui.gameMinZoomSlider.addEventListener("input", syncGameZoomRange);
  ui.gameMaxZoomSlider.addEventListener("input", syncGameZoomRange);
  for (const input of ui.colorInputs) input.addEventListener("input", rebuildPalette);
  ui.resetAdvancedBtn.addEventListener("click", resetAdvanced);

  ui.panToolBtn.addEventListener("click", () => setTool("pan"));
  ui.lifeToolBtn.addEventListener("click", () => setTool("form"));
  ui.paintToolBtn.addEventListener("click", () => setTool("paint"));
  ui.eraseToolBtn.addEventListener("click", () => setTool("erase"));
  ui.sampleToolBtn.addEventListener("click", () => setTool("sample"));
  ui.saveMapBtn.addEventListener("click", saveMapFile);
  ui.loadMapBtn.addEventListener("click", () => ui.loadMapInput.click());
  ui.loadMapInput.addEventListener("change", async () => {
    await loadMapFile(ui.loadMapInput.files?.[0]);
    ui.loadMapInput.value = "";
  });
  ui.brushSizeSlider.addEventListener("input", syncLabels);
  ui.brushPowerSlider.addEventListener("input", syncLabels);
  ui.addLayerBtn.addEventListener("click", addLayer);
  ui.removeLayerBtn.addEventListener("click", removeSelectedLayer);
  ui.layerNameInput.addEventListener("input", () => renameSelectedLayer(ui.layerNameInput.value));
  ui.layerVisibleToggle.addEventListener("change", () => setSelectedLayerVisible(ui.layerVisibleToggle.checked));
  ui.layerSourceSelect.addEventListener("change", () => setSelectedLayerSource(ui.layerSourceSelect.value));
  ui.metricScopeSelect.addEventListener("change", () => setMetricScope(ui.metricScopeSelect.value));
  ui.toggleMetricsBtn.addEventListener("click", () => setMetricsEnabled(!metricsEnabled));
  for (const input of ui.layerColorInputs) {
    input.addEventListener("input", () => {
      ui.colorInputs.forEach((colorInput, index) => {
        colorInput.value = ui.layerColorInputs[index].value;
      });
      rebuildPalette();
    });
  }
  ui.formSearch.addEventListener("input", () => {
    cancelAnimationFrame(formSearchFrame);
    formSearchFrame = requestAnimationFrame(() => {
      formSearchFrame = 0;
      renderFormList();
    });
  });
  ui.collectionSelect.addEventListener("change", () => requestCollectionChange(Number(ui.collectionSelect.value)));
  ui.groupSelect.addEventListener("change", () => requestGroupChange(Number(ui.groupSelect.value)));
  ui.prevGroupBtn.addEventListener("click", () => moveGroup(-1));
  ui.nextGroupBtn.addEventListener("click", () => moveGroup(1));
  ui.cancelGroupChangeBtn.addEventListener("click", hideGroupChangeDialog);
  ui.confirmGroupChangeBtn.addEventListener("click", () => {
    const collectionIndex = pendingCollectionIndex;
    const groupIndex = pendingGroupIndex;
    setGroupAlertDisabled(ui.skipGroupAlert.checked);
    hideGroupChangeDialog();
    commitCatalogSelection(collectionIndex, groupIndex);
  });
  ui.groupChangeDialog.addEventListener("click", (event) => {
    if (event.target === ui.groupChangeDialog) hideGroupChangeDialog();
  });
  ui.groupChangeDialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [...ui.groupChangeDialog.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )].filter((element) => !element.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  ui.scaleDownBtn.addEventListener("click", () => {
    if (!pendingPlacement) return;
    pendingPlacement.scale = clamp(pendingPlacement.scale / 1.15, 0.25, 5);
    requestRender();
  });
  ui.scaleUpBtn.addEventListener("click", () => {
    if (!pendingPlacement) return;
    pendingPlacement.scale = clamp(pendingPlacement.scale * 1.15, 0.25, 5);
    requestRender();
  });
  ui.rotateLeftBtn.addEventListener("click", () => {
    if (!pendingPlacement) return;
    pendingPlacement.angle -= Math.PI / 12;
    requestRender();
  });
  ui.rotateRightBtn.addEventListener("click", () => {
    if (!pendingPlacement) return;
    pendingPlacement.angle += Math.PI / 12;
    requestRender();
  });
  ui.commitPlacementBtn.addEventListener("click", commitPendingPlacement);
  ui.cancelPlacementBtn.addEventListener("click", () => {
    pendingPlacement = null;
    requestRender();
  });

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener("wheel", handleWheel, { passive: false });
  canvas.addEventListener("keydown", (event) => {
    const directions = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (directions[event.key]) {
      event.preventDefault();
      event.stopPropagation();
      const distance = (event.shiftKey ? 64 : 16) / Math.max(0.65, camera.scale);
      camera.x += directions[event.key][0] * distance;
      camera.y += directions[event.key][1] * distance;
      clampCamera();
      requestRender();
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      event.stopPropagation();
      camera.scale = clamp(camera.scale * 1.12, 0.65, 64);
      requestRender();
    } else if (event.key === "-") {
      event.preventDefault();
      event.stopPropagation();
      camera.scale = clamp(camera.scale / 1.12, 0.65, 64);
      requestRender();
    } else if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      const center = { x: camera.x, y: camera.y };
      if (currentTool === "form") {
        if (pendingPlacement) commitPendingPlacement();
        else placePendingAt(center);
      } else if (currentTool !== "pan") {
        paintAt(center);
      }
    }
  });
  glCanvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    if (usingWebgl()) switchFromWebglToCpu(simulationModel(), { reason: "WebGL context was lost." });
  });
  window.addEventListener("resize", resizeCanvas);

  window.addEventListener("keydown", (event) => {
    if (!ui.groupChangeDialog.hidden) {
      if (event.key === "Escape") hideGroupChangeDialog();
      return;
    }
    if (gameMode && event.key === "Escape") {
      event.preventDefault();
      setGameMode(false);
      return;
    }
    if (gameMode && handleGameKeyDown(event)) return;
    if (event.target.matches("input, select, button")) return;
    if (event.key === " ") {
      event.preventDefault();
      setRunning(!isRunning);
    } else if (event.key === "Escape") {
      pendingPlacement = null;
      requestRender();
    } else if (event.key === "Enter" && pendingPlacement) {
      commitPendingPlacement();
    }
  });
  window.addEventListener("keyup", (event) => {
    if (gameMode) handleGameKeyUp(event);
  });
  window.addEventListener("mousemove", handleGameMouseMove);
  document.addEventListener("pointerlockchange", handlePointerLockChange);
  window.addEventListener("blur", () => {
    gameKeys.clear();
    gameMouse.dx = 0;
    gameMouse.dy = 0;
  });
}

function tick(now) {
  if (!lastFrameAt) {
    lastFrameAt = now;
    fpsClock = now;
  }

  const elapsed = Math.min(250, now - lastFrameAt);
  lastFrameAt = now;

  updateGameMode(elapsed);

  if (isRunning && backendReady()) {
    accumulator += elapsed;
    const stepMs = 1000 / Math.max(1, Number(ui.speedSlider.value));
    let dueSteps = 0;
    while (accumulator >= stepMs && dueSteps < 8) {
      accumulator -= stepMs;
      dueSteps += 1;
    }
    if (dueSteps >= 8) accumulator = 0;
    queueSteps(dueSteps);
  }

  if (now - fpsClock >= 500) {
    ui.fpsLabel.textContent = Math.round((renderFrameCount * 1000) / (now - fpsClock));
    ui.simFpsLabel.textContent = Math.round((simStepCount * 1000) / (now - fpsClock));
    renderFrameCount = 0;
    simStepCount = 0;
    fpsClock = now;
  }

  if (viewDirty || pendingPlacement) render();
  requestAnimationFrame(tick);
}

async function boot() {
  makeBuffers();
  syncWorldSizeControl(worldWidth);
  resizeCanvas();
  bindEvents();
  const baseForms = buildLibraryForms(baseLifeformSources());
  const repositoryForms = buildLibraryForms(repositoryLifeformSources());
  catalogForms = [...baseForms, ...repositoryForms];
  let strictGroups = [];
  try {
    strictGroups = await buildCompatibleGroups(baseForms);
  } catch (error) {
    console.error(error);
  }
  const legacyGroup = buildLegacyCompatibleGroup(baseForms);
  lifeformCollections = buildLifeformCollections(strictGroups, legacyGroup, repositoryForms);
  renderGroupOrganizer();
  if (lifeformCollections.length) {
    const collectionIndex = defaultCollectionIndex();
    const groupIndex = defaultGroupIndex(lifeformCollections[collectionIndex]);
    const defaultForm = defaultFormForGroup(lifeformCollections[collectionIndex].groups[groupIndex]);
    commitCatalogSelection(collectionIndex, groupIndex, { selectFirst: false });
    if (defaultForm) selectForm(defaultForm);
  } else {
    ui.selectedForm.textContent = "No lifeform collections loaded";
    renderFormList();
  }
  setGameZoom(Number(ui.gameZoomSlider.value));
  setTab("time");
  syncLabels();
  syncGameModeButton();
  syncSelectedLayerControls();
  setRunning(false);
  setTool("form");
  updateMetrics();
  startBackend({ resetField: true });
  placeFormAtCenter(selectedForm);
  requestAnimationFrame(tick);
}

boot();
