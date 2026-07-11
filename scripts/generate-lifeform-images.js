const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const zlib = require("node:zlib");

const { clamp, hexToRgb, parseCellArray } = require("../src/lenia-core.js");
const {
  buildLibraryForms,
  isCompatibleRule,
  parseCompatibleGroups,
} = require("../src/lifeform-catalog.js");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "lifeforms");
const CATALOG_PATH = path.join(ROOT, "docs", "strictly-compatible-groups.txt");
const SIZE = 128;
const PADDING = 10;
const DEFAULT_COLORS = ["#080618", "#231c49", "#3e3f77", "#8889bc", "#f0efd6"];
const PALETTE = DEFAULT_COLORS.map(hexToRgb);

function samplePalette(value) {
  const scaled = clamp(value) * (PALETTE.length - 1);
  const base = Math.floor(scaled);
  const ratio = scaled - base;
  const start = PALETTE[base];
  const end = PALETTE[Math.min(base + 1, PALETTE.length - 1)];
  return start.map((component, index) => Math.round(component + (end[index] - component) * ratio));
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
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
  const imageHeader = Buffer.alloc(13);
  imageHeader.writeUInt32BE(width, 0);
  imageHeader.writeUInt32BE(height, 4);
  imageHeader[8] = 8;
  imageHeader[9] = 6;

  const rowSize = width * 4 + 1;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0;
    rgba.copy(raw, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    header,
    pngChunk("IHDR", imageHeader),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function renderLifeform(form) {
  const data = parseCellArray(form.cells);
  const rgba = Buffer.alloc(SIZE * SIZE * 4);
  const availableSize = SIZE - PADDING * 2;
  const sourceSpan = Math.max(data.width || 1, data.height || 1);
  const scale = sourceSpan <= availableSize ? Math.max(1, Math.floor(availableSize / sourceSpan)) : availableSize / sourceSpan;
  const drawnWidth = Math.max(1, Math.round(data.width * scale));
  const drawnHeight = Math.max(1, Math.round(data.height * scale));
  const offsetX = Math.floor((SIZE - drawnWidth) / 2);
  const offsetY = Math.floor((SIZE - drawnHeight) / 2);

  for (let y = 0; y < drawnHeight; y += 1) {
    const sourceY = Math.min(data.height - 1, Math.floor(y / scale));
    for (let x = 0; x < drawnWidth; x += 1) {
      const sourceX = Math.min(data.width - 1, Math.floor(x / scale));
      const value = data.rows[sourceY]?.[sourceX] || 0;
      if (value <= 0) continue;
      const [red, green, blue] = samplePalette(value);
      const pixelIndex = ((offsetY + y) * SIZE + offsetX + x) * 4;
      rgba[pixelIndex] = red;
      rgba[pixelIndex + 1] = green;
      rgba[pixelIndex + 2] = blue;
      rgba[pixelIndex + 3] = Math.round(90 + value * 165);
    }
  }

  return encodePng(SIZE, SIZE, rgba);
}

function loadLifeformContext() {
  const context = vm.createContext({}, { codeGeneration: { strings: false, wasm: false } });
  context.window = context;
  for (const fileName of [
    "lenia-lifeforms.js",
    "compatible-extra-lifeforms.js",
    "lenia-repository-lifeforms.js",
  ]) {
    const sourcePath = path.join(ROOT, "src", fileName);
    if (!fs.existsSync(sourcePath)) continue;
    vm.runInContext(fs.readFileSync(sourcePath, "utf8"), context, { filename: fileName });
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

function writeGeneratedImages(forms) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const generatedNames = new Set();
  for (const form of forms) {
    const fileName = `${form.assetSlug}.png`;
    if (generatedNames.has(fileName)) throw new Error(`Duplicate generated asset name: ${fileName}`);
    generatedNames.add(fileName);
    fs.writeFileSync(path.join(OUT_DIR, fileName), renderLifeform(form));
  }
}

function main() {
  const context = loadLifeformContext();
  const baseForms = buildLibraryForms(baseLifeformSources(context));
  const repositoryForms = buildLibraryForms(repositoryLifeformSources(context));
  const groups = parseCompatibleGroups(fs.readFileSync(CATALOG_PATH, "utf8"), baseForms);
  const formsById = new Map();

  for (const group of groups) {
    for (const form of group.forms) formsById.set(form.id, form);
  }
  for (const form of baseForms.filter((candidate) => isCompatibleRule(candidate.ruleInfo))) {
    formsById.set(form.id, form);
  }
  for (const form of repositoryForms) formsById.set(form.id, form);

  writeGeneratedImages(formsById.values());
  console.log(`Generated ${formsById.size} lifeform PNGs in ${path.relative(ROOT, OUT_DIR)}`);
}

main();
