(function () {
  'use strict';

  if (window.__merrinlabExpressiveStage2AEditor) return;
  window.__merrinlabExpressiveStage2AEditor = true;

  const steps = Array.from(document.querySelectorAll('.step'));
  const expressiveMonitor = document.querySelector('[data-expressive-monitor]');
  if (!steps.length || !expressiveMonitor) return;

  const stage2B = window.MerrinLabSequencerStage2B || null;
  const groove = document.querySelector('.stage2b-groove');
  const rawPitchReadout = groove && groove.querySelector('[data-raw]');
  const outputPitchReadout = groove && groove.querySelector('[data-output]');

  const style = document.createElement('style');
  style.id = 'merrinlab-stage2a-expressive-editor-style';
  style.textContent = `
    .step .expressive-control { grid-template-columns: 1fr auto !important; padding: 0.14rem 0.22rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; cursor: pointer; user-select: none; }
    .step .expressive-control input[type='range'] { display: none !important; }
    .step .expressive-control output { min-width: auto !important; padding: 0 !important; border: 0 !important; background: transparent !important; box-shadow: none !important; }
    .step.expressive-selected { outline: 2px solid #74b7ff; outline-offset: 2px; }
    [data-expressive-editor] { margin-top: 10px; }
    .expressive-editor-panel { display: grid; grid-template-columns: minmax(150px, 0.65fr) minmax(280px, 2fr) minmax(240px, 1.5fr); gap: 12px; padding: 12px; border: 1px solid #2c3742; border-radius: 12px; background: rgba(13,18,23,0.72); }
    .expressive-editor-group { display: grid; gap: 8px; align-content: start; }
    .expressive-editor-group .editor-label-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: #c8d0d7; font-size: 0.78rem; letter-spacing: 0.04em; text-transform: uppercase; }
    .expressive-editor-group output { min-width: 3.3em; padding: 0.18rem 0.45rem; border: 1px solid #56606b; border-radius: 7px; background: #0f1418; color: #f1f4f6; font-weight: 800; text-align: center; font-variant-numeric: tabular-nums; }
    .expressive-editor-group input[type='range'] { width: 100%; min-width: 0; }
    .expressive-editor-rest { min-height: 46px; font-size: 0.92rem !important; }
    .expressive-editor-rest.active { color: #f4fff7 !important; border-color: #b8f2c7 !important; background: linear-gradient(#1f6a3a, #123f24) !important; box-shadow: 0 0 10px rgba(166,244,184,0.75), 0 0 20px rgba(166,244,184,0.32) !important; text-shadow: 0 0 7px rgba(244,255,247,0.7); }
    .chance-presets, .ratchet-presets { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 5px; }
    .ratchet-presets { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    .chance-presets button, .ratchet-presets button { padding: 0.34rem 0.2rem !important; font-size: 0.72rem !important; }
    .step label.pitch-control { grid-template-columns: 1fr auto; align-items: center; column-gap: 6px; }
    .step label.pitch-control input[type='range'] { grid-column: 1 / -1; }
    .pitch-value { min-width: 2.5em; padding: .08rem .35rem; border: 1px solid #56606b; border-radius: 6px; background: #0f1418; color: #eef1f3; font-weight: 700; text-align: center; font-variant-numeric: tabular-nums; box-shadow: inset 0 0 8px rgba(0,0,0,.55); }
    .pitch-value.adjusting { border-color: #74b7ff; color: #e8f4ff; box-shadow: 0 0 10px rgba(116,183,255,.5), inset 0 0 8px rgba(0,0,0,.55); }
    @media (max-width: 900px) { .expressive-editor-panel { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(style);

  const section = document.createElement('section');
  section.dataset.expressiveEditor = 'true';
  section.setAttribute('aria-label', 'Selected step expressive editor');
  section.innerHTML = `
    <h2 class="section-title">Expressive Step Editor · <span data-editor-step>01</span></h2>
    <p class="subtitle">Click any visible step card, then use these full-width controls. The compact card values remain as readouts.</p>
    <div class="expressive-editor-panel">
      <div class="expressive-editor-group"><div class="editor-label-row"><span>Rest</span><span data-editor-bank>Bank A</span></div><button type="button" class="expressive-editor-rest toggle" aria-pressed="false">Rest Off</button></div>
      <div class="expressive-editor-group"><div class="editor-label-row"><span>Chance</span><output data-editor-chance-output>100%</output></div><input data-editor-chance type="range" min="0" max="100" step="5" value="100" aria-label="Selected step chance" /><div class="chance-presets" aria-label="Chance presets"><button type="button" class="toggle" data-chance-preset="0">0%</button><button type="button" class="toggle" data-chance-preset="25">25%</button><button type="button" class="toggle" data-chance-preset="50">50%</button><button type="button" class="toggle" data-chance-preset="75">75%</button><button type="button" class="toggle" data-chance-preset="100">100%</button></div></div>
      <div class="expressive-editor-group"><div class="editor-label-row"><span>Ratchets</span><output data-editor-ratchet-output>1</output></div><input data-editor-ratchet type="range" min="1" max="8" step="1" value="1" aria-label="Selected step ratchet count" /><div class="ratchet-presets" aria-label="Ratchet presets"><button type="button" class="toggle" data-ratchet-preset="1">1</button><button type="button" class="toggle" data-ratchet-preset="2">2</button><button type="button" class="toggle" data-ratchet-preset="3">3</button><button type="button" class="toggle" data-ratchet-preset="4">4</button><button type="button" class="toggle" data-ratchet-preset="6">6</button><button type="button" class="toggle" data-ratchet-preset="8">8</button></div></div>
    </div>`;
  expressiveMonitor.insertAdjacentElement('afterend', section);

  const stepReadout = section.querySelector('[data-editor-step]');
  const bankReadout = section.querySelector('[data-editor-bank]');
  const restButton = section.querySelector('.expressive-editor-rest');
  const chanceInput = section.querySelector('[data-editor-chance]');
  const chanceOutput = section.querySelector('[data-editor-chance-output]');
  const ratchetInput = section.querySelector('[data-editor-ratchet]');
  const ratchetOutput = section.querySelector('[data-editor-ratchet-output]');

  let selectedVisibleIndex = 0;

  function sourceControls(visibleIndex) {
    const step = steps[visibleIndex];
    if (!step) return null;
    const wrapper = step.querySelector('.expressive-controls');
    if (!wrapper) return null;
    const labels = Array.from(wrapper.querySelectorAll('.expressive-control'));
    return {
      step,
      rest: wrapper.querySelector('.expressive-rest'),
      chance: labels[0] && labels[0].querySelector("input[type='range']"),
      ratchet: labels[1] && labels[1].querySelector("input[type='range']"),
      pitch: step.querySelector("label:nth-of-type(1) input[type='range']"),
    };
  }

  function selectedControls() {
    return sourceControls(selectedVisibleIndex);
  }

  function previewPitch(control) {
    if (!stage2B || !control || !control.pitch) return;
    const raw = Math.max(0, Math.min(127, Number(control.pitch.value) || 0));
    const state = stage2B.getState();
    const output = state.pitchMode === 'quantized' ? stage2B.quantizePitch(raw) : raw;
    if (rawPitchReadout) rawPitchReadout.textContent = String(raw);
    if (outputPitchReadout) outputPitchReadout.textContent = String(output);
  }

  function syncPitchReadout(control, pulse) {
    if (!control || !control.pitch) return;
    const label = control.pitch.closest('label');
    if (!label) return;
    label.classList.add('pitch-control');
    let output = label.querySelector('.pitch-value');
    if (!output) {
      output = document.createElement('output');
      output.className = 'pitch-value';
      output.setAttribute('aria-label', 'Step MIDI pitch');
      label.insertBefore(output, control.pitch);
    }
    output.value = control.pitch.value;
    output.textContent = control.pitch.value;
    if (pulse) {
      output.classList.add('adjusting');
      window.clearTimeout(output.__merrinlabPitchTimer);
      output.__merrinlabPitchTimer = window.setTimeout(() => output.classList.remove('adjusting'), 450);
    }
  }

  function syncAllVisiblePitchReadouts() {
    steps.forEach((_, index) => syncPitchReadout(sourceControls(index), false));
  }

  function syncEditor() {
    const control = selectedControls();
    if (!control || !control.chance || !control.ratchet || !control.rest) return;

    steps.forEach((step, index) => step.classList.toggle('expressive-selected', index === selectedVisibleIndex));

    const heading = control.step.querySelector('h3');
    const stepNumber = Number(heading && heading.textContent.trim()) || selectedVisibleIndex + 1;
    const chance = Number(control.chance.value) || 0;
    const ratchets = Number(control.ratchet.value) || 1;
    const resting = control.rest.classList.contains('active');

    stepReadout.textContent = String(stepNumber).padStart(2, '0');
    bankReadout.textContent = stepNumber > 16 ? 'Bank B' : 'Bank A';
    chanceInput.value = String(chance);
    chanceOutput.value = String(chance);
    chanceOutput.textContent = chance + '%';
    ratchetInput.value = String(ratchets);
    ratchetOutput.value = String(ratchets);
    ratchetOutput.textContent = String(ratchets);
    restButton.classList.toggle('active', resting);
    restButton.setAttribute('aria-pressed', resting ? 'true' : 'false');
    restButton.textContent = resting ? 'Rest On' : 'Rest Off';

    section.querySelectorAll('[data-chance-preset]').forEach((button) => {
      button.classList.toggle('active', Number(button.dataset.chancePreset) === chance);
    });
    section.querySelectorAll('[data-ratchet-preset]').forEach((button) => {
      button.classList.toggle('active', Number(button.dataset.ratchetPreset) === ratchets);
    });

    syncPitchReadout(control, false);
    previewPitch(control);
  }

  function selectStep(index) {
    selectedVisibleIndex = Math.max(0, Math.min(steps.length - 1, index));
    syncEditor();
  }

  steps.forEach((step, index) => {
    const control = sourceControls(index);
    step.addEventListener('click', () => selectStep(index));
    step.querySelectorAll('.expressive-control').forEach((label) => {
      label.setAttribute('title', 'Click to select this step; adjust it in the Expressive Step Editor');
    });
    if (control && control.pitch) {
      control.pitch.addEventListener('input', () => {
        selectedVisibleIndex = index;
        syncPitchReadout(control, true);
        previewPitch(control);
      });
    }
  });

  restButton.addEventListener('click', () => {
    const control = selectedControls();
    if (!control || !control.rest) return;
    control.rest.click();
    syncEditor();
  });

  chanceInput.addEventListener('input', () => {
    const control = selectedControls();
    if (!control || !control.chance) return;
    control.chance.value = chanceInput.value;
    control.chance.dispatchEvent(new Event('input', { bubbles: true }));
    syncEditor();
  });

  ratchetInput.addEventListener('input', () => {
    const control = selectedControls();
    if (!control || !control.ratchet) return;
    control.ratchet.value = ratchetInput.value;
    control.ratchet.dispatchEvent(new Event('input', { bubbles: true }));
    syncEditor();
  });

  section.querySelectorAll('[data-chance-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      chanceInput.value = button.dataset.chancePreset;
      chanceInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  section.querySelectorAll('[data-ratchet-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      ratchetInput.value = button.dataset.ratchetPreset;
      ratchetInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  const editBankBlock = Array.from(document.querySelectorAll('.control-block')).find((block) => {
    const heading = block.querySelector('h2');
    return heading && heading.textContent.trim().toLowerCase() === 'edit bank';
  });
  if (editBankBlock) {
    editBankBlock.addEventListener('click', (event) => {
      if (!event.target.closest('button')) return;
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          syncAllVisiblePitchReadouts();
          syncEditor();
        });
      });
    });
  }

  if (groove) {
    groove.addEventListener('click', (event) => {
      if (!event.target.closest('[data-mode]')) return;
      window.requestAnimationFrame(() => previewPitch(selectedControls()));
    });
    groove.addEventListener('change', (event) => {
      if (!event.target.matches('[data-root], [data-scale]')) return;
      window.requestAnimationFrame(() => previewPitch(selectedControls()));
    });
  }

  if (stage2B && typeof stage2B.subscribe === 'function') {
    stage2B.subscribe(() => {
      window.requestAnimationFrame(() => previewPitch(selectedControls()));
    });
  }

  syncAllVisiblePitchReadouts();
  syncEditor();
})();
