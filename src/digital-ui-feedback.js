(function () {
  const STYLE_ID = 'merrinlab-sequencer-ui-feedback';

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .step-status button.active {
        color: #f4fff7 !important;
        border-color: #b8f2c7 !important;
        background: linear-gradient(#1f6a3a, #123f24) !important;
        box-shadow:
          0 0 0 1px rgba(184, 242, 199, 0.45),
          0 0 10px rgba(166, 244, 184, 0.75),
          0 0 22px rgba(166, 244, 184, 0.38),
          inset 0 1px 0 rgba(255, 255, 255, 0.12) !important;
        text-shadow: 0 0 7px rgba(244, 255, 247, 0.7);
      }

      .step label.length-control {
        grid-template-columns: 1fr auto;
        align-items: center;
        column-gap: 6px;
      }

      .step label.length-control input[type='range'] {
        grid-column: 1 / -1;
      }

      .length-value {
        min-width: 2.1em;
        padding: 0.08rem 0.35rem;
        border: 1px solid #56606b;
        border-radius: 6px;
        background: #0f1418;
        color: #eef1f3;
        font-weight: 700;
        text-align: center;
        font-variant-numeric: tabular-nums;
        box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.55);
      }

      .length-value.adjusting {
        border-color: #b8f2c7;
        color: #dffff0;
        box-shadow:
          0 0 10px rgba(166, 244, 184, 0.55),
          inset 0 0 8px rgba(0, 0, 0, 0.55);
      }
    `;
    document.head.appendChild(style);
  }

  const lengthControls = [];

  document.querySelectorAll('.step').forEach((step) => {
    const label = step.querySelector('label:nth-of-type(2)');
    const input = label && label.querySelector("input[type='range']");
    if (!label || !input) return;

    label.classList.add('length-control');

    let output = label.querySelector('.length-value');
    if (!output) {
      output = document.createElement('output');
      output.className = 'length-value';
      output.setAttribute('aria-label', 'Step length');
      label.insertBefore(output, input);
    }

    let pulseTimer = null;
    const sync = function (pulse) {
      output.value = input.value;
      output.textContent = input.value;
      if (!pulse) return;
      output.classList.add('adjusting');
      window.clearTimeout(pulseTimer);
      pulseTimer = window.setTimeout(function () {
        output.classList.remove('adjusting');
      }, 450);
    };

    input.addEventListener('input', function () {
      sync(true);
    });
    sync(false);
    lengthControls.push(function () {
      sync(false);
    });
  });

  function syncAllLengths() {
    lengthControls.forEach(function (sync) {
      sync();
    });
  }

  const editBankBlock = Array.from(document.querySelectorAll('.control-block')).find(function (block) {
    const heading = block.querySelector('h2');
    return heading && heading.textContent.trim().toLowerCase() === 'edit bank';
  });

  if (editBankBlock) {
    editBankBlock.addEventListener('click', function (event) {
      if (!event.target.closest('button')) return;
      window.requestAnimationFrame(syncAllLengths);
    });
  }

  if (!document.querySelector('script[data-stage2a-expressive-loader]')) {
    const expressiveScript = document.createElement('script');
    expressiveScript.src = 'src/digital-expressive-layer.js';
    expressiveScript.dataset.stage2aExpressiveLoader = 'true';
    document.body.appendChild(expressiveScript);
  }
})();