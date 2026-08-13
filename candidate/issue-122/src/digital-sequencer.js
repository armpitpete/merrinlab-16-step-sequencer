(function () {
  'use strict';

  const MODULE_ID = 'merrinlab-16-step-sequencer';
  const CHANNEL = 'merrinlab-patch-bus';
  const PROTOCOL = 'merrinlab.patch.v0.1';
  const STAGE2B_EVENT = 'merrinlab-sequencer-stage2b-state';
  const STEPS_PER_BANK = 16;
  const TOTAL_STEPS = 32;
  const PLAY_RANGES = [
    { label: 'A', start: 0, length: 16 },
    { label: 'B', start: 16, length: 16 },
    { label: 'A+B', start: 0, length: 32 },
  ];
  const STATUS_KEYS = ['mute', 'skip', 'accent', 'glide'];
  const DIRECTION_LABELS = ['Forward', 'Reverse', 'Ping-Pong', 'Random'];
  const ROOT_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const SCALES = {
    chromatic: { label: 'Chromatic', intervals: [0,1,2,3,4,5,6,7,8,9,10,11] },
    major: { label: 'Major', intervals: [0,2,4,5,7,9,11] },
    naturalMinor: { label: 'Natural Minor', intervals: [0,2,3,5,7,8,10] },
    majorPentatonic: { label: 'Major Pentatonic', intervals: [0,2,4,7,9] },
    minorPentatonic: { label: 'Minor Pentatonic', intervals: [0,3,5,7,10] },
  };

  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL) : null;

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

  const steps = Array.from(document.querySelectorAll('.step'));
  const statusStrip = document.querySelector('.status-strip');
  const statusValues = Array.from(statusStrip?.querySelectorAll('strong') || []);
  const currentStepReadout = statusValues[0];
  const currentBankReadout = statusValues[1];
  const statusReadout = statusValues[2];
  const lengthCodeBits = Array.from(document.querySelectorAll('.led-code .bit i'));
  const transportButtons = Array.from(document.querySelectorAll('.transport button'));
  const clockRateInput = document.querySelector(".clock input[type='range']");

  function findControlBlock(title) {
    return Array.from(document.querySelectorAll('.control-block')).find((block) => {
      return block.querySelector('h2')?.textContent.trim().toLowerCase() === title.toLowerCase();
    });
  }

  const editBankBlock = findControlBlock('Edit Bank');
  const editBankButtons = editBankBlock ? Array.from(editBankBlock.querySelectorAll('button')) : [];
  const playRangeBlock = findControlBlock('Play Range');
  const playRangeButtons = playRangeBlock ? Array.from(playRangeBlock.querySelectorAll('button')) : [];
  const clockBlock = findControlBlock('Clock');
  const clockButtons = clockBlock ? Array.from(clockBlock.querySelectorAll('button')) : [];
  const clockSourceButtons = clockButtons.filter((button) => ['internal', 'external'].includes(button.textContent.trim().toLowerCase()));
  const pitchModeButtons = clockButtons.filter((button) => ['normal', 'quantized'].includes(button.textContent.trim().toLowerCase()));
  const gateModeBlock = findControlBlock('Gate Mode');
  const gateModeButtons = gateModeBlock ? Array.from(gateModeBlock.querySelectorAll('button')) : [];
  const directionBlock = findControlBlock('Direction');

  function ensureDirectionButtons() {
    if (!directionBlock) return [];
    const row = directionBlock.querySelector('.button-row');
    if (!row) return [];
    const existingLabels = new Set(Array.from(row.querySelectorAll('button')).map((button) => button.textContent.trim()));
    DIRECTION_LABELS.forEach((label) => {
      if (existingLabels.has(label)) return;
      const button = document.createElement('button');
      button.className = 'toggle';
      button.type = 'button';
      button.textContent = label;
      row.appendChild(button);
    });
    const note = directionBlock.querySelector('p');
    if (note) note.textContent = 'Changes direction from the current position; Reset chooses the direction-specific start.';
    return Array.from(row.querySelectorAll('button'));
  }

  const directionButtons = ensureDirectionButtons();

  if (clockBlock) {
    let note = clockBlock.querySelector('[data-functional-boundary]');
    if (!note) {
      note = document.createElement('p');
      note.dataset.functionalBoundary = 'clock';
      clockBlock.appendChild(note);
    }
    note.textContent = 'Internal / External and Normal / Quantized are functional. Swing affects internal clock only.';
  }

  const modeCard = document.querySelector('.mode-card');
  const modeCardNote = modeCard?.querySelector('p');
  if (modeCardNote) {
    modeCardNote.textContent = 'Mode selector is retained as a design reference; the active engine uses the Digital/Clean behaviour.';
  }
  modeCard?.querySelectorAll('button').forEach((button) => {
    const isClean = button.textContent.trim().toLowerCase() === 'clean';
    button.classList.toggle('active', isClean);
    button.setAttribute('aria-disabled', 'true');
  });

  function createControlMonitor() {
    if (!statusStrip || document.querySelector('[data-control-monitor]')) return {};
    const section = document.createElement('section');
    section.dataset.controlMonitor = 'true';
    section.setAttribute('aria-label', 'Control output monitor');
    section.innerHTML = `
      <h2 class="section-title">Control Monitor</h2>
      <p class="subtitle">Shows sequencer control output without requiring a connected synth.</p>
      <div class="status-strip">
        <div><span class="label">Step</span><strong data-monitor="step">01</strong></div>
        <div><span class="label">Step state</span><strong data-monitor="state">READY</strong></div>
        <div><span class="label">Gate</span><strong data-monitor="gate">CLOSED</strong></div>
        <div><span class="label">Triggers</span><strong data-monitor="triggers">0</strong></div>
        <div><span class="label">Accent</span><strong data-monitor="accent">OFF</strong></div>
        <div><span class="label">Glide</span><strong data-monitor="glide">OFF</strong></div>
        <div><span class="label">Pitch CV</span><strong data-monitor="pitch">0.00</strong></div>
        <div><span class="label">Gate mode</span><strong data-monitor="mode">SINGLE</strong></div>
      </div>`;
    statusStrip.insertAdjacentElement('afterend', section);
    const refs = {};
    section.querySelectorAll('[data-monitor]').forEach((node) => {
      refs[node.dataset.monitor] = node;
    });
    return refs;
  }

  const monitor = createControlMonitor();
  let monitorTriggerCount = 0;

  function setMonitor(key, value) {
    if (monitor[key]) monitor[key].textContent = String(value);
  }

  function monitorStatusToggle(globalIndex, key, active) {
    setMonitor('step', String(globalIndex + 1).padStart(2, '0'));
    setMonitor('state', `${key.toUpperCase()} ${active ? 'ON' : 'OFF'}`);
  }

  let activeBank = 0;
  let activePlayRange = 0;
  let playCursor = 0;
  let directionMode = 'forward';
  let pingPongDirection = 1;
  let gateMode = 'single';
  let clockSource = 'internal';
  let transposeSemitones = 0;
  let pitchMode = 'normal';
  let quantizeRoot = 0;
  let quantizeScale = 'major';
  let swingPercent = 50;

  let running = false;
  let pulseTimer = null;
  let currentGlobalIndex = null;
  let pulseInStep = 0;
  let openGateGlobalIndex = null;
  let lastExternalClockTime = null;
  let externalPulseMs = null;

  let internalPulseIndex = 0;
  let lastInternalPulseIndex = null;
  let lastInternalTickAt = null;
  let currentScheduledIntervalMs = null;
  let activePulseDurationMs = null;
  let lastPitchState = {
    rawPitch: null,
    outputPitch: null,
    sourcePitch: null,
    pitchMode,
  };

  const gateTimers = new Set();
  const stage2BListeners = new Set();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getPitchInput(step) {
    return step.querySelector('label:nth-of-type(1) input');
  }

  function getLengthInput(step) {
    return step.querySelector('label:nth-of-type(2) input');
  }

  function getGateButton(step) {
    return Array.from(step.children).find((child) => child.tagName === 'BUTTON') || null;
  }

  function getStatusButtons(step) {
    return Array.from(step.querySelectorAll('.step-status button'));
  }

  function getStepPitch(step) {
    return clamp(Number(getPitchInput(step)?.value || 60), 0, 127);
  }

  function getStepLength(step) {
    return clamp(Number(getLengthInput(step)?.value || 4), 1, 16);
  }

  function readStatusState(step) {
    const state = { mute: false, skip: false, accent: false, glide: false };
    getStatusButtons(step).forEach((button, index) => {
      const key = STATUS_KEYS[index];
      if (key) state[key] = button.classList.contains('active');
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

  function bankForGlobalIndex(globalIndex) {
    return Math.floor(globalIndex / STEPS_PER_BANK);
  }

  function visibleIndexForGlobalIndex(globalIndex) {
    return globalIndex % STEPS_PER_BANK;
  }

  function bankLabel(bankIndex) {
    return bankIndex === 0 ? 'A' : 'B';
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

  function pulseDurationForIndex(index) {
    const base = pulseMs();
    const swing = clamp(Number(swingPercent) || 50, 50, 75) / 100;
    if (swing <= 0.5) return base;
    return index % 2 === 0 ? base * 2 * swing : base * 2 * (1 - swing);
  }

  function stepDurationForInternal(length, startPulseIndex) {
    let duration = 0;
    for (let offset = 0; offset < length; offset += 1) {
      duration += pulseDurationForIndex(startPulseIndex + offset);
    }
    return duration;
  }

  function currentPulseMs() {
    if (clockSource === 'external' && externalPulseMs !== null) return externalPulseMs;
    if (clockSource === 'internal' && activePulseDurationMs !== null) return activePulseDurationMs;
    return pulseMs();
  }

  function pitchToCv(midiPitch) {
    return (midiPitch - 60) / 12;
  }

  function pitchClassAllowed(pitch, root, scaleKey) {
    const scale = SCALES[scaleKey] || SCALES.major;
    const pitchClass = ((pitch - root) % 12 + 12) % 12;
    return scale.intervals.includes(pitchClass);
  }

  function quantizePitch(rawPitch) {
    const pitch = clamp(Math.round(rawPitch), 0, 127);
    if (pitchClassAllowed(pitch, quantizeRoot, quantizeScale)) return pitch;
    for (let distance = 1; distance <= 12; distance += 1) {
      const down = pitch - distance;
      if (down >= 0 && pitchClassAllowed(down, quantizeRoot, quantizeScale)) return down;
      const up = pitch + distance;
      if (up <= 127 && pitchClassAllowed(up, quantizeRoot, quantizeScale)) return up;
    }
    return pitch;
  }

  function setStatus(text) {
    if (statusReadout) statusReadout.textContent = text;
  }

  function setLengthCode(length) {
    const code = clamp(length - 1, 0, 15);
    [8, 4, 2, 1].forEach((weight, index) => {
      lengthCodeBits[index]?.classList.toggle('on', Boolean(code & weight));
    });
  }

  function saveVisibleStep(visibleIndex) {
    const step = steps[visibleIndex];
    const patternIndex = visibleBankStart() + visibleIndex;
    if (!step || !pattern[patternIndex]) return;
    pattern[patternIndex] = {
      ...pattern[patternIndex],
      pitch: getStepPitch(step),
      length: getStepLength(step),
      ...readStatusState(step),
    };
  }

  function saveVisibleBank() {
    steps.forEach((_, index) => saveVisibleStep(index));
  }

  function renderVisibleBank() {
    const bankStart = visibleBankStart();
    steps.forEach((step, visibleIndex) => {
      const patternStep = pattern[bankStart + visibleIndex];
      const globalIndex = bankStart + visibleIndex;
      const heading = step.querySelector('h3');
      const pitchInput = getPitchInput(step);
      const lengthInput = getLengthInput(step);
      if (heading) heading.textContent = String(globalIndex + 1).padStart(2, '0');
      if (pitchInput) pitchInput.value = patternStep.pitch;
      if (lengthInput) lengthInput.value = patternStep.length;
      getStatusButtons(step).forEach((button, statusIndex) => {
        const key = STATUS_KEYS[statusIndex];
        button.classList.toggle('active', Boolean(key && patternStep[key]));
      });
    });
    const previewIndex = currentGlobalIndex ?? currentPlayRange().start + playCursor;
    showGlobalStep(previewIndex);
  }

  function updatePlayRangeButtons() {
    playRangeButtons.forEach((button, index) => {
      button.classList.toggle('active', index === activePlayRange);
    });
  }

  function updateDirectionButtons() {
    directionButtons.forEach((button) => {
      const mode = button.textContent.trim().toLowerCase().replace('ping-pong', 'pingpong');
      button.classList.toggle('active', mode === directionMode);
    });
  }

  function updateGateModeButtons() {
    gateModeButtons.forEach((button) => {
      button.classList.toggle('active', button.textContent.trim().toLowerCase() === gateMode);
    });
    setMonitor('mode', gateMode.toUpperCase());
  }

  function updateClockSourceButtons() {
    clockSourceButtons.forEach((button) => {
      const label = button.textContent.trim().toLowerCase();
      button.classList.toggle('active', label === clockSource);
    });
  }

  function updatePitchModeButtons() {
    pitchModeButtons.forEach((button) => {
      const label = button.textContent.trim().toLowerCase();
      button.classList.toggle('active', label === pitchMode);
    });
  }

  function showGlobalStep(globalIndex) {
    if (!Number.isInteger(globalIndex) || globalIndex < 0 || globalIndex >= TOTAL_STEPS) return;
    const visibleIndex = visibleIndexForGlobalIndex(globalIndex);
    const playbackBank = bankForGlobalIndex(globalIndex);
    steps.forEach((step, stepIndex) => {
      const isActive = playbackBank === activeBank && stepIndex === visibleIndex;
      step.classList.toggle('active', isActive);
      step.querySelector('.step-led')?.classList.toggle('on', isActive);
    });
    if (currentStepReadout) currentStepReadout.textContent = String(globalIndex + 1).padStart(2, '0');
    if (currentBankReadout) currentBankReadout.textContent = bankLabel(playbackBank);
    const patternStep = pattern[globalIndex];
    if (patternStep) setLengthCode(patternStep.length);
  }

  function clearGateTimers() {
    gateTimers.forEach((timer) => window.clearTimeout(timer));
    gateTimers.clear();
  }

  function closeGate(globalIndex, reason = 'close') {
    if (openGateGlobalIndex === globalIndex) openGateGlobalIndex = null;
    setMonitor('gate', 'CLOSED');
    send('gate', {
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
    if (openGateGlobalIndex === null) {
      setMonitor('gate', 'CLOSED');
      return;
    }
    const globalIndex = openGateGlobalIndex;
    openGateGlobalIndex = null;
    closeGate(globalIndex, reason);
  }

  function emitGatePulse(globalIndex, durationMs, reason) {
    const patternStep = pattern[globalIndex];
    if (!patternStep || patternStep.mute) {
      setMonitor('gate', 'MUTED');
      return;
    }
    if (openGateGlobalIndex !== null) forceCloseOpenGate('retrigger');
    monitorTriggerCount += 1;
    setMonitor('triggers', monitorTriggerCount);
    setMonitor('gate', 'OPEN');
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
    send('gate', { ...payload, open: true });
    send('trigger', payload);
    scheduleGateClose(globalIndex, durationMs, reason);
  }

  function stage2BState(extra = {}) {
    const scale = SCALES[quantizeScale] || SCALES.major;
    return {
      swingPercent,
      pitchMode,
      quantizeRoot,
      quantizeRootName: ROOT_NAMES[quantizeRoot],
      quantizeScale,
      quantizeScaleLabel: scale.label,
      clockSource,
      bpm: Number(clockRateInput?.value || 120),
      pulseDurationMs: activePulseDurationMs ?? pulseMs(),
      swingPhase: clockSource === 'external'
        ? 'external'
        : ((lastInternalPulseIndex ?? internalPulseIndex) % 2 === 0 ? 'long' : 'short'),
      rawPitch: lastPitchState.rawPitch,
      outputPitch: lastPitchState.outputPitch,
      sourcePitch: lastPitchState.sourcePitch,
      ...extra,
    };
  }

  function notifyStage2B(extra = {}) {
    const snapshot = stage2BState(extra);
    stage2BListeners.forEach((listener) => {
      try { listener(snapshot); } catch (_) {}
    });
    window.dispatchEvent(new CustomEvent(STAGE2B_EVENT, { detail: snapshot }));
  }

  function emitStepStart(globalIndex, timing = {}) {
    const patternStep = pattern[globalIndex];
    if (!patternStep) return;

    const rawPitch = clamp(patternStep.pitch + transposeSemitones, 0, 127);
    const snappedPitch = quantizePitch(rawPitch);
    const outputPitch = pitchMode === 'quantized' ? snappedPitch : rawPitch;
    const cv = pitchToCv(outputPitch);

    const pulseDurationMs = Number(timing.pulseDurationMs) > 0 ? Number(timing.pulseDurationMs) : currentPulseMs();
    let stepDurationMs = Number(timing.stepDurationMs);
    if (!(stepDurationMs > 0)) {
      stepDurationMs = clockSource === 'internal'
        ? stepDurationForInternal(patternStep.length, internalPulseIndex)
        : currentPulseMs() * patternStep.length;
    }

    const common = {
      step: globalIndex + 1,
      visibleStep: visibleIndexForGlobalIndex(globalIndex) + 1,
      bank: bankLabel(bankForGlobalIndex(globalIndex)),
      playRange: playRangeLabel(),
      clockSource,
      pulseDurationMs,
      stepDurationMs,
      swingPercent: clockSource === 'internal' ? swingPercent : 50,
      swingPhase: timing.swingPhase || (clockSource === 'external' ? 'external' : 'straight'),
    };

    lastPitchState = {
      rawPitch,
      outputPitch,
      sourcePitch: patternStep.pitch,
      pitchMode,
    };

    monitorTriggerCount = 0;
    setMonitor('step', String(globalIndex + 1).padStart(2, '0'));
    setMonitor('state', patternStep.mute ? 'MUTED' : 'PLAY');
    setMonitor('gate', patternStep.mute ? 'MUTED' : 'CLOSED');
    setMonitor('triggers', 0);
    setMonitor('accent', patternStep.accent ? 'ON' : 'OFF');
    setMonitor('glide', patternStep.glide ? 'ON' : 'OFF');
    setMonitor('pitch', `${cv >= 0 ? '+' : ''}${cv.toFixed(2)}`);

    send('step-index', common);
    send('pitch-cv', {
      ...common,
      value: cv,
      pitch: outputPitch,
      rawPitch,
      sourcePitch: patternStep.pitch,
      transposeSemitones,
      pitchMode,
      quantized: pitchMode === 'quantized',
      quantizeRoot: ROOT_NAMES[quantizeRoot],
      quantizeScale: (SCALES[quantizeScale] || SCALES.major).label,
      glide: patternStep.glide,
    });
    send('accent', { ...common, active: patternStep.accent });

    if (gateMode === 'single') {
      emitGatePulse(globalIndex, stepDurationMs * 0.85, 'single-step');
    }

    notifyStage2B({ pulseDurationMs, rawPitch, outputPitch, sourcePitch: patternStep.pitch });
  }

  function resetTraversal() {
    const range = currentPlayRange();
    currentGlobalIndex = null;
    pulseInStep = 0;
    pingPongDirection = 1;
    playCursor = directionMode === 'reverse' ? range.length - 1 : 0;
    forceCloseOpenGate('traversal-reset');
    showGlobalStep(range.start + playCursor);
  }

  function advanceCursor() {
    const range = currentPlayRange();
    if (range.length <= 1) {
      playCursor = 0;
      return;
    }
    if (directionMode === 'reverse') {
      playCursor = (playCursor - 1 + range.length) % range.length;
      return;
    }
    if (directionMode === 'pingpong') {
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
    if (directionMode === 'random') {
      playCursor = Math.floor(Math.random() * range.length);
      return;
    }
    playCursor = (playCursor + 1) % range.length;
  }

  function selectPlayableGlobalIndex() {
    const range = currentPlayRange();
    if (directionMode === 'random') {
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
      setMonitor('step', String(globalIndex + 1).padStart(2, '0'));
      setMonitor('state', 'SKIPPED');
      advanceCursor();
    }
    return null;
  }

  function emitInternalClock(globalIndex, pulseNumber, stepLength, timing) {
    send('clock', {
      step: globalIndex + 1,
      visibleStep: visibleIndexForGlobalIndex(globalIndex) + 1,
      bank: bankLabel(bankForGlobalIndex(globalIndex)),
      playRange: playRangeLabel(),
      pulse: pulseNumber,
      stepLength,
      bpm: Number(clockRateInput?.value || 120),
      subdivision: '1/16',
      pulseDurationMs: timing.pulseDurationMs,
      swingPercent,
      swingPhase: timing.swingPhase,
      pairDurationMs: pulseMs() * 2,
    });
  }

  function tick({ external = false, pulseDurationMs: requestedPulseMs = null, pulseIndex = null } = {}) {
    if (!running) return;

    const pulseDurationMs = external
      ? currentPulseMs()
      : (Number(requestedPulseMs) > 0 ? Number(requestedPulseMs) : pulseDurationForIndex(Number.isInteger(pulseIndex) ? pulseIndex : internalPulseIndex));

    activePulseDurationMs = pulseDurationMs;

    let justStarted = false;
    if (currentGlobalIndex === null) {
      currentGlobalIndex = selectPlayableGlobalIndex();
      if (currentGlobalIndex === null) {
        setStatus('All steps skipped');
        setMonitor('state', 'ALL SKIPPED');
        return;
      }
      pulseInStep = 0;
      justStarted = true;
      showGlobalStep(currentGlobalIndex);
    }

    const patternStep = pattern[currentGlobalIndex];
    const pulseNumber = pulseInStep + 1;
    const effectivePulseIndex = Number.isInteger(pulseIndex) ? pulseIndex : internalPulseIndex;
    const swingPhase = external ? 'external' : (swingPercent === 50 ? 'straight' : (effectivePulseIndex % 2 === 0 ? 'long' : 'short'));

    if (!external) {
      emitInternalClock(currentGlobalIndex, pulseNumber, patternStep.length, {
        pulseDurationMs,
        swingPhase,
      });
    }

    if (justStarted) {
      const stepDurationMs = external
        ? pulseDurationMs * patternStep.length
        : stepDurationForInternal(patternStep.length, effectivePulseIndex);
      emitStepStart(currentGlobalIndex, { pulseDurationMs, stepDurationMs, swingPhase });
    }

    if (gateMode === 'multi') {
      emitGatePulse(currentGlobalIndex, pulseDurationMs * 0.6, 'multi-pulse');
    }

    setStatus(
      `${clockSource === 'external' ? 'External' : 'Running'} · ${String(currentGlobalIndex + 1).padStart(2, '0')} · ${pulseNumber}/${patternStep.length}`
    );

    notifyStage2B({ pulseDurationMs, swingPhase });

    pulseInStep += 1;
    if (pulseInStep >= patternStep.length) {
      currentGlobalIndex = null;
      pulseInStep = 0;
      advanceCursor();
    }
  }

  function stopInternalTimer() {
    window.clearTimeout(pulseTimer);
    pulseTimer = null;
    currentScheduledIntervalMs = null;
  }

  function scheduleNextInternalPulse(delayMs) {
    window.clearTimeout(pulseTimer);
    currentScheduledIntervalMs = Math.max(10, delayMs);
    pulseTimer = window.setTimeout(runInternalPulse, currentScheduledIntervalMs);
  }

  function runInternalPulse() {
    if (!running || clockSource !== 'internal') return;
    const pulseIndex = internalPulseIndex;
    const duration = pulseDurationForIndex(pulseIndex);
    lastInternalTickAt = performance.now();
    lastInternalPulseIndex = pulseIndex;
    activePulseDurationMs = duration;
    tick({ external: false, pulseDurationMs: duration, pulseIndex });
    internalPulseIndex += 1;
    if (running && clockSource === 'internal') scheduleNextInternalPulse(duration);
  }

  function startInternalTimer({ immediate = true, resetPhase = false } = {}) {
    stopInternalTimer();
    if (!running || clockSource !== 'internal') return;
    if (resetPhase) {
      internalPulseIndex = 0;
      lastInternalPulseIndex = null;
      lastInternalTickAt = null;
    }
    if (immediate) {
      runInternalPulse();
    } else {
      const previousIndex = lastInternalPulseIndex ?? Math.max(0, internalPulseIndex - 1);
      scheduleNextInternalPulse(pulseDurationForIndex(previousIndex));
    }
  }

  function rescheduleInternalTimer() {
    if (!running || clockSource !== 'internal' || pulseTimer === null || lastInternalTickAt === null || lastInternalPulseIndex === null) {
      notifyStage2B();
      return;
    }

    const now = performance.now();
    const oldDuration = Math.max(10, currentScheduledIntervalMs || pulseDurationForIndex(lastInternalPulseIndex));
    const elapsed = Math.max(0, now - lastInternalTickAt);
    const progress = clamp(elapsed / oldDuration, 0, 0.99);
    const newDuration = pulseDurationForIndex(lastInternalPulseIndex);
    const remaining = Math.max(10, newDuration * (1 - progress));
    scheduleNextInternalPulse(remaining);
    currentScheduledIntervalMs = newDuration;
    notifyStage2B({ pulseDurationMs: newDuration });
  }

  function stop() {
    running = false;
    stopInternalTimer();
    forceCloseOpenGate('transport-stop');
    currentGlobalIndex = null;
    pulseInStep = 0;
    internalPulseIndex = 0;
    lastInternalPulseIndex = null;
    lastInternalTickAt = null;
    activePulseDurationMs = null;
    setStatus('Stopped');
    notifyStage2B({ swingPhase: 'stopped' });
  }

  function run() {
    if (running) return;
    running = true;
    if (clockSource === 'internal') {
      internalPulseIndex = 0;
      lastInternalPulseIndex = null;
      lastInternalTickAt = null;
      setStatus('Running');
      startInternalTimer({ immediate: true });
    } else {
      setStatus('External · armed');
      notifyStage2B({ swingPhase: 'external' });
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
    if (emit) send('reset', payload);
    setMonitor('step', String(globalIndex + 1).padStart(2, '0'));
    setMonitor('state', 'RESET');
    setStatus(wasRunning ? (clockSource === 'external' ? 'External · armed' : 'Running') : 'Stopped');
  }

  function manualStep() {
    if (running) return;
    const globalIndex = selectPlayableGlobalIndex();
    if (globalIndex === null) {
      setStatus('All steps skipped');
      setMonitor('state', 'ALL SKIPPED');
      return;
    }
    currentGlobalIndex = globalIndex;
    pulseInStep = 0;
    showGlobalStep(globalIndex);
    const patternStep = pattern[globalIndex];
    const manualPulseIndex = internalPulseIndex;
    const manualPulseMs = clockSource === 'internal' ? pulseDurationForIndex(manualPulseIndex) : currentPulseMs();
    const manualStepMs = clockSource === 'internal'
      ? stepDurationForInternal(patternStep.length, manualPulseIndex)
      : manualPulseMs * patternStep.length;
    emitStepStart(globalIndex, {
      pulseDurationMs: manualPulseMs,
      stepDurationMs: manualStepMs,
      swingPhase: clockSource === 'internal' && swingPercent !== 50 ? (manualPulseIndex % 2 === 0 ? 'long' : 'short') : (clockSource === 'external' ? 'external' : 'straight'),
    });
    if (gateMode === 'multi') {
      emitGatePulse(globalIndex, manualPulseMs * 0.6, 'manual-multi');
    }
    setStatus(`Manual · ${String(globalIndex + 1).padStart(2, '0')}`);
    currentGlobalIndex = null;
    advanceCursor();
  }

  function setActiveBank(nextBank) {
    if (nextBank === activeBank) return;
    saveVisibleBank();
    activeBank = nextBank;
    renderVisibleBank();
    if (!running) setStatus(`Edit Bank ${bankLabel(activeBank)} selected`);
  }

  function setActivePlayRange(nextRange) {
    if (!PLAY_RANGES[nextRange] || nextRange === activePlayRange) return;
    saveVisibleBank();
    activePlayRange = nextRange;
    updatePlayRangeButtons();
    resetTraversal();
    if (running && clockSource === 'internal') startInternalTimer();
    setStatus(running ? (clockSource === 'external' ? 'External · armed' : 'Running') : `Play Range ${playRangeLabel()} selected`);
  }

  function setDirection(nextDirection) {
    const allowed = DIRECTION_LABELS.map((label) => label.toLowerCase().replace('ping-pong', 'pingpong'));
    if (!allowed.includes(nextDirection) || nextDirection === directionMode) return;
    const previousDirection = directionMode;
    const range = currentPlayRange();
    if (nextDirection === 'pingpong') {
      if (playCursor <= 0) pingPongDirection = 1;
      else if (playCursor >= range.length - 1) pingPongDirection = -1;
      else pingPongDirection = previousDirection === 'reverse' ? -1 : 1;
    }
    directionMode = nextDirection;
    updateDirectionButtons();
    setStatus(running
      ? `${clockSource === 'external' ? 'External' : 'Running'} · direction ${nextDirection}`
      : `Direction ${nextDirection} · position preserved`);
  }

  function setGateMode(nextGateMode) {
    if (nextGateMode !== 'single' && nextGateMode !== 'multi') return;
    gateMode = nextGateMode;
    forceCloseOpenGate('gate-mode-change');
    updateGateModeButtons();
    monitorTriggerCount = 0;
    setMonitor('triggers', 0);
    setStatus(running
      ? (clockSource === 'external' ? 'External · armed' : `Running · Gate ${gateMode}`)
      : `Gate ${gateMode}`);
  }

  function setClockSource(nextClockSource) {
    if (!['internal', 'external'].includes(nextClockSource) || clockSource === nextClockSource) return;
    clockSource = nextClockSource;
    stopInternalTimer();
    forceCloseOpenGate('clock-source-change');
    currentGlobalIndex = null;
    pulseInStep = 0;
    lastExternalClockTime = null;
    externalPulseMs = null;
    activePulseDurationMs = null;
    updateClockSourceButtons();

    if (running && clockSource === 'internal') {
      internalPulseIndex = 0;
      lastInternalPulseIndex = null;
      lastInternalTickAt = null;
      startInternalTimer({ immediate: true });
    } else {
      setStatus(running ? 'External · armed' : `Clock ${clockSource}`);
      notifyStage2B({ swingPhase: clockSource === 'external' ? 'external' : 'stopped' });
    }
  }

  function setPitchMode(nextMode) {
    if (!['normal', 'quantized'].includes(nextMode) || pitchMode === nextMode) return;
    pitchMode = nextMode;
    updatePitchModeButtons();
    notifyStage2B();
  }

  function setSwingPercent(nextSwing) {
    const value = clamp(Math.round(Number(nextSwing) || 50), 50, 75);
    if (value === swingPercent) return;
    swingPercent = value;
    rescheduleInternalTimer();
    notifyStage2B();
  }

  function setQuantizeRoot(nextRoot) {
    const value = clamp(Math.round(Number(nextRoot) || 0), 0, 11);
    if (value === quantizeRoot) return;
    quantizeRoot = value;
    notifyStage2B();
  }

  function setQuantizeScale(nextScale) {
    if (!SCALES[nextScale] || nextScale === quantizeScale) return;
    quantizeScale = nextScale;
    notifyStage2B();
  }

  function isAddressedToSequencer(message) {
    const target = message?.target ?? message?.payload?.target;
    return target === MODULE_ID || target === '*';
  }

  function handleIncoming(message) {
    if (!message || message.protocol !== PROTOCOL || message.source === MODULE_ID) return;
    if (!isAddressedToSequencer(message)) return;

    if (message.type === 'clock') {
      if (running && clockSource === 'external') {
        const now = performance.now();
        if (lastExternalClockTime !== null) {
          const delta = now - lastExternalClockTime;
          if (delta >= 20 && delta <= 5000) externalPulseMs = delta;
        }
        lastExternalClockTime = now;
        activePulseDurationMs = externalPulseMs ?? pulseMs();
        tick({ external: true, pulseDurationMs: activePulseDurationMs });
      }
      return;
    }

    if (message.type === 'reset') {
      reset({ emit: false });
      return;
    }

    if (message.type === 'transport') {
      const action = String(message.payload?.action || '').toLowerCase();
      if (action === 'run') run();
      if (action === 'stop') stop();
      if (action === 'reset') reset({ emit: false });
      return;
    }

    if (message.type === 'transpose') {
      const semitones = Number(message.payload?.semitones);
      if (Number.isFinite(semitones)) {
        transposeSemitones = clamp(semitones, -48, 48);
        setStatus(`Transpose ${transposeSemitones >= 0 ? '+' : ''}${transposeSemitones}`);
      }
    }
  }

  editBankButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      editBankButtons.forEach((bankButton) => bankButton.classList.remove('active'));
      button.classList.add('active');
      setActiveBank(index);
    });
  });

  playRangeButtons.forEach((button, index) => {
    button.addEventListener('click', () => setActivePlayRange(index));
  });

  directionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.textContent.trim().toLowerCase().replace('ping-pong', 'pingpong');
      setDirection(next);
    });
  });

  gateModeButtons.forEach((button) => {
    button.addEventListener('click', () => setGateMode(button.textContent.trim().toLowerCase()));
  });

  clockSourceButtons.forEach((button) => {
    const label = button.textContent.trim().toLowerCase();
    button.addEventListener('click', () => setClockSource(label));
  });

  pitchModeButtons.forEach((button) => {
    const label = button.textContent.trim().toLowerCase();
    button.addEventListener('click', () => setPitchMode(label));
  });

  transportButtons.forEach((button) => {
    const label = button.textContent.trim().toLowerCase();
    if (label === 'run') button.addEventListener('click', run);
    if (label === 'stop') button.addEventListener('click', stop);
    if (label === 'reset') button.addEventListener('click', reset);
    if (label === 'manual step') button.addEventListener('click', manualStep);
  });

  clockRateInput?.addEventListener('input', rescheduleInternalTimer);

  steps.forEach((step, index) => {
    getPitchInput(step)?.addEventListener('input', () => saveVisibleStep(index));
    getLengthInput(step)?.addEventListener('input', () => {
      saveVisibleStep(index);
      const globalIndex = visibleBankStart() + index;
      if (globalIndex === currentGlobalIndex) setLengthCode(pattern[globalIndex].length);
    });

    getStatusButtons(step).forEach((button, statusIndex) => {
      button.addEventListener('click', () => {
        button.classList.toggle('active');
        saveVisibleStep(index);
        const key = STATUS_KEYS[statusIndex] || 'state';
        const globalIndex = visibleBankStart() + index;
        monitorStatusToggle(globalIndex, key, button.classList.contains('active'));
      });
    });

    getGateButton(step)?.addEventListener('click', () => {
      saveVisibleStep(index);
      const globalIndex = visibleBankStart() + index;
      const range = currentPlayRange();
      const isInRange = globalIndex >= range.start && globalIndex < range.start + range.length;
      if (isInRange) playCursor = globalIndex - range.start;
      showGlobalStep(globalIndex);
      const patternStep = pattern[globalIndex];
      const previewPulseIndex = internalPulseIndex;
      const previewPulseMs = clockSource === 'internal' ? pulseDurationForIndex(previewPulseIndex) : currentPulseMs();
      const previewStepMs = clockSource === 'internal'
        ? stepDurationForInternal(patternStep.length, previewPulseIndex)
        : previewPulseMs * patternStep.length;
      emitStepStart(globalIndex, {
        pulseDurationMs: previewPulseMs,
        stepDurationMs: previewStepMs,
        swingPhase: clockSource === 'internal' && swingPercent !== 50 ? (previewPulseIndex % 2 === 0 ? 'long' : 'short') : (clockSource === 'external' ? 'external' : 'straight'),
      });
      if (gateMode === 'multi') {
        emitGatePulse(globalIndex, previewPulseMs * 0.6, 'preview-multi');
      }
      setStatus(`Preview · ${String(globalIndex + 1).padStart(2, '0')}`);
    });
  });

  channel?.addEventListener('message', (event) => handleIncoming(event.data));
  window.addEventListener(CHANNEL, (event) => handleIncoming(event.detail));

  window.MerrinLabSequencerStage2B = {
    getState: () => stage2BState(),
    setSwingPercent,
    setPitchMode,
    setQuantizeRoot,
    setQuantizeScale,
    quantizePitch: (pitch) => {
      const raw = clamp(Number(pitch) || 0, 0, 127);
      return quantizePitch(raw);
    },
    subscribe(listener) {
      if (typeof listener !== 'function') return function () {};
      stage2BListeners.add(listener);
      listener(stage2BState());
      return function () {
        stage2BListeners.delete(listener);
      };
    },
    roots: ROOT_NAMES.slice(),
    scales: Object.fromEntries(Object.entries(SCALES).map(([key, value]) => [key, value.label])),
  };

  updatePlayRangeButtons();
  updateDirectionButtons();
  updateGateModeButtons();
  updateClockSourceButtons();
  updatePitchModeButtons();
  resetTraversal();
  renderVisibleBank();
  setMonitor('state', 'READY');
  setStatus('Stopped');
  notifyStage2B({ swingPhase: 'stopped' });
})();
