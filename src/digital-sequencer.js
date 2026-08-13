(function () {
  const MODULE_ID = "merrinlab-16-step-sequencer";
  const CHANNEL = "merrinlab-patch-bus";
  const PROTOCOL = "merrinlab.patch.v0.1";
  const STEPS_PER_BANK = 16;
  const BANK_COUNT = 2;
  const TOTAL_STEPS = STEPS_PER_BANK * BANK_COUNT;
  const PLAY_RANGES = [
    { label: "A", start: 0, length: STEPS_PER_BANK },
    { label: "B", start: STEPS_PER_BANK, length: STEPS_PER_BANK },
    { label: "A+B", start: 0, length: TOTAL_STEPS },
  ];
  const STATUS_KEYS = ["mute", "skip", "accent", "glide"];
  const DIRECTION_LABELS = ["Forward", "Reverse", "Ping-Pong", "Random"];
  const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL) : null;

  function send(type, payload) {
    const message = {
      protocol: PROTOCOL,
      source: MODULE_ID,
      type,
      time: performance.now(),
      payload,
    };

    if (channel) channel.postMessage(message);
    window.dispatchEvent(new CustomEvent(CHANNEL, { detail: message }));
  }

  const steps = Array.from(document.querySelectorAll(".step"));
  const statusValues = Array.from(document.querySelectorAll(".status-strip strong"));
  const currentStepReadout = statusValues[0];
  const currentBankReadout = statusValues[1];
  const statusReadout = statusValues[2];
  const lengthCodeBits = Array.from(document.querySelectorAll(".led-code .bit i"));
  const transportButtons = Array.from(document.querySelectorAll(".transport button"));
  const clockRateInput = document.querySelector(".clock input[type='range']");

  function findControlBlock(title) {
    return Array.from(document.querySelectorAll(".control-block")).find((block) => {
      return block.querySelector("h2")?.textContent.trim().toLowerCase() === title.toLowerCase();
    });
  }

  const editBankBlock = findControlBlock("Edit Bank");
  const editBankButtons = editBankBlock ? Array.from(editBankBlock.querySelectorAll("button")) : [];
  const playRangeBlock = findControlBlock("Play Range");
  const playRangeButtons = playRangeBlock ? Array.from(playRangeBlock.querySelectorAll("button")) : [];
  const clockBlock = findControlBlock("Clock");
  const clockButtons = clockBlock ? Array.from(clockBlock.querySelectorAll("button")) : [];
  const gateModeBlock = findControlBlock("Gate Mode");
  const gateModeButtons = gateModeBlock ? Array.from(gateModeBlock.querySelectorAll("button")) : [];
  const directionBlock = findControlBlock("Direction");

  function ensureDirectionButtons() {
    if (!directionBlock) return [];

    const row = directionBlock.querySelector(".button-row");
    if (!row) return [];

    const existing = Array.from(row.querySelectorAll("button"));
    const existingLabels = new Set(existing.map((button) => button.textContent.trim()));

    DIRECTION_LABELS.forEach((label) => {
      if (existingLabels.has(label)) return;
      const button = document.createElement("button");
      button.className = "toggle";
      button.type = "button";
      button.textContent = label;
      row.appendChild(button);
    });

    const note = directionBlock.querySelector("p");
    if (note) note.textContent = "Forward, reverse, ping-pong, or random traversal.";

    return Array.from(row.querySelectorAll("button"));
  }

  const directionButtons = ensureDirectionButtons();

  if (clockBlock && !clockBlock.querySelector("[data-functional-boundary]")) {
    const note = document.createElement("p");
    note.dataset.functionalBoundary = "clock";
    note.textContent = "Internal / External is functional. Normal / Quantized remains reserved.";
    clockBlock.appendChild(note);
  }

  const modeCard = document.querySelector(".mode-card");
  const modeCardNote = modeCard?.querySelector("p");
  if (modeCardNote) {
    modeCardNote.textContent = "Mode selector is retained as a design reference; the active engine uses the Digital/Clean behaviour.";
  }
  modeCard?.querySelectorAll("button").forEach((button) => {
    const isClean = button.textContent.trim().toLowerCase() === "clean";
    button.classList.toggle("active", isClean);
    button.setAttribute("aria-disabled", "true");
  });

  let activeBank = 0;
  let activePlayRange = 0;
  let playCursor = 0;
  let directionMode = "forward";
  let pingPongDirection = 1;
  let gateMode = "single";
  let clockSource = "internal";
  let transposeSemitones = 0;
  let running = false;
  let pulseTimer = null;
  let currentGlobalIndex = null;
  let pulseInStep = 0;
  let openGateGlobalIndex = null;
  const gateTimers = new Set();

  function getPitchInput(step) {
    return step.querySelector("label:nth-of-type(1) input");
  }

  function getLengthInput(step) {
    return step.querySelector("label:nth-of-type(2) input");
  }

  function getGateButton(step) {
    return Array.from(step.children).find((child) => child.tagName === "BUTTON") || null;
  }

  function getStatusButtons(step) {
    return Array.from(step.querySelectorAll(".step-status button"));
  }

  function getStepPitch(step) {
    return Math.max(0, Math.min(127, Number(getPitchInput(step)?.value || 60)));
  }

  function getStepLength(step) {
    return Math.max(1, Math.min(16, Number(getLengthInput(step)?.value || 4)));
  }

  function readStatusState(step) {
    const state = { mute: false, skip: false, accent: false, glide: false };
    getStatusButtons(step).forEach((button, index) => {
      const key = STATUS_KEYS[index];
      if (key) state[key] = button.classList.contains("active");
    });
    return state;
  }

  function makePatternStep(index) {
    const sourceStep = steps[index % steps.length];
    return {
      pitch: getStepPitch(sourceStep),
      length: getStepLength(sourceStep),
      ...readStatusState(sourceStep),
    };
  }

  const pattern = Array.from({ length: TOTAL_STEPS }, (_, index) => makePatternStep(index));

  function visibleBankStart() {
    return activeBank * STEPS_PER_BANK;
  }

  function globalStepNumber(visibleIndex) {
    return visibleBankStart() + visibleIndex + 1;
  }

  function bankForGlobalIndex(globalIndex) {
    return Math.floor(globalIndex / STEPS_PER_BANK);
  }

  function visibleIndexForGlobalIndex(globalIndex) {
    return globalIndex % STEPS_PER_BANK;
  }

  function bankLabel(bankIndex) {
    return bankIndex === 0 ? "A" : "B";
  }

  function currentPlayRange() {
    return PLAY_RANGES[activePlayRange];
  }

  function playRangeLabel() {
    return currentPlayRange().label;
  }

  function pulseMs() {
    const bpm = Number(clockRateInput?.value || 120);
    return (60000 / Math.max(20, bpm)) / 4;
  }

  function pitchToCv(midiPitch) {
    return (midiPitch - 60) / 12;
  }

  function setStatus(text) {
    if (statusReadout) statusReadout.textContent = text;
  }

  function setCurrentBankReadout() {
    if (currentBankReadout) currentBankReadout.textContent = bankLabel(activeBank);
  }

  function setLengthCode(length) {
    const code = Math.max(0, Math.min(15, length - 1));
    [8, 4, 2, 1].forEach((weight, index) => {
      lengthCodeBits[index]?.classList.toggle("on", Boolean(code & weight));
    });
  }

  function saveVisibleStep(visibleIndex) {
    const step = steps[visibleIndex];
    const patternIndex = visibleBankStart() + visibleIndex;
    if (!step || !pattern[patternIndex]) return;

    const state = readStatusState(step);
    pattern[patternIndex] = {
      ...pattern[patternIndex],
      pitch: getStepPitch(step),
      length: getStepLength(step),
      ...state,
    };
  }

  function saveVisibleBank() {
    steps.forEach((_, index) => saveVisibleStep(index));
  }

  function renderVisibleBank() {
    const bankStart = visibleBankStart();

    steps.forEach((step, visibleIndex) => {
      const patternStep = pattern[bankStart + visibleIndex];
      const stepNumber = globalStepNumber(visibleIndex);
      const heading = step.querySelector("h3");
      const pitchInput = getPitchInput(step);
      const lengthInput = getLengthInput(step);

      if (heading) heading.textContent = String(stepNumber).padStart(2, "0");
      if (pitchInput) pitchInput.value = patternStep.pitch;
      if (lengthInput) lengthInput.value = patternStep.length;

      getStatusButtons(step).forEach((button, statusIndex) => {
        const key = STATUS_KEYS[statusIndex];
        button.classList.toggle("active", Boolean(key && patternStep[key]));
      });
    });

    setCurrentBankReadout();
    const previewIndex = currentGlobalIndex ?? currentPlayRange().start + playCursor;
    showGlobalStep(previewIndex);
  }

  function updatePlayRangeButtons() {
    playRangeButtons.forEach((button, index) => {
      button.classList.toggle("active", index === activePlayRange);
    });
  }

  function updateDirectionButtons() {
    directionButtons.forEach((button) => {
      const mode = button.textContent.trim().toLowerCase().replace("ping-pong", "pingpong");
      button.classList.toggle("active", mode === directionMode);
    });
  }

  function updateGateModeButtons() {
    gateModeButtons.forEach((button) => {
      button.classList.toggle("active", button.textContent.trim().toLowerCase() === gateMode);
    });
  }

  function updateClockSourceButtons() {
    clockButtons.forEach((button) => {
      const label = button.textContent.trim().toLowerCase();
      if (label === "internal" || label === "external") {
        button.classList.toggle("active", label === clockSource);
      }
    });
  }

  function showGlobalStep(globalIndex) {
    if (!Number.isInteger(globalIndex) || globalIndex < 0 || globalIndex >= TOTAL_STEPS) return;

    const visibleIndex = visibleIndexForGlobalIndex(globalIndex);
    const visibleBank = bankForGlobalIndex(globalIndex);

    steps.forEach((step, stepIndex) => {
      const isActive = visibleBank === activeBank && stepIndex === visibleIndex;
      step.classList.toggle("active", isActive);
      step.querySelector(".step-led")?.classList.toggle("on", isActive);
    });

    if (currentStepReadout) {
      currentStepReadout.textContent = String(globalIndex + 1).padStart(2, "0");
    }

    const patternStep = pattern[globalIndex];
    if (patternStep) setLengthCode(patternStep.length);
  }

  function clearGateTimers() {
    gateTimers.forEach((timer) => window.clearTimeout(timer));
    gateTimers.clear();
  }

  function closeGate(globalIndex, reason = "close") {
    if (openGateGlobalIndex === globalIndex) openGateGlobalIndex = null;
    send("gate", {
      open: false,
      step: globalIndex + 1,
      visibleStep: visibleIndexForGlobalIndex(globalIndex) + 1,
      bank: bankLabel(bankForGlobalIndex(globalIndex)),
      playRange: playRangeLabel(),
      reason,
    });
  }

  function scheduleGateClose(globalIndex, durationMs, reason) {
    const timer = window.setTimeout(() => {
      gateTimers.delete(timer);
      closeGate(globalIndex, reason);
    }, Math.max(20, durationMs));
    gateTimers.add(timer);
  }

  function forceCloseOpenGate(reason) {
    clearGateTimers();
    if (openGateGlobalIndex === null) return;
    const globalIndex = openGateGlobalIndex;
    openGateGlobalIndex = null;
    closeGate(globalIndex, reason);
  }

  function emitGatePulse(globalIndex, durationMs, reason) {
    const patternStep = pattern[globalIndex];
    if (!patternStep || patternStep.mute) return;

    if (openGateGlobalIndex !== null) forceCloseOpenGate("retrigger");

    const payload = {
      step: globalIndex + 1,
      visibleStep: visibleIndexForGlobalIndex(globalIndex) + 1,
      bank: bankLabel(bankForGlobalIndex(globalIndex)),
      playRange: playRangeLabel(),
      accent: patternStep.accent,
      glide: patternStep.glide,
      reason,
    };

    openGateGlobalIndex = globalIndex;
    send("gate", { ...payload, open: true });
    send("trigger", payload);
    scheduleGateClose(globalIndex, durationMs, reason);
  }

  function emitStepStart(globalIndex) {
    const patternStep = pattern[globalIndex];
    if (!patternStep) return;

    const transposedPitch = Math.max(0, Math.min(127, patternStep.pitch + transposeSemitones));
    const common = {
      step: globalIndex + 1,
      visibleStep: visibleIndexForGlobalIndex(globalIndex) + 1,
      bank: bankLabel(bankForGlobalIndex(globalIndex)),
      playRange: playRangeLabel(),
    };

    send("step-index", common);
    send("pitch-cv", {
      ...common,
      value: pitchToCv(transposedPitch),
      pitch: transposedPitch,
      sourcePitch: patternStep.pitch,
      transposeSemitones,
      glide: patternStep.glide,
    });
    send("accent", { ...common, active: patternStep.accent });

    if (gateMode === "single") {
      emitGatePulse(globalIndex, pulseMs() * patternStep.length * 0.85, "single-step");
    }
  }

  function resetTraversal() {
    const range = currentPlayRange();
    currentGlobalIndex = null;
    pulseInStep = 0;
    pingPongDirection = 1;
    playCursor = directionMode === "reverse" ? range.length - 1 : 0;
    forceCloseOpenGate("traversal-reset");
    showGlobalStep(range.start + playCursor);
  }

  function advanceCursor() {
    const range = currentPlayRange();
    if (range.length <= 1) {
      playCursor = 0;
      return;
    }

    if (directionMode === "reverse") {
      playCursor = (playCursor - 1 + range.length) % range.length;
      return;
    }

    if (directionMode === "pingpong") {
      let next = playCursor + pingPongDirection;
      if (next >= range.length) {
        pingPongDirection = -1;
        next = range.length - 2;
      } else if (next < 0) {
        pingPongDirection = 1;
        next = 1;
      }
      playCursor = next;
      return;
    }

    if (directionMode === "random") {
      playCursor = Math.floor(Math.random() * range.length);
      return;
    }

    playCursor = (playCursor + 1) % range.length;
  }

  function selectPlayableGlobalIndex() {
    const range = currentPlayRange();

    if (directionMode === "random") {
      const playableOffsets = [];
      for (let offset = 0; offset < range.length; offset += 1) {
        if (!pattern[range.start + offset].skip) playableOffsets.push(offset);
      }
      if (!playableOffsets.length) return null;
      playCursor = playableOffsets[Math.floor(Math.random() * playableOffsets.length)];
      return range.start + playCursor;
    }

    for (let attempt = 0; attempt < range.length; attempt += 1) {
      const globalIndex = range.start + playCursor;
      if (!pattern[globalIndex].skip) return globalIndex;
      advanceCursor();
    }

    return null;
  }

  function emitInternalClock(globalIndex, pulseNumber, stepLength) {
    send("clock", {
      step: globalIndex + 1,
      visibleStep: visibleIndexForGlobalIndex(globalIndex) + 1,
      bank: bankLabel(bankForGlobalIndex(globalIndex)),
      playRange: playRangeLabel(),
      pulse: pulseNumber,
      stepLength,
      bpm: Number(clockRateInput?.value || 120),
      subdivision: "1/16",
    });
  }

  function tick({ external = false } = {}) {
    if (!running) return;

    let justStarted = false;
    if (currentGlobalIndex === null) {
      currentGlobalIndex = selectPlayableGlobalIndex();
      if (currentGlobalIndex === null) {
        setStatus("All steps skipped");
        return;
      }
      pulseInStep = 0;
      justStarted = true;
      showGlobalStep(currentGlobalIndex);
    }

    const patternStep = pattern[currentGlobalIndex];
    const pulseNumber = pulseInStep + 1;

    if (!external) {
      emitInternalClock(currentGlobalIndex, pulseNumber, patternStep.length);
    }

    if (justStarted) {
      emitStepStart(currentGlobalIndex);
    }

    if (gateMode === "multi") {
      emitGatePulse(currentGlobalIndex, pulseMs() * 0.6, "multi-pulse");
    }

    setStatus(`${clockSource === "external" ? "External" : "Running"} · ${String(currentGlobalIndex + 1).padStart(2, "0")} · ${pulseNumber}/${patternStep.length}`);

    pulseInStep += 1;
    if (pulseInStep >= patternStep.length) {
      currentGlobalIndex = null;
      pulseInStep = 0;
      advanceCursor();
    }
  }

  function stopInternalTimer() {
    window.clearInterval(pulseTimer);
    pulseTimer = null;
  }

  function startInternalTimer() {
    stopInternalTimer();
    if (!running || clockSource !== "internal") return;
    tick();
    pulseTimer = window.setInterval(() => tick(), pulseMs());
  }

  function stop() {
    running = false;
    stopInternalTimer();
    forceCloseOpenGate("transport-stop");
    currentGlobalIndex = null;
    pulseInStep = 0;
    setStatus("Stopped");
  }

  function run() {
    if (running) return;
    running = true;

    if (clockSource === "internal") {
      setStatus("Running");
      startInternalTimer();
    } else {
      setStatus("External · armed");
    }
  }

  function reset({ emit = true } = {}) {
    const wasRunning = running;
    resetTraversal();
    const globalIndex = currentPlayRange().start + playCursor;
    const payload = {
      step: globalIndex + 1,
      visibleStep: visibleIndexForGlobalIndex(globalIndex) + 1,
      bank: bankLabel(bankForGlobalIndex(globalIndex)),
      playRange: playRangeLabel(),
      direction: directionMode,
    };

    if (emit) send("reset", payload);
    setStatus(wasRunning ? (clockSource === "external" ? "External · armed" : "Running") : "Stopped");
  }

  function manualStep() {
    if (running) return;

    const globalIndex = selectPlayableGlobalIndex();
    if (globalIndex === null) {
      setStatus("All steps skipped");
      return;
    }

    currentGlobalIndex = globalIndex;
    pulseInStep = 0;
    showGlobalStep(globalIndex);
    emitStepStart(globalIndex);
    if (gateMode === "multi") emitGatePulse(globalIndex, pulseMs() * 0.6, "manual-multi");
    setStatus(`Manual · ${String(globalIndex + 1).padStart(2, "0")}`);

    currentGlobalIndex = null;
    advanceCursor();
  }

  function restartClockIfRunning() {
    if (!running || clockSource !== "internal") return;
    startInternalTimer();
  }

  function setActiveBank(nextBank) {
    if (nextBank === activeBank) return;

    if (running) stop();
    saveVisibleBank();
    activeBank = nextBank;
    renderVisibleBank();
    setStatus(`Bank ${bankLabel(activeBank)} selected`);
  }

  function setActivePlayRange(nextRange) {
    if (!PLAY_RANGES[nextRange] || nextRange === activePlayRange) return;

    saveVisibleBank();
    activePlayRange = nextRange;
    updatePlayRangeButtons();
    resetTraversal();

    if (running && clockSource === "internal") startInternalTimer();
    setStatus(running ? (clockSource === "external" ? "External · armed" : "Running") : `Play Range ${playRangeLabel()} selected`);
  }

  function setDirection(nextDirection) {
    if (!DIRECTION_LABELS.map((label) => label.toLowerCase().replace("ping-pong", "pingpong")).includes(nextDirection)) return;
    directionMode = nextDirection;
    updateDirectionButtons();
    resetTraversal();

    if (running && clockSource === "internal") startInternalTimer();
    setStatus(running ? (clockSource === "external" ? "External · armed" : "Running") : `Direction ${nextDirection}`);
  }

  function setGateMode(nextGateMode) {
    if (nextGateMode !== "single" && nextGateMode !== "multi") return;
    gateMode = nextGateMode;
    forceCloseOpenGate("gate-mode-change");
    updateGateModeButtons();
    setStatus(running ? (clockSource === "external" ? "External · armed" : "Running") : `Gate ${gateMode}`);
  }

  function setClockSource(nextClockSource) {
    if (nextClockSource !== "internal" && nextClockSource !== "external") return;
    if (clockSource === nextClockSource) return;

    clockSource = nextClockSource;
    stopInternalTimer();
    forceCloseOpenGate("clock-source-change");
    currentGlobalIndex = null;
    pulseInStep = 0;
    updateClockSourceButtons();

    if (running && clockSource === "internal") {
      startInternalTimer();
    } else {
      setStatus(running ? "External · armed" : `Clock ${clockSource}`);
    }
  }

  function isAddressedToSequencer(message) {
    const target = message?.target ?? message?.payload?.target;
    return target === MODULE_ID || target === "*";
  }

  function handleIncoming(message) {
    if (!message || message.protocol !== PROTOCOL || message.source === MODULE_ID) return;
    if (!isAddressedToSequencer(message)) return;

    if (message.type === "clock") {
      if (running && clockSource === "external") tick({ external: true });
      return;
    }

    if (message.type === "reset") {
      reset({ emit: false });
      return;
    }

    if (message.type === "transport") {
      const action = String(message.payload?.action || "").toLowerCase();
      if (action === "run") run();
      if (action === "stop") stop();
      if (action === "reset") reset({ emit: false });
      return;
    }

    if (message.type === "transpose") {
      const semitones = Number(message.payload?.semitones);
      if (Number.isFinite(semitones)) {
        transposeSemitones = Math.max(-48, Math.min(48, semitones));
        setStatus(`Transpose ${transposeSemitones >= 0 ? "+" : ""}${transposeSemitones}`);
      }
    }
  }

  editBankButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      editBankButtons.forEach((bankButton) => bankButton.classList.remove("active"));
      button.classList.add("active");
      setActiveBank(index);
    });
  });

  playRangeButtons.forEach((button, index) => {
    button.addEventListener("click", () => setActivePlayRange(index));
  });

  directionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const next = button.textContent.trim().toLowerCase().replace("ping-pong", "pingpong");
      setDirection(next);
    });
  });

  gateModeButtons.forEach((button) => {
    button.addEventListener("click", () => setGateMode(button.textContent.trim().toLowerCase()));
  });

  clockButtons.forEach((button) => {
    const label = button.textContent.trim().toLowerCase();
    if (label === "internal" || label === "external") {
      button.addEventListener("click", () => setClockSource(label));
    }
  });

  transportButtons.forEach((button) => {
    const label = button.textContent.trim().toLowerCase();
    if (label === "run") button.addEventListener("click", run);
    if (label === "stop") button.addEventListener("click", stop);
    if (label === "reset") button.addEventListener("click", reset);
    if (label === "manual step") button.addEventListener("click", manualStep);
  });

  clockRateInput?.addEventListener("input", restartClockIfRunning);

  steps.forEach((step, index) => {
    getPitchInput(step)?.addEventListener("input", () => saveVisibleStep(index));
    getLengthInput(step)?.addEventListener("input", () => {
      saveVisibleStep(index);
      const globalIndex = visibleBankStart() + index;
      if (globalIndex === currentGlobalIndex) setLengthCode(pattern[globalIndex].length);
    });

    getStatusButtons(step).forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("active");
        saveVisibleStep(index);
      });
    });

    getGateButton(step)?.addEventListener("click", () => {
      saveVisibleStep(index);
      const globalIndex = visibleBankStart() + index;
      const range = currentPlayRange();
      const isInRange = globalIndex >= range.start && globalIndex < range.start + range.length;

      if (isInRange) playCursor = globalIndex - range.start;
      showGlobalStep(globalIndex);
      emitStepStart(globalIndex);
      if (gateMode === "multi") emitGatePulse(globalIndex, pulseMs() * 0.6, "preview-multi");
      setStatus(`Preview · ${String(globalIndex + 1).padStart(2, "0")}`);
    });
  });

  channel?.addEventListener("message", (event) => handleIncoming(event.data));
  window.addEventListener(CHANNEL, (event) => handleIncoming(event.detail));

  updatePlayRangeButtons();
  updateDirectionButtons();
  updateGateModeButtons();
  updateClockSourceButtons();
  resetTraversal();
  renderVisibleBank();
  setStatus("Stopped");
})();
