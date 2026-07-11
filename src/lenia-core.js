(function initLeniaCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LeniaCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  /**
   * @typedef {object} LeniaRule
   * @property {number} radius
   * @property {number} alpha
   * @property {number} dt
   * @property {number} gain
   * @property {number} decay
   * @property {number} mu
   * @property {number} sigma
   * @property {boolean} limitValue
   * @property {string} deltaName
   * @property {string} coreName
   * @property {number} layer
   * @property {number[]} beta
   * @property {number[]} eta
   */

  /** @typedef {{rows: number[][], width: number, height: number}} CellArray */

  const ZIP_HEADER = "(zip)";
  const ZIP2_HEADER = "(zip2)";
  const ZIP_START = 192;
  const MAX_DECODED_CELLS = 4_194_304;
  const DEFAULT_RULE = Object.freeze({
    radius: 13,
    alpha: 4,
    ts: 10,
    dt: 0.1,
    gain: 1,
    decay: 0,
    limitValue: true,
    deltaName: "gaus",
    mu: 0.15,
    sigma: 0.017,
    coreName: "bump4",
    layer: 0,
    beta: Object.freeze([1, 0, 0, 0]),
    eta: Object.freeze([0, 0, 0, 0]),
  });

  /** @param {number} value @param {number} [low] @param {number} [high] */
  function clamp(value, low = 0, high = 1) {
    return Math.max(low, Math.min(high, value));
  }

  function modulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  /** Create a defensive rule copy with independent kernel arrays. */
  function cloneRule(rule = DEFAULT_RULE) {
    return {
      ...DEFAULT_RULE,
      ...rule,
      beta: [...(Array.isArray(rule.beta) ? rule.beta : DEFAULT_RULE.beta)],
      eta: [...(Array.isArray(rule.eta) ? rule.eta : DEFAULT_RULE.eta)],
    };
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

  function assertCellBudget(count) {
    if (!Number.isSafeInteger(count) || count < 0 || count > MAX_DECODED_CELLS) {
      throw new RangeError(`Lifeform expands beyond ${MAX_DECODED_CELLS.toLocaleString("en-US")} cells.`);
    }
  }

  function rleCellValue(token) {
    if (token === "." || token === "b") return 0;
    if (token === "o") return 1;
    if (token.length === 1) return clamp((token.charCodeAt(0) - 64) / 255);
    return clamp(((token.charCodeAt(0) - 112) * 24 + (token.charCodeAt(1) - 65 + 25)) / 255);
  }

  function parseRleCellArray(cellText) {
    const rows = [];
    let row = [];
    let countText = "";
    let prefix = "";
    let decodedCells = 0;
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
        assertCellBudget(rows.length + count);
        assertCellBudget(decodedCells + row.length);
        rows.push(row);
        for (let index = 1; index < count; index += 1) rows.push([]);
        decodedCells += row.length;
        row = [];
        continue;
      }

      const count = repeatCount();
      assertCellBudget(decodedCells + row.length + count);
      const value = rleCellValue(token);
      for (let index = 0; index < count; index += 1) row.push(value);
    }

    return summarizeRows(rows);
  }

  function summarizeRows(rows) {
    const width = rows.reduce((maximum, row) => Math.max(maximum, row.length), 0);
    const height = rows.length;
    assertCellBudget(width * height);
    return { rows, width, height };
  }

  /** Decode Lenia zip/zip2, CSV, or RLE cell data. */
  /** @returns {CellArray} */
  function parseCellArray(cellText) {
    let source = String(cellText || "");
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
            if (bits.length === 1) return part;
            const repeat = fromRepeat(bits[0]);
            assertCellBudget(repeat);
            return "0".repeat(repeat) + bits.slice(1).join(".");
          })
          .join("");
        assertCellBudget(row.length);
        return [...row].map((char) => clamp(fromZip(char) / 100));
      }
      if (row === "") return [];
      return row.split(",").map((value) => clamp(Number.parseFloat(value) || 0));
    });

    if (isZip2) {
      const doubled = [];
      for (const row of rows) {
        const wide = row.flatMap((value) => [value, value]);
        doubled.push([...wide], [...wide]);
      }
      rows = doubled;
    }

    return summarizeRows(rows);
  }

  function parseFraction(value) {
    if (value == null || value === "") return 0;
    const text = String(value).trim();
    if (text.includes("/")) {
      const [numerator, denominator] = text.split("/").map(Number);
      return denominator ? numerator / denominator : 0;
    }
    return Number.parseFloat(text) || 0;
  }

  /** Parse the compact Lenia rule syntax used by the bundled catalogues. */
  /** @returns {LeniaRule} */
  function parseRule(ruleText, defaults = DEFAULT_RULE) {
    const rule = cloneRule(defaults);
    const source = String(ruleText || "");
    const radius = Number.parseInt(source.match(/(?:^|;)R=(\d+)/)?.[1] || "", 10);
    if (Number.isFinite(radius)) rule.radius = radius;

    const delta = source.match(/d=([a-z0-9/]+)\(([-\d.]+),([-\d.]+)\)\*([-\d.]+)(\+?)/i);
    if (delta) {
      rule.deltaName = delta[1];
      rule.mu = Number.parseFloat(delta[2]);
      rule.sigma = Number.parseFloat(delta[3]);
      const multiplier = Math.abs(Number.parseFloat(delta[4]));
      rule.ts = multiplier > 0 ? Math.round(1 / multiplier) : Number(defaults.ts || DEFAULT_RULE.ts);
      rule.dt = multiplier || Number(defaults.dt || DEFAULT_RULE.dt);
      rule.limitValue = delta[5] !== "+";
    }

    const kernel = source.match(/k=([^;]+)/i);
    if (kernel) {
      const expression = kernel[1];
      const name = expression.split("(")[0];
      const legacyName = name === "bimo4" || name === "trmo4" ? "quad4" : name === "bist4" ? "stpz1/4" : name;
      const args = [...expression.matchAll(/\(([^)]*)\)/g)].map((match) =>
        match[1] === "" ? [] : match[1].split(",").map(parseFraction),
      );
      rule.coreName = legacyName.replace(/\d+$/, "") === "bump" ? "bump4" : legacyName;
      if (!["bump4", "quad4", "trap1/5", "stpz1/4", "life"].includes(rule.coreName)) {
        rule.coreName = legacyName.startsWith("quad") ? "quad4" : legacyName.startsWith("bump") ? "bump4" : legacyName;
      }
      const beta = args[0] || [];
      const eta = args[1] || [];
      rule.layer = name === "trmo4" ? 2 : Math.max(beta.length - 1, 0);
      for (let index = 0; index < 4; index += 1) {
        rule.beta[index] = beta[index] || 0;
        rule.eta[index] = eta[index] || 0;
      }
      if (rule.layer <= 1 && rule.beta[0] === 0) rule.beta[0] = 1;
    }

    return rule;
  }

  function splitLifeformPayload(payload) {
    const source = String(payload || "");
    const markerIndex = source.indexOf(";cells=");
    if (markerIndex < 0) return { rule: "", cells: source };
    return {
      rule: source.slice(0, markerIndex),
      cells: source.slice(markerIndex + 7),
    };
  }

  function displayCode(rawCode) {
    return String(rawCode || "").replace(/^[~*]/, "");
  }

  function bump(value, alpha = 4) {
    if (value <= 0 || value >= 1) return 0;
    const kernel = 4 * value * (1 - value);
    return Math.exp(alpha * (1 - 1 / kernel));
  }

  function coreValue(rule, radius, alpha = Number(rule?.alpha ?? 4)) {
    if (radius < 0 || radius > 1) return 0;
    const kernel = 4 * radius * (1 - radius);
    switch (rule?.coreName) {
      case "quad4":
        return kernel <= 0 ? 0 : Math.pow(kernel, alpha);
      case "trap1/5": {
        const quarter = 1 / 5;
        if (radius < quarter || radius > 1 - quarter) return 0;
        if (radius < 2 * quarter) return (radius - quarter) / quarter;
        if (radius > 1 - 2 * quarter) return (1 - quarter - radius) / quarter;
        return 1;
      }
      case "stpz1/4": {
        const quarter = 1 / 4;
        return radius >= quarter && radius <= 1 - quarter ? 1 : 0;
      }
      case "life": {
        const quarter = 1 / 4;
        if (radius < quarter) return 0.5;
        return radius > 1 - quarter ? 0 : 1;
      }
      default:
        return bump(radius, alpha);
    }
  }

  function kernelValue(rule, radius, alpha = Number(rule?.alpha ?? 4)) {
    const distance = Math.abs(radius);
    if (!rule?.layer) return coreValue(rule, distance, alpha);
    if (distance >= 1) return 0;
    const layerCount = rule.layer + 1;
    const scaled = distance * layerCount;
    const betaIndex = Math.floor(scaled);
    const etaIndex = Math.floor(scaled + 0.5);
    const eta = etaIndex <= rule.layer ? rule.eta?.[etaIndex] || 0 : 0;
    return coreValue(rule, scaled % 1, alpha) * ((rule.beta?.[betaIndex] || 0) - eta) + eta;
  }

  function growthCurve(rule, neighborhood, alpha = Number(rule?.alpha ?? 4)) {
    const mu = Number(rule?.mu ?? DEFAULT_RULE.mu);
    const sigma = Math.max(Number.EPSILON, Number(rule?.sigma ?? DEFAULT_RULE.sigma));
    const distance = Math.abs(neighborhood - mu);
    const squared = distance * distance;
    switch (rule?.deltaName) {
      case "quad4": {
        const reach = 9 * sigma * sigma;
        return squared > reach ? -1 : Math.pow(1 - squared / reach, alpha) * 2 - 1;
      }
      case "trap": {
        const inner = sigma / 2;
        const outer = sigma * 2;
        if (distance <= inner) return 1;
        return distance <= outer ? (2 * (outer - distance)) / (outer - inner) - 1 : -1;
      }
      case "stpz":
        return distance <= sigma ? 1 : -1;
      default:
        return 2 * Math.exp(-squared / (2 * sigma * sigma)) - 1;
    }
  }

  function hexToRgb(hex) {
    const clean = String(hex || "#000000").replace(/^#/, "");
    const full = clean.length === 3 ? clean.split("").map((part) => part + part).join("") : clean.padEnd(6, "0").slice(0, 6);
    const value = Number.parseInt(full, 16);
    return Number.isFinite(value) ? [(value >> 16) & 255, (value >> 8) & 255, value & 255] : [0, 0, 0];
  }

  function normalizePalette(colors, fallback = ["#000000", "#ffffff"]) {
    const source = Array.isArray(colors) && colors.length ? colors : fallback;
    return source.map((color) => (Array.isArray(color) ? color.slice(0, 3).map((value) => clamp(Math.round(Number(value) || 0), 0, 255)) : hexToRgb(color)));
  }

  function colorRamp(value, colors) {
    const palette = normalizePalette(colors);
    const scaled = clamp(value) * (palette.length - 1);
    const base = Math.floor(scaled);
    const ratio = scaled - base;
    const start = palette[base];
    const end = palette[Math.min(base + 1, palette.length - 1)];
    return start.map((component, index) => Math.round(component + (end[index] - component) * ratio));
  }

  function createColorLut(colors, size = 256) {
    const length = clamp(Math.round(Number(size) || 256), 2, 65_536);
    const palette = normalizePalette(colors);
    const lookup = new Uint8ClampedArray(length * 3);
    for (let index = 0; index < length; index += 1) {
      const scaled = (index / (length - 1)) * (palette.length - 1);
      const base = Math.floor(scaled);
      const ratio = scaled - base;
      const start = palette[base];
      const end = palette[Math.min(base + 1, palette.length - 1)];
      const offset = index * 3;
      lookup[offset] = Math.round(start[0] + (end[0] - start[0]) * ratio);
      lookup[offset + 1] = Math.round(start[1] + (end[1] - start[1]) * ratio);
      lookup[offset + 2] = Math.round(start[2] + (end[2] - start[2]) * ratio);
    }
    return lookup;
  }

  return Object.freeze({
    DEFAULT_RULE,
    MAX_DECODED_CELLS,
    clamp,
    cloneRule,
    colorRamp,
    createColorLut,
    coreValue,
    displayCode,
    growthCurve,
    hexToRgb,
    kernelValue,
    modulo,
    normalizePalette,
    parseCellArray,
    parseFraction,
    parseRleCellArray,
    parseRule,
    splitLifeformPayload,
  });
});
