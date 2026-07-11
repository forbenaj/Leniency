(function () {
  const EPSILON = 0.00001;
  const MAX_CHANNELS = 3;
  const MAX_RENDER_CHANNELS = MAX_CHANNELS;
  const MAX_RULES = 8;
  const MAX_RULE_RADIUS = 64;
  const DEFAULT_COLORS = ["#080618", "#231c49", "#3e3f77", "#8889bc", "#f0efd6"];
  const DEFAULT_RULE = {
    id: "rule-0",
    sourceChannelId: "channel-0",
    destinationChannelId: "channel-0",
    radius: 13,
    alpha: 4,
    mu: 0.15,
    sigma: 0.017,
    dt: 0.1,
    gain: 1,
    decay: 0,
    limitValue: true,
    wrapAround: true,
    deltaName: "gaus",
    coreName: "bump4",
    layer: 0,
    beta: [1, 0, 0, 0],
    eta: [0, 0, 0, 0],
    weight: 1,
    positiveOnly: false,
  };

  class WebGLLeniaSim {
    constructor(canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      });
      if (!this.gl) throw new Error("WebGL2 is unavailable");

      const gl = this.gl;
      this.floatColorExt = gl.getExtension("EXT_color_buffer_float");
      if (!this.floatColorExt) throw new Error("EXT_color_buffer_float is unavailable");

      this.width = 1;
      this.height = 1;
      this.channels = [];
      this.channelMap = new Map();
      this.rules = [];
      this.wrapAround = true;
      this.selectedChannelId = "channel-0";
      this.metricScope = "selected";
      this.metrics = emptyMetrics(this.selectedChannelId, this.metricScope);
      this.lastMetricReadAt = 0;
      this.metricElapsedTime = 0;
      this.metricMassBaseline = new Map();
      this.profile = {
        stepSimulationMs: 0,
        colorizeMs: 0,
        updateFieldBufferMs: 0,
        activeChunks: 0,
        simChunks: 0,
        patches: 0,
      };

      this.vao = gl.createVertexArray();
      gl.bindVertexArray(this.vao);
      this.stepProgram = createProgram(gl, VERTEX_SHADER, STEP_FRAGMENT_SHADER);
      this.renderProgram = createProgram(gl, VERTEX_SHADER, RENDER_FRAGMENT_SHADER);
      this.brushProgram = createProgram(gl, VERTEX_SHADER, BRUSH_FRAGMENT_SHADER);
      this.placeProgram = createProgram(gl, VERTEX_SHADER, PLACE_FRAGMENT_SHADER);
      this.randomizeProgram = createProgram(gl, VERTEX_SHADER, RANDOMIZE_FRAGMENT_SHADER);
      this.copyProgram = createProgram(gl, VERTEX_SHADER, COPY_FRAGMENT_SHADER);
      this.clearProgram = createProgram(gl, VERTEX_SHADER, CLEAR_FRAGMENT_SHADER);
      this.quantizeProgram = createProgram(gl, VERTEX_SHADER, QUANTIZE_FRAGMENT_SHADER);
      this.remapProgram = createProgram(gl, VERTEX_SHADER, REMAP_FRAGMENT_SHADER);

      this.stateTextures = [];
      this.stateFramebuffers = [];
      this.sourceIndex = 0;
      this.emptyKernelTexture = null;

      this.testFloatFramebuffer();
      this.replaceStateTextures(1, 1);
      this.emptyKernelTexture = this.createKernelTexture(new Float32Array([0, 0, 0, 0]), 1);
    }

    init(width, height, modelOrConfig, colors) {
      this.width = this.validateDimension(width, "width");
      this.height = this.validateDimension(height, "height");
      this.replaceStateTextures(this.width, this.height);
      this.setModel(modelOrConfig?.channels ? modelOrConfig : legacyModel(modelOrConfig, colors), { preserve: false });
      this.clear();
    }

    dispose() {
      const gl = this.gl;
      this.deleteStateTextures();
      for (const rule of this.rules) {
        if (rule.kernelTexture) gl.deleteTexture(rule.kernelTexture);
      }
      if (this.emptyKernelTexture) gl.deleteTexture(this.emptyKernelTexture);
      for (const program of [
        this.stepProgram,
        this.renderProgram,
        this.brushProgram,
        this.placeProgram,
        this.randomizeProgram,
        this.copyProgram,
        this.clearProgram,
        this.quantizeProgram,
        this.remapProgram,
      ]) {
        if (program) gl.deleteProgram(program);
      }
      if (this.vao) gl.deleteVertexArray(this.vao);
    }

    setModel(model, { preserve = true } = {}) {
      const normalized = normalizeModel(model);
      if (normalized.rules.length > MAX_RULES) {
        throw new Error(`WebGL v1 supports up to ${MAX_RULES} rules`);
      }

      const gl = this.gl;
      const previousChannels = this.channels;
      const previousById = new Map(previousChannels.map((channel) => [channel.id, channel]));
      const nextChannels = normalized.channels.map((info, index) => ({
        id: info.id,
        name: info.name,
        visible: info.visible,
        palette: info.palette,
        componentIndex: index,
      }));
      const nextMap = new Map(nextChannels.map((channel) => [channel.id, channel]));
      const remap = nextChannels.map((channel) => previousById.get(channel.id)?.componentIndex ?? -1);
      const needsRemap =
        preserve &&
        previousChannels.length > 0 &&
        (nextChannels.length !== previousChannels.length ||
          nextChannels.some((channel, index) => previousChannels[index]?.id !== channel.id));

      for (const rule of this.rules) {
        if (rule.kernelTexture) gl.deleteTexture(rule.kernelTexture);
      }

      this.channels = nextChannels;
      this.channelMap = nextMap;
      this.selectedChannelId = nextMap.has(normalized.selectedChannelId) ? normalized.selectedChannelId : this.channels[0]?.id || "channel-0";
      this.metricScope = normalized.metricScope;
      this.wrapAround = normalized.wrapAround;
      this.rules = normalized.rules.filter(
        (rule) => nextMap.has(rule.sourceChannelId) && nextMap.has(rule.destinationChannelId),
      );
      if (!this.rules.length && this.channels.length) {
        this.rules = [normalizeRule({ sourceChannelId: this.channels[0].id, destinationChannelId: this.channels[0].id })];
      }
      if (this.rules.length > MAX_RULES) {
        throw new Error(`WebGL v1 supports up to ${MAX_RULES} rules`);
      }

      for (const rule of this.rules) this.rebuildKernel(rule);
      if (needsRemap) this.remapState(remap);
      if (!preserve) this.clearStateTextures();
      for (const channel of this.channels) {
        if (isDiscreteChannel(this.rules, channel.id)) this.quantizeChannel(channel);
      }
      this.metrics = emptyMetrics(this.selectedChannelId, this.metricScope);
      this.markFullSimulation();
    }

    resize(width, height) {
      const oldWidth = this.width;
      const oldHeight = this.height;
      const oldTextures = this.stateTextures;
      const oldFramebuffers = this.stateFramebuffers;
      const oldTexture = this.sourceTexture();

      this.width = this.validateDimension(width, "width");
      this.height = this.validateDimension(height, "height");
      this.stateTextures = [this.createFieldTexture(this.width, this.height), this.createFieldTexture(this.width, this.height)];
      this.stateFramebuffers = this.stateTextures.map((texture) => this.createFramebuffer(texture));
      this.sourceIndex = 0;

      const copyWidth = Math.min(oldWidth, this.width);
      const copyHeight = Math.min(oldHeight, this.height);
      const oldX = Math.floor((oldWidth - copyWidth) / 2);
      const oldY = Math.floor((oldHeight - copyHeight) / 2);
      const newX = Math.floor((this.width - copyWidth) / 2);
      const newY = Math.floor((this.height - copyHeight) / 2);
      this.runCopyPass(oldTexture, oldWidth, oldHeight, oldX, oldY, newX, newY, copyWidth, copyHeight);
      this.clearTexture(this.destinationTexture(), this.destinationFramebuffer());

      const gl = this.gl;
      for (const texture of oldTextures) gl.deleteTexture(texture);
      for (const framebuffer of oldFramebuffers) gl.deleteFramebuffer(framebuffer);
      for (const rule of this.rules) this.rebuildKernel(rule);
      this.metrics = emptyMetrics(this.selectedChannelId, this.metricScope);
      this.metricElapsedTime = 0;
      this.metricMassBaseline.clear();
      this.markFullSimulation();
    }

    clear(channelId = null) {
      if (channelId == null) {
        this.clearStateTextures();
      } else {
        const channel = this.channelMap.get(channelId) || this.channelMap.get(this.selectedChannelId) || this.channels[0];
        if (!channel) return;
        this.runEditProgram(this.clearProgram, (gl, program) => {
          bindTexture(gl, program, "uState", this.sourceTexture(), 0);
          gl.uniform1i(gl.getUniformLocation(program, "uTargetChannel"), channel.componentIndex);
        });
      }
      this.metrics = emptyMetrics(this.selectedChannelId, this.metricScope);
      this.metricElapsedTime = 0;
      this.metricMassBaseline.clear();
      this.profile = { ...this.profile, activeChunks: 0, simChunks: 0, patches: 0 };
    }

    randomize(rect, channelId = this.selectedChannelId) {
      const channel = this.channelMap.get(channelId) || this.channelMap.get(this.selectedChannelId) || this.channels[0];
      if (!channel) return;
      const safeRect = normalizeRect(rect, this.width, this.height);
      this.runEditProgram(this.randomizeProgram, (gl, program) => {
        bindTexture(gl, program, "uState", this.sourceTexture(), 0);
        gl.uniform4f(gl.getUniformLocation(program, "uRect"), safeRect.left, safeRect.top, safeRect.right, safeRect.bottom);
        gl.uniform1f(gl.getUniformLocation(program, "uSeed"), performance.now() + Math.random() * 1000);
        gl.uniform1i(gl.getUniformLocation(program, "uTargetChannel"), channel.componentIndex);
        gl.uniform1i(gl.getUniformLocation(program, "uDiscrete"), isDiscreteChannel(this.rules, channel.id) ? 1 : 0);
      });
      this.markFullSimulation();
    }

    brush({ x, y, radius, power, mode, channelId }) {
      const channel = this.channelMap.get(channelId) || this.channelMap.get(this.selectedChannelId) || this.channels[0];
      if (!channel) return;
      this.runEditProgram(this.brushProgram, (gl, program) => {
        bindTexture(gl, program, "uState", this.sourceTexture(), 0);
        gl.uniform2f(gl.getUniformLocation(program, "uWorldSize"), this.width, this.height);
        gl.uniform2f(gl.getUniformLocation(program, "uCenter"), x, y);
        gl.uniform1f(gl.getUniformLocation(program, "uRadius"), Math.max(0, radius ?? 0));
        gl.uniform1f(gl.getUniformLocation(program, "uPower"), Math.max(0, power || 0));
        gl.uniform1i(gl.getUniformLocation(program, "uMode"), mode === "erase" ? 1 : 0);
        gl.uniform1i(gl.getUniformLocation(program, "uWrap"), this.wrapAround ? 1 : 0);
        gl.uniform1i(gl.getUniformLocation(program, "uDiscrete"), isDiscreteChannel(this.rules, channel.id) ? 1 : 0);
        gl.uniform1i(gl.getUniformLocation(program, "uTargetChannel"), channel.componentIndex);
      });
      this.markFullSimulation();
    }

    place(placement) {
      if (!placement || !placement.cells || !placement.width || !placement.height) return;
      const channel =
        this.channelMap.get(placement.channelId) || this.channelMap.get(this.selectedChannelId) || this.channels[0];
      if (!channel) return;
      const gl = this.gl;
      const cellTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, cellTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, placement.width, placement.height, 0, gl.RED, gl.FLOAT, placement.cells);

      this.runEditProgram(this.placeProgram, (nextGl, program) => {
        bindTexture(nextGl, program, "uState", this.sourceTexture(), 0);
        bindTexture(nextGl, program, "uCells", cellTexture, 1);
        nextGl.uniform2f(nextGl.getUniformLocation(program, "uWorldSize"), this.width, this.height);
        nextGl.uniform2f(nextGl.getUniformLocation(program, "uCenter"), placement.x, placement.y);
        nextGl.uniform2f(nextGl.getUniformLocation(program, "uCellSize"), placement.width, placement.height);
        nextGl.uniform1f(nextGl.getUniformLocation(program, "uScale"), placement.scale || 1);
        nextGl.uniform1f(nextGl.getUniformLocation(program, "uAngle"), placement.angle || 0);
        nextGl.uniform1i(nextGl.getUniformLocation(program, "uWrap"), this.wrapAround ? 1 : 0);
        nextGl.uniform1i(nextGl.getUniformLocation(program, "uDiscrete"), isDiscreteChannel(this.rules, channel.id) ? 1 : 0);
        nextGl.uniform1i(nextGl.getUniformLocation(program, "uTargetChannel"), channel.componentIndex);
      });
      gl.deleteTexture(cellTexture);
      this.markFullSimulation();
    }

    sample(x, y, channelId = this.selectedChannelId, scope = this.metricScope) {
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
      const pixel = this.readPackedPixel(x, y);
      if (scope === "aggregate") {
        let total = 0;
        for (const channel of this.channels) {
          if (channel.visible !== false) total += pixel[channel.componentIndex] || 0;
        }
        return clamp(total);
      }
      const channel = this.channelMap.get(channelId) || this.channelMap.get(this.selectedChannelId) || this.channels[0];
      return channel ? pixel[channel.componentIndex] || 0 : 0;
    }

    snapshot() {
      const packed = this.readPackedState();
      const channels = this.channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        visible: channel.visible,
        palette: [...channel.palette],
        width: this.width,
        height: this.height,
        values: unpackChannel(packed, channel.componentIndex),
      }));
      return {
        width: this.width,
        height: this.height,
        channels,
        values: channels[0]?.values || new Float32Array(this.width * this.height),
      };
    }

    loadSnapshot(snapshot = {}) {
      if (snapshot.width && snapshot.height && (snapshot.width !== this.width || snapshot.height !== this.height)) {
        this.width = Math.max(1, Math.floor(snapshot.width));
        this.height = Math.max(1, Math.floor(snapshot.height));
        this.replaceStateTextures(this.width, this.height);
        this.setModel(snapshot.model || currentModel(this), { preserve: false });
      } else if (snapshot.model) {
        this.setModel(snapshot.model);
      }
      const packed = new Float32Array(this.width * this.height * 4);
      const incoming = Array.isArray(snapshot.channels)
        ? snapshot.channels
        : [{ id: this.channels[0]?.id || "channel-0", values: snapshot.values }];
      for (const item of incoming) {
        const channel = this.channelMap.get(item.id) || this.channels[0];
        if (!channel || !item.values) continue;
        const values = item.values instanceof Float32Array ? item.values : new Float32Array(item.values);
        if (values.length !== this.width * this.height) continue;
        packChannel(packed, values, channel.componentIndex);
      }
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture());
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.width, this.height, gl.RGBA, gl.FLOAT, packed);
      this.clearTexture(this.destinationTexture(), this.destinationFramebuffer());
      this.metrics = emptyMetrics(this.selectedChannelId, this.metricScope);
      this.metricElapsedTime = 0;
      this.metricMassBaseline.clear();
      this.markFullSimulation();
    }

    step(count) {
      const gl = this.gl;
      const stepCount = Math.max(1, Math.min(8, count || 1));
      const start = performance.now();
      const uniforms = this.compileRuleUniforms();

      gl.useProgram(this.stepProgram);
      gl.uniform2f(gl.getUniformLocation(this.stepProgram, "uWorldSize"), this.width, this.height);
      gl.uniform1i(gl.getUniformLocation(this.stepProgram, "uRuleCount"), this.rules.length);
      gl.uniform1i(gl.getUniformLocation(this.stepProgram, "uWrap"), this.wrapAround ? 1 : 0);
      gl.uniform1iv(gl.getUniformLocation(this.stepProgram, "uRuleSrc"), uniforms.ruleSrc);
      gl.uniform1iv(gl.getUniformLocation(this.stepProgram, "uRuleDst"), uniforms.ruleDst);
      gl.uniform1iv(gl.getUniformLocation(this.stepProgram, "uKernelCount"), uniforms.kernelCount);
      gl.uniform1iv(gl.getUniformLocation(this.stepProgram, "uPositiveOnly"), uniforms.positiveOnly);
      gl.uniform1iv(gl.getUniformLocation(this.stepProgram, "uDeltaMode"), uniforms.deltaMode);
      gl.uniform1iv(gl.getUniformLocation(this.stepProgram, "uDestinationActive"), uniforms.destinationActive);
      gl.uniform1iv(gl.getUniformLocation(this.stepProgram, "uDestinationDiscrete"), uniforms.destinationDiscrete);
      gl.uniform1iv(gl.getUniformLocation(this.stepProgram, "uDestinationLimit"), uniforms.destinationLimit);
      gl.uniform1fv(gl.getUniformLocation(this.stepProgram, "uMu"), uniforms.mu);
      gl.uniform1fv(gl.getUniformLocation(this.stepProgram, "uSigma"), uniforms.sigma);
      gl.uniform1fv(gl.getUniformLocation(this.stepProgram, "uDt"), uniforms.dt);
      gl.uniform1fv(gl.getUniformLocation(this.stepProgram, "uGain"), uniforms.gain);
      gl.uniform1fv(gl.getUniformLocation(this.stepProgram, "uDecay"), uniforms.decay);
      gl.uniform1fv(gl.getUniformLocation(this.stepProgram, "uWeight"), uniforms.weight);
      gl.uniform1fv(gl.getUniformLocation(this.stepProgram, "uAlpha"), uniforms.alpha);

      for (let i = 0; i < MAX_RULES; i += 1) {
        bindTexture(gl, this.stepProgram, `uKernel${i}`, this.rules[i]?.kernelTexture || this.emptyKernelTexture, i + 1);
      }

      for (let i = 0; i < stepCount; i += 1) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.destinationFramebuffer());
        gl.viewport(0, 0, this.width, this.height);
        bindTexture(gl, this.stepProgram, "uState", this.sourceTexture(), 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        this.swapState();
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.flush();
      const stepMs = performance.now() - start;
      this.metricElapsedTime += this.rules.reduce((maximum, rule) => Math.max(maximum, rule.dt || 0), 0) * stepCount;
      this.markFullSimulation();
      this.profile.stepSimulationMs = stepMs;
      return {
        stepSimulationMs: stepMs,
        steps: stepCount,
        activeChunks: this.profile.activeChunks,
        simChunks: this.profile.simChunks,
      };
    }

    readMetrics(now = performance.now(), force = false) {
      if (!force && now - this.lastMetricReadAt < 850) return null;
      this.lastMetricReadAt = now;
      const packed = this.readPackedState();
      const perChannel = {};
      let aggregateMass = 0;
      let aggregateEnergy = 0;
      for (const channel of this.channels) {
        let mass = 0;
        let energy = 0;
        const component = channel.componentIndex;
        for (let i = 0; i < this.width * this.height; i += 1) {
          const value = packed[i * 4 + component];
          if (value > EPSILON) mass += value;
          energy += value * value;
        }
        const channelMetrics = {
          mass: mass / (this.width * this.height),
          growth: 0,
          energy: energy / (this.width * this.height),
        };
        const baseline = this.metricMassBaseline.get(channel.id);
        channelMetrics.growth = baseline != null && this.metricElapsedTime > 0
          ? (channelMetrics.mass - baseline) / this.metricElapsedTime
          : this.metrics.perChannel?.[channel.id]?.growth || 0;
        this.metricMassBaseline.set(channel.id, channelMetrics.mass);
        perChannel[channel.id] = channelMetrics;
        if (channel.visible !== false) {
          aggregateMass += channelMetrics.mass;
          aggregateEnergy += channelMetrics.energy;
        }
      }
      const aggregate = {
        mass: aggregateMass,
        growth: this.channels.reduce((sum, channel) => (channel.visible === false ? sum : sum + (perChannel[channel.id]?.growth || 0)), 0),
        energy: aggregateEnergy,
      };
      this.metrics = {
        selectedChannelId: this.selectedChannelId,
        scope: this.metricScope,
        perChannel,
        aggregate,
        ...(this.metricScope === "aggregate" ? aggregate : perChannel[this.selectedChannelId] || aggregate),
      };
      this.metricElapsedTime = 0;
      return this.metrics;
    }

    render({ cssWidth, cssHeight, dpr, camera, background }) {
      const gl = this.gl;
      const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
      const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));
      if (this.canvas.width !== pixelWidth) this.canvas.width = pixelWidth;
      if (this.canvas.height !== pixelHeight) this.canvas.height = pixelHeight;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, pixelWidth, pixelHeight);
      gl.useProgram(this.renderProgram);

      const renderChannels = this.channels.slice(0, MAX_RENDER_CHANNELS);
      bindTexture(gl, this.renderProgram, "uState", this.sourceTexture(), 0);
      gl.uniform2f(gl.getUniformLocation(this.renderProgram, "uWorldSize"), this.width, this.height);
      gl.uniform2f(gl.getUniformLocation(this.renderProgram, "uCssSize"), cssWidth, cssHeight);
      gl.uniform1f(gl.getUniformLocation(this.renderProgram, "uDpr"), dpr);
      gl.uniform3f(gl.getUniformLocation(this.renderProgram, "uCamera"), camera.x, camera.y, camera.scale);
      gl.uniform1i(gl.getUniformLocation(this.renderProgram, "uWrap"), this.wrapAround ? 1 : 0);
      gl.uniform1i(gl.getUniformLocation(this.renderProgram, "uChannelCount"), renderChannels.length);
      gl.uniform1iv(gl.getUniformLocation(this.renderProgram, "uChannelComponent"), componentArray(renderChannels));
      gl.uniform1iv(gl.getUniformLocation(this.renderProgram, "uVisible"), visibleArray(renderChannels));
      gl.uniform1iv(gl.getUniformLocation(this.renderProgram, "uPaletteCount"), paletteCountArray(renderChannels));
      gl.uniform3fv(gl.getUniformLocation(this.renderProgram, "uPalettes"), flattenPalettes(renderChannels));
      const bg = hexToRgb(background || this.channels[0]?.palette?.[0] || DEFAULT_COLORS[0]).map((value) => value / 255);
      gl.uniform3f(gl.getUniformLocation(this.renderProgram, "uBackground"), bg[0], bg[1], bg[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    createFieldTexture(width, height) {
      const gl = this.gl;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
      return texture;
    }

    validateDimension(value, label) {
      const dimension = Math.floor(Number(value));
      const maximum = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
      if (!Number.isFinite(dimension) || dimension < 1 || dimension > maximum) {
        throw new RangeError(`WebGL world ${label} must be between 1 and ${maximum}`);
      }
      return dimension;
    }

    createKernelTexture(data, count) {
      const gl = this.gl;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, Math.max(1, count), 1, 0, gl.RGBA, gl.FLOAT, data);
      return texture;
    }

    createFramebuffer(texture) {
      const gl = this.gl;
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (status !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Float framebuffer is incomplete");
      return framebuffer;
    }

    clearTexture(texture, framebuffer) {
      if (!texture || !framebuffer) return;
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, this.width, this.height);
      gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 0]));
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    clearStateTextures() {
      this.clearTexture(this.stateTextures[0], this.stateFramebuffers[0]);
      this.clearTexture(this.stateTextures[1], this.stateFramebuffers[1]);
      this.sourceIndex = 0;
    }

    testFloatFramebuffer() {
      const texture = this.createFieldTexture(1, 1);
      const framebuffer = this.createFramebuffer(texture);
      this.gl.deleteFramebuffer(framebuffer);
      this.gl.deleteTexture(texture);
    }

    rebuildKernel(rule) {
      const offsets = [];
      let total = 0;
      const radius = Math.max(1, Math.round(rule.radius || 1));
      for (let oy = -radius; oy <= radius; oy += 1) {
        for (let ox = -radius; ox <= radius; ox += 1) {
          const distance = Math.hypot(ox, oy);
          if (distance > radius) continue;
          const weight = kernelValue(rule, distance / radius);
          if (weight <= 0) continue;
          offsets.push({ ox, oy, weight });
          total += weight;
        }
      }

      rule.kernelCount = offsets.length;
      const gl = this.gl;
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      if (rule.kernelCount > maxTextureSize) {
        throw new Error(`Kernel radius ${radius} needs ${rule.kernelCount} texels, over MAX_TEXTURE_SIZE ${maxTextureSize}`);
      }
      const data = new Float32Array(Math.max(1, rule.kernelCount) * 4);
      for (let i = 0; i < offsets.length; i += 1) {
        data[i * 4] = offsets[i].ox;
        data[i * 4 + 1] = offsets[i].oy;
        data[i * 4 + 2] = total > 0 ? offsets[i].weight / total : 0;
      }
      if (rule.kernelTexture) gl.deleteTexture(rule.kernelTexture);
      rule.kernelTexture = this.createKernelTexture(data, rule.kernelCount);
    }

    compileRuleUniforms() {
      const ruleSrc = new Int32Array(MAX_RULES);
      const ruleDst = new Int32Array(MAX_RULES);
      const kernelCount = new Int32Array(MAX_RULES);
      const positiveOnly = new Int32Array(MAX_RULES);
      const deltaModes = new Int32Array(MAX_RULES);
      const mu = new Float32Array(MAX_RULES);
      const sigma = new Float32Array(MAX_RULES);
      const dt = new Float32Array(MAX_RULES);
      const gain = new Float32Array(MAX_RULES);
      const decay = new Float32Array(MAX_RULES);
      const weight = new Float32Array(MAX_RULES);
      const alpha = new Float32Array(MAX_RULES);
      const destinationActive = new Int32Array(MAX_CHANNELS);
      const destinationDiscrete = new Int32Array(MAX_CHANNELS);
      const destinationLimit = new Int32Array(MAX_CHANNELS);
      destinationLimit.fill(1);

      const rulesByDestination = new Map();
      for (let i = 0; i < this.rules.length; i += 1) {
        const rule = this.rules[i];
        const source = this.channelMap.get(rule.sourceChannelId);
        const destination = this.channelMap.get(rule.destinationChannelId);
        if (!source || !destination) continue;
        ruleSrc[i] = source.componentIndex;
        ruleDst[i] = destination.componentIndex;
        kernelCount[i] = rule.kernelCount || 0;
        positiveOnly[i] = rule.positiveOnly ? 1 : 0;
        deltaModes[i] = deltaMode(rule.deltaName);
        mu[i] = rule.mu;
        sigma[i] = rule.sigma;
        dt[i] = rule.dt;
        gain[i] = rule.gain;
        decay[i] = rule.decay;
        weight[i] = rule.weight;
        alpha[i] = rule.alpha;
        destinationActive[destination.componentIndex] = 1;
        if (isDiscreteRule(rule)) destinationDiscrete[destination.componentIndex] = 1;
        const list = rulesByDestination.get(destination.componentIndex) || [];
        list.push(rule);
        rulesByDestination.set(destination.componentIndex, list);
      }

      for (const [component, destinationRules] of rulesByDestination) {
        destinationLimit[component] = destinationRules.every((rule) => rule.limitValue !== false) ? 1 : 0;
      }

      return {
        ruleSrc,
        ruleDst,
        kernelCount,
        positiveOnly,
        deltaMode: deltaModes,
        mu,
        sigma,
        dt,
        gain,
        decay,
        weight,
        alpha,
        destinationActive,
        destinationDiscrete,
        destinationLimit,
      };
    }

    runEditProgram(program, setUniforms) {
      const gl = this.gl;
      gl.useProgram(program);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.destinationFramebuffer());
      gl.viewport(0, 0, this.width, this.height);
      setUniforms(gl, program);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.swapState();
    }

    quantizeChannel(channel) {
      this.runEditProgram(this.quantizeProgram, (gl, program) => {
        bindTexture(gl, program, "uState", this.sourceTexture(), 0);
        gl.uniform1i(gl.getUniformLocation(program, "uTargetChannel"), channel.componentIndex);
      });
      this.markFullSimulation();
    }

    remapState(sourceComponents) {
      const data = new Int32Array(MAX_CHANNELS);
      data.fill(-1);
      for (let i = 0; i < Math.min(MAX_CHANNELS, sourceComponents.length); i += 1) data[i] = sourceComponents[i];
      this.runEditProgram(this.remapProgram, (gl, program) => {
        bindTexture(gl, program, "uState", this.sourceTexture(), 0);
        gl.uniform1iv(gl.getUniformLocation(program, "uSourceComponent"), data);
      });
    }

    runCopyPass(oldTexture, oldWidth, oldHeight, oldX, oldY, newX, newY, copyWidth, copyHeight) {
      const gl = this.gl;
      gl.useProgram(this.copyProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.sourceFramebuffer());
      gl.viewport(0, 0, this.width, this.height);
      bindTexture(gl, this.copyProgram, "uOldState", oldTexture, 0);
      gl.uniform2f(gl.getUniformLocation(this.copyProgram, "uOldSize"), oldWidth, oldHeight);
      gl.uniform2f(gl.getUniformLocation(this.copyProgram, "uNewSize"), this.width, this.height);
      gl.uniform2f(gl.getUniformLocation(this.copyProgram, "uOldOrigin"), oldX, oldY);
      gl.uniform2f(gl.getUniformLocation(this.copyProgram, "uNewOrigin"), newX, newY);
      gl.uniform2f(gl.getUniformLocation(this.copyProgram, "uCopySize"), copyWidth, copyHeight);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    readPackedPixel(x, y) {
      const gl = this.gl;
      const value = new Float32Array(4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.sourceFramebuffer());
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.FLOAT, value);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return value;
    }

    readPackedState() {
      const gl = this.gl;
      const values = new Float32Array(this.width * this.height * 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.sourceFramebuffer());
      gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.FLOAT, values);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return values;
    }

    markFullSimulation() {
      const chunks = Math.ceil(this.width / 32) * Math.ceil(this.height / 32) * Math.max(1, this.channels.length);
      this.profile.activeChunks = chunks;
      this.profile.simChunks = chunks;
      this.profile.patches = 0;
      this.profile.colorizeMs = 0;
      this.profile.updateFieldBufferMs = 0;
    }

    replaceStateTextures(width, height) {
      this.deleteStateTextures();
      this.stateTextures = [this.createFieldTexture(width, height), this.createFieldTexture(width, height)];
      this.stateFramebuffers = this.stateTextures.map((texture) => this.createFramebuffer(texture));
      this.sourceIndex = 0;
    }

    deleteStateTextures() {
      const gl = this.gl;
      for (const texture of this.stateTextures || []) gl.deleteTexture(texture);
      for (const framebuffer of this.stateFramebuffers || []) gl.deleteFramebuffer(framebuffer);
      this.stateTextures = [];
      this.stateFramebuffers = [];
    }

    sourceTexture() {
      return this.stateTextures[this.sourceIndex];
    }

    destinationTexture() {
      return this.stateTextures[1 - this.sourceIndex];
    }

    sourceFramebuffer() {
      return this.stateFramebuffers[this.sourceIndex];
    }

    destinationFramebuffer() {
      return this.stateFramebuffers[1 - this.sourceIndex];
    }

    swapState() {
      this.sourceIndex = 1 - this.sourceIndex;
    }
  }

  const VERTEX_SHADER = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

  const STEP_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
#define MAX_RULES ${MAX_RULES}
#define MAX_CHANNELS ${MAX_CHANNELS}
uniform sampler2D uState;
uniform sampler2D uKernel0;
uniform sampler2D uKernel1;
uniform sampler2D uKernel2;
uniform sampler2D uKernel3;
uniform sampler2D uKernel4;
uniform sampler2D uKernel5;
uniform sampler2D uKernel6;
uniform sampler2D uKernel7;
uniform vec2 uWorldSize;
uniform int uRuleCount;
uniform int uRuleSrc[MAX_RULES];
uniform int uRuleDst[MAX_RULES];
uniform int uKernelCount[MAX_RULES];
uniform int uPositiveOnly[MAX_RULES];
uniform int uDeltaMode[MAX_RULES];
uniform int uDestinationActive[MAX_CHANNELS];
uniform int uDestinationDiscrete[MAX_CHANNELS];
uniform int uDestinationLimit[MAX_CHANNELS];
uniform float uMu[MAX_RULES];
uniform float uSigma[MAX_RULES];
uniform float uDt[MAX_RULES];
uniform float uGain[MAX_RULES];
uniform float uDecay[MAX_RULES];
uniform float uWeight[MAX_RULES];
uniform float uAlpha[MAX_RULES];
uniform bool uWrap;
out vec4 outState;

float clamp01(float value) {
  return max(0.0, min(1.0, value));
}

float readChannel(vec4 state, int channel) {
  if (channel == 0) return state.r;
  if (channel == 1) return state.g;
  return state.b;
}

void addChannel(inout vec3 state, int channel, float delta) {
  if (channel == 0) state.r += delta;
  else if (channel == 1) state.g += delta;
  else state.b += delta;
}

void setChannel(inout vec3 state, int channel, float value) {
  if (channel == 0) state.r = value;
  else if (channel == 1) state.g = value;
  else state.b = value;
}

vec4 fetchKernel(int ruleIndex, int offset) {
  ivec2 cell = ivec2(offset, 0);
  if (ruleIndex == 0) return texelFetch(uKernel0, cell, 0);
  if (ruleIndex == 1) return texelFetch(uKernel1, cell, 0);
  if (ruleIndex == 2) return texelFetch(uKernel2, cell, 0);
  if (ruleIndex == 3) return texelFetch(uKernel3, cell, 0);
  if (ruleIndex == 4) return texelFetch(uKernel4, cell, 0);
  if (ruleIndex == 5) return texelFetch(uKernel5, cell, 0);
  if (ruleIndex == 6) return texelFetch(uKernel6, cell, 0);
  return texelFetch(uKernel7, cell, 0);
}

float sampleSource(ivec2 cell, int channel) {
  ivec2 size = ivec2(uWorldSize);
  if (uWrap) {
    cell = ivec2((cell.x % size.x + size.x) % size.x, (cell.y % size.y + size.y) % size.y);
  } else if (cell.x < 0 || cell.y < 0 || cell.x >= size.x || cell.y >= size.y) {
    return 0.0;
  }
  return readChannel(texelFetch(uState, cell, 0), channel);
}

float growthCurve(int ruleIndex, float n) {
  float mu = uMu[ruleIndex];
  float sigma = max(0.000001, uSigma[ruleIndex]);
  float distance = abs(n - mu);
  float squared = distance * distance;
  int mode = uDeltaMode[ruleIndex];
  if (mode == 1) {
    float reach = 9.0 * sigma * sigma;
    return squared > reach ? -1.0 : pow(1.0 - squared / reach, uAlpha[ruleIndex]) * 2.0 - 1.0;
  }
  if (mode == 2) {
    float p = sigma / 2.0;
    float q = sigma * 2.0;
    if (distance <= p) return 1.0;
    return distance <= q ? (2.0 * (q - distance)) / (q - p) - 1.0 : -1.0;
  }
  if (mode == 3) {
    return distance <= sigma ? 1.0 : -1.0;
  }
  return 2.0 * exp(-squared / (2.0 * sigma * sigma)) - 1.0;
}

void finalizeChannel(inout vec3 state, int channel) {
  if (uDestinationActive[channel] == 0) return;
  float value = readChannel(vec4(state, 0.0), channel);
  if (uDestinationDiscrete[channel] == 1) value = value > 0.5 ? 1.0 : 0.0;
  else if (uDestinationLimit[channel] == 1) value = clamp01(value);
  else value = max(0.0, value);
  setChannel(state, channel, value);
}

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);
  vec4 current = texelFetch(uState, cell, 0);
  vec3 next = current.rgb;

  for (int ruleIndex = 0; ruleIndex < MAX_RULES; ruleIndex += 1) {
    if (ruleIndex >= uRuleCount) break;
    int sourceChannel = uRuleSrc[ruleIndex];
    int destinationChannel = uRuleDst[ruleIndex];
    int kernelCount = uKernelCount[ruleIndex];
    float neighborhood = 0.0;

    for (int kernelIndex = 0; kernelIndex < kernelCount; kernelIndex += 1) {
      vec4 kernel = fetchKernel(ruleIndex, kernelIndex);
      ivec2 offset = ivec2(round(kernel.xy));
      neighborhood += sampleSource(cell + offset, sourceChannel) * kernel.z;
    }

    float currentDestination = readChannel(current, destinationChannel);
    float rawGrowth = growthCurve(ruleIndex, neighborhood) * uGain[ruleIndex];
    float growth = uPositiveOnly[ruleIndex] == 1 ? max(0.0, rawGrowth) : rawGrowth;
    float delta = uDt[ruleIndex] * growth * uWeight[ruleIndex] - uDecay[ruleIndex] * currentDestination;
    addChannel(next, destinationChannel, delta);
  }

  finalizeChannel(next, 0);
  finalizeChannel(next, 1);
  finalizeChannel(next, 2);
  outState = vec4(next, 0.0);
}`;

  const RENDER_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
#define MAX_RENDER_CHANNELS ${MAX_RENDER_CHANNELS}
uniform sampler2D uState;
uniform vec2 uWorldSize;
uniform vec2 uCssSize;
uniform float uDpr;
uniform vec3 uCamera;
uniform bool uWrap;
uniform int uChannelCount;
uniform int uChannelComponent[MAX_RENDER_CHANNELS];
uniform int uVisible[MAX_RENDER_CHANNELS];
uniform int uPaletteCount[MAX_RENDER_CHANNELS];
uniform vec3 uPalettes[${MAX_RENDER_CHANNELS * 8}];
uniform vec3 uBackground;
out vec4 outColor;

float readComponent(vec4 state, int component) {
  if (component == 0) return state.r;
  if (component == 1) return state.g;
  return state.b;
}

float sampleChannel(int channelIndex, ivec2 cell) {
  return readComponent(texelFetch(uState, cell, 0), uChannelComponent[channelIndex]);
}

vec3 colorRamp(int channelIndex, float value) {
  float clampedValue = max(0.0, min(1.0, value));
  int paletteCount = max(1, uPaletteCount[channelIndex]);
  float scaled = clampedValue * float(max(1, paletteCount - 1));
  int base = int(floor(scaled));
  float t = scaled - float(base);
  int nextIndex = min(base + 1, paletteCount - 1);
  int offset = channelIndex * 8;
  return mix(uPalettes[offset + base], uPalettes[offset + nextIndex], t);
}

void main() {
  vec2 screen = vec2(gl_FragCoord.x / uDpr, uCssSize.y - gl_FragCoord.y / uDpr);
  vec2 world = (screen - uCssSize * 0.5) / uCamera.z + uCamera.xy;
  if (uWrap) {
    world = mod(world, uWorldSize);
  } else if (world.x < 0.0 || world.y < 0.0 || world.x >= uWorldSize.x || world.y >= uWorldSize.y) {
    outColor = vec4(uBackground, 1.0);
    return;
  }

  ivec2 cell = ivec2(floor(world));
  int visibleCount = 0;
  int singleIndex = 0;
  for (int i = 0; i < MAX_RENDER_CHANNELS; i += 1) {
    if (i < uChannelCount && uVisible[i] == 1) {
      visibleCount += 1;
      singleIndex = i;
    }
  }
  if (visibleCount == 1) {
    outColor = vec4(colorRamp(singleIndex, sampleChannel(singleIndex, cell)), 1.0);
    return;
  }

  vec3 color = uBackground;
  for (int i = 0; i < MAX_RENDER_CHANNELS; i += 1) {
    if (i >= uChannelCount || uVisible[i] == 0) continue;
    float value = max(0.0, min(1.0, sampleChannel(i, cell)));
    if (value <= 0.00001) continue;
    vec3 layerColor = colorRamp(i, value);
    float alpha = max(0.0, min(1.0, value * 0.86));
    color = mix(color, layerColor, alpha);
  }
  outColor = vec4(color, 1.0);
}`;

  const BRUSH_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uState;
uniform vec2 uWorldSize;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uPower;
uniform int uMode;
uniform bool uWrap;
uniform bool uDiscrete;
uniform int uTargetChannel;
out vec4 outState;

float clamp01(float value) {
  return max(0.0, min(1.0, value));
}

float readChannel(vec4 state, int channel) {
  if (channel == 0) return state.r;
  if (channel == 1) return state.g;
  return state.b;
}

void setChannel(inout vec4 state, int channel, float value) {
  if (channel == 0) state.r = value;
  else if (channel == 1) state.g = value;
  else state.b = value;
}

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);
  vec4 state = texelFetch(uState, cell, 0);
  float current = readChannel(state, uTargetChannel);
  vec2 delta = vec2(cell) - uCenter;
  if (uWrap) {
    delta -= round(delta / uWorldSize) * uWorldSize;
  }
  float distance = length(delta);
  if (distance > uRadius) {
    outState = state;
    return;
  }
  float value = current;
  if (uDiscrete) {
    value = uMode == 1 ? 0.0 : 1.0;
  } else {
    float falloff = uRadius <= 0.0 ? 1.0 : 1.0 - distance / uRadius;
    if (uMode == 1) value = clamp01(current * (1.0 - falloff * uPower));
    else value = clamp01(current + falloff * uPower);
  }
  setChannel(state, uTargetChannel, value);
  outState = state;
}`;

  const PLACE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uState;
uniform sampler2D uCells;
uniform vec2 uWorldSize;
uniform vec2 uCenter;
uniform vec2 uCellSize;
uniform float uScale;
uniform float uAngle;
uniform bool uWrap;
uniform bool uDiscrete;
uniform int uTargetChannel;
out vec4 outState;

float readChannel(vec4 state, int channel) {
  if (channel == 0) return state.r;
  if (channel == 1) return state.g;
  return state.b;
}

void setChannel(inout vec4 state, int channel, float value) {
  if (channel == 0) state.r = value;
  else if (channel == 1) state.g = value;
  else state.b = value;
}

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);
  vec4 state = texelFetch(uState, cell, 0);
  float current = readChannel(state, uTargetChannel);
  vec2 delta = vec2(cell) + vec2(0.5) - uCenter;
  if (uWrap) {
    delta -= round(delta / uWorldSize) * uWorldSize;
  }
  float c = cos(uAngle);
  float s = sin(uAngle);
  vec2 source = vec2(c * delta.x + s * delta.y, -s * delta.x + c * delta.y) / max(0.0001, uScale) + uCellSize * 0.5;
  ivec2 sourceCell = ivec2(floor(source));
  if (sourceCell.x < 0 || sourceCell.y < 0 || sourceCell.x >= int(uCellSize.x) || sourceCell.y >= int(uCellSize.y)) {
    outState = state;
    return;
  }
  float sourceValue = texelFetch(uCells, sourceCell, 0).r;
  float value = uDiscrete ? max(current >= 0.5 ? 1.0 : 0.0, sourceValue >= 0.5 ? 1.0 : 0.0) : max(current, sourceValue);
  setChannel(state, uTargetChannel, value);
  outState = state;
}`;

  const RANDOMIZE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uState;
uniform vec4 uRect;
uniform float uSeed;
uniform int uTargetChannel;
uniform bool uDiscrete;
out vec4 outState;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031 + uSeed * 0.0137);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void setChannel(inout vec4 state, int channel, float value) {
  if (channel == 0) state.r = value;
  else if (channel == 1) state.g = value;
  else state.b = value;
}

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);
  vec4 state = texelFetch(uState, cell, 0);
  bool inside = float(cell.x) >= uRect.x && float(cell.y) >= uRect.y && float(cell.x) < uRect.z && float(cell.y) < uRect.w;
  float value = 0.0;
  if (inside) {
    float roll = hash12(vec2(cell) + vec2(17.0, 29.0));
    if (roll > 0.86) value = uDiscrete ? 1.0 : hash12(vec2(cell) + vec2(83.0, 41.0));
  }
  setChannel(state, uTargetChannel, value);
  outState = state;
}`;

  const COPY_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uOldState;
uniform vec2 uOldSize;
uniform vec2 uNewSize;
uniform vec2 uOldOrigin;
uniform vec2 uNewOrigin;
uniform vec2 uCopySize;
out vec4 outState;

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec2 relative = cell - uNewOrigin;
  if (relative.x < 0.0 || relative.y < 0.0 || relative.x >= uCopySize.x || relative.y >= uCopySize.y) {
    outState = vec4(0.0);
    return;
  }
  ivec2 oldCell = ivec2(relative + uOldOrigin);
  outState = texelFetch(uOldState, oldCell, 0);
}`;

  const CLEAR_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uState;
uniform int uTargetChannel;
out vec4 outState;

void setChannel(inout vec4 state, int channel, float value) {
  if (channel == 0) state.r = value;
  else if (channel == 1) state.g = value;
  else state.b = value;
}

void main() {
  vec4 state = texelFetch(uState, ivec2(gl_FragCoord.xy), 0);
  setChannel(state, uTargetChannel, 0.0);
  outState = state;
}`;

  const QUANTIZE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uState;
uniform int uTargetChannel;
out vec4 outState;

float readChannel(vec4 state, int channel) {
  if (channel == 0) return state.r;
  if (channel == 1) return state.g;
  return state.b;
}

void setChannel(inout vec4 state, int channel, float value) {
  if (channel == 0) state.r = value;
  else if (channel == 1) state.g = value;
  else state.b = value;
}

void main() {
  vec4 state = texelFetch(uState, ivec2(gl_FragCoord.xy), 0);
  float value = readChannel(state, uTargetChannel);
  setChannel(state, uTargetChannel, value >= 0.5 ? 1.0 : 0.0);
  outState = state;
}`;

  const REMAP_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
#define MAX_CHANNELS ${MAX_CHANNELS}
uniform sampler2D uState;
uniform int uSourceComponent[MAX_CHANNELS];
out vec4 outState;

float readChannel(vec4 state, int channel) {
  if (channel == 0) return state.r;
  if (channel == 1) return state.g;
  if (channel == 2) return state.b;
  return 0.0;
}

void setChannel(inout vec4 state, int channel, float value) {
  if (channel == 0) state.r = value;
  else if (channel == 1) state.g = value;
  else state.b = value;
}

void main() {
  vec4 oldState = texelFetch(uState, ivec2(gl_FragCoord.xy), 0);
  vec4 nextState = vec4(0.0);
  for (int channel = 0; channel < MAX_CHANNELS; channel += 1) {
    setChannel(nextState, channel, readChannel(oldState, uSourceComponent[channel]));
  }
  outState = nextState;
}`;

  function createProgram(gl, vertexSource, fragmentSource) {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) || "Unknown program link error";
      gl.deleteProgram(program);
      throw new Error(log);
    }
    return program;
  }

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) || "Unknown shader compile error";
      gl.deleteShader(shader);
      throw new Error(log);
    }
    return shader;
  }

  function bindTexture(gl, program, name, texture, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, name), unit);
  }

  function normalizeModel(model = {}) {
    const sourceChannels = Array.isArray(model.channels) && model.channels.length ? model.channels : legacyModel(model).channels;
    const channels = sourceChannels.slice(0, MAX_CHANNELS).map((channel, index) => ({
      id: String(channel.id || `channel-${index}`),
      name: String(channel.name || `Layer ${index + 1}`),
      palette: normalizePalette(channel.palette || channel.colors || DEFAULT_COLORS),
      visible: channel.visible !== false,
    }));
    const ids = new Set(channels.map((channel) => channel.id));
    if (ids.size !== channels.length) throw new TypeError("Channel ids must be unique");
    const sourceRules = Array.isArray(model.rules) && model.rules.length ? model.rules : [model.rule || DEFAULT_RULE];
    if (sourceRules.length > MAX_RULES) throw new RangeError(`WebGL v1 supports up to ${MAX_RULES} rules`);
    const rules = sourceRules.map((rule, index) => {
      const fallbackId = channels[0]?.id || "channel-0";
      const sourceId = String(rule.sourceChannelId || rule.src || rule.source || fallbackId);
      const destinationId = String(rule.destinationChannelId || rule.dst || rule.destination || fallbackId);
      return normalizeRule({
        ...rule,
        id: rule.id || `rule-${index}`,
        sourceChannelId: ids.has(sourceId) ? sourceId : fallbackId,
        destinationChannelId: ids.has(destinationId) ? destinationId : fallbackId,
      });
    });
    return {
      channels,
      rules,
      selectedChannelId: String(model.selectedChannelId || channels[0]?.id || "channel-0"),
      metricScope: model.metricScope === "aggregate" ? "aggregate" : "selected",
      wrapAround: model.wrapAround !== false,
    };
  }

  function legacyModel(config = DEFAULT_RULE, colors = DEFAULT_COLORS) {
    const rule = normalizeRule({ ...DEFAULT_RULE, ...config });
    return {
      selectedChannelId: "channel-0",
      metricScope: "selected",
      wrapAround: config?.wrapAround !== false,
      channels: [{ id: "channel-0", name: "Layer 1", palette: colors && colors.length ? colors : DEFAULT_COLORS, visible: true }],
      rules: [{ ...rule, id: "rule-0", sourceChannelId: "channel-0", destinationChannelId: "channel-0" }],
    };
  }

  function currentModel(sim) {
    return {
      selectedChannelId: sim.selectedChannelId,
      metricScope: sim.metricScope,
      wrapAround: sim.wrapAround,
      channels: sim.channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        palette: [...channel.palette],
        visible: channel.visible,
      })),
      rules: sim.rules.map(stripRuntimeRule),
    };
  }

  function stripRuntimeRule(rule) {
    return {
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
      weight: Number(rule.weight ?? 1),
      positiveOnly: Boolean(rule.positiveOnly),
    };
  }

  function normalizeRule(rule = {}) {
    return {
      id: String(rule.id || "rule-0"),
      sourceChannelId: String(rule.sourceChannelId || rule.source || "channel-0"),
      destinationChannelId: String(rule.destinationChannelId || rule.destination || "channel-0"),
      radius: finiteNumber(rule.radius ?? 13, "Rule radius", 1, MAX_RULE_RADIUS),
      alpha: finiteNumber(rule.alpha ?? 4, "Rule alpha", 0.01, 64),
      mu: finiteNumber(rule.mu ?? 0.15, "Rule mu", -4, 4),
      sigma: finiteNumber(rule.sigma ?? 0.017, "Rule sigma", Number.EPSILON, 4),
      dt: finiteNumber(rule.dt ?? 0.1, "Rule time step", 0.000001, 4),
      gain: finiteNumber(rule.gain ?? 1, "Rule gain", -16, 16),
      decay: finiteNumber(rule.decay ?? 0, "Rule decay", 0, 4),
      limitValue: rule.limitValue !== false,
      deltaName: rule.deltaName || "gaus",
      coreName: rule.coreName || "bump4",
      layer: Number(rule.layer || 0),
      beta: [...(rule.beta || [1, 0, 0, 0])],
      eta: [...(rule.eta || [0, 0, 0, 0])],
      weight: finiteNumber(rule.weight ?? 1, "Rule weight", -16, 16),
      positiveOnly: Boolean(rule.positiveOnly),
      kernelTexture: null,
      kernelCount: 0,
    };
  }

  function normalizePalette(colors) {
    const palette = colors && colors.length ? colors : DEFAULT_COLORS;
    return palette.slice(0, 8).map((color) => String(color || DEFAULT_COLORS[0]));
  }

  function normalizeRect(rect, width, height) {
    const source = rect || { left: 0, top: 0, right: width, bottom: height };
    const left = Math.max(0, Math.min(width, Math.floor(source.left || 0)));
    const top = Math.max(0, Math.min(height, Math.floor(source.top || 0)));
    const right = Math.max(left, Math.min(width, Math.ceil(source.right ?? width)));
    const bottom = Math.max(top, Math.min(height, Math.ceil(source.bottom ?? height)));
    return { left, top, right, bottom };
  }

  function isDiscreteRule(rule) {
    return rule.coreName === "life";
  }

  function isDiscreteChannel(rules, channelId) {
    return rules.some((rule) => rule.destinationChannelId === channelId && isDiscreteRule(rule));
  }

  function coreValue(config, r) {
    const alpha = config.alpha;
    if (r < 0 || r > 1) return 0;
    const k = 4 * r * (1 - r);
    switch (config.coreName) {
      case "quad4":
        return k <= 0 ? 0 : Math.pow(k, alpha);
      case "trap1/5": {
        const q = 1 / 5;
        if (r < q || r > 1 - q) return 0;
        if (r < 2 * q) return (r - q) / q;
        if (r > 1 - 2 * q) return (1 - q - r) / q;
        return 1;
      }
      case "stpz1/4": {
        const q = 1 / 4;
        return r >= q && r <= 1 - q ? 1 : 0;
      }
      case "life": {
        const q = 1 / 4;
        if (r < q) return 0.5;
        return r > 1 - q ? 0 : 1;
      }
      case "bump4":
      default:
        if (r <= 0 || r >= 1 || k <= 0) return 0;
        return Math.exp(alpha * (1 - 1 / k));
    }
  }

  function kernelValue(config, r) {
    const distance = Math.abs(r);
    if (config.layer === 0) return coreValue(config, distance);
    if (distance >= 1) return 0;
    const layers = config.layer + 1;
    const scaled = distance * layers;
    const betaIndex = Math.floor(scaled);
    const etaIndex = Math.floor(scaled + 0.5);
    const eta = etaIndex <= config.layer ? config.eta[etaIndex] : 0;
    return coreValue(config, scaled % 1) * ((config.beta[betaIndex] || 0) - eta) + eta;
  }

  function deltaMode(name) {
    if (name === "quad4") return 1;
    if (name === "trap") return 2;
    if (name === "stpz") return 3;
    return 0;
  }

  function hexToRgb(hex) {
    const clean = String(hex || "#000000").replace("#", "");
    const full = clean.length === 3 ? clean.split("").map((part) => part + part).join("") : clean;
    const value = Number.parseInt(full, 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  function flattenPalettes(channels) {
    const data = new Float32Array(MAX_RENDER_CHANNELS * 8 * 3);
    for (let channelIndex = 0; channelIndex < Math.min(MAX_RENDER_CHANNELS, channels.length); channelIndex += 1) {
      const palette = normalizePalette(channels[channelIndex].palette).map(hexToRgb);
      for (let i = 0; i < Math.min(8, palette.length); i += 1) {
        const p = (channelIndex * 8 + i) * 3;
        data[p] = palette[i][0] / 255;
        data[p + 1] = palette[i][1] / 255;
        data[p + 2] = palette[i][2] / 255;
      }
    }
    return data;
  }

  function visibleArray(channels) {
    const data = new Int32Array(MAX_RENDER_CHANNELS);
    for (let i = 0; i < Math.min(MAX_RENDER_CHANNELS, channels.length); i += 1) data[i] = channels[i].visible ? 1 : 0;
    return data;
  }

  function componentArray(channels) {
    const data = new Int32Array(MAX_RENDER_CHANNELS);
    for (let i = 0; i < Math.min(MAX_RENDER_CHANNELS, channels.length); i += 1) data[i] = channels[i].componentIndex;
    return data;
  }

  function paletteCountArray(channels) {
    const data = new Int32Array(MAX_RENDER_CHANNELS);
    for (let i = 0; i < Math.min(MAX_RENDER_CHANNELS, channels.length); i += 1) {
      data[i] = Math.max(1, Math.min(8, channels[i].palette.length));
    }
    return data;
  }

  function packChannel(packed, values, component) {
    for (let i = 0; i < values.length; i += 1) packed[i * 4 + component] = values[i];
  }

  function unpackChannel(packed, component) {
    const values = new Float32Array(packed.length / 4);
    for (let i = 0; i < values.length; i += 1) values[i] = packed[i * 4 + component];
    return values;
  }

  function emptyMetrics(selectedChannelId, metricScope) {
    return {
      mass: 0,
      growth: 0,
      energy: 0,
      selectedChannelId,
      scope: metricScope,
      perChannel: {},
      aggregate: { mass: 0, growth: 0, energy: 0 },
    };
  }

  function clamp(value, low = 0, high = 1) {
    return Math.max(low, Math.min(high, value));
  }

  function finiteNumber(value, label, low, high) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < low || number > high) {
      throw new RangeError(`${label} must be between ${low} and ${high}`);
    }
    return number;
  }

  window.WebGLLeniaSim = WebGLLeniaSim;
})();
