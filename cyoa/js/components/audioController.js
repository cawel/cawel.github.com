import { findMp3FilesInFolder } from "../utils/audioResolver.js";

export function createAudioController() {
  let isPlaying = false;
  let audioElement = null;
  let muted = true;
  let mainAudioReady = Promise.resolve();
  let availableAudioSources = [];
  let selectedAudioIndex = 0;
  let audioButton = null;
  let audioTrackSelect = null;

  const stopAllAudio = () => {
    const mainAudio = document.getElementById("main-audio");

    if (mainAudio && !mainAudio.paused) mainAudio.pause();
  };

  const updateAudioTrackSelect = () => {
    if (!audioTrackSelect) return;

    audioTrackSelect.innerHTML = "";

    if (!availableAudioSources.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Music 1";
      audioTrackSelect.appendChild(option);
      audioTrackSelect.value = "";
      return;
    }

    availableAudioSources.forEach((source, index) => {
      const option = document.createElement("option");
      option.value = source;
      option.textContent = `Music ${index + 1}`;
      option.title = source;
      audioTrackSelect.appendChild(option);
    });

    audioTrackSelect.value = availableAudioSources[selectedAudioIndex] || "";
  };

  const applySelectedMainTrack = () => {
    const mainAudio = document.getElementById("main-audio");
    if (!mainAudio || !availableAudioSources.length) return;

    const selectedSource = availableAudioSources[selectedAudioIndex];
    if (!selectedSource) return;

    const resolvedSelected = new URL(selectedSource, window.location.href).href;
    if (mainAudio.src !== resolvedSelected) {
      mainAudio.src = selectedSource;
    }
  };

  const ensureMainAudioExists = () => {
    if (!document.getElementById("main-audio")) {
      const audio = document.createElement("audio");
      audio.id = "main-audio";
      audio.loop = true;
      audio.style.display = "none";
      document.body.appendChild(audio);

      mainAudioReady = (async () => {
        const discoveredFiles = await findMp3FilesInFolder("music/");
        availableAudioSources = discoveredFiles;

        selectedAudioIndex = 0;
        updateAudioTrackSelect();
        applySelectedMainTrack();
        return audio;
      })();
    } else {
      const existing = document.getElementById("main-audio");
      mainAudioReady = (async () => {
        const discoveredFiles = await findMp3FilesInFolder("music/");
        availableAudioSources = discoveredFiles;

        const currentSrc = existing.src;
        const matchedIndex = availableAudioSources.findIndex((source) => {
          return new URL(source, window.location.href).href === currentSrc;
        });

        selectedAudioIndex = matchedIndex >= 0 ? matchedIndex : 0;
        updateAudioTrackSelect();
        return existing;
      })();
    }
  };

  const setupAudio = () => {
    audioElement = document.getElementById("main-audio");
    applySelectedMainTrack();
    isPlaying = audioElement && audioElement.paused === false;

    if (muted && audioElement && !audioElement.paused) {
      audioElement.pause();
      isPlaying = false;
    }
  };

  const syncState = () => {
    setupAudio();
    updateAudioButton();
  };

  const muteAndStopAll = () => {
    muted = true;
    stopAllAudio();
    isPlaying = false;
    updateAudioButton();
  };

  const stopAudioWithoutMuting = () => {
    stopAllAudio();
    isPlaying = false;
    updateAudioButton();
  };

  const toggleAudio = async () => {
    await mainAudioReady;
    setupAudio();
    muted = !muted;

    if (audioElement) {
      if (muted) {
        audioElement.pause();
      } else {
        audioElement.play().catch((error) => {
          console.warn(
            "[audio] Unable to play music. Check that an MP3 exists in /music and the file is accessible.",
            error,
          );
        });
      }
    }

    isPlaying = audioElement ? !audioElement.paused : false;
    updateAudioButton();
  };

  const updateAudioButton = () => {
    if (!audioButton) return;

    const cross = audioButton.querySelector(".mute-cross");
    const speaker = audioButton.querySelector(".speaker-icon");
    if (speaker) speaker.style.visibility = "visible";
    if (cross) cross.style.visibility = muted ? "visible" : "hidden";
  };

  const onTrackSelectionChange = (event) => {
    const selectedSource = event.target.value;
    const nextIndex = availableAudioSources.indexOf(selectedSource);
    if (nextIndex < 0) return;

    selectedAudioIndex = nextIndex;
    applySelectedMainTrack();

    const mainAudio = document.getElementById("main-audio");
    if (mainAudio && !muted) {
      mainAudio.play().catch((error) => {
        console.warn(
          "[audio] Unable to play selected track. Check that MP3 files are accessible.",
          error,
        );
      });
    }
  };

  const setControls = ({ button, trackSelect }) => {
    audioButton = button;
    audioTrackSelect = trackSelect;

    if (audioButton) {
      audioButton.addEventListener("click", () => {
        toggleAudio();
      });
    }

    if (audioTrackSelect) {
      audioTrackSelect.addEventListener("change", onTrackSelectionChange);
    }

    updateAudioTrackSelect();
    updateAudioButton();
  };

  const initialize = () => {
    ensureMainAudioExists();
  };

  return {
    initialize,
    setControls,
    whenReady: () => mainAudioReady,
    isMuted: () => muted,
    syncState,
    muteAndStopAll,
    stopAudioWithoutMuting,
    toggleAudio,
    updateAudioButton,
  };
}
