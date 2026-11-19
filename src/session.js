// Keep your place across reloads.  When you refresh the page (or the dev
// server reloads it after a code change), where you stand, the way you face,
// and which Show toggles are off come back as they were.  It's kept in
// sessionStorage, so it lasts only for this browser tab; a new tab or window
// starts at home.  If storage is blocked, you just start at home.

const STORAGE_KEY = 'varsity-booth.session';

// The saved state, or null when there isn't one.
export function loadSession() {
  try {
    const state = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    const numbers = ['x', 'y', 'z', 'yaw', 'pitch'];
    if (!state || !numbers.every((n) => Number.isFinite(state[n]))) return null;
    if (!Array.isArray(state.hidden)) state.hidden = [];
    return state;
  } catch {
    return null;
  }
}

// Save getState() whenever the page is about to go away.
export function saveSessionOnLeave(getState) {
  const save = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(getState()));
    } catch {
      // Storage full or blocked; you'll just start at home.
    }
  };
  window.addEventListener('beforeunload', save);
  // Phones don't always send beforeunload, so also save when the page hides.
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save();
  });
}
