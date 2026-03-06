/**
 * Tiny shared app state store
 *
 * Purpose:
 * - Hold app-level UI state shared across components
 * - Provide a minimal publish/subscribe mechanism
 *
 * State model:
 * - `theme`: current theme key
 * - `fontIndex`: current chapter font index
 * - `audio`: muted/playing/track-selection snapshot
 * - `header`: header visibility snapshot
 *
 * Update behavior:
 * - `setAppState` accepts only a partial state object (no updater function)
 * - Partial updates are merged into existing state by key
 * - Every successful update notifies all current subscribers
 *
 * Subscription behavior:
 * - `subscribeToAppState(listener)` returns an unsubscribe function
 * - Unsubscribe removes that listener from future notifications
 */

const initialState = {
  theme: "yellow",
  fontIndex: 0,
  audio: {
    muted: true,
    isPlaying: false,
    selectedTrackIndex: 0,
    trackCount: 0,
  },
  header: {
    hidden: false,
  },
};

let state = initialState;
const listeners = new Set();

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeStateSlice(baseState, partialState) {
  const nextState = { ...baseState };

  Object.keys(partialState).forEach((key) => {
    const currentValue = baseState[key];
    const incomingValue = partialState[key];

    if (isPlainObject(currentValue) && isPlainObject(incomingValue)) {
      nextState[key] = mergeStateSlice(currentValue, incomingValue);
      return;
    }

    nextState[key] = incomingValue;
  });

  return nextState;
}

function notify() {
  listeners.forEach((listener) => {
    listener(state);
  });
}

export function getAppState() {
  return state;
}

export function setAppState(partialState) {
  if (!isPlainObject(partialState)) {
    return state;
  }

  const nextState = mergeStateSlice(state, partialState);

  if (!nextState || nextState === state) {
    return state;
  }

  state = nextState;
  notify();
  return state;
}

export function subscribeToAppState(listener) {
  if (typeof listener !== "function") {
    return () => null;
  }

  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetAppState() {
  state = initialState;
  notify();
}
