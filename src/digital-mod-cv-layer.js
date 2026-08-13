(function () {
  'use strict';

  if (window.__merrinlabModCV1Stage2C) return;
  window.__merrinlabModCV1Stage2C = true;

  const MODULE_ID = 'merrinlab-16-step-sequencer';
  const SOURCE_ID = 'merrinlab-16-step-sequencer.mod-cv-1';
  const CHANNEL = 'merrinlab-patch-bus';
  const PROTOCOL = 'merrinlab.patch.v0.1';
  const LANE = 1;
  const TOTAL_STEPS = 32;
  const STEPS_PER_BANK = 16;
  const values = Array(TOTAL_STEPS).fill(0);
  const steps = Array.from(document.querySelectorAll('.step'));
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL) : null;

  if (!steps.length) return;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const normalize = (value) => Math.round(clamp(Number(value) || 0, -1, 1) * 100) / 100;
  const format = (value) => `${value >= 0 ? '+' : ''}${normalize(value).toFixed(2)}`;

  function globalStepForVisibleIndex(index) {
    const heading = steps[index]?.querySelector('h3');
    const step = Number(heading?.textContent.trim());
    return Number.isInteger(step) && step >= 1 && step <= TOTAL_STEPS ? step : index + 1;
  }

  function bankForStep(step) {
    return step > STEPS_PER_BANK ? 'B' : 'A';
  }

  function valueForStep(step) {
    return values[clamp(step, 1, TOTAL_STEPS) - 1] || 0;
  }

  function sendModCV(stepMessage) {
    const payload = stepMessage?.payload || {};
    const step = Number(payload.step);
    if (!Number.isInteger(step) || step < 1 || step > TOTAL_STEPS) return;

    const value = valueForStep(step);
    const message = {
      protocol: PROTOCOL,
      source: MODULE_ID,
      type: 'mod-cv',
      time: performance.now(),
      payload: {
        lane: LANE,
        laneId: 'mod-cv-1',
        sourceId: SOURCE_ID,
        value,
        normalized: value,
        step,
        visibleStep: Number(payload.visibleStep) || ((step - 1) % STEPS_PER_BANK) + 1,
        bank: payload.bank || bankForStep(step),
        playRange: payload.playRange || null,
        reason: 'step-enter',
      },
    };

    if (channel) channel.postMessage(message);
    window.dispatchEvent(new CustomEvent(CHANNEL, { detail: message }));
    updateMonitor(step, value, 'STEP ENTER');
  }

  const style = document.createElement('style');
  style.id = 'merrinlab-stage2c-mod-cv1-style';
  style.textContent = `
    .mod-cv-compact { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 5px; padding: .18rem .3rem !important; margin-top: 4px; font-size: .68rem !important; letter-spacing: .02em; }
    .mod-cv-compact output { min-width: 3.9em; text-align: right; font-weight: 800; font-variant-numeric: tabular-nums; }
    .mod-cv-compact.selected { border-color: #c69cff !important; box-shadow: 0 0 9px rgba(198,156,255,.45); }
    .stage2c-mod-cv { margin: 12px 0; }
    .mod-cv-editor { display: grid; grid-template-columns: minmax(150px,.6fr) minmax(300px,2.2fr) minmax(220px,1fr); gap: 12px; align-items: stretch; padding: 12px; border: 1px solid #2c3742; border-radius: 12px; background: rgba(13,18,23,.72); }
    .mod-cv-editor-group { display: grid; gap: 8px; align-content: start; }
    .mod-cv-editor-head { display: flex; justify-content: space-between; gap: 10px; align-items: center; color: #c8d0d7; font-size: .78rem; letter-spacing: .04em; text-transform: uppercase; }
    .mod-cv-editor output { min-width: 4.2em; padding: .18rem .45rem; border: 1px solid #735b8b; border-radius: 7px; background: #0f1418; color: #f4ecff; font-weight: 800; text-align: center; font-variant-numeric: tabular-nums; }
    .mod-cv-editor input[type='range'] { width: 100%; min-width: 0; }
    .mod-cv-presets { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 5px; }
    .mod-cv-presets button { padding: .34rem .2rem !important; font-size: .72rem !important; }
    .mod-cv-monitor { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 7px; }
    .mod-cv-monitor div { padding: 8px; border: 1px solid #2c3742; border-radius: 8px; background: #0f1418; }
    .mod-cv-monitor span { display: block; color: #8995a1; font-size: .68rem; text-transform: uppercase; }
    .mod-cv-monitor strong { display: block; margin-top: 4px; font-variant-numeric: tabular-nums; }
    @media (max-width: 900px) { .mod-cv-editor { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(style);

  const outputsBlock = Array.from(document.querySelectorAll('.io-block')).find((block) => {
    return block.querySelector('h2')?.textContent.trim().toLowerCase() === 'outputs';
  });
  const outputsList = outputsBlock?.querySelector('ul');
  if (outputsList && !outputsList.querySelector('[data-mod-cv1-output]')) {
    const item = document.createElement('li');
    item.dataset.modCv1Output = 'true';
    item.innerHTML = '<span class="jack out"></span>Mod CV 1 Out';
    outputsList.appendChild(item);
  }

  const section = document.createElement('section');
  section.className = 'stage2c-mod-cv';
  section.dataset.modCv1 = 'true';
  section.innerHTML = `
    <h2 class="section-title">Mod CV 1</h2>
    <p class="subtitle">Per-step bipolar control lane. It emits on every entered step, independently of Rest, Chance or Mute; skipped steps emit nothing.</p>
    <div class="mod-cv-editor">
      <div class="mod-cv-editor-group">
        <div class="mod-cv-editor-head"><span>Selected step</span><strong data-mod-step>01 · Bank A</strong></div>
        <p class="subtitle">Click a step's Mod CV readout to edit that step.</p>
      </div>
      <div class="mod-cv-editor-group">
        <div class="mod-cv-editor-head"><span>Value</span><output data-mod-output>+0.00</output></div>
        <input data-mod-slider type="range" min="-100" max="100" step="1" value="0" aria-label="Selected step Mod CV 1 value" />
        <div class="mod-cv-presets" aria-label="Mod CV presets">
          <button type="button" class="toggle" data-mod-preset="-100">-1.00</button>
          <button type="button" class="toggle" data-mod-preset="-50">-0.50</button>
          <button type="button" class="toggle" data-mod-preset="0">0.00</button>
          <button type="button" class="toggle" data-mod-preset="50">+0.50</button>
          <button type="button" class="toggle" data-mod-preset="100">+1.00</button>
        </div>
      </div>
      <div class="mod-cv-editor-group">
        <div class="mod-cv-editor-head"><span>Output monitor</span><span>Lane 1</span></div>
        <div class="mod-cv-monitor">
          <div><span>Step</span><strong data-mod-monitor-step>—</strong></div>
          <div><span>Value</span><strong data-mod-monitor-value>+0.00</strong></div>
          <div><span>Event</span><strong data-mod-monitor-event>READY</strong></div>
        </div>
      </div>
    </div>`;

  const stepsSection = document.querySelector('.steps');
  if (stepsSection) stepsSection.insertAdjacentElement('beforebegin', section);

  const slider = section.querySelector('[data-mod-slider]');
  const output = section.querySelector('[data-mod-output]');
  const selectedReadout = section.querySelector('[data-mod-step]');
  const monitorStep = section.querySelector('[data-mod-monitor-step]');
  const monitorValue = section.querySelector('[data-mod-monitor-value]');
  const monitorEvent = section.querySelector('[data-mod-monitor-event]');
  let selectedVisibleIndex = 0;

  function compactForStep(step) {
    return step.querySelector('.mod-cv-compact');
  }

  function ensureCompactControls() {
    steps.forEach((step, visibleIndex) => {
      let button = compactForStep(step);
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'toggle mod-cv-compact';
        button.innerHTML = '<span>Mod CV 1</span><output>+0.00</output>';
        button.setAttribute('aria-label', 'Select step Mod CV 1');
        const status = step.querySelector('.step-status');
        if (status) status.insertAdjacentElement('afterend', button);
        else step.appendChild(button);
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          selectedVisibleIndex = visibleIndex;
          syncEditor();
        });
      }
    });
  }

  function syncCompacts() {
    steps.forEach((step, visibleIndex) => {
      const globalStep = globalStepForVisibleIndex(visibleIndex);
      const button = compactForStep(step);
      if (!button) return;
      const compactOutput = button.querySelector('output');
      if (compactOutput) compactOutput.textContent = format(valueForStep(globalStep));
      button.classList.toggle('selected', visibleIndex === selectedVisibleIndex);
      button.title = `Step ${globalStep} Mod CV 1: ${format(valueForStep(globalStep))}`;
    });
  }

  function syncEditor() {
    const step = globalStepForVisibleIndex(selectedVisibleIndex);
    const value = valueForStep(step);
    selectedReadout.textContent = `${String(step).padStart(2, '0')} · Bank ${bankForStep(step)}`;
    slider.value = String(Math.round(value * 100));
    output.value = format(value);
    output.textContent = format(value);
    section.querySelectorAll('[data-mod-preset]').forEach((button) => {
      button.classList.toggle('active', Number(button.dataset.modPreset) === Math.round(value * 100));
    });
    syncCompacts();
  }

  function setSelectedValue(rawValue) {
    const step = globalStepForVisibleIndex(selectedVisibleIndex);
    values[step - 1] = normalize(Number(rawValue) / 100);
    syncEditor();
  }

  function updateMonitor(step, value, eventName) {
    if (monitorStep) monitorStep.textContent = String(step).padStart(2, '0');
    if (monitorValue) monitorValue.textContent = format(value);
    if (monitorEvent) monitorEvent.textContent = eventName;
  }

  slider.addEventListener('input', () => setSelectedValue(slider.value));
  section.querySelectorAll('[data-mod-preset]').forEach((button) => {
    button.addEventListener('click', () => setSelectedValue(button.dataset.modPreset));
  });

  const editBankBlock = Array.from(document.querySelectorAll('.control-block')).find((block) => {
    return block.querySelector('h2')?.textContent.trim().toLowerCase() === 'edit bank';
  });
  if (editBankBlock) {
    editBankBlock.addEventListener('click', (event) => {
      if (!event.target.closest('button')) return;
      window.requestAnimationFrame(() => {
        ensureCompactControls();
        syncEditor();
      });
    });
  }

  function handlePatchEvent(event) {
    const message = event?.detail;
    if (!message || message.protocol !== PROTOCOL || message.source !== MODULE_ID) return;
    if (message.type !== 'step-index') return;
    sendModCV(message);
  }

  window.addEventListener(CHANNEL, handlePatchEvent);

  window.MerrinLabSequencerModCV1 = {
    lane: LANE,
    sourceId: SOURCE_ID,
    getStepValue(step) {
      const numericStep = clamp(Math.round(Number(step) || 1), 1, TOTAL_STEPS);
      return valueForStep(numericStep);
    },
    setStepValue(step, value) {
      const numericStep = clamp(Math.round(Number(step) || 1), 1, TOTAL_STEPS);
      values[numericStep - 1] = normalize(value);
      syncEditor();
      return values[numericStep - 1];
    },
    snapshot() {
      return values.slice();
    },
  };

  ensureCompactControls();
  syncEditor();
})();
