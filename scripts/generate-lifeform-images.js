const fs = require("fs");
const path = require("path");
const vm = require("vm");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "lifeforms");
const SIZE = 128;
const PADDING = 10;
const ZIP_HEADER = "(zip)";
const ZIP2_HEADER = "(zip2)";
const ZIP_START = 192;
const DEFAULT_COLORS = ["#080618", "#231c49", "#3e3f77", "#8889bc", "#f0efd6"];
const DEFAULT_RULE = {
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

function clamp(value, low = 0, high = 1) {
  return Math.max(low, Math.min(high, value));
}

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
  };
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
  if (!group.ruleInfo.hasGrowthHint) nextRule.deltaName = firstRule.deltaName;
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
        ruleInfo,
        perFormRule: ruleInfo.perFormRule,
        items: [],
        forms: [],
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
      }
    }
    group.ruleInfo = reconcileGroupRule(group);
  }

  return groups.filter((group) => group.forms.length > 0);
}

function isCompatibleRule(rule) {
  return rule.radius === 13 && rule.coreName === "bump4" && rule.layer === 0 && Math.abs(rule.dt - 0.1) < 0.000001;
}

function lifeformAssetSlug(form) {
  const code = String(form.code || "form")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const prefix = String(form.assetPrefix || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `lifeform-${prefix ? `${prefix}-` : ""}${form.index}-${code || "form"}`;
}

function cleanGroupName(value) {
  return String(value || "")
    .replace(/^(class|order|family|subfamily|subphylum):\s*/i, "")
    .trim();
}

function buildLibraryForms(sources) {
  const forms = [];

  for (const source of sources) {
    const groupStack = [];
    const entries = Array.isArray(source.entries) ? source.entries : [];
    for (let i = 0; i < entries.length; i += 1) {
      const item = entries[i];
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
      const index = Number(source.indexOffset || 0) + i;
      forms.push({
        id: `${source.id}-${index}-${code || i}`,
        sourceId: source.id,
        sourceTitle: source.title,
        sourceIndex: i,
        assetPrefix: source.assetPrefix || "",
        index,
        code,
        rawCode: item[0] || "",
        name: item[1] || code,
        section: cleanGroupName(groupStack.filter(Boolean).at(-1)) || source.title || "",
        rule,
        cells,
        ruleInfo,
      });
    }
  }

  return forms.map((form) => ({
    ...form,
    assetSlug: lifeformAssetSlug(form),
  }));
}

function hexToRgb(hex) {
  const clean = String(hex || "#000000").replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((part) => part + part).join("") : clean;
  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const palette = DEFAULT_COLORS.map(hexToRgb);

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

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.from("\x89PNG\r\n\x1a\n", "binary");
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rawOffset = y * (width * 4 + 1);
    raw[rawOffset] = 0;
    rgba.copy(raw, rawOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    header,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function renderLifeform(form) {
  const data = parseCellArray(form.cells);
  const rgba = Buffer.alloc(SIZE * SIZE * 4);
  const scale = Math.max(1, Math.floor((SIZE - PADDING * 2) / Math.max(data.width || 1, data.height || 1)));
  const drawnWidth = data.width * scale;
  const drawnHeight = data.height * scale;
  const offsetX = Math.floor((SIZE - drawnWidth) / 2);
  const offsetY = Math.floor((SIZE - drawnHeight) / 2);

  for (let sourceY = 0; sourceY < data.height; sourceY += 1) {
    for (let sourceX = 0; sourceX < data.width; sourceX += 1) {
      const value = data.rows[sourceY]?.[sourceX] || 0;
      if (value <= 0) continue;
      const [r, g, b] = colorRamp(value);
      const alpha = Math.round(90 + value * 165);
      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          const x = offsetX + sourceX * scale + dx;
          const y = offsetY + sourceY * scale + dy;
          const p = (y * SIZE + x) * 4;
          rgba[p] = r;
          rgba[p + 1] = g;
          rgba[p + 2] = b;
          rgba[p + 3] = alpha;
        }
      }
    }
  }

  return encodePng(SIZE, SIZE, rgba);
}

function loadLifeformContext() {
  const context = vm.createContext({});
  context.window = context;
  for (const file of ["lenia-lifeforms.js", "compatible-extra-lifeforms.js", "lenia-repository-lifeforms.js"]) {
    const sourcePath = path.join(ROOT, "src", file);
    if (fs.existsSync(sourcePath)) {
      vm.runInContext(fs.readFileSync(sourcePath, "utf8"), context, { filename: file });
    }
  }
  return context;
}

function baseLifeformSources(context) {
  const animalArr = Array.isArray(context.animalArr) ? context.animalArr : [];
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
      entries: Array.isArray(context.extraCompatibleAnimalArr) ? context.extraCompatibleAnimalArr : [],
      indexOffset: animalArr.length,
      assetPrefix: "",
    },
  ];
}

function repositoryLifeformSources(context) {
  return [
    {
      id: "lenia-repository",
      title: "Lenia repository",
      entries: Array.isArray(context.leniaRepositoryAnimalArr) ? context.leniaRepositoryAnimalArr : [],
      indexOffset: 0,
      assetPrefix: "lenia",
    },
  ];
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const context = loadLifeformContext();
  const baseForms = buildLibraryForms(baseLifeformSources(context));
  const repositoryForms = buildLibraryForms(repositoryLifeformSources(context));
  const groups = parseCompatibleGroups(fs.readFileSync(path.join(ROOT, "docs/strictly-compatible-groups.txt"), "utf8"), baseForms);
  const legacyForms = baseForms.filter((form) => isCompatibleRule(form.ruleInfo));
  const formsById = new Map();
  for (const group of groups) {
    for (const form of group.forms) formsById.set(form.id, form);
  }
  for (const form of legacyForms) formsById.set(form.id, form);
  for (const form of repositoryForms) formsById.set(form.id, form);

  for (const form of formsById.values()) {
    fs.writeFileSync(path.join(OUT_DIR, `${form.assetSlug}.png`), renderLifeform(form));
  }

  console.log(`Generated ${formsById.size} lifeform PNGs in ${path.relative(ROOT, OUT_DIR)}`);
}

main();
