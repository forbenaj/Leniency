(function initLeniaSimpleSim(root, factory) {
  const core = typeof module === "object" && module.exports ? require("./lenia-core.js") : root?.LeniaCore;
  const api = factory(core);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LeniaSimpleSim = api;
})(typeof globalThis !== "undefined" ? globalThis : this, (core) => {
  "use strict";

  if (!core) throw new Error("LeniaSimpleSim requires LeniaCore.");

  const MAX_WORLD_SIZE = 512;
  const WORLD_SIZE_STEP = 32;
  const DEFAULT_TRACE_LENGTH = 180;

  function positiveNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function normalizeWorldSize(value) {
    const size = Math.round(Number(value));
    if (!Number.isSafeInteger(size) || size < 2 || size > MAX_WORLD_SIZE) {
      throw new RangeError(`World size must be an integer from 2 to ${MAX_WORLD_SIZE}.`);
    }
    return size;
  }

  /**
   * Pick the smallest practical world that can contain a lifeform without
   * resampling it. Padding keeps the seed away from its periodic copies.
   */
  function chooseWorldSize(cellData, padding = 24, minimumSize = 64) {
    const width = Math.max(0, Number(cellData?.width) || 0);
    const height = Math.max(0, Number(cellData?.height) || 0);
    const required = Math.max(width, height) + Math.max(0, Number(padding) || 0);
    const requested = Math.max(64, Number(minimumSize) || 0, required);
    const size = Math.ceil(requested / WORLD_SIZE_STEP) * WORLD_SIZE_STEP;
    if (size > MAX_WORLD_SIZE) {
      throw new RangeError(`This lifeform needs a ${size} x ${size} world; the compact playground supports up to ${MAX_WORLD_SIZE}.`);
    }
    return size;
  }

  /** Mutable, dependency-free simulation state used by the compact UI. */
  class SimpleSimulation {
    constructor(options = {}) {
      this.maxTraceLength = Math.max(2, Math.round(Number(options.maxTraceLength) || DEFAULT_TRACE_LENGTH));
      this.size = normalizeWorldSize(options.size || 96);
      this.rule = core.cloneRule(options.rule);
      this.field = new Float32Array(this.size * this.size);
      this.next = new Float32Array(this.field.length);
      this.growth = new Float32Array(this.field.length);
      this.kernel = {
        offsetX: new Int16Array(0),
        offsetY: new Int16Array(0),
        weights: new Float32Array(0),
      };
      this.metrics = { mass: 0, growth: 0, energy: 0 };
      this.simTime = 0;
      this.massTrace = [];
      this.rebuildKernel();
    }

    /** Map a coordinate into the periodic world. */
    indexOf(x, y) {
      const wrappedX = core.modulo(x, this.size);
      const wrappedY = core.modulo(y, this.size);
      return wrappedY * this.size + wrappedX;
    }

    /** Replace the active rule without coercing valid catalogue parameters. */
    setRule(rule, rebuildKernel = true) {
      const nextRule = core.cloneRule(rule);
      nextRule.radius = Math.max(1, Math.round(positiveNumber(nextRule.radius, core.DEFAULT_RULE.radius)));
      nextRule.alpha = positiveNumber(nextRule.alpha, core.DEFAULT_RULE.alpha);
      nextRule.dt = positiveNumber(nextRule.dt, core.DEFAULT_RULE.dt);
      nextRule.mu = Number.isFinite(Number(nextRule.mu)) ? Number(nextRule.mu) : core.DEFAULT_RULE.mu;
      nextRule.sigma = positiveNumber(nextRule.sigma, core.DEFAULT_RULE.sigma);
      nextRule.gain = Number.isFinite(Number(nextRule.gain)) ? Number(nextRule.gain) : 1;
      nextRule.decay = Math.max(0, Number.isFinite(Number(nextRule.decay)) ? Number(nextRule.decay) : 0);
      this.rule = nextRule;
      if (rebuildKernel) this.rebuildKernel();
      return this.rule;
    }

    /** Merge control changes into the active rule. */
    updateRule(patch, rebuildKernel = false) {
      return this.setRule({ ...this.rule, ...patch }, rebuildKernel);
    }

    /** Build a normalized positive kernel using compact typed arrays. */
    rebuildKernel() {
      const radius = this.rule.radius;
      const offsets = [];
      let total = 0;
      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          const distance = Math.hypot(offsetX, offsetY);
          if (distance > radius) continue;
          const weight = core.kernelValue(this.rule, distance / radius, this.rule.alpha);
          if (!(weight > 0) || !Number.isFinite(weight)) continue;
          offsets.push([offsetX, offsetY, weight]);
          total += weight;
        }
      }
      if (!(total > 0)) throw new RangeError("The selected rule produces an empty kernel.");

      const offsetX = new Int16Array(offsets.length);
      const offsetY = new Int16Array(offsets.length);
      const weights = new Float32Array(offsets.length);
      for (let index = 0; index < offsets.length; index += 1) {
        offsetX[index] = offsets[index][0];
        offsetY[index] = offsets[index][1];
        weights[index] = offsets[index][2] / total;
      }
      this.kernel = { offsetX, offsetY, weights };
      return this.kernel;
    }

    /** Resize around the center and reset history so metrics remain coherent. */
    resize(newSize, preserveField = true) {
      const targetSize = normalizeWorldSize(newSize);
      const oldSize = this.size;
      const oldField = this.field;
      this.size = targetSize;
      this.field = new Float32Array(targetSize * targetSize);
      this.next = new Float32Array(this.field.length);
      this.growth = new Float32Array(this.field.length);

      if (preserveField) {
        const copySize = Math.min(oldSize, targetSize);
        const oldOffset = Math.floor((oldSize - copySize) / 2);
        const newOffset = Math.floor((targetSize - copySize) / 2);
        for (let row = 0; row < copySize; row += 1) {
          const sourceStart = (row + oldOffset) * oldSize + oldOffset;
          const targetStart = (row + newOffset) * targetSize + newOffset;
          this.field.set(oldField.subarray(sourceStart, sourceStart + copySize), targetStart);
        }
      }

      this.resetHistory();
      this.measure();
    }

    resetHistory() {
      this.simTime = 0;
      this.massTrace.length = 0;
    }

    clear() {
      this.field.fill(0);
      this.next.fill(0);
      this.growth.fill(0);
      this.resetHistory();
      this.metrics = { mass: 0, growth: 0, energy: 0 };
    }

    measure() {
      let mass = 0;
      let energy = 0;
      for (let index = 0; index < this.field.length; index += 1) {
        const value = this.field[index];
        mass += value;
        energy += value * value;
      }
      this.metrics = {
        mass: mass / this.field.length,
        growth: 0,
        energy: energy / this.field.length,
      };
      return this.metrics;
    }

    addBlob(centerX, centerY, radius, amount = 1, softness = 0.9) {
      const reach = Math.ceil(radius * 2);
      for (let y = -reach; y <= reach; y += 1) {
        for (let x = -reach; x <= reach; x += 1) {
          const distance = Math.hypot(x, y) / radius;
          if (distance > 2) continue;
          const value = amount * Math.exp(-(distance * distance) / softness);
          const index = this.indexOf(Math.round(centerX + x), Math.round(centerY + y));
          this.field[index] = core.clamp(this.field[index] + value);
        }
      }
    }

    seed(kind, random = Math.random) {
      this.clear();
      const center = this.size / 2;
      if (kind === "orbium") {
        this.addBlob(center - 8, center - 4, 8.5, 0.95);
        this.addBlob(center + 3, center - 7, 6.8, 0.82);
        this.addBlob(center + 10, center + 4, 7.6, 0.7);
        this.addBlob(center - 4, center + 8, 6.2, 0.58);
      } else if (kind === "ring") {
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 5) {
          this.addBlob(center + Math.cos(angle) * 12, center + Math.sin(angle) * 12, 4, 0.48);
        }
        this.addBlob(center + 4, center - 2, 5, 0.32);
      } else if (kind === "nebula") {
        for (let index = 0; index < 50; index += 1) {
          this.addBlob(
            center + (random() - 0.5) * this.size * 0.48,
            center + (random() - 0.5) * this.size * 0.48,
            2 + random() * 7,
            0.08 + random() * 0.2,
          );
        }
      } else if (kind === "speckles") {
        for (let index = 0; index < this.field.length; index += 1) {
          this.field[index] = random() > 0.88 ? random() * 0.8 : 0;
        }
      }
      this.measure();
    }

    randomize(random = Math.random) {
      this.clear();
      for (let index = 0; index < this.field.length; index += 1) {
        this.field[index] = random() > 0.78 ? random() : 0;
      }
      this.measure();
    }

    /** Place decoded cells exactly; values are never spatially resampled. */
    placeCells(cellData) {
      if (!cellData || cellData.width > this.size || cellData.height > this.size) {
        throw new RangeError("The decoded lifeform does not fit in the current world.");
      }
      this.clear();
      const startX = Math.floor((this.size - cellData.width) / 2);
      const startY = Math.floor((this.size - cellData.height) / 2);
      for (let y = 0; y < cellData.height; y += 1) {
        const row = cellData.rows[y] || [];
        for (let x = 0; x < row.length; x += 1) {
          const value = Number(row[x]) || 0;
          if (value > 0) this.field[(startY + y) * this.size + startX + x] = core.clamp(value);
        }
      }
      this.measure();
    }

    /** Apply one brush stamp without triggering rendering or a full measurement. */
    paintAt(x, y, options = {}) {
      const mode = options.mode || "paint";
      if (mode === "sample") return this.field[this.indexOf(x, y)];
      const radius = Math.max(1, Math.round(Number(options.radius) || 1));
      const power = core.clamp(Number(options.power) || 0, 0, 1);
      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          const distance = Math.hypot(offsetX, offsetY);
          if (distance > radius) continue;
          const falloff = 1 - distance / radius;
          const index = this.indexOf(x + offsetX, y + offsetY);
          this.field[index] =
            mode === "paint"
              ? core.clamp(this.field[index] + 0.95 * falloff * power)
              : core.clamp(this.field[index] * (1 - falloff * 0.6));
        }
      }
      return null;
    }

    step(count = 1) {
      const stepCount = Math.max(1, Math.round(Number(count) || 1));
      for (let step = 0; step < stepCount; step += 1) this.stepOnce();
      return this.metrics;
    }

    stepOnce() {
      const { offsetX, offsetY, weights } = this.kernel;
      const { dt, gain, decay, limitValue, alpha } = this.rule;
      const worldSize = this.size;
      let mass = 0;
      let growthSum = 0;
      let energy = 0;

      for (let y = 0; y < worldSize; y += 1) {
        for (let x = 0; x < worldSize; x += 1) {
          let neighborhood = 0;
          for (let kernelIndex = 0; kernelIndex < weights.length; kernelIndex += 1) {
            let neighborX = x + offsetX[kernelIndex];
            let neighborY = y + offsetY[kernelIndex];
            if (neighborX < 0) neighborX += worldSize;
            else if (neighborX >= worldSize) neighborX -= worldSize;
            if (neighborY < 0) neighborY += worldSize;
            else if (neighborY >= worldSize) neighborY -= worldSize;
            if (neighborX < 0 || neighborX >= worldSize) neighborX = core.modulo(neighborX, worldSize);
            if (neighborY < 0 || neighborY >= worldSize) neighborY = core.modulo(neighborY, worldSize);
            neighborhood += this.field[neighborY * worldSize + neighborX] * weights[kernelIndex];
          }
          const index = y * worldSize + x;
          const growth = core.growthCurve(this.rule, neighborhood, alpha) * gain;
          const rawValue = this.field[index] + dt * growth - decay * this.field[index];
          const value = limitValue ? core.clamp(rawValue) : Math.max(0, rawValue);
          this.growth[index] = growth;
          this.next[index] = value;
          mass += value;
          growthSum += growth;
          energy += Math.abs(growth) * value;
        }
      }

      [this.field, this.next] = [this.next, this.field];
      this.simTime += dt;
      this.metrics = {
        mass: mass / this.field.length,
        growth: growthSum / this.field.length,
        energy: energy / this.field.length,
      };
      this.massTrace.push(this.metrics.mass);
      if (this.massTrace.length > this.maxTraceLength) this.massTrace.splice(0, this.massTrace.length - this.maxTraceLength);
    }
  }

  return Object.freeze({
    MAX_WORLD_SIZE,
    SimpleSimulation,
    chooseWorldSize,
  });
});
