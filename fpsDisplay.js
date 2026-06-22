export const createFpsDisplay = (engine) => {
  const panel = document.createElement("div");
  panel.id = "fpsDisplay";
  panel.textContent = "FPS: --";
  panel.style.position = "fixed";
  panel.style.top = "12px";
  panel.style.right = "12px";
  panel.style.zIndex = "20";
  panel.style.padding = "8px 10px";
  panel.style.borderRadius = "6px";
  panel.style.background = "rgba(0, 20, 28, 0.72)";
  panel.style.color = "#d8fbff";
  panel.style.font = "600 13px Arial, sans-serif";
  panel.style.letterSpacing = "0";
  panel.style.pointerEvents = "none";
  document.body.appendChild(panel);

  let elapsed = 0;

  return {
    update(deltaTime) {
      elapsed += deltaTime;
      if (elapsed >= 0.25) {
        panel.textContent = `FPS: ${Math.round(engine.getFps())}`;
        elapsed = 0;
      }
    }
  };
};
