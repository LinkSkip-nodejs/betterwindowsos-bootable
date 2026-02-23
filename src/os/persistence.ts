// Persistence layer — saves OS state to localStorage with debounced writes.
// On crash/power loss, state is recovered on next boot.

const STORAGE_KEY = "webos-state";
const SAVE_DEBOUNCE = 2000; // 2 seconds

export type GoogleAccount = {
  email: string;
  name: string;
  picture: string;
  accessToken: string;
} | null;

export type PersistedState = {
  fs: unknown;
  theme: string;
  wallpaperId: number;
  accentColor: string;
  cursorSize: string;
  volume: number;
  muted: boolean;
  lockPin: string; // legacy, kept for migration
  lockPinHash: string;
  dndMode: boolean;
  widgets: unknown[];
  desktopItems: unknown[];
  setupComplete: boolean;
  username: string;
  connectedWifi: string | null;
  soundScheme: string;
  fontFamily: string;
  googleAccount: GoogleAccount;
  _savedAt: number;
  _version: number;
};

const STATE_VERSION = 1;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const saveState = (state: PersistedState): void => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      const data = { ...state, _savedAt: Date.now(), _version: STATE_VERSION };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or unavailable — silently fail
    }
  }, SAVE_DEBOUNCE);
};

export const saveStateImmediate = (state: PersistedState): void => {
  if (debounceTimer) clearTimeout(debounceTimer);
  try {
    const data = { ...state, _savedAt: Date.now(), _version: STATE_VERSION };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
};

export const loadState = (): PersistedState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data._version !== STATE_VERSION) return null;
    return data as PersistedState;
  } catch {
    return null;
  }
};

export const clearPersistedState = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const hasPersistedState = (): boolean => {
  return localStorage.getItem(STORAGE_KEY) !== null;
};
