// While developing, keep your place across reloads.  When the dev server
// reloads the page after a code change (or you reload it yourself), where you
// stand, the way you face, and which Show toggles are off come back as they
// were.  It's kept in sessionStorage, so it lasts only for this browser tab;
// a new tab or window starts at home.  The published site skips all of this
// and always starts at home.

const STORAGE_KEY = 'varsity-booth.dev-session';

// The saved state, or null when there isn't one (or this isn't the dev server).
export function loadDevSession() {
  if (!import.meta.env.DEV) return null;
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
export function saveDevSessionOnLeave(getState) {
  if (!import.meta.env.DEV) return;
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
