const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function collectIds(html) {
  return [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
}

function referencedIds(html) {
  return [...html.matchAll(/\s(?:aria-controls|aria-describedby|aria-labelledby)="([^"]+)"/g)]
    .flatMap((match) => match[1].trim().split(/\s+/));
}

function scriptSources(html) {
  return [...html.matchAll(/<script\s+[^>]*src="([^"]+)"/g)].map((match) => match[1].split("?")[0]);
}

test("HTML documents have unique and resolvable accessibility ids", () => {
  for (const fileName of ["index.html", "range-playground.html"]) {
    const html = read(fileName);
    const ids = collectIds(html);
    assert.equal(new Set(ids).size, ids.length, `${fileName} has duplicate ids`);
    const idSet = new Set(ids);
    for (const id of referencedIds(html)) assert.ok(idSet.has(id), `${fileName} references missing #${id}`);
    assert.match(html, /<main(?:\s|>)/, `${fileName} has a main landmark`);
    assert.match(html, /class="skip-link"/, `${fileName} has a skip link`);
    assert.match(html, /Content-Security-Policy/, `${fileName} defines a CSP`);
  }
});

test("HTML runtime dependencies exist and load in dependency order", () => {
  const compactScripts = scriptSources(read("index.html"));
  const rangeScripts = scriptSources(read("range-playground.html"));
  for (const source of [...compactScripts, ...rangeScripts]) {
    assert.ok(fs.existsSync(path.join(ROOT, source)), `Missing script ${source}`);
  }
  assert.ok(compactScripts.indexOf("src/lenia-core.js") < compactScripts.indexOf("src/simple-sim.js"));
  assert.ok(compactScripts.indexOf("src/simple-sim.js") < compactScripts.indexOf("src/app.js"));
  assert.ok(rangeScripts.indexOf("src/lenia-core.js") < rangeScripts.indexOf("src/lifeform-catalog.js"));
  assert.ok(rangeScripts.indexOf("src/map-codec.js") < rangeScripts.indexOf("src/range-playground.js"));
});

test("JavaScript-referenced element ids exist in their documents", () => {
  const pairs = [
    ["index.html", "src/app.js"],
    ["range-playground.html", "src/range-playground.js"],
  ];
  for (const [htmlFile, scriptFile] of pairs) {
    const ids = new Set(collectIds(read(htmlFile)));
    const script = read(scriptFile);
    const selectors = [...script.matchAll(/(?:querySelector|required)\(\s*["']#([A-Za-z][\w:-]*)["']\s*\)/g)]
      .map((match) => match[1]);
    for (const id of selectors) assert.ok(ids.has(id), `${scriptFile} expects missing #${id}`);
  }
});

test("stylesheets keep responsive and accessibility safeguards", () => {
  for (const fileName of ["src/styles.css", "src/range-playground.css"]) {
    const css = read(fileName);
    const opens = (css.match(/{/g) || []).length;
    const closes = (css.match(/}/g) || []).length;
    assert.equal(opens, closes, `${fileName} has balanced blocks`);
    assert.match(css, /:focus-visible/);
    assert.match(css, /prefers-reduced-motion/);
    assert.match(css, /forced-colors/);
  }
});
