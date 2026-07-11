(function initLeniencyMapCodec(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LeniencyMapCodec = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";

  const MAP_TYPE = "leniency-map";
  const MAP_VERSION = 2;
  const MIN_WORLD_SIZE = 16;
  const MAX_WORLD_SIZE = 2048;
  const MAX_CHANNELS = 3;
  const MAX_RULES = 16;
  const MAX_RULE_RADIUS = 64;
  const MAX_MAP_FILE_BYTES = 128 * 1024 * 1024;
  const CHANNEL_ID_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,63}$/i;
  const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

  /** @param {unknown} value @param {string} label */
  function requireObject(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
    return value;
  }

  /** @param {unknown} value @param {string} label @param {number} low @param {number} high */
  function requireFiniteNumber(value, label, low, high) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < low || number > high) {
      throw new RangeError(`${label} must be between ${low} and ${high}.`);
    }
    return number;
  }

  /** @param {unknown} value @param {string} label @param {number} low @param {number} high */
  function requireInteger(value, label, low, high) {
    const number = requireFiniteNumber(value, label, low, high);
    if (!Number.isSafeInteger(number)) throw new TypeError(`${label} must be an integer.`);
    return number;
  }

  function isLittleEndian() {
    const bytes = new Uint8Array(new Uint16Array([1]).buffer);
    return bytes[0] === 1;
  }

  function decodedByteLength(base64) {
    const source = String(base64 || "").replace(/\s+/g, "");
    if (!source || source.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(source)) {
      throw new TypeError("Field data is not valid base64.");
    }
    const padding = source.endsWith("==") ? 2 : source.endsWith("=") ? 1 : 0;
    return (source.length / 4) * 3 - padding;
  }

  /** Decode an exact-length Float32 payload without trusting serialized allocation lengths. */
  function decodeFloat32(base64, expectedLength) {
    if (base64 === "") return new Float32Array(expectedLength);
    const expectedBytes = expectedLength * Float32Array.BYTES_PER_ELEMENT;
    if (decodedByteLength(base64) !== expectedBytes) {
      throw new RangeError(`Field payload must contain exactly ${expectedLength} Float32 values.`);
    }
    const binary = atob(String(base64).replace(/\s+/g, ""));
    const bytes = new Uint8Array(expectedBytes);
    for (let index = 0; index < expectedBytes; index += 1) bytes[index] = binary.charCodeAt(index);
    const values = new Float32Array(bytes.buffer);
    for (let index = 0; index < values.length; index += 1) {
      if (!Number.isFinite(values[index])) throw new TypeError(`Field contains a non-finite value at index ${index}.`);
    }
    return values;
  }

  /** Encode a Float32 field in bounded chunks to avoid argument-stack overflow. */
  function encodeFloat32(values) {
    if (!(values instanceof Float32Array)) throw new TypeError("Field values must be a Float32Array.");
    const bytes = new Uint8Array(values.buffer, values.byteOffset, values.byteLength);
    const chunks = [];
    for (let index = 0; index < bytes.length; index += 32768) {
      chunks.push(String.fromCharCode.apply(null, bytes.subarray(index, index + 32768)));
    }
    return btoa(chunks.join(""));
  }

  function validatePalette(value, label) {
    if (!Array.isArray(value) || value.length < 2 || value.length > 8) {
      throw new TypeError(`${label} must contain between 2 and 8 colors.`);
    }
    return value.map((color, index) => {
      const normalized = String(color || "");
      if (!COLOR_PATTERN.test(normalized)) throw new TypeError(`${label}[${index}] must be a six-digit hex color.`);
      return normalized.toLowerCase();
    });
  }

  function validateRule(value, index, channelIds) {
    const source = requireObject(value, `configuration.layers.rules[${index}]`);
    const sourceChannelId = String(source.sourceChannelId || source.src || source.source || "");
    const destinationChannelId = String(source.destinationChannelId || source.dst || source.destination || "");
    if (!channelIds.has(sourceChannelId) || !channelIds.has(destinationChannelId)) {
      throw new TypeError(`Rule ${index} references a missing channel.`);
    }
    const beta = Array.isArray(source.beta) ? source.beta.slice(0, 8) : [1, 0, 0, 0];
    const eta = Array.isArray(source.eta) ? source.eta.slice(0, 8) : [0, 0, 0, 0];
    for (const [name, values] of [["beta", beta], ["eta", eta]]) {
      values.forEach((entry, valueIndex) => requireFiniteNumber(entry, `Rule ${index} ${name}[${valueIndex}]`, -16, 16));
    }
    return {
      ...source,
      id: String(source.id || `rule-${index}`).slice(0, 96),
      sourceChannelId,
      destinationChannelId,
      radius: requireFiniteNumber(source.radius ?? 13, `Rule ${index} radius`, 1, MAX_RULE_RADIUS),
      alpha: requireFiniteNumber(source.alpha ?? 4, `Rule ${index} alpha`, 0.01, 64),
      mu: requireFiniteNumber(source.mu ?? 0.15, `Rule ${index} mu`, -4, 4),
      sigma: requireFiniteNumber(source.sigma ?? 0.017, `Rule ${index} sigma`, Number.EPSILON, 4),
      dt: requireFiniteNumber(source.dt ?? 0.1, `Rule ${index} dt`, 0.000001, 4),
      gain: requireFiniteNumber(source.gain ?? 1, `Rule ${index} gain`, -16, 16),
      decay: requireFiniteNumber(source.decay ?? 0, `Rule ${index} decay`, 0, 4),
      weight: requireFiniteNumber(source.weight ?? 1, `Rule ${index} weight`, -16, 16),
      layer: requireInteger(source.layer ?? 0, `Rule ${index} layer`, 0, 7),
      beta,
      eta,
      limitValue: source.limitValue !== false,
      positiveOnly: Boolean(source.positiveOnly),
      deltaName: String(source.deltaName || "gaus").slice(0, 24),
      coreName: String(source.coreName || "bump4").slice(0, 24),
    };
  }

  function validateModel(value, legacyRule, legacyColors) {
    const source = value && typeof value === "object" ? value : null;
    if (!source?.channels?.length) {
      const channelIds = new Set(["channel-0"]);
      return {
        selectedChannelId: "channel-0",
        metricScope: "selected",
        wrapAround: legacyRule?.wrapAround !== false,
        channels: [{ id: "channel-0", name: "Layer 1", palette: validatePalette(legacyColors, "configuration.advanced.colors"), visible: true }],
        rules: [validateRule({
          ...legacyRule,
          id: "rule-0",
          sourceChannelId: "channel-0",
          destinationChannelId: "channel-0",
        }, 0, channelIds)],
      };
    }
    if (!Array.isArray(source.channels) || source.channels.length < 1 || source.channels.length > MAX_CHANNELS) {
      throw new RangeError(`A map must contain between 1 and ${MAX_CHANNELS} channels.`);
    }
    const channelIds = new Set();
    const channels = source.channels.map((entry, index) => {
      const channel = requireObject(entry, `configuration.layers.channels[${index}]`);
      const id = String(channel.id || `channel-${index}`);
      if (!CHANNEL_ID_PATTERN.test(id) || channelIds.has(id)) throw new TypeError(`Channel id "${id}" is invalid or duplicated.`);
      channelIds.add(id);
      return {
        id,
        name: String(channel.name || `Layer ${index + 1}`).slice(0, 36),
        palette: validatePalette(channel.palette || channel.colors, `Channel ${id} palette`),
        visible: channel.visible !== false,
      };
    });
    if (!Array.isArray(source.rules) || source.rules.length < 1 || source.rules.length > MAX_RULES) {
      throw new RangeError(`A map must contain between 1 and ${MAX_RULES} rules.`);
    }
    const rules = source.rules.map((rule, index) => validateRule(rule, index, channelIds));
    const selectedChannelId = channelIds.has(String(source.selectedChannelId)) ? String(source.selectedChannelId) : channels[0].id;
    return {
      selectedChannelId,
      metricScope: source.metricScope === "aggregate" ? "aggregate" : "selected",
      wrapAround: source.wrapAround !== false,
      channels,
      rules,
    };
  }

  /** Validate and decode a parsed Leniency v2 map without mutating application state. */
  function decodeMap(value) {
    const map = requireObject(value, "Map");
    if (map.type !== MAP_TYPE) throw new TypeError(`Unsupported map type "${String(map.type || "")}".`);
    if (map.version !== MAP_VERSION) throw new RangeError(`Unsupported map version ${String(map.version)}; expected ${MAP_VERSION}.`);
    const world = requireObject(map.world, "world");
    const width = requireInteger(world.width, "world.width", MIN_WORLD_SIZE, MAX_WORLD_SIZE);
    const height = requireInteger(world.height, "world.height", MIN_WORLD_SIZE, MAX_WORLD_SIZE);
    const expectedLength = width * height;
    const configuration = requireObject(map.configuration || {}, "configuration");
    const legacyColors = configuration.advanced?.colors || ["#080618", "#231c49", "#3e3f77", "#8889bc", "#f0efd6"];
    const legacyRule = configuration.rule || {};
    const model = validateModel(configuration.layers, legacyRule, legacyColors);
    const channelIds = new Set(model.channels.map((channel) => channel.id));
    const sourceFields = Array.isArray(map.fields) && map.fields.length
      ? map.fields
      : map.field?.data
        ? [{ ...map.field, channelId: model.channels[0].id }]
        : [];
    if (!sourceFields.length) throw new TypeError("Map contains no field data.");
    if (!isLittleEndian() && sourceFields.some((field) => field.littleEndian !== false)) {
      throw new Error("This map uses little-endian Float32 data, which this platform cannot decode.");
    }
    const seenFields = new Set();
    const fields = sourceFields.map((entry, index) => {
      const field = requireObject(entry, `fields[${index}]`);
      const channelId = String(field.channelId || field.id || "");
      if (!channelIds.has(channelId) || seenFields.has(channelId)) {
        throw new TypeError(`Field channel "${channelId}" is missing or duplicated.`);
      }
      seenFields.add(channelId);
      if (field.encoding !== "float32-base64") throw new TypeError(`Unsupported field encoding "${String(field.encoding || "")}".`);
      if (field.littleEndian === false) throw new TypeError("Big-endian field data is unsupported.");
      if (field.length != null && Number(field.length) !== expectedLength) {
        throw new RangeError(`Field ${channelId} length does not match ${width} x ${height}.`);
      }
      return { id: channelId, values: decodeFloat32(field.data, expectedLength) };
    });
    return { map, width, height, expectedLength, configuration, model, fields };
  }

  function parseMapText(text) {
    const source = String(text || "");
    if (source.length > MAX_MAP_FILE_BYTES) throw new RangeError("Map file is too large.");
    let parsed;
    try {
      parsed = JSON.parse(source);
    } catch (error) {
      throw new SyntaxError(`Map is not valid JSON: ${error?.message || error}`);
    }
    return decodeMap(parsed);
  }

  async function readMapFile(file) {
    if (!file || typeof file.text !== "function") throw new TypeError("Choose a .map file to load.");
    if (Number(file.size) > MAX_MAP_FILE_BYTES) throw new RangeError("Map file is too large.");
    return parseMapText(await file.text());
  }

  return Object.freeze({
    MAP_TYPE,
    MAP_VERSION,
    MIN_WORLD_SIZE,
    MAX_WORLD_SIZE,
    MAX_CHANNELS,
    MAX_RULES,
    MAX_RULE_RADIUS,
    MAX_MAP_FILE_BYTES,
    decodeFloat32,
    decodeMap,
    encodeFloat32,
    parseMapText,
    readMapFile,
  });
});
