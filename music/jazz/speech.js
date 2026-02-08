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
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let firedThisSession = false;

      recognition.onresult = (event) => {
        setSession("listening");

        // Build the latest transcript from the current result batch
        // Use resultIndex so we don't reprocess old results.
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += " " + (event.results[i][0]?.transcript ?? "");
        }
        transcript = normalize(transcript);

        const isFinalBatch = Boolean(event.results[event.results.length - 1]?.isFinal);

        dbg(debug, (isFinalBatch ? "final:" : "interim:"), JSON.stringify(transcript));

        // Hard guard: once fired, ignore further interim spam until onend
        if (firedThisSession) return;

        if (STOP_LISTENING_RE.test(transcript)) {
          firedThisSession = true;
          dbg(debug, "FIRE: stop listening");
          onCommand("stop-listening", transcript, { isFinal: isFinalBatch });

          // Force the session to end now so restart can happen sooner.
          try { recognition.stop(); } catch {}
          return;
        }

        if (NEXT_RE.test(transcript)) {
          firedThisSession = true;
          dbg(debug, "FIRE: next");
          onCommand("next", transcript, { isFinal: isFinalBatch });

          // Force the session to end now so restart can happen sooner.
          try { recognition.stop(); } catch {}
          return;
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
        dbg(debug, "onend");
        firedThisSession = false; // reset latch for next session

        if (!enabled) {
          dbg(debug, "listening disabled → idle");
          setSession("idle");
          return;
        }

        dbg(debug, "auto-restart scheduled");
        clearRestart();

        restartTimer = setTimeout(() => {
          if (!enabled) return;
          try {
            dbg(debug, "restart start()");
            recognition.start();
            setSession("listening");
          } catch {
            onError("restart_failed");
            setSession("error", "restart_failed");
          }
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

