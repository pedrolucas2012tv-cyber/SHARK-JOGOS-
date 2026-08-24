import { storage } from './utils/storage.js';

const FILE_KEY = 'tavvkkj.save';
const EGGS_KEY = 'tavvkkj.eggs';
const SECRET_TOTAL = 6;
const FLUSH_MS = 15000;

const readFile = () => {
  const raw = storage.get(FILE_KEY, null);
  const file = raw && typeof raw === 'object' ? raw : {};
  return {
    created: Number(file.created) || Date.now(),
    runs: Number(file.runs) || 0,
    playMs: Number(file.playMs) || 0
  };
};

const file = readFile();
const listeners = new Set();
let counting = 0;
let started = false;

const persist = () => storage.set(FILE_KEY, file);

const secretsFound = () => {
  const list = storage.get(EGGS_KEY, []);
  return Array.isArray(list) ? [...new Set(list)] : [];
};

const liveMs = () => file.playMs + (counting ? performance.now() - counting : 0);

export const formatPlayTime = (ms) => {
  const total = Math.max(0, Math.round(ms / 1000));
  const pad = (value) => String(value).padStart(2, '0');
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
};

export const snapshot = () => {
  const found = secretsFound();
  const secrets = Math.min(found.length, SECRET_TOTAL);
  return {
    created: file.created,
    runs: Math.max(1, file.runs),
    playMs: liveMs(),
    playTime: formatPlayTime(liveMs()),
    found,
    secrets,
    total: SECRET_TOTAL,
    pct: Math.round((secrets / SECRET_TOTAL) * 100)
  };
};

const emit = () => listeners.forEach((fn) => fn(snapshot()));

export const onSaveChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const hasSecret = (id) => secretsFound().includes(id);

export const recordSecret = (id) => {
  const found = secretsFound();
  if (found.includes(id)) return false;
  storage.set(EGGS_KEY, [...found, id]);
  emit();
  return true;
};

const flush = () => {
  if (!counting) return;
  const now = performance.now();
  file.playMs += now - counting;
  counting = now;
  persist();
};
const resume = () => { if (!counting && !document.hidden) counting = performance.now(); };
const pause = () => { flush(); counting = 0; };

export const beginRun = () => {
  if (started) return snapshot();
  started = true;
  file.runs += 1;
  persist();
  resume();
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));
  addEventListener('pagehide', pause);
  setInterval(flush, FLUSH_MS);
  return snapshot();
};
