/**
 * NurseFlow Firebase Core — Enterprise Resilience V5.2
 * 
 * SENTINEL VERSIONING:
 *   ↑ Increment SENTINEL_VSN to force a global IndexedDB cache reset
 *   for all connected browsers. Use this when you make major Firestore
 *   schema or index changes.
 *
 * ARCHITECTURE:
 *   db is exported SYNCHRONOUSLY (required by Firebase JS SDK v9+).
 *   Sentinel cleanup runs as a non-blocking async side-effect AFTER export.
 */
import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
  clearIndexedDbPersistence,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// ─── Firebase Config ─────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCEQJqb_FyuKTpSq6Yc5g-T0wUYwUjSNNo",
  authDomain:        "nurseflow-309c7.firebaseapp.com",
  projectId:         "nurseflow-309c7",
  storageBucket:     "nurseflow-309c7.firebasestorage.app",
  messagingSenderId: "381014626562",
  appId:             "1:381014626562:web:be60f5d1d3d7d25038b21b",
  measurementId:     "G-3S8W6X48ZB",
};

export const app = initializeApp(firebaseConfig);

// ─── Sentinel Versioning ──────────────────────────────────────────────────────
const SENTINEL_VSN = "3"; // Increment this to force global cache reset on next load

// ─── Synchronous DB Init (REQUIRED — async export causes null-db bug) ─────────
// NOTE: initializeFirestore is synchronous. Persistence is configured here.
//       The sentinel CLEANUP is done async below, but db itself is always valid.
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
  console.log("[Firebase] Resilience V5.2 | Mode: Persistent Multi-Tab");
} catch (err) {
  console.error("[Firebase] Persistence init failed. Falling back to memory cache:", err);
  db = initializeFirestore(app, {}); // Memory fallback — no localCache
}

export { db };

// ─── Other Exports ────────────────────────────────────────────────────────────
export const auth      = getAuth(app);
export const functions = getFunctions(app, "asia-southeast2");

// ─── Sentinel Side-Effect (async, non-blocking) ───────────────────────────────
// Runs AFTER the module resolves. If version mismatches, clears IndexedDB and
// reloads the app so the fresh db instance picks up a clean state.
(async () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  const storedVsn = localStorage.getItem("NF_CACHE_VSN");

  if (storedVsn !== SENTINEL_VSN) {
    console.warn(
      `[Sentinel] Version mismatch (stored: ${storedVsn} → required: ${SENTINEL_VSN}). Clearing IndexedDB...`
    );
    try {
      // Terminate FIRST — Firestore requires the connection to be closed before clearing
      await terminate(db);
      await clearIndexedDbPersistence(db);
      localStorage.setItem("NF_CACHE_VSN", SENTINEL_VSN);
      console.log("[Sentinel] Cache cleared. Reloading...");
      window.location.reload(); // Reload so fresh db instance is used
    } catch (e) {
      console.error("[Sentinel] Cache clear failed:", e);
      // Not fatal — app will continue with potentially stale cache
    }
  } else {
    console.log(`[Firebase] Sentinel OK (VSN: ${SENTINEL_VSN})`);
  }
})();

// ─── Utility: Force Cache Reset (expose to Admin UI) ─────────────────────────
export const forceResetCache = async () => {
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
    localStorage.removeItem("NF_CACHE_VSN");
    window.location.reload();
  } catch (e) {
    console.error("[ForceReset] Failed:", e);
  }
};
