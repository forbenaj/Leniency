const canvas = document.querySelector("#fieldCanvas");
const glCanvas = document.querySelector("#glFieldCanvas");
const ctx = canvas.getContext("2d", { alpha: true });

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

const ZIP_HEADER = "(zip)";
const ZIP2_HEADER = "(zip2)";
const ZIP_START = 192;
const COMPATIBLE_GROUPS_URL = "strictly-compatible-groups.txt";
const LIFEFORM_ASSET_BASE = "assets/lifeforms/";
const SKIP_GROUP_ALERT_KEY = "leniency.skipGroupChangeAlert";
const DEFAULT_WORLD_SIZE = 128;
const DEFAULT_FORM_NAME = "Orbium unicaudatus";
const MAP_FILE_VERSION = 2;
const SNAPSHOT_TIMEOUT_MS = 8000;
const DEFAULT_COLORS = ["#080618", "#231c49", "#3e3f77", "#8889bc", "#f0efd6"];
const NEW_LAYER_PALETTES = [
  ["#140704", "#4c160b", "#a23a16", "#e98331", "#ffe0a3"],
  ["#03120a", "#104326", "#2c7f45", "#73c969", "#e1ffd0"],
  ["#10071a", "#321653", "#6b35a0", "#b276e7", "#f0d7ff"],
  ["#151002", "#51400b", "#a68016", "#e4c53c", "#fff3a8"],
  DEFAULT_COLORS,
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
let compatibleForms = [];
let compatibleGroups = [];
let activeGroupIndex = -1;
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
let webglSim = null;
let webglUnavailableReason = "";
let backendPreference = "auto";
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

function fromZip(char) {
  if (char === "0") return 0;
  if (char === "1") return 100;
  return char.charCodeAt(0) - (ZIP_START - 1);
}

function isZipRepeat(value) {
  return value.length > 0 && value.charCodeAt(0) >= ZIP_START;
}

function fromRepeat(value) {
  if (value === "") return 1;
  if (!isZipRepeat(value)) return Number.parseInt(value, 10) || 0;
  if (value.length === 1) return fromZip(value);
  return fromZip(value[0]) * 100 + fromZip(value[1]);
}

function parseCellArray(cellText) {
  let source = cellText || "";
  const isZip1 = source.startsWith(ZIP_HEADER);
  const isZip2 = source.startsWith(ZIP2_HEADER);
  const isZip = isZip1 || isZip2;
  if (!isZip && /[$!]|\bo\b|\bb\b/.test(source)) return parseRleCellArray(source);
  if (isZip1) source = source.slice(ZIP_HEADER.length);
  if (isZip2) source = source.slice(ZIP2_HEADER.length);

  let rows = source.split("/").map((rowText) => {
    let row = rowText.trim();
    if (isZip) {
      row = row
        .split("-")
        .map((part) => {
          const bits = part.split(".");
          return bits.length === 1 ? part : "0".repeat(fromRepeat(bits[0])) + bits[1];
        })
        .join("");
      return [...row].map((char) => clamp(fromZip(char) / 100));
    }
    return row === "" ? [] : row.split(",").map((value) => clamp(Number.parseFloat(value) || 0));
  });

  if (isZip2) {
    const doubled = [];
    for (const row of rows) {
      const wide = row.flatMap((value) => [value, value]);
      doubled.push([...wide], [...wide]);
    }
    rows = doubled;
  }

  return {
    rows,
    width: rows.reduce((max, row) => Math.max(max, row.length), 0),
    height: rows.length,
    flat: null,
  };
}

function rleCellValue(token) {
  if (token === "." || token === "b") return 0;
  if (token === "o") return 1;
  if (token.length === 1) return clamp((token.charCodeAt(0) - "A".charCodeAt(0) + 1) / 255);
  return clamp(((token.charCodeAt(0) - "p".charCodeAt(0)) * 24 + (token.charCodeAt(1) - "A".charCodeAt(0) + 25)) / 255);
}

function parseRleCellArray(cellText) {
  const rows = [];
  let row = [];
  let countText = "";
  let prefix = "";
  const source = String(cellText || "").replace(/\s+/g, "").replace(/!$/, "") + "$";

  function repeatCount() {
    const count = Number.parseInt(countText || "1", 10);
    countText = "";
    return Number.isFinite(count) && count > 0 ? count : 1;
  }

  for (const char of source) {
    if (/\d/.test(char)) {
      countText += char;
      continue;
    }
    if ("pqrstuvwxy@".includes(char)) {
      prefix = char;
      continue;
    }

    const token = `${prefix}${char}`;
    prefix = "";
    if (token === "$") {
      const count = repeatCount();
      rows.push(row);
      for (let i = 1; i < count; i += 1) rows.push([]);
      row = [];
      continue;
    }

    const value = rleCellValue(token);
    const count = repeatCount();
    for (let i = 0; i < count; i += 1) row.push(value);
  }

  return {
    rows,
    width: rows.reduce((max, nextRow) => Math.max(max, nextRow.length), 0),
    height: rows.length,
    flat: null,
  };
}

function parseFraction(value) {
  if (value == null || value === "") return 0;
  const text = String(value).trim();
  if (text.includes("/")) {
    const [top, bottom] = text.split("/").map(Number);
    return bottom ? top / bottom : 0;
  }
  return Number.parseFloat(text) || 0;
}

function parseRule(ruleText) {
  const rule = { ...DEFAULT_RULE, beta: [...DEFAULT_RULE.beta], eta: [...DEFAULT_RULE.eta] };
  const radius = Number.parseInt(ruleText.match(/(?:^|;)R=(\d+)/)?.[1] || "", 10);
  if (Number.isFinite(radius)) rule.radius = radius;

  const delta = ruleText.match(/d=([a-z0-9/]+)\(([-\d.]+),([-\d.]+)\)\*([-\d.]+)(\+?)/i);
  if (delta) {
    rule.deltaName = delta[1];
    rule.mu = Number.parseFloat(delta[2]);
    rule.sigma = Number.parseFloat(delta[3]);
    const multiplier = Math.abs(Number.parseFloat(delta[4]));
    rule.ts = multiplier > 0 ? Math.round(1 / multiplier) : DEFAULT_RULE.ts;
    rule.dt = multiplier || DEFAULT_RULE.dt;
    rule.limitValue = delta[5] !== "+";
  }

  const kernel = ruleText.match(/k=([^;]+)/i);
  if (kernel) {
    const text = kernel[1];
    const name = text.split("(")[0];
    const legacyName =
      name === "bimo4" ? "quad4" : name === "bist4" ? "stpz1/4" : name === "trmo4" ? "quad4" : name;
    const args = [...text.matchAll(/\(([^)]*)\)/g)].map((match) =>
      match[1] === "" ? [] : match[1].split(",").map(parseFraction),
    );
    rule.coreName = legacyName.replace(/\d+$/, "") === "bump" ? "bump4" : legacyName;
    if (!["bump4", "quad4", "trap1/5", "stpz1/4", "life"].includes(rule.coreName)) {
      rule.coreName = legacyName.startsWith("quad") ? "quad4" : legacyName.startsWith("bump") ? "bump4" : legacyName;
    }
    const beta = args[0] || [];
    const eta = args[1] || [];
    rule.layer = Math.max(beta.length - 1, 0);
    if (name === "trmo4") rule.layer = 2;
    for (let i = 0; i < 4; i += 1) {
      rule.beta[i] = beta[i] || 0;
      rule.eta[i] = eta[i] || 0;
    }
    if (rule.layer <= 1 && rule.beta[0] === 0) rule.beta[0] = 1;
  }

  return rule;
}

function splitLifeformPayload(payload) {
  const parts = payload.split(";cells=");
  return {
    rule: parts[0] || "",
    cells: parts[1] || payload,
  };
}

function displayCode(rawCode) {
  return String(rawCode || "").replace(/^[~*]/, "");
}

function lifeformAssetSlug(index, code) {
  const cleanCode = String(code || "form")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `lifeform-${index}-${cleanCode || "form"}`;
}

function normalizeLookupText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^[~*]+/, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeCode(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^[~*]+/, "")
    .replace(/[^a-z0-9]+/g, "");
}

function parseFieldMap(ruleText) {
  const fields = {};
  for (const part of String(ruleText || "").split(";")) {
    const [key, ...valueParts] = part.split("=");
    if (!key || !valueParts.length) continue;
    fields[key.trim().toLowerCase()] = valueParts.join("=").trim();
  }
  return fields;
}

function parseGroupRule(ruleText) {
  const fields = parseFieldMap(ruleText);
  const rule = { ...DEFAULT_RULE, beta: [...DEFAULT_RULE.beta], eta: [...DEFAULT_RULE.eta] };
  const radius = Number.parseInt(fields.r || "", 10);
  const ts = Number.parseFloat(fields.t || "");
  const beta = (fields.b || "1").split(",").map(parseFraction).filter((value) => Number.isFinite(value));

  if (Number.isFinite(radius)) rule.radius = radius;
  if (Number.isFinite(ts) && ts > 0) {
    rule.ts = ts;
    rule.dt = 1 / ts;
  }
  if (fields.m != null) rule.mu = Number.parseFloat(fields.m) || rule.mu;
  if (fields.s != null) rule.sigma = Number.parseFloat(fields.s) || rule.sigma;

  for (let i = 0; i < 4; i += 1) {
    rule.beta[i] = beta[i] || 0;
    rule.eta[i] = 0;
  }
  rule.layer = Math.max(beta.length - 1, 0);
  if (rule.layer <= 1 && rule.beta[0] === 0) rule.beta[0] = 1;

  if (rule.radius === 2 || fields.kn === "4") rule.coreName = "life";
  else if (rule.layer > 0 || fields.kn === "2") rule.coreName = "quad4";
  else rule.coreName = "bump4";

  if (rule.coreName === "life" || fields.gn === "3") rule.deltaName = "stpz";
  else if (fields.gn === "2") rule.deltaName = "quad4";
  else rule.deltaName = "gaus";

  return {
    ...rule,
    sourceText: ruleText,
    perFormRule: fields["per-form"] === "1" || fields.perform === "1",
    hasKernelHint: fields.kn != null,
    hasGrowthHint: fields.gn != null,
  };
}

function parseGroupItem(line) {
  const text = line.trim();
  const [first = "", ...rest] = text.split(/\s+/);
  const isCodeLike = first.startsWith("~") || /^\d?[A-Z]+\d/i.test(first) || /^C\d/i.test(first) || /^K\d/i.test(first);
  return {
    raw: text,
    code: isCodeLike ? first.replace(/^[~*]+/, "") : "",
    name: isCodeLike ? rest.join(" ") : text,
  };
}

function groupTitle(ruleInfo) {
  const beta = ruleInfo.beta.slice(0, ruleInfo.layer + 1).map((value) => Number(value.toFixed(4))).join(",");
  return `R ${ruleInfo.radius} | mu ${ruleInfo.mu.toFixed(3)} | sigma ${ruleInfo.sigma.toFixed(3)} | b ${beta}`;
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

function formMatchesItem(form, item) {
  const itemName = normalizeLookupText(item.name);
  const formName = normalizeLookupText(form.name);
  const formBaseName = normalizeLookupText(form.name.split("(")[0]);
  if (itemName && (formName === itemName || formName.startsWith(`${itemName} `) || formBaseName === itemName)) {
    return true;
  }

  const itemCode = normalizeCode(item.code);
  if (!itemCode) return false;
  return [form.rawCode, form.code].some((code) => normalizeCode(code) === itemCode);
}

function findFormForGroupItem(item, forms, usedFormIds) {
  const byName = forms.find((form) => !usedFormIds.has(form.id) && formMatchesItem(form, { ...item, code: "" }));
  if (byName) return byName;
  return forms.find((form) => !usedFormIds.has(form.id) && formMatchesItem(form, { ...item, name: "" })) || null;
}

function reconcileGroupRule(group) {
  if (!group.forms.length) return group.ruleInfo;
  const firstRule = group.forms[0].ruleInfo;
  const nextRule = {
    ...group.ruleInfo,
    beta: [...group.ruleInfo.beta],
    eta: [...group.ruleInfo.eta],
  };

  if (!group.ruleInfo.hasKernelHint) {
    nextRule.coreName = firstRule.coreName;
    nextRule.layer = firstRule.layer;
    nextRule.beta = [...firstRule.beta];
    nextRule.eta = [...firstRule.eta];
  }
  if (!group.ruleInfo.hasGrowthHint) {
    nextRule.deltaName = firstRule.deltaName;
  }
  return nextRule;
}

function parseCompatibleGroups(text, forms) {
  const groups = [];
  let currentGroup = null;

  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      currentGroup = null;
      continue;
    }

    if (/^R\s*=/.test(line)) {
      const ruleInfo = parseGroupRule(line);
      currentGroup = {
        id: `group-${groups.length}`,
        title: groupTitle(ruleInfo),
        ruleText: line,
        ruleInfo,
        perFormRule: ruleInfo.perFormRule,
        items: [],
        forms: [],
        missingItems: [],
      };
      groups.push(currentGroup);
      continue;
    }

    if (currentGroup) currentGroup.items.push(parseGroupItem(line));
  }

  const usedFormIds = new Set();
  for (const group of groups) {
    for (const item of group.items) {
      const form = findFormForGroupItem(item, forms, usedFormIds);
      if (form) {
        group.forms.push(form);
        usedFormIds.add(form.id);
      } else {
        group.missingItems.push(item.raw);
      }
    }
    group.ruleInfo = reconcileGroupRule(group);
    group.title = groupTitle(group.ruleInfo);
  }

  return groups.filter((group) => group.forms.length > 0);
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

function defaultGroupIndex() {
  const legacyIndex = compatibleGroups.findIndex((group) => group.id === "legacy-compatible-forms");
  return legacyIndex >= 0 ? legacyIndex : 0;
}

function defaultFormForGroup(group) {
  if (!group?.forms.length) return null;
  const defaultName = normalizeLookupText(DEFAULT_FORM_NAME);
  return group.forms.find((form) => normalizeLookupText(form.name) === defaultName) || group.forms[0];
}

function buildLibraryForms() {
  const source = [
    ...(Array.isArray(window.animalArr) ? window.animalArr : []),
    ...(Array.isArray(window.extraCompatibleAnimalArr) ? window.extraCompatibleAnimalArr : []),
  ];
  const forms = [];
  const groupStack = [];

  for (let i = 0; i < source.length; i += 1) {
    const item = source[i];
    if (!Array.isArray(item)) continue;
    if (item.length === 3 && item[1]) {
      const level = Number.parseInt(String(item[0]).replace(/^\D+/, ""), 10) || 1;
      groupStack[level - 1] = item[1];
      groupStack.length = level;
      continue;
    }
    if (item.length < 4 || !item[3]) continue;

    const { rule, cells } = splitLifeformPayload(item[3]);
    const ruleInfo = parseRule(rule);

    const code = displayCode(item[0]);
    const assetSlug = lifeformAssetSlug(i, code);
    const groups = groupStack.filter(Boolean);
    forms.push({
      id: `${i}-${code}`,
      index: i,
      code,
      assetPath: `${LIFEFORM_ASSET_BASE}${assetSlug}.png`,
      rawCode: item[0] || "",
      name: item[1] || code,
      section: groups[groups.length - 1]?.replace(/^(class|order|family|subfamily):\s*/i, "") || "",
      groups,
      rule,
      cells,
      ruleInfo,
      cellData: null,
      previewCanvas: null,
      previewVersion: -1,
    });
  }

  return forms;
}

function isCompatibleRule(rule) {
  return rule.radius === 13 && rule.coreName === "bump4" && rule.layer === 0 && Math.abs(rule.dt - 0.1) < 0.000001;
}

function isLifeRule(rule = currentRule) {
  return rule.coreName === "life";
}

function hexToRgb(hex) {
  const clean = String(hex || "#000000").replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((part) => part + part).join("") : clean;
  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function cloneRule(rule) {
  return {
    ...DEFAULT_RULE,
    ...rule,
    beta: [...(rule?.beta || DEFAULT_RULE.beta)],
    eta: [...(rule?.eta || DEFAULT_RULE.eta)],
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
  let rule = rules.find((item) => item.destinationChannelId === channelId);
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
    wrapAround: ui.wrapToggle.checked,
    channels: channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      palette: normalizePalette(channel.palette),
      visible: channel.visible !== false,
    })),
    rules: rules.map((rule) => ({
      id: rule.id,
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
    })),
  };
}

function colorRamp(value) {
  const scaled = clamp(value) * (palette.length - 1);
  const base = Math.floor(scaled);
  const t = scaled - base;
  const a = palette[base];
  const b = palette[Math.min(base + 1, palette.length - 1)];
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function currentColors() {
  return normalizePalette(selectedChannel()?.palette || DEFAULT_COLORS);
}

function currentRadius() {
  return Number(ui.radiusSlider.value);
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
    id: rule.id,
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
      activeGroupIndex,
      groupId: group?.id || null,
      groupTitle: group?.title || null,
      groupRule: group?.ruleText || null,
      selectedForm: formMapInfo(selectedForm),
    },
    pendingPlacement: pendingPlacementMapInfo(),
  };
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunks = [];
  const chunkSize = 32768;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize)));
  }
  return btoa(chunks.join(""));
}

function float32ArrayToBase64(values) {
  const copy = new Float32Array(values.length);
  copy.set(values);
  return arrayBufferToBase64(copy.buffer);
}

function base64ToArrayBuffer(text) {
  const binary = atob(String(text || ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64ToFloat32Array(text, expectedLength = 0) {
  const buffer = base64ToArrayBuffer(text);
  const values = new Float32Array(buffer);
  if (expectedLength && values.length !== expectedLength) {
    const resized = new Float32Array(expectedLength);
    resized.set(values.subarray(0, expectedLength));
    return resized;
  }
  return values;
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
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      pendingSnapshotRequests.delete(requestId);
      reject(new Error("Timed out while saving the map."));
    }, SNAPSHOT_TIMEOUT_MS);

    pendingSnapshotRequests.set(requestId, { resolve, reject, timeoutId });
    postWorker("snapshot", { requestId });
  });
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
      field: {
        encoding: "float32-base64",
        littleEndian: true,
        length: (snapshot.values || snapshot.channels?.[0]?.values || new Float32Array()).length,
        data: float32ArrayToBase64(snapshot.values || snapshot.channels?.[0]?.values || new Float32Array()),
      },
    };
    downloadMapFile(map, savedAt);
  } catch (error) {
    console.error(error);
    ui.stateLabel.textContent = "Save failed";
  } finally {
    ui.saveMapBtn.disabled = false;
    ui.saveMapBtn.removeAttribute("aria-busy");
  }
}

function modelFromMap(map) {
  const layerConfig = map.configuration?.layers;
  if (layerConfig?.channels?.length) {
    return {
      selectedChannelId: layerConfig.selectedChannelId || layerConfig.channels[0].id,
      metricScope: layerConfig.metricScope === "aggregate" ? "aggregate" : "selected",
      wrapAround: layerConfig.wrapAround !== false,
      channels: layerConfig.channels.map(cloneChannel),
      rules: (layerConfig.rules || []).map(cloneRule),
    };
  }

  const rule = cloneRule(map.configuration?.rule || DEFAULT_RULE);
  rule.id = "rule-0";
  rule.sourceChannelId = "channel-0";
  rule.destinationChannelId = "channel-0";
  return {
    selectedChannelId: "channel-0",
    metricScope: "selected",
    wrapAround: rule.wrapAround !== false,
    channels: [
      {
        id: "channel-0",
        name: "Layer 1",
        palette: normalizePalette(map.configuration?.advanced?.colors || DEFAULT_COLORS),
        visible: true,
      },
    ],
    rules: [rule],
  };
}

function fieldsFromMap(map, model, width, height) {
  const expectedLength = width * height;
  if (Array.isArray(map.fields) && map.fields.length) {
    return map.fields
      .map((field) => {
        const channelId = field.channelId || field.id;
        if (!model.channels.some((channel) => channel.id === channelId)) return null;
        return {
          id: channelId,
          values: base64ToFloat32Array(field.data, field.length || expectedLength),
        };
      })
      .filter(Boolean);
  }
  if (map.field?.data) {
    return [
      {
        id: model.channels[0]?.id || "channel-0",
        values: base64ToFloat32Array(map.field.data, map.field.length || expectedLength),
      },
    ];
  }
  return [];
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

async function loadMapFile(file) {
  if (!file) return;
  try {
    const map = JSON.parse(await file.text());
    const width = Number(map.world?.width || DEFAULT_WORLD_SIZE);
    const height = Number(map.world?.height || width);
    const model = modelFromMap(map);
    const loadedFields = fieldsFromMap(map, model, width, height);
    applyLoadedModel(model);
    worldWidth = width;
    worldHeight = height;
    ui.worldSizeSelect.value = String(width);
    camera.x = worldWidth / 2;
    camera.y = worldHeight / 2;
    gamePlayer.x = worldWidth / 2;
    gamePlayer.y = worldHeight / 2;
    makeBuffers();
    clampCamera();
    simTime = Number(map.configuration?.state?.simTime || 0);
    metrics = map.configuration?.state?.metrics || { mass: 0, growth: 0, energy: 0 };
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
  } catch (error) {
    console.error(error);
    ui.stateLabel.textContent = "Load failed";
  }
}

function setSliderValue(slider, value) {
  if (value == null || Number.isNaN(value)) return;
  const min = Number(slider.min);
  const max = Number(slider.max);
  slider.value = String(clamp(value, min, max));
}

function postWorker(type, payload = {}, transfer = []) {
  if (!simWorker) return;
  simWorker.postMessage({ type, ...payload }, transfer);
}

function usingWebgl() {
  return activeBackend === "webgl" && webglSim;
}

function backendReady() {
  return usingWebgl() || workerReady;
}

function backendName() {
  return usingWebgl() ? "WebGL" : "CPU";
}

function syncBackendLabel() {
  const suffix = backendPreference === "auto" ? " auto" : "";
  ui.backendLabel.textContent = `${backendName()}${suffix}`;
  ui.backendLabel.title = usingWebgl()
    ? "WebGL float-texture simulation. Step sim is CPU dispatch time unless GPU timer support is added."
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
  if (usingWebgl()) webglSim.setModel(model);
  else postWorker("model", { model });
}

function setBackendPalette() {
  configureBackend();
}

function sendBackend(type, payload = {}, transfer = []) {
  if (!usingWebgl()) {
    postWorker(type, payload, transfer);
    return;
  }

  if (type === "config") {
    webglSim.setConfig(payload.config);
  } else if (type === "palette") {
    webglSim.setPalette(payload.colors);
  } else if (type === "model") {
    webglSim.setModel(payload.model);
  } else if (type === "resize") {
    webglSim.resize(payload.width, payload.height);
    metrics = webglSim.metrics;
    profile = { ...profile, ...webglSim.profile };
  } else if (type === "clear") {
    webglSim.clear();
    metrics = webglSim.metrics;
    profile = { ...profile, ...webglSim.profile };
  } else if (type === "randomize") {
    webglSim.randomize(payload.rect);
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
    metrics = webglSim.metrics;
    profile = { ...profile, ...webglSim.profile };
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
  const scopedMetrics =
    metricScope === "aggregate" ? metrics.aggregate || metrics : metrics.perChannel?.[selectedChannelId] || metrics;
  ui.massLabel.textContent = Number(scopedMetrics.mass || 0).toFixed(4);
  ui.growthLabel.textContent = Number(scopedMetrics.growth || 0).toFixed(4);
  ui.energyLabel.textContent = Number(scopedMetrics.energy || 0).toFixed(4);
  ui.timeLabel.textContent = `t ${simTime.toFixed(1)}`;
  ui.simMsLabel.textContent = profile.stepSimulationMs.toFixed(1);
  ui.colorizeMsLabel.textContent = profile.colorizeMs.toFixed(1);
  ui.bufferMsLabel.textContent = profile.updateFieldBufferMs.toFixed(1);
  ui.renderMsLabel.textContent = profile.renderMs.toFixed(1);
  ui.chunkLabel.textContent = `${profile.simChunks}/${profile.activeChunks}`;
  ui.patchLabel.textContent = String(profile.patches);
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
  for (const form of compatibleForms) {
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
    if (channel.id === selectedChannelId) button.classList.add("selected");
    if (channel.visible === false) button.classList.add("muted");

    const swatch = document.createElement("span");
    swatch.className = "layer-swatch";
    swatch.style.background = channel.palette[3] || channel.palette[0] || DEFAULT_COLORS[3];
    const name = document.createElement("span");
    name.className = "layer-name";
    name.textContent = channel.name;
    const link = document.createElement("span");
    link.className = "layer-link";
    link.textContent = `${channelById(rule.sourceChannelId)?.name || "Missing"} -> ${channel.name}`;
    button.append(swatch, name, link);
    button.addEventListener("click", () => selectLayer(channel.id));
    ui.layerList.append(button);
  }

  const channel = selectedChannel();
  const rule = selectedRule();
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
  writeSelectedRuleFromControls();
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
  configureBackend();
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
  configureBackend();
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

function resizeWorld(newSize) {
  const oldWidth = worldWidth;
  const oldHeight = worldHeight;
  worldWidth = newSize;
  worldHeight = newSize;
  camera.x += (worldWidth - oldWidth) / 2;
  camera.y += (worldHeight - oldHeight) / 2;
  gamePlayer.x += (worldWidth - oldWidth) / 2;
  gamePlayer.y += (worldHeight - oldHeight) / 2;
  makeBuffers();
  clampCamera();
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
  ui.timeTabBtn.classList.toggle("active", name === "time");
  ui.gameTabBtn.classList.toggle("active", name === "game");
  ui.advancedTabBtn.classList.toggle("active", name === "advanced");
  ui.timeTab.classList.toggle("active", name === "time");
  ui.gameTab.classList.toggle("active", name === "game");
  ui.advancedTab.classList.toggle("active", name === "advanced");
}

function setTool(tool) {
  currentTool = tool;
  ui.panToolBtn.classList.toggle("active", tool === "pan");
  ui.lifeToolBtn.classList.toggle("active", tool === "form");
  ui.paintToolBtn.classList.toggle("active", tool === "paint");
  ui.eraseToolBtn.classList.toggle("active", tool === "erase");
  ui.sampleToolBtn.classList.toggle("active", tool === "sample");
  canvas.style.cursor = tool === "pan" ? "grab" : tool === "form" ? "copy" : tool === "sample" ? "crosshair" : "cell";
}

function selectForm(form) {
  selectedForm = form;
  setTool("form");
  if (!selectedForm.cellData) selectedForm.cellData = parseCellArray(selectedForm.cells);
  const group = activeGroup();
  if (group?.perFormRule) applyRuleInfo(selectedForm.ruleInfo);
  ui.selectedForm.textContent = `${selectedForm.code} - ${selectedForm.name}\n${group ? group.title : ""}`;
  renderGroupOrganizer();
  renderFormList();
}

function activeGroup() {
  return compatibleGroups[activeGroupIndex] || null;
}

function renderFormList() {
  const query = ui.formSearch.value.trim().toLowerCase();
  const group = activeGroup();
  const forms = group ? group.forms : [];
  ui.formList.innerHTML = "";
  for (const form of forms) {
    const haystack = `${form.code} ${form.name} ${form.section}`.toLowerCase();
    if (query && !haystack.includes(query)) continue;

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
    ui.formList.append(button);
  }

  if (!ui.formList.children.length) {
    const empty = document.createElement("div");
    empty.className = "form-empty";
    empty.textContent = query ? "No forms match this search." : "No forms in this group.";
    ui.formList.append(empty);
  }
}

function renderGroupOrganizer() {
  ui.groupSelect.innerHTML = "";
  compatibleGroups.forEach((group, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index + 1}. ${group.title} (${group.forms.length})`;
    ui.groupSelect.append(option);
  });

  const group = activeGroup();
  ui.groupSelect.disabled = compatibleGroups.length <= 1;
  ui.prevGroupBtn.disabled = compatibleGroups.length <= 1;
  ui.nextGroupBtn.disabled = compatibleGroups.length <= 1;
  if (group) {
    ui.groupSelect.value = String(activeGroupIndex);
    ui.groupRule.textContent = groupRuleLabel(group);
    ui.groupRule.title = `${group.ruleText}${group.missingItems.length ? `\nMissing: ${group.missingItems.join(", ")}` : ""}`;
  } else {
    ui.groupRule.textContent = "No group selected";
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

function commitGroupChange(index, { selectFirst = true } = {}) {
  const group = compatibleGroups[index];
  if (!group) return;
  activeGroupIndex = index;
  pendingGroupIndex = -1;
  pendingPlacement = null;
  const query = ui.formSearch.value.trim().toLowerCase();
  const firstVisible = group.forms.find((form) => {
    return !query || `${form.code} ${form.name} ${form.section}`.toLowerCase().includes(query);
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

function hideGroupChangeDialog() {
  ui.groupChangeDialog.hidden = true;
  pendingGroupIndex = -1;
  ui.skipGroupAlert.checked = false;
  ui.groupSelect.value = String(activeGroupIndex);
}

function showGroupChangeDialog(index) {
  const group = compatibleGroups[index];
  if (!group) return;
  pendingGroupIndex = index;
  ui.groupChangeMessage.textContent = `Changing to group ${index + 1} updates the field's simulation values to ${groupRuleLabel(group)}. Existing lifeforms may become unstable.`;
  ui.groupChangeDialog.hidden = false;
  ui.confirmGroupChangeBtn.focus();
}

function requestGroupChange(index) {
  if (index === activeGroupIndex || !compatibleGroups[index]) {
    ui.groupSelect.value = String(activeGroupIndex);
    return;
  }

  if (activeGroupIndex < 0 || groupAlertDisabled()) {
    commitGroupChange(index);
    return;
  }

  showGroupChangeDialog(index);
}

function moveGroup(offset) {
  if (!compatibleGroups.length) return;
  const nextIndex = (activeGroupIndex + offset + compatibleGroups.length) % compatibleGroups.length;
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
    webglSim.render({
      cssWidth,
      cssHeight,
      dpr,
      camera,
      background: backgroundColor(),
    });
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (!usingWebgl()) {
    ctx.fillStyle = "#080618";
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
    sendBackend("sample", { x: wx, y: wy, channelId: selectedChannelId, scope: metricScope, requestId });
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
  if (message.type === "ready") {
    workerReady = true;
    setStateLabel();
    syncBackendLabel();
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
    for (const [requestId, pending] of pendingSnapshotRequests) {
      window.clearTimeout(pending.timeoutId);
      pending.reject(new Error(message.message || "Simulation worker error."));
      pendingSnapshotRequests.delete(requestId);
    }
    ui.stateLabel.textContent = "Worker error";
  }
}

function startWorker() {
  if (simWorker) simWorker.terminate();
  simWorker = null;
  workerReady = false;
  workerBusy = false;
  simWorker = new Worker("src/range-sim-worker.js");
  simWorker.addEventListener("message", handleWorkerMessage);
  simWorker.addEventListener("error", () => {
    workerReady = false;
    workerBusy = false;
    ui.stateLabel.textContent = "Worker error";
  });
  postWorker("init", {
    width: worldWidth,
    height: worldHeight,
    model: simulationModel(),
  });
}

function startBackend({ resetField = true } = {}) {
  const wantsWebgl = backendPreference === "webgl" || backendPreference === "auto";
  const canTryWebgl = wantsWebgl && window.WebGLLeniaSim && glCanvas;

  pendingStepCount = 0;
  workerBusy = false;
  workerReady = false;

  if (canTryWebgl) {
    try {
      if (simWorker) {
        simWorker.terminate();
        simWorker = null;
      }
      if (!webglSim) webglSim = new window.WebGLLeniaSim(glCanvas);
      activeBackend = "webgl";
      glCanvas.hidden = false;
      webglUnavailableReason = "";
      if (resetField) {
        simTime = 0;
        metrics = { mass: 0, growth: 0, energy: 0 };
      }
      webglSim.init(worldWidth, worldHeight, simulationModel());
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
    const nextProfile = webglSim.step(count);
    profile = {
      ...profile,
      ...webglSim.profile,
      stepSimulationMs: nextProfile.stepSimulationMs,
      colorizeMs: 0,
      updateFieldBufferMs: 0,
      patches: 0,
    };
    const nextMetrics = webglSim.readMetrics(performance.now());
    if (nextMetrics) metrics = nextMetrics;
    simTime += currentStepDt() * nextProfile.steps;
    simStepCount += nextProfile.steps;
    requestRender();
    updateMetrics();
    if (pendingStepCount > 0) drainStepQueue();
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
      : getActiveRect(currentSafeArea() + currentRadius() + 2),
  });
}

function bindEvents() {
  ui.gameModeBtn.addEventListener("click", () => setGameMode(!gameMode));
  ui.timeTabBtn.addEventListener("click", () => setTab("time"));
  ui.gameTabBtn.addEventListener("click", () => setTab("game"));
  ui.advancedTabBtn.addEventListener("click", () => setTab("advanced"));
  ui.runBtn.addEventListener("click", () => setRunning(!isRunning));
  ui.stepBtn.addEventListener("click", () => queueSteps(1));
  ui.clearBtn.addEventListener("click", clearField);
  ui.randomBtn.addEventListener("click", randomizeField);
  ui.speedSlider.addEventListener("input", syncLabels);

  ui.worldSizeSelect.addEventListener("change", () => {
    resizeWorld(Number(ui.worldSizeSelect.value));
  });

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
    ui.safeSlider,
  ]) {
    slider.addEventListener("input", () => {
      syncLabels();
      configureBackend();
    });
  }

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
  for (const input of ui.layerColorInputs) {
    input.addEventListener("input", () => {
      ui.colorInputs.forEach((colorInput, index) => {
        colorInput.value = ui.layerColorInputs[index].value;
      });
      rebuildPalette();
    });
  }
  ui.formSearch.addEventListener("input", renderFormList);
  ui.groupSelect.addEventListener("change", () => requestGroupChange(Number(ui.groupSelect.value)));
  ui.prevGroupBtn.addEventListener("click", () => moveGroup(-1));
  ui.nextGroupBtn.addEventListener("click", () => moveGroup(1));
  ui.cancelGroupChangeBtn.addEventListener("click", hideGroupChangeDialog);
  ui.confirmGroupChangeBtn.addEventListener("click", () => {
    const index = pendingGroupIndex;
    setGroupAlertDisabled(ui.skipGroupAlert.checked);
    ui.groupChangeDialog.hidden = true;
    ui.skipGroupAlert.checked = false;
    commitGroupChange(index);
  });
  ui.groupChangeDialog.addEventListener("click", (event) => {
    if (event.target === ui.groupChangeDialog) hideGroupChangeDialog();
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
  resizeCanvas();
  bindEvents();
  compatibleForms = buildLibraryForms();
  try {
    compatibleGroups = await buildCompatibleGroups(compatibleForms);
  } catch (error) {
    console.error(error);
    compatibleGroups = [];
  }
  const legacyGroup = buildLegacyCompatibleGroup(compatibleForms);
  if (legacyGroup) compatibleGroups.push(legacyGroup);
  const groupFormCount = compatibleGroups.reduce((total, group) => total + group.forms.length, 0);
  ui.libraryCount.textContent = `${groupFormCount} forms | ${compatibleGroups.length} groups`;
  renderGroupOrganizer();
  if (compatibleGroups.length) {
    const groupIndex = defaultGroupIndex();
    const defaultForm = defaultFormForGroup(compatibleGroups[groupIndex]);
    commitGroupChange(groupIndex, { selectFirst: false });
    if (defaultForm) selectForm(defaultForm);
  } else {
    ui.selectedForm.textContent = "No compatible groups loaded";
    renderFormList();
  }
  setGameZoom(Number(ui.gameZoomSlider.value));
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
