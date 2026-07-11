(function initLifeformCatalog(root, factory) {
  const core = root?.LeniaCore || (typeof require === "function" ? require("./lenia-core.js") : null);
  const api = factory(core);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LifeformCatalog = api;
})(typeof globalThis !== "undefined" ? globalThis : this, (core) => {
  "use strict";

  if (!core) throw new Error("LifeformCatalog requires LeniaCore.");
  const { cloneRule, displayCode, parseFraction, parseRule, splitLifeformPayload } = core;

  function slugify(value, fallback = "group") {
    return (
      String(value || "")
        .toLowerCase()
        .replace(/^[~*]+/, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || fallback
    );
  }

  function cleanGroupName(value) {
    return String(value || "")
      .replace(/^(class|order|family|subfamily|subphylum):\s*/i, "")
      .trim();
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

  function lifeformAssetSlug(indexOrForm, code, assetPrefix = "") {
    const form = typeof indexOrForm === "object" && indexOrForm ? indexOrForm : null;
    const index = form ? form.index : indexOrForm;
    const cleanCode = slugify(form ? form.code : code, "form");
    const cleanPrefix = slugify(form ? form.assetPrefix : assetPrefix, "");
    return `lifeform-${cleanPrefix ? `${cleanPrefix}-` : ""}${Number(index) || 0}-${cleanCode}`;
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

  function parseGroupRule(ruleText, defaults = core.DEFAULT_RULE) {
    const fields = parseFieldMap(ruleText);
    const rule = cloneRule(defaults);
    const radius = Number.parseInt(fields.r || "", 10);
    const timeScale = Number.parseFloat(fields.t || "");
    const beta = (fields.b || "1").split(",").map(parseFraction).filter(Number.isFinite);

    if (Number.isFinite(radius)) rule.radius = radius;
    if (Number.isFinite(timeScale) && timeScale > 0) {
      rule.ts = timeScale;
      rule.dt = 1 / timeScale;
    }
    if (fields.m != null && Number.isFinite(Number.parseFloat(fields.m))) rule.mu = Number.parseFloat(fields.m);
    if (fields.s != null && Number.isFinite(Number.parseFloat(fields.s))) rule.sigma = Number.parseFloat(fields.s);

    for (let index = 0; index < 4; index += 1) {
      rule.beta[index] = beta[index] || 0;
      rule.eta[index] = 0;
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
      sourceText: String(ruleText || ""),
      perFormRule: fields["per-form"] === "1" || fields.perform === "1",
      hasKernelHint: fields.kn != null,
      hasGrowthHint: fields.gn != null,
    };
  }

  function parseGroupItem(line) {
    const text = String(line || "").trim();
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
    return `R ${ruleInfo.radius} | mu ${Number(ruleInfo.mu).toFixed(3)} | sigma ${Number(ruleInfo.sigma).toFixed(3)} | b ${beta}`;
  }

  function formMatchesItem(form, item) {
    const itemName = normalizeLookupText(item.name);
    const formName = normalizeLookupText(form.name);
    const formBaseName = normalizeLookupText(String(form.name || "").split("(")[0]);
    if (itemName && (formName === itemName || formName.startsWith(`${itemName} `) || formBaseName === itemName)) return true;

    const itemCode = normalizeCode(item.code);
    if (!itemCode) return false;
    return [form.rawCode, form.code].some((candidate) => normalizeCode(candidate) === itemCode);
  }

  function findFormForGroupItem(item, forms, usedFormIds) {
    const byName = forms.find((form) => !usedFormIds.has(form.id) && formMatchesItem(form, { ...item, code: "" }));
    if (byName) return byName;
    return forms.find((form) => !usedFormIds.has(form.id) && formMatchesItem(form, { ...item, name: "" })) || null;
  }

  function reconcileGroupRule(group) {
    if (!group.forms.length) return group.ruleInfo;
    const firstRule = group.forms[0].ruleInfo;
    const nextRule = cloneRule(group.ruleInfo);
    nextRule.sourceText = group.ruleInfo.sourceText;
    nextRule.perFormRule = group.ruleInfo.perFormRule;
    nextRule.hasKernelHint = group.ruleInfo.hasKernelHint;
    nextRule.hasGrowthHint = group.ruleInfo.hasGrowthHint;

    if (!group.ruleInfo.hasKernelHint) {
      nextRule.coreName = firstRule.coreName;
      nextRule.layer = firstRule.layer;
      nextRule.beta = [...firstRule.beta];
      nextRule.eta = [...firstRule.eta];
    }
    if (!group.ruleInfo.hasGrowthHint) nextRule.deltaName = firstRule.deltaName;
    return nextRule;
  }

  function parseCompatibleGroups(text, forms, defaults = core.DEFAULT_RULE) {
    const groups = [];
    let currentGroup = null;

    for (const rawLine of String(text || "").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) {
        currentGroup = null;
        continue;
      }
      if (/^R\s*=/.test(line)) {
        const ruleInfo = parseGroupRule(line, defaults);
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
      } else if (currentGroup) {
        currentGroup.items.push(parseGroupItem(line));
      }
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

  function buildLibraryForms(sources, { assetBase = "assets/lifeforms/", defaults = core.DEFAULT_RULE } = {}) {
    const forms = [];
    for (const source of Array.isArray(sources) ? sources : []) {
      const groupStack = [];
      const entries = Array.isArray(source.entries) ? source.entries : [];
      for (let sourceIndex = 0; sourceIndex < entries.length; sourceIndex += 1) {
        const item = entries[sourceIndex];
        if (!Array.isArray(item)) continue;
        if (item.length === 3 && item[1]) {
          const level = Number.parseInt(String(item[0]).replace(/^\D+/, ""), 10) || 1;
          groupStack[level - 1] = item[1];
          groupStack.length = level;
          continue;
        }
        if (item.length < 4 || !item[3]) continue;

        const { rule, cells } = splitLifeformPayload(item[3]);
        const code = displayCode(item[0]);
        const index = Number(source.indexOffset || 0) + sourceIndex;
        const groups = groupStack.filter(Boolean);
        const assetPrefix = source.assetPrefix || "";
        const assetSlug = lifeformAssetSlug(index, code, assetPrefix);
        forms.push({
          id: `${source.id}-${index}-${code || sourceIndex}`,
          sourceId: source.id,
          sourceTitle: source.title,
          sourceIndex,
          assetPrefix,
          index,
          code,
          assetSlug,
          assetPath: `${assetBase}${assetSlug}.png`,
          rawCode: item[0] || "",
          name: item[1] || code,
          chineseName: item[2] || "",
          section: cleanGroupName(groups[groups.length - 1]) || source.title || "",
          groups,
          rule,
          cells,
          ruleInfo: parseRule(rule, defaults),
          cellData: null,
          previewCanvas: null,
          previewVersion: -1,
        });
      }
    }
    return forms;
  }

  function isCompatibleRule(rule) {
    return rule.radius === 13 && rule.coreName === "bump4" && rule.layer === 0 && Math.abs(rule.dt - 0.1) < 0.000001;
  }

  return Object.freeze({
    buildLibraryForms,
    cleanGroupName,
    findFormForGroupItem,
    formMatchesItem,
    groupTitle,
    isCompatibleRule,
    lifeformAssetSlug,
    normalizeCode,
    normalizeLookupText,
    parseCompatibleGroups,
    parseFieldMap,
    parseGroupItem,
    parseGroupRule,
    reconcileGroupRule,
    slugify,
  });
});
