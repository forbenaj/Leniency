const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const core = require("../src/lenia-core.js");
const catalog = require("../src/lifeform-catalog.js");

const ROOT = path.resolve(__dirname, "..");

function readDataScript(fileName) {
  const context = vm.createContext({});
  context.window = context;
  vm.runInContext(fs.readFileSync(path.join(ROOT, "src", fileName), "utf8"), context, { filename: fileName });
  return context;
}

function readDataScripts(fileNames) {
  const context = vm.createContext({});
  context.window = context;
  for (const fileName of fileNames) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, "src", fileName), "utf8"), context, { filename: fileName });
  }
  return context;
}

test("builds normalized catalogue records without sharing mutable rule arrays", () => {
  const entries = [
    [">1", "family: Test", ""],
    ["T1", "Test form", "", "R=13;k=quad4(1,1/2);d=gaus(0.2,0.03)*0.1;cells=(zip)01"],
  ];
  const forms = catalog.buildLibraryForms([{ id: "test", title: "Test", entries }]);
  assert.equal(forms.length, 1);
  assert.equal(forms[0].section, "Test");
  assert.equal(forms[0].assetSlug, "lifeform-1-t1");
  assert.deepEqual(forms[0].ruleInfo.beta, [1, 0.5, 0, 0]);
  forms[0].ruleInfo.beta[0] = 0;
  assert.equal(core.DEFAULT_RULE.beta[0], 1);
});

test("all bundled lifeforms decode and retain their full rule ranges", () => {
  const context = readDataScript("lenia-lifeforms.js");
  const forms = catalog.buildLibraryForms([
    { id: "bundled", title: "Bundled", entries: context.animalArr, indexOffset: 0 },
  ]);

  assert.equal(forms.length, 330);
  assert.ok(Math.max(...forms.map((form) => form.ruleInfo.mu)) > 0.45);
  assert.ok(Math.max(...forms.map((form) => form.ruleInfo.sigma)) > 0.09);
  for (const form of forms) {
    const cells = core.parseCellArray(form.cells);
    assert.ok(cells.width > 0, `${form.code} has cells`);
    assert.ok(cells.height > 0, `${form.code} has rows`);
  }
  assert.equal(new Set(forms.map((form) => form.assetSlug)).size, forms.length);
});

test("strict compatibility groups resolve to unique bundled forms", () => {
  const context = readDataScript("lenia-lifeforms.js");
  const forms = catalog.buildLibraryForms([{ id: "bundled", title: "Bundled", entries: context.animalArr }]);
  const groupText = fs.readFileSync(path.join(ROOT, "docs", "strictly-compatible-groups.txt"), "utf8");
  const groups = catalog.parseCompatibleGroups(groupText, forms);
  const ids = groups.flatMap((group) => group.forms.map((form) => form.id));
  assert.ok(groups.length > 1);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(groups.every((group) => group.forms.length > 0));
});

test("generated catalogue assets cover compatible and repository forms", () => {
  const context = readDataScripts([
    "lenia-lifeforms.js",
    "compatible-extra-lifeforms.js",
    "lenia-repository-lifeforms.js",
  ]);
  const baseForms = catalog.buildLibraryForms([
    { id: "bundled", title: "Bundled", entries: context.animalArr, indexOffset: 0 },
    {
      id: "extras",
      title: "Extras",
      entries: context.extraCompatibleAnimalArr,
      indexOffset: context.animalArr.length,
    },
  ]);
  const repositoryForms = catalog.buildLibraryForms([
    {
      id: "repository",
      title: "Repository",
      entries: context.leniaRepositoryAnimalArr,
      assetPrefix: "lenia",
    },
  ]);
  const strictGroups = catalog.parseCompatibleGroups(
    fs.readFileSync(path.join(ROOT, "docs", "strictly-compatible-groups.txt"), "utf8"),
    baseForms,
  );
  const expectedForms = new Map();
  for (const group of strictGroups) for (const form of group.forms) expectedForms.set(form.id, form);
  for (const form of baseForms.filter((candidate) => catalog.isCompatibleRule(candidate.ruleInfo))) {
    expectedForms.set(form.id, form);
  }
  for (const form of repositoryForms) expectedForms.set(form.id, form);

  assert.ok(repositoryForms.length > 500);
  for (const form of expectedForms.values()) {
    assert.ok(fs.existsSync(path.join(ROOT, "assets", "lifeforms", `${form.assetSlug}.png`)), form.assetSlug);
  }
});
