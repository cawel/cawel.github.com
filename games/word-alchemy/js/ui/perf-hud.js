/**
 * Perf HUD for Word Alchemy
 *
 * Usage:
 *   - Add ?perf=1 to the URL to enable the HUD (works in prod and dev)
 *   - Press Shift+P to toggle the HUD on/off for the current session
 *
 * Metrics:
 *   FPS: Frames per second (UI update rate, higher is better)
 *   elements: Time (ms) to render the element grid (last render)
 *   elements avg: Average time (ms) to render the element grid (last 50 renders)
 *   stats: Time (ms) to render the stats panel (last render)
 *   stats avg: Average time (ms) to render the stats panel (last 50 renders)
 *
 * No data is persisted. HUD is session-only unless ?perf=1 is present.
 */
function isLocalDevHost() {
  return (
    window.location.protocol === "file:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

function createPerfDiagnostics() {
  const panel = document.createElement("aside");
  panel.setAttribute("aria-live", "polite");
  panel.style.position = "fixed";
  panel.style.right = "10px";
  panel.style.bottom = "10px";
  panel.style.zIndex = "1000";
  panel.style.padding = "8px 10px";
  panel.style.borderRadius = "8px";
  panel.style.border = "1px solid #3f4a60";
  panel.style.background = "rgba(10, 15, 28, 0.9)";
  panel.style.color = "#d9e4ff";
  panel.style.font =
    "12px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  panel.style.pointerEvents = "none";
  panel.style.minWidth = "180px";
  panel.style.backdropFilter = "blur(2px)";

  // Metrics tracked for the HUD
  const metrics = {
    /**
     * FPS: Frames per second (UI update rate, higher is better)
     */
    fps: 0,
    /**
     * renderElementsLastMs: Time (ms) to render the element grid (last render)
     */
    renderElementsLastMs: 0,
    /**
     * renderElementsAvgMs: Average time (ms) to render the element grid (last 50 renders)
     */
    renderElementsAvgMs: 0,
    /**
     * renderStatsLastMs: Time (ms) to render the stats panel (last render)
     */
    renderStatsLastMs: 0,
    /**
     * renderStatsAvgMs: Average time (ms) to render the stats panel (last 50 renders)
     */
    renderStatsAvgMs: 0,
  };

  const samples = {
    renderElements: [],
    renderStats: [],
  };

  const maxSamples = 50;
  let frameCounter = 0;
  let fpsWindowStart = performance.now();
  let rafId = null;
  let enabled = false;

  function average(list) {
    if (list.length === 0) {
      return 0;
    }

    const total = list.reduce((acc, value) => acc + value, 0);
    return total / list.length;
  }

  function trackSample(key, durationMs) {
    const list = samples[key];
    list.push(durationMs);
    if (list.length > maxSamples) {
      list.shift();
    }

    if (key === "renderElements") {
      metrics.renderElementsLastMs = durationMs;
      metrics.renderElementsAvgMs = average(list);
    }

    if (key === "renderStats") {
      metrics.renderStatsLastMs = durationMs;
      metrics.renderStatsAvgMs = average(list);
    }

    updatePanel();
  }

  function updatePanel() {
    panel.textContent = [
      `FPS: ${metrics.fps}`,
      `elements: ${metrics.renderElementsLastMs.toFixed(2)}ms`,
      `elements avg: ${metrics.renderElementsAvgMs.toFixed(2)}ms`,
      `stats: ${metrics.renderStatsLastMs.toFixed(2)}ms`,
      `stats avg: ${metrics.renderStatsAvgMs.toFixed(2)}ms`,
    ].join(", ");
  }

  function frameTick(now) {
    frameCounter += 1;
    const elapsed = now - fpsWindowStart;

    if (elapsed >= 500) {
      metrics.fps = Math.round((frameCounter * 1000) / elapsed);
      frameCounter = 0;
      fpsWindowStart = now;
      updatePanel();
    }

    rafId = requestAnimationFrame(frameTick);
  }

  function setEnabled(nextValue) {
    if (enabled === nextValue) {
      return;
    }

    enabled = nextValue;
    if (enabled) {
      document.body.appendChild(panel);
      updatePanel();
      rafId = requestAnimationFrame(frameTick);
      return;
    }

    panel.remove();
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function withTiming(key, fn, thisArg, args) {
    if (!enabled) {
      return fn.apply(thisArg, args);
    }

    const start = performance.now();
    const result = fn.apply(thisArg, args);
    const durationMs = performance.now() - start;
    trackSample(key, durationMs);
    return result;
  }

  return {
    setEnabled,
    withTiming,
    isEnabled: () => enabled,
  };
}

export function withPerfHud(baseRenderer) {
  const searchParams = new URLSearchParams(window.location.search);
  const isPerfHudRequestedByQuery = searchParams.get("perf") === "1";
  const isDevHost = isLocalDevHost();
  const canUsePerfHud = isDevHost || isPerfHudRequestedByQuery;

  if (!canUsePerfHud) {
    return baseRenderer;
  }

  const perfDiagnostics = createPerfDiagnostics();

  perfDiagnostics.setEnabled(isPerfHudRequestedByQuery);

  window.addEventListener("keydown", (event) => {
    if (!event.shiftKey || event.key.toLowerCase() !== "p") {
      return;
    }

    const nextEnabled = !perfDiagnostics.isEnabled();
    perfDiagnostics.setEnabled(nextEnabled);
  });

  return {
    ...baseRenderer,
    renderElements(...args) {
      return perfDiagnostics.withTiming(
        "renderElements",
        baseRenderer.renderElements,
        baseRenderer,
        args,
      );
    },
    renderStats(...args) {
      return perfDiagnostics.withTiming(
        "renderStats",
        baseRenderer.renderStats,
        baseRenderer,
        args,
      );
    },
  };
}
