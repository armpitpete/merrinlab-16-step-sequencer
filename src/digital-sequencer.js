(function () {
  const MODULE_ID = "merrinlab-16-step-sequencer";
  const CHANNEL = "merrinlab-patch-bus";
  const STEPS_PER_BANK = 16;
  const BANK_COUNT = 2;
  const TOTAL_STEPS = STEPS_PER_BANK * BANK_COUNT;
  const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL) : null;

  function send(type, payload) {
    const message = {
      protocol: "merrinlab.patch.v0.1",
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
  const transportButtons = Array.from(document.querySelectorAll(".transport button"));
  const clockRateInput = document.querySelector(".clock input[type='range']");

  function findControlBlock(title) {
    return Array.from(document.querySelectorAll(".control-block")).find((block) => {
      return block.querySelector("h2")?.textContent.trim().toLowerCase() === title.toLowerCase();
    });
  }

  const editBankBlock = findControlBlock("Edit Bank");
  const editBankButtons = editBankBlock ? Array.from(editBankBlock.querySelectorAll("button")) : [];

  let currentStep = 0;
  let activeBank = 0;
  let running = false;
  let timer = null;
  let gateTimer = null;

  function getPitchInput(step) {
    return step.querySelector("label:nth-of-type(1) input");
  }

  function getLengthInput(step) {
    return step.querySelector("label:nth-of-type(2) input");
  }

  function getGateButton(step) {
    return Array.from(step.children).find((child) => child.tagName === "BUTTON") || null;
  }

  function getStepPitch(step) {
    return Number(getPitchInput(step)?.value || 60);
  }

  function getStepLength(step) {
    return Number(getLengthInput(step)?.value || 4);
  }

  function makePatternStep(index) {
    const sourceStep = steps[index % steps.length];
    return {
      pitch: getStepPitch(sourceStep),
      length: getStepLength(sourceStep),
    };
  }

  const pattern = Array.from({ length: TOTAL_STEPS }, (_, index) => makePatternStep(index));

  function visibleBankStart() {
    return activeBank * STEPS_PER_BANK;
  }

  function globalStepNumber(visibleIndex) {
    return visibleBankStart() + visibleIndex + 1;
  }

  function bankLabel(bankIndex) {
    return bankIndex === 0 ? "A" : "B";
  }

  function pitchToCv(pitch) {
    return (pitch - 60) / 12;
  }

  function clockMs() {
    const bpm = Number(clockRateInput?.value || 120);
    return 60000 / Math.max(20, bpm);
  }

  function setStatus(text) {
    if (statusReadout) statusReadout.textContent = text;
  }

  function setCurrentBankReadout() {
    if (currentBankReadout) currentBankReadout.textContent = bankLabel(activeBank);
  }

  function saveVisibleStep(visibleIndex) {
    const step = steps[visibleIndex];
    const patternIndex = visibleBankStart() + visibleIndex;
    if (!step || !pattern[patternIndex]) return;

    pattern[patternIndex].pitch = getStepPitch(step);
    pattern[patternIndex].length = getStepLength(step);
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
    });

    setCurrentBankReadout();
    showStep(currentStep);
  }

  function setActiveBank(nextBank) {
    if (nextBank === activeBank) return;

    if (running) stop();
    saveVisibleBank();
    activeBank = nextBank;
    currentStep = 0;
    renderVisibleBank();
    setStatus(`Bank ${bankLabel(activeBank)} selected`);
  }

  function showStep(index) {
    steps.forEach((step, stepIndex) => {
      const isActive = stepIndex === index;
      step.classList.toggle("active", isActive);
      step.querySelector(".step-led")?.classList.toggle("on", isActive);
    });

    if (currentStepReadout) {
      currentStepReadout.textContent = String(globalStepNumber(index)).padStart(2, "0");
    }
  }

  function closeGate(stepNumber) {
    send("gate", { open: false, step: stepNumber, bank: bankLabel(activeBank) });
  }

  function playStep(index) {
    const step = steps[index];
    if (!step) return;

    saveVisibleStep(index);

    const stepNumber = globalStepNumber(index);
    const pitch = getStepPitch(step);
    const length = getStepLength(step);
    const stepMs = clockMs();
    const gateMs = Math.min(stepMs * 0.85, Math.max(35, stepMs * (length / 16)));

    showStep(index);
    send("clock", { step: stepNumber, visibleStep: index + 1, bank: bankLabel(activeBank) });
    send("pitch-cv", { value: pitchToCv(pitch), pitch, step: stepNumber, visibleStep: index + 1, bank: bankLabel(activeBank) });
    send("gate", { open: true, step: stepNumber, visibleStep: index + 1, bank: bankLabel(activeBank) });

    window.clearTimeout(gateTimer);
    gateTimer = window.setTimeout(() => closeGate(stepNumber), gateMs);
  }

  function advance() {
    playStep(currentStep);
    currentStep = (currentStep + 1) % steps.length;
  }

  function stop() {
    running = false;
    window.clearInterval(timer);
    window.clearTimeout(gateTimer);
    timer = null;
    gateTimer = null;
    send("gate", { open: false, step: globalStepNumber(currentStep), bank: bankLabel(activeBank) });
    setStatus("Stopped");
  }

  function run() {
    if (running) return;
    running = true;
    setStatus("Running");
    advance();
    timer = window.setInterval(advance, clockMs());
  }

  function reset() {
    currentStep = 0;
    showStep(currentStep);
    send("clock", { step: globalStepNumber(currentStep), visibleStep: 1, bank: bankLabel(activeBank), reset: true });
    setStatus(running ? "Running" : "Stopped");
  }

  function manualStep() {
    if (running) return;
    setStatus("Manual Step");
    advance();
  }

  function restartIfRunning() {
    if (!running) return;
    window.clearInterval(timer);
    timer = window.setInterval(advance, clockMs());
  }

  editBankButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      editBankButtons.forEach((bankButton) => bankButton.classList.remove("active"));
      button.classList.add("active");
      setActiveBank(index);
    });
  });

  transportButtons.forEach((button) => {
    const label = button.textContent.trim().toLowerCase();
    if (label === "run") button.addEventListener("click", run);
    if (label === "stop") button.addEventListener("click", stop);
    if (label === "reset") button.addEventListener("click", reset);
    if (label === "manual step") button.addEventListener("click", manualStep);
  });

  clockRateInput?.addEventListener("input", restartIfRunning);

  steps.forEach((step, index) => {
    getPitchInput(step)?.addEventListener("input", () => saveVisibleStep(index));
    getLengthInput(step)?.addEventListener("input", () => saveVisibleStep(index));

    getGateButton(step)?.addEventListener("click", () => {
      currentStep = index;
      playStep(index);
    });
  });

  renderVisibleBank();
  setStatus("Stopped");
})();
