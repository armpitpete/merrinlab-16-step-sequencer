(function () {
  const MODULE_ID = "merrinlab-16-step-sequencer";
  const CHANNEL = "merrinlab-patch-bus";
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
  const statusReadout = statusValues[2];
  const transportButtons = Array.from(document.querySelectorAll(".transport button"));
  const clockRateInput = document.querySelector(".clock input[type='range']");

  let currentStep = 0;
  let running = false;
  let timer = null;
  let gateTimer = null;

  function getStepPitch(step) {
    return Number(step.querySelector("label:nth-of-type(1) input")?.value || 60);
  }

  function getStepLength(step) {
    return Number(step.querySelector("label:nth-of-type(2) input")?.value || 4);
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

  function showStep(index) {
    steps.forEach((step, stepIndex) => {
      const isActive = stepIndex === index;
      step.classList.toggle("active", isActive);
      step.querySelector(".step-led")?.classList.toggle("on", isActive);
    });

    if (currentStepReadout) {
      currentStepReadout.textContent = String(index + 1).padStart(2, "0");
    }
  }

  function closeGate() {
    send("gate", { open: false, step: currentStep + 1 });
  }

  function playStep(index) {
    const step = steps[index];
    if (!step) return;

    const pitch = getStepPitch(step);
    const length = getStepLength(step);
    const stepMs = clockMs();
    const gateMs = Math.min(stepMs * 0.85, Math.max(35, stepMs * (length / 16)));

    showStep(index);
    send("clock", { step: index + 1 });
    send("pitch-cv", { value: pitchToCv(pitch), pitch, step: index + 1 });
    send("gate", { open: true, step: index + 1 });

    window.clearTimeout(gateTimer);
    gateTimer = window.setTimeout(closeGate, gateMs);
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
    send("gate", { open: false, step: currentStep + 1 });
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
    send("clock", { step: 1, reset: true });
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

  transportButtons.forEach((button) => {
    const label = button.textContent.trim().toLowerCase();
    if (label === "run") button.addEventListener("click", run);
    if (label === "stop") button.addEventListener("click", stop);
    if (label === "reset") button.addEventListener("click", reset);
    if (label === "manual step") button.addEventListener("click", manualStep);
  });

  clockRateInput?.addEventListener("input", restartIfRunning);

  steps.forEach((step, index) => {
    step.querySelector("button")?.addEventListener("click", () => {
      currentStep = index;
      playStep(index);
    });
  });

  showStep(currentStep);
  setStatus("Stopped");
})();
