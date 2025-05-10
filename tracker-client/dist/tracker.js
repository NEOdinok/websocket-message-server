var TrackerBundle = function(exports) {
  "use strict";
  const flushIntervalMs = 1e3;
  const eventBufferSize = 3;
  const portApi = Number("8888");
  const appUrl = "http://localhost";
  const buffer = [];
  const tracker = {
    track(event, ...tags) {
      buffer.push(buildEvent(event, tags));
      scheduleFlush();
    }
  };
  window.tracker = tracker;
  let lastFlush = 0;
  let flushTimer = null;
  const ENDPOINT = `${appUrl}:${portApi}/track`;
  function buildEvent(event, tags) {
    const currentTimeSeconds = Math.floor(Date.now() / 1e3);
    return {
      event,
      tags,
      url: location.href,
      title: document.title,
      ts: currentTimeSeconds
    };
  }
  function scheduleFlush() {
    const now = Date.now();
    const timeSinceLast = now - lastFlush;
    if (buffer.length >= eventBufferSize) {
      flushSoon();
      return;
    }
    if (!flushTimer) {
      const timeLeftToFlush = Math.max(flushIntervalMs - timeSinceLast, 0);
      flushSoon(timeLeftToFlush);
    }
  }
  function flushSoon(delay = 0) {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, delay);
  }
  async function flush() {
    flushTimer = null;
    if (buffer.length === 0) return;
    const payload = buffer.splice(0, buffer.length);
    lastFlush = Date.now();
    try {
      await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      });
    } catch (err) {
      console.warn("Error sending analytic event. Retrying", err);
      setTimeout(() => {
        buffer.unshift(...payload);
        scheduleFlush();
      }, flushIntervalMs);
    }
  }
  function trackAllBeforePageCloses() {
    window.addEventListener("beforeunload", () => {
      var _a;
      if (buffer.length) (_a = navigator.sendBeacon) == null ? void 0 : _a.call(navigator, ENDPOINT, JSON.stringify(buffer));
    });
  }
  trackAllBeforePageCloses();
  exports.tracker = tracker;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
  return exports;
}({});
