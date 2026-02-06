"use strict";

/**
 * speech.js (Option 3: enabled state + session state)
 *
 * Strategy (reliable on localhost/Chrome):
 * - continuous = false (one utterance per session)
 * - final results only
 * - auto-restart onend while enabled
 *
 * Callbacks:
 * - onState(enabled:boolean): user-intent state (button pressed/unpressed)
 * - onSession(status:string, detail?:string): engine lifecycle
 *     status ∈ "idle" | "listening" | "restarting" | "error"
 *
 * No DOM.
 *
 */

/**
 * NOTE: We intentionally use `continuous = false` for Chrome reliability.
 * In practice, `continuous = true` produces unreliable utterance boundaries,
 * duplicate/stale transcripts, and silent stalls for short voice commands.
 * Treating each utterance as a discrete recognition session yields predictable
 * behavior for command-style UX (e.g. “next”), especially across silence.
 */

(() => {
  const getCtor = () => window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
  const isSupported = () => Boolean(getCtor());
  const NEXT_RE = /\bnext\b/i;
  const STOP_LISTENING_RE = /\bstop\s+listening\b/i;

  const timeTag = () => new Date().toISOString().slice(11, 23);
  const dbg = (enabled, ...args) => enabled && console.log("[speech]", timeTag(), ...args);

  const normalize = (s) =>
    String(s ?? "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const create = ({
    lang = "en-US",
    restartDelayMs = 200,
    onCommand = () => {},
    onState = () => {},
    onSession = () => {},   // NEW
    onError = () => {},
    debug = false
  } = {}) => {
    const SR = getCtor();

    if (!SR) {
      onError("not_supported");
      onSession("error", "not_supported");
      return Object.freeze({
        isSupported,
        start: () => onError("not_supported"),
        stop: () => {},
        toggle: () => onError("not_supported"),
        isListening: () => false,
        getSessionStatus: () => "error"
      });
    }

    let recognition = null;

    // User intent: should we keep listening across restarts?
    let enabled = false;

    // Engine lifecycle
    let sessionStatus = "idle"; // "idle" | "listening" | "restarting" | "error"

    let restartTimer = null;

    const setSession = (status, detail = "") => {
      if (sessionStatus === status) return;
      sessionStatus = status;
      onSession(status, detail);
    };

    const clearRestart = () => {
      if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
      }
    };

    const ensure = () => {
      if (recognition) return;

      recognition = new SR();
      recognition.lang = lang;

      // Key reliability choice
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        setSession("listening");

        const transcript = normalize(
          event.results?.[0]?.[0]?.transcript ?? ""
        );

        dbg(debug, "final:", JSON.stringify(transcript));

        // Explicit shutdown command (highest priority)
        if (STOP_LISTENING_RE.test(transcript)) {
          dbg(debug, "FIRE: stop listening");
          onCommand("stop-listening", transcript, { isFinal: true });
          return;
        }

        // Normal command
        if (NEXT_RE.test(transcript)) {
          dbg(debug, "FIRE: next");
          onCommand("next", transcript, { isFinal: true });
        }
      };

      recognition.onerror = (event) => {
        const code = event?.error ?? "speech_error";
        dbg(debug, "onerror:", code);

        // Silence is normal for command-style UX; Chrome emits "no-speech" frequently.
        // Don't treat it as fatal; onend will restart automatically if enabled.
        if (enabled && code === "no-speech") {
          dbg(debug, "no-speech ignored (will restart onend)");
          return;
        }

        onError(code);
        setSession("error", code);
      };

      recognition.onend = () => {
        dbg(debug, "auto-restart scheduled");

        clearRestart();
        restartTimer = setTimeout(() => {
          if (!enabled) {
            dbg(debug, "restart canceled (listening disabled)");
            setSession("idle");
            return;
          }

          const tryStart = (label) => {
            try {
              dbg(debug, label);
              recognition.start();
              setSession("listening");
              return true;
            } catch (e) {
              dbg(debug, `${label} FAILED`);
              return false;
            }
          };

          // First attempt
          if (tryStart("restart start()")) return;

          // Safety nudge: try again shortly after
          setTimeout(() => {
            if (!enabled) return;
            tryStart("restart retry start()");
          }, 250);
        }, restartDelayMs);

      };
    };

    const start = () => {
      ensure();
      if (enabled) return;

      enabled = true;
      onState(true);
      setSession("listening");
      dbg(debug, "start listening");

      clearRestart();
      try {
        recognition.start();
      } catch (e) {
        dbg(debug, "start_failed");
        onError("start_failed");
        setSession("error", "start_failed");
      }
    };

    const stop = () => {
      if (!recognition || !enabled) return;

      enabled = false;
      onState(false);
      setSession("idle");
      dbg(debug, "stop listening");

      clearRestart();
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };

    const toggle = () => (enabled ? stop() : start());

    return Object.freeze({
      isSupported,
      start,
      stop,
      toggle,
      isListening: () => enabled,
      getSessionStatus: () => sessionStatus
    });
  };

  window.SpeechController = Object.freeze({ create, isSupported });
})();

