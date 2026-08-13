(function () {
  'use strict';

  if (window.__merrinlabExpressiveStage2A) return;
  window.__merrinlabExpressiveStage2A = true;

  const MODULE_ID = 'merrinlab-16-step-sequencer';
  const CHANNEL = 'merrinlab-patch-bus';
  const PROTOCOL = 'merrinlab.patch.v0.1';
  const STEP_COUNT = 32;
  const STEPS_PER_BANK = 16;

  const steps = Array.from(document.querySelectorAll('.step'));
  if (!steps.length) return;

  const state = Array.from({ length: STEP_COUNT }, function () {
    return { chance: 100, rest: false, ratchets: 1 };
  });

  const coreMirror = Array.from({ length: STEP_COUNT }, function () {
    return { length: 1, mute: false };
  });

  const messageResults = new WeakMap();
  const ratchetTimers = new Set();
  let visitSerial = 0;
  let currentVisit = null;
  let lastClockAt = null;
  let observedPulseMs = null;
  let expressiveTriggerCount = 0;
  let ratchetGateOpen = false;

  const NativeBroadcastChannel = window.BroadcastChannel;
  const nativePostMessage = NativeBroadcastChannel && NativeBroadcastChannel.prototype.postMessage;
  const nativeDispatchEvent = window.dispatchEvent.bind(window);
  const outputChannel = NativeBroadcastChannel ? new NativeBroadcastChannel(CHANNEL) : null;

  function findControlBlock(title) {
    return Array.from(document.querySelectorAll('.control-block')).find(function (block) {
      const heading = block.querySelector('h2');
      return heading && heading.textContent.trim().toLowerCase() === title.toLowerCase();
    });
  }

  const editBankBlock = findControlBlock('Edit Bank');
  const clockBlock = findControlBlock('Clock');
  const clockRateInput = clockBlock && clockBlock.querySelector("input[type='range']");

  function activeEditBank() {
    if (!editBankBlock) return 0;
    const buttons = Array.from(editBankBlock.querySelectorAll('button'));
    const active = buttons.findIndex(function (button) {
      return button.classList.contains('active');
    });
    return active === 1 ? 1 : 0;
  }

  function visibleGlobalIndex(visibleIndex) {
    return activeEditBank() * STEPS_PER_BANK + visibleIndex;
  }

  function readCoreVisibleBank() {
    const bank = activeEditBank();
    steps.forEach(function (step, visibleIndex) {
      const globalIndex = bank * STEPS_PER_BANK + visibleIndex;
      const lengthInput = step.querySelector("label:nth-of-type(2) input[type='range']");
      const muteButton = step.querySelector('.step-status button:nth-child(1)');
      coreMirror[globalIndex] = {
        length: Math.max(1, Math.min(16, Number(lengthInput && lengthInput.value) || 1)),
        mute: Boolean(muteButton && muteButton.classList.contains('active')),
      };
    });
  }

  readCoreVisibleBank();
  for (let index = STEPS_PER_BANK; index < STEP_COUNT; index += 1) {
    coreMirror[index] = { ...coreMirror[index - STEPS_PER_BANK] };
  }

  function basePulseMs() {
    if (observedPulseMs && observedPulseMs >= 20 && observedPulseMs <= 5000) return observedPulseMs;
    const bpm = Math.max(20, Number(clockRateInput && clockRateInput.value) || 120);
    return (60000 / bpm) / 4;
  }

  function stepPayload(globalIndex) {
    return {
      step: globalIndex + 1,
      visibleStep: (globalIndex % STEPS_PER_BANK) + 1,
      bank: globalIndex < STEPS_PER_BANK ? 'A' : 'B',
      playRange: currentVisit && currentVisit.playRange ? currentVisit.playRange : 'A+B',
    };
  }

  function customSend(type, payload) {
    const message = {
      protocol: PROTOCOL,
      source: MODULE_ID,
      type: type,
      time: performance.now(),
      payload: { ...payload, expressiveStage2A: true },
    };

    if (outputChannel && nativePostMessage) {
      nativePostMessage.call(outputChannel, message);
    }
    nativeDispatchEvent(new CustomEvent(CHANNEL, { detail: message }));
  }

  function clearRatchetTimers(reason) {
    ratchetTimers.forEach(function (timer) {
      window.clearTimeout(timer);
    });
    ratchetTimers.clear();

    if (ratchetGateOpen && currentVisit) {
      customSend('gate', {
        ...stepPayload(currentVisit.globalIndex),
        open: false,
        accent: Boolean(currentVisit.accent),
        glide: Boolean(currentVisit.glide),
        reason: reason || 'ratchet-cancel',
      });
    }
    ratchetGateOpen = false;
  }

  function coreMonitor(name, value) {
    const node = document.querySelector('[data-monitor="' + name + '"]');
    if (node) node.textContent = String(value);
  }

  function createExpressiveMonitor() {
    if (document.querySelector('[data-expressive-monitor]')) {
      return document.querySelector('[data-expressive-monitor]');
    }

    const anchor = document.querySelector('[data-control-monitor]') || document.querySelector('.status-strip');
    if (!anchor) return null;

    const section = document.createElement('section');
    section.dataset.expressiveMonitor = 'true';
    section.setAttribute('aria-label', 'Expressive sequencing monitor');
    section.innerHTML = `
      <h2 class="section-title">Expressive Monitor</h2>
      <p class="subtitle">Shows Chance, Rest and dedicated Ratchet decisions without requiring a connected synth.</p>
      <div class="status-strip expressive-status-strip">
        <div><span class="label">Step</span><strong data-expressive="step">01</strong></div>
        <div><span class="label">Chance</span><strong data-expressive="chance">100%</strong></div>
        <div><span class="label">Decision</span><strong data-expressive="decision">READY</strong></div>
        <div><span class="label">Ratchets</span><strong data-expressive="ratchets">1</strong></div>
        <div><span class="label">Express Triggers</span><strong data-expressive="triggers">0</strong></div>
      </div>`;
    anchor.insertAdjacentElement('afterend', section);
    return section;
  }

  const expressiveMonitor = createExpressiveMonitor();

  function expressiveReadout(name, value) {
    if (!expressiveMonitor) return;
    const node = expressiveMonitor.querySelector('[data-expressive="' + name + '"]');
    if (node) node.textContent = String(value);
  }

  function decisionLabel(visit) {
    if (!visit) return 'READY';
    if (visit.rest) return 'REST';
    if (!visit.chancePass) return 'CHANCE REST';
    if (visit.muted) return 'MUTED';
    return 'PLAY';
  }

  function syncVisitMonitor() {
    if (!currentVisit) return;
    expressiveReadout('step', String(currentVisit.globalIndex + 1).padStart(2, '0'));
    expressiveReadout('chance', currentVisit.chance + '%');
    expressiveReadout('decision', decisionLabel(currentVisit));
    expressiveReadout('ratchets', currentVisit.ratchets);
    expressiveReadout('triggers', expressiveTriggerCount);
  }

  function scheduleRatchets(visit) {
    if (!visit || visit.suppress || visit.muted || visit.ratchets <= 1) return;

    const token = visit.serial;
    const count = visit.ratchets;
    const duration = Math.max(40, basePulseMs() * visit.length);
    const interval = duration / count;
    const gateDuration = Math.max(20, Math.min(interval * 0.45, interval - 8));

    for (let index = 0; index < count; index += 1) {
      const openTimer = window.setTimeout(function () {
        ratchetTimers.delete(openTimer);
        if (!currentVisit || currentVisit.serial !== token || currentVisit.suppress || currentVisit.muted) return;

        ratchetGateOpen = true;
        expressiveTriggerCount += 1;
        expressiveReadout('triggers', expressiveTriggerCount);
        coreMonitor('gate', 'OPEN');
        coreMonitor('triggers', expressiveTriggerCount);

        const payload = {
          ...stepPayload(visit.globalIndex),
          accent: Boolean(visit.accent),
          glide: Boolean(visit.glide),
          ratchet: index + 1,
          ratchetCount: count,
          reason: 'dedicated-ratchet',
        };

        customSend('gate', { ...payload, open: true });
        customSend('trigger', payload);

        const closeTimer = window.setTimeout(function () {
          ratchetTimers.delete(closeTimer);
          if (!currentVisit || currentVisit.serial !== token) return;
          ratchetGateOpen = false;
          coreMonitor('gate', 'CLOSED');
          customSend('gate', { ...payload, open: false });
        }, gateDuration);
        ratchetTimers.add(closeTimer);
      }, Math.max(0, index * interval));
      ratchetTimers.add(openTimer);
    }
  }

  function beginVisit(message) {
    const payload = message.payload || {};
    const globalIndex = Math.max(0, Math.min(STEP_COUNT - 1, Number(payload.step || 1) - 1));
    const stepState = state[globalIndex];
    const mirror = coreMirror[globalIndex];
    const chancePass = stepState.chance >= 100 || (stepState.chance > 0 && Math.random() * 100 < stepState.chance);

    clearRatchetTimers('new-step');
    expressiveTriggerCount = 0;
    visitSerial += 1;
    currentVisit = {
      serial: visitSerial,
      globalIndex: globalIndex,
      chance: stepState.chance,
      chancePass: chancePass,
      rest: stepState.rest,
      suppress: stepState.rest || !chancePass,
      ratchets: stepState.ratchets,
      length: mirror.length,
      muted: mirror.mute,
      accent: false,
      glide: false,
      playRange: payload.playRange || 'A+B',
    };

    syncVisitMonitor();

    if (currentVisit.suppress) {
      coreMonitor('gate', 'REST');
      coreMonitor('triggers', 0);
      coreMonitor('accent', 'OFF');
    }

    scheduleRatchets(currentVisit);
  }

  function sameVisit(message) {
    if (!currentVisit) return false;
    const step = Number(message.payload && message.payload.step);
    return !Number.isFinite(step) || step === currentVisit.globalIndex + 1;
  }

  function processSequencerMessage(message) {
    if (!message || typeof message !== 'object') return { allow: true };
    if (message.protocol !== PROTOCOL || message.source !== MODULE_ID) return { allow: true };
    if (message.payload && message.payload.expressiveStage2A) return { allow: true };

    if (messageResults.has(message)) return messageResults.get(message);

    let allow = true;
    const type = message.type;

    if (type === 'step-index') {
      beginVisit(message);
    } else if (type === 'clock') {
      const now = performance.now();
      if (lastClockAt !== null) {
        const delta = now - lastClockAt;
        if (delta >= 20 && delta <= 5000) observedPulseMs = delta;
      }
      lastClockAt = now;
    } else if (currentVisit && sameVisit(message)) {
      if (type === 'pitch-cv') {
        currentVisit.glide = Boolean(message.payload && message.payload.glide);
        if (currentVisit.suppress) allow = false;
      } else if (type === 'accent') {
        currentVisit.accent = Boolean(message.payload && message.payload.active);
        if (currentVisit.suppress) allow = false;
      } else if (type === 'gate' || type === 'trigger') {
        if (currentVisit.suppress) {
          allow = false;
          coreMonitor('gate', 'REST');
          coreMonitor('triggers', 0);
        } else if (currentVisit.ratchets > 1) {
          allow = false;
          coreMonitor('triggers', expressiveTriggerCount);
          if (!ratchetGateOpen) coreMonitor('gate', 'CLOSED');
        } else if (type === 'trigger') {
          expressiveTriggerCount += 1;
          expressiveReadout('triggers', expressiveTriggerCount);
        }
      } else if (type === 'reset') {
        clearRatchetTimers('reset');
      }
    }

    const result = { allow: allow };
    messageResults.set(message, result);
    return result;
  }

  if (NativeBroadcastChannel && nativePostMessage) {
    NativeBroadcastChannel.prototype.postMessage = function (message) {
      const result = processSequencerMessage(message);
      if (!result.allow) return undefined;
      return nativePostMessage.call(this, message);
    };
  }

  window.dispatchEvent = function (event) {
    if (event && event.type === CHANNEL && event.detail) {
      const result = processSequencerMessage(event.detail);
      if (!result.allow) return true;
    }
    return nativeDispatchEvent(event);
  };

  function addStyles() {
    if (document.getElementById('merrinlab-stage2a-expressive-style')) return;
    const style = document.createElement('style');
    style.id = 'merrinlab-stage2a-expressive-style';
    style.textContent = `
      .expressive-controls {
        display: grid;
        gap: 5px;
        padding-top: 5px;
        border-top: 1px solid rgba(255,255,255,0.07);
      }
      .expressive-control {
        display: grid !important;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 4px !important;
        font-size: 0.62rem !important;
        color: #b9c2ca !important;
      }
      .expressive-control input[type='range'] {
        min-width: 0;
        height: 0.9rem !important;
      }
      .expressive-control output {
        min-width: 2.6em;
        padding: 0.04rem 0.2rem;
        border: 1px solid #4a545e;
        border-radius: 5px;
        background: #0e1216;
        color: #eef1f3;
        text-align: center;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }
      .expressive-rest {
        width: 100%;
        padding: 0.24rem 0.25rem !important;
        border-radius: 7px !important;
        font-size: 0.65rem !important;
      }
      .expressive-rest.active {
        color: #f4fff7 !important;
        border-color: #b8f2c7 !important;
        background: linear-gradient(#1f6a3a, #123f24) !important;
        box-shadow: 0 0 10px rgba(166,244,184,0.75), 0 0 20px rgba(166,244,184,0.32) !important;
        text-shadow: 0 0 7px rgba(244,255,247,0.7);
      }
      .expressive-status-strip {
        grid-template-columns: repeat(5, minmax(120px, 1fr));
      }
      @media (max-width: 1100px) {
        .expressive-status-strip {
          grid-template-columns: repeat(2, minmax(140px, 1fr));
        }
      }
    `;
    document.head.appendChild(style);
  }

  addStyles();

  const expressiveViews = [];

  function renderVisibleExpressiveState() {
    const bank = activeEditBank();
    steps.forEach(function (step, visibleIndex) {
      const globalIndex = bank * STEPS_PER_BANK + visibleIndex;
      const stepState = state[globalIndex];
      const view = expressiveViews[visibleIndex];
      if (!view) return;

      view.chanceInput.value = String(stepState.chance);
      view.chanceOutput.value = String(stepState.chance);
      view.chanceOutput.textContent = stepState.chance + '%';
      view.ratchetInput.value = String(stepState.ratchets);
      view.ratchetOutput.value = String(stepState.ratchets);
      view.ratchetOutput.textContent = String(stepState.ratchets);
      view.restButton.classList.toggle('active', stepState.rest);
      view.restButton.setAttribute('aria-pressed', stepState.rest ? 'true' : 'false');
    });
    readCoreVisibleBank();
  }

  steps.forEach(function (step, visibleIndex) {
    const wrapper = document.createElement('div');
    wrapper.className = 'expressive-controls';
    wrapper.setAttribute('aria-label', 'Expressive step controls');
    wrapper.innerHTML = `
      <button type="button" class="expressive-rest" title="Rest: keep timing but suppress pitch/gate/trigger/accent" aria-pressed="false">Rest</button>
      <label class="expressive-control"><span>Chance</span><input type="range" min="0" max="100" step="5" value="100" /><output>100%</output></label>
      <label class="expressive-control"><span>Rat</span><input type="range" min="1" max="8" step="1" value="1" /><output>1</output></label>`;

    const led = step.querySelector('.step-led');
    if (led) step.insertBefore(wrapper, led);
    else step.appendChild(wrapper);

    const restButton = wrapper.querySelector('.expressive-rest');
    const controls = Array.from(wrapper.querySelectorAll('.expressive-control'));
    const chanceInput = controls[0].querySelector('input');
    const chanceOutput = controls[0].querySelector('output');
    const ratchetInput = controls[1].querySelector('input');
    const ratchetOutput = controls[1].querySelector('output');

    const view = { restButton, chanceInput, chanceOutput, ratchetInput, ratchetOutput };
    expressiveViews[visibleIndex] = view;

    restButton.addEventListener('click', function () {
      const globalIndex = visibleGlobalIndex(visibleIndex);
      state[globalIndex].rest = !state[globalIndex].rest;
      restButton.classList.toggle('active', state[globalIndex].rest);
      restButton.setAttribute('aria-pressed', state[globalIndex].rest ? 'true' : 'false');
    });

    chanceInput.addEventListener('input', function () {
      const globalIndex = visibleGlobalIndex(visibleIndex);
      const value = Math.max(0, Math.min(100, Number(chanceInput.value) || 0));
      state[globalIndex].chance = value;
      chanceOutput.value = String(value);
      chanceOutput.textContent = value + '%';
    });

    ratchetInput.addEventListener('input', function () {
      const globalIndex = visibleGlobalIndex(visibleIndex);
      const value = Math.max(1, Math.min(8, Number(ratchetInput.value) || 1));
      state[globalIndex].ratchets = value;
      ratchetOutput.value = String(value);
      ratchetOutput.textContent = String(value);
    });

    const lengthInput = step.querySelector("label:nth-of-type(2) input[type='range']");
    if (lengthInput) {
      lengthInput.addEventListener('input', function () {
        readCoreVisibleBank();
      });
    }

    const statusStrip = step.querySelector('.step-status');
    if (statusStrip) {
      statusStrip.addEventListener('click', function () {
        window.requestAnimationFrame(readCoreVisibleBank);
      });
    }
  });

  renderVisibleExpressiveState();

  if (editBankBlock) {
    editBankBlock.addEventListener('click', function (event) {
      if (!event.target.closest('button')) return;
      window.requestAnimationFrame(renderVisibleExpressiveState);
    });
  }

  const transport = findControlBlock('Transport');
  if (transport) {
    transport.addEventListener('click', function (event) {
      const button = event.target.closest('button');
      if (!button) return;
      const label = button.textContent.trim().toLowerCase();
      if (label === 'stop' || label === 'reset') {
        clearRatchetTimers(label);
        expressiveTriggerCount = 0;
        expressiveReadout('triggers', 0);
      }
    });
  }

  if (outputChannel) {
    outputChannel.addEventListener('message', function (event) {
      const message = event.data;
      if (!message || message.protocol !== PROTOCOL || message.source === MODULE_ID || message.type !== 'clock') return;
      const target = message.target || (message.payload && message.payload.target);
      if (target && target !== MODULE_ID && target !== '*') return;
      const now = performance.now();
      if (lastClockAt !== null) {
        const delta = now - lastClockAt;
        if (delta >= 20 && delta <= 5000) observedPulseMs = delta;
      }
      lastClockAt = now;
    });
  }

  window.addEventListener(CHANNEL, function (event) {
    const message = event.detail;
    if (!message || message.protocol !== PROTOCOL || message.source === MODULE_ID || message.type !== 'clock') return;
    const target = message.target || (message.payload && message.payload.target);
    if (target && target !== MODULE_ID && target !== '*') return;
    const now = performance.now();
    if (lastClockAt !== null) {
      const delta = now - lastClockAt;
      if (delta >= 20 && delta <= 5000) observedPulseMs = delta;
    }
    lastClockAt = now;
  });
})();