// Shared by the server (NextAuth session lifetime) and the browser (idle
// sign-out timer), so both enforce the same limit.
export const IDLE_TIMEOUT_MINUTES = 60;
export const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

// localStorage key holding the time of the last user activity, shared by all
// open tabs. Present only while signed in; cleared on any deliberate sign-out.
export const LAST_ACTIVITY_KEY = "vg:lastActivity";
