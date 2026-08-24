import { storage } from './utils/storage.js';

const STORAGE_KEY = 'tavvkkj.sound';
const MIX_KEY = 'tavvkkj.mix';
const DEFAULT_MIX = { music: 0.35, sfx: 0.7 };

export function createSfx({ reduceMotion }) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const listeners = new Set();

  let enabled = storage.get(STORAGE_KEY, reduceMotion ? false : true) === true;
  const stored = storage.get(MIX_KEY, null);
  const mix = {
    music: clamp01(stored?.music ?? DEFAULT_MIX.music),
    sfx: clamp01(stored?.sfx ?? DEFAULT_MIX.sfx)
  };

  if (!AudioCtx) return silent(listeners, mix);

  let ctx;
  let master;
  let sfxBus;
  let musicBus;
  let room;
  let roomSend;
  const tracks = new Map();
  let currentSrc = null;
  let playing = null;
  let wanted = false;
  let drone = null;
  let bellTimer = 0;

  const buildRoom = () => {
    const seconds = 1.9;
    const rate = ctx.sampleRate;
    const frames = Math.floor(rate * seconds);
    const buffer = ctx.createBuffer(2, frames, rate);
    for (let c = 0; c < 2; c += 1) {
      const data = buffer.getChannelData(c);
      let low = 0;
      for (let i = 0; i < frames; i += 1) {
        const decay = (1 - i / frames) ** 3.2;

        low += ((Math.random() * 2 - 1) - low) * 0.22;
        data[i] = low * decay;
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = buffer;
    return convolver;
  };

  const ensure = () => {
    if (ctx) return ctx;
    try {
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = 0.42;
      master.connect(ctx.destination);

      sfxBus = ctx.createGain();
      sfxBus.gain.value = mix.sfx;
      sfxBus.connect(master);
      musicBus = ctx.createGain();
      musicBus.gain.value = mix.music;
      musicBus.connect(master);
      room = buildRoom();
      roomSend = ctx.createGain();
      roomSend.gain.value = 0.5;
      roomSend.connect(room).connect(sfxBus);
    } catch { ctx = null; }
    return ctx;
  };

  const live = () => enabled && ensure() && ctx.state !== 'closed';

  const voice = ({ type = 'sine', from, to, t0 = 0, dur, gain = 0.1, cutoff = 2400, wet = 0.4, curve = 'exp', bus = 'sfx' }) => {
    const start = ctx.currentTime + t0;
    const out = bus === 'music' ? musicBus : sfxBus;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.setValueAtTime(cutoff, start);
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    if (to) {
      if (curve === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + dur);
      else osc.frequency.linearRampToValueAtTime(to, start + dur);
    }
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.05, dur * 0.22));
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(tone).connect(env);
    const send = ctx.createGain();
    send.gain.value = wet;
    env.connect(out);
    env.connect(send).connect(roomSend);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  };

  const air = ({ t0 = 0, dur = 0.6, gain = 0.08, hz0 = 900, hz1 = 220, q = 0.9, wet = 0.55 }) => {
    const start = ctx.currentTime + t0;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * 0.55;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = q;
    band.frequency.setValueAtTime(hz0, start);
    band.frequency.exponentialRampToValueAtTime(Math.max(20, hz1), start + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + dur * 0.4);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(band).connect(env);
    const send = ctx.createGain();
    send.gain.value = wet;
    env.connect(sfxBus);
    env.connect(send).connect(roomSend);
    src.start(start);
    src.stop(start + dur + 0.05);
  };

  const trackFor = (src) => {
    if (!src) return null;
    const cached = tracks.get(src);
    if (cached) return cached;
    let entry = null;
    try {
      const element = new Audio(src);
      element.loop = true;
      element.preload = 'auto';
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      ctx.createMediaElementSource(element).connect(gain).connect(musicBus);
      entry = { element, gain, failed: false };
      element.addEventListener('error', () => {
        entry.failed = true;
        if (playing !== entry) return;
        playing = null;
        startDrone();
      });
      tracks.set(src, entry);
    } catch { return null; }
    return entry;
  };

  const fadeTo = (entry, value, seconds) => {
    entry.gain.gain.cancelScheduledValues(ctx.currentTime);
    entry.gain.gain.setTargetAtTime(value, ctx.currentTime, seconds);
  };

  const retire = (entry) => {
    if (!entry) return;
    fadeTo(entry, 0.0001, 0.4);
    setTimeout(() => { if (playing !== entry) entry.element.pause(); }, 1600);
  };


  const scheduleBell = () => {
    clearTimeout(bellTimer);
    if (!drone) return;
    bellTimer = setTimeout(() => {
      if (!drone || !live() || mix.music <= 0.001) return;
      const note = [523.25, 587.33, 659.25, 783.99, 880][Math.floor(Math.random() * 5)];
      voice({ type: 'sine', from: note, dur: 3.4, gain: 0.02, cutoff: 3000, wet: 0, bus: 'music' });
      voice({ type: 'sine', from: note * 2, t0: 0.08, dur: 2.6, gain: 0.006, cutoff: 4000, wet: 0, bus: 'music' });
      scheduleBell();
    }, 9000 + Math.random() * 13000);
  };

  const startDrone = () => {
    if (drone || !live() || mix.music <= 0.001) return;
    const t = ctx.currentTime;
    const pad = ctx.createGain();
    pad.gain.setValueAtTime(0.0001, t);
    pad.gain.setTargetAtTime(0.16, t, 3.2);
    pad.connect(musicBus);

    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 340;
    tone.Q.value = 0.7;
    tone.connect(pad);

    const sweep = ctx.createOscillator();
    sweep.frequency.value = 0.02;
    const sweepDepth = ctx.createGain();
    sweepDepth.gain.value = 210;
    sweep.connect(sweepDepth).connect(tone.frequency);
    sweep.start(t);

    const oscs = [
      { hz: 55, type: 'sine', gain: 0.5, detune: -4 },
      { hz: 82.41, type: 'sine', gain: 0.3, detune: 3 },
      { hz: 110, type: 'triangle', gain: 0.16, detune: -7 },
      { hz: 164.81, type: 'triangle', gain: 0.09, detune: 5 }
    ].map(({ hz, type, gain, detune }) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = hz;
      osc.detune.value = detune;
      const level = ctx.createGain();
      level.gain.value = gain;
      osc.connect(level).connect(tone);
      osc.start(t);
      return osc;
    });

    drone = { pad, oscs, sweep };
    scheduleBell();
  };

  const startMusic = () => {
    if (!live() || mix.music <= 0.001) return;
    wanted = true;
    const entry = trackFor(currentSrc);
    if (!entry || entry.failed) { startDrone(); return; }
    stopDrone();
    if (playing && playing !== entry) retire(playing);
    playing = entry;
    fadeTo(entry, 1, 0.9);
    entry.element.play()?.catch(() => {
      entry.failed = true;
      if (playing === entry) playing = null;
      startDrone();
    });
  };

  const stopMusic = () => {
    wanted = false;
    stopDrone();
    const entry = playing;
    playing = null;
    retire(entry);
  };

  const setTrack = (src) => {
    if (src === currentSrc) return;
    currentSrc = src;
    if (!wanted) return;
    if (!live() || mix.music <= 0.001) return;
    startMusic();
  };

  const stopDrone = () => {
    clearTimeout(bellTimer);
    if (!drone) return;
    const { pad, oscs, sweep } = drone;
    drone = null;
    const t = ctx.currentTime;

    pad.gain.cancelScheduledValues(t);
    pad.gain.setTargetAtTime(0.0001, t, 0.5);
    setTimeout(() => {
      oscs.forEach((osc) => { try { osc.stop(); } catch {  } });
      try { sweep.stop(); } catch {  }
      pad.disconnect();
    }, 2600);
  };

  const api = {
    get enabled() { return enabled; },
    get mix() { return { ...mix }; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    setEnabled(value) {
      enabled = Boolean(value);
      storage.set(STORAGE_KEY, enabled);
      if (enabled) { api.resume(); startMusic(); }
      else stopMusic();
      listeners.forEach((fn) => fn(enabled));
    },

    setVolume(kind, value) {
      if (!(kind in mix)) return;
      mix[kind] = clamp01(value);
      storage.set(MIX_KEY, { ...mix });
      if (!ctx) { if (kind === 'music' && mix.music > 0) api.resume(); return; }
      const bus = kind === 'music' ? musicBus : sfxBus;
      bus.gain.setTargetAtTime(mix[kind], ctx.currentTime, 0.04);
      if (kind !== 'music') return;
      if (mix.music <= 0.001) stopMusic();
      else if (enabled) startMusic();
    },
    getVolume(kind) { return mix[kind] ?? 0; },
    resume() {
      const c = ensure();
      if (c && c.state === 'suspended') c.resume().catch(() => {});
    },
    music(on) { if (on) startMusic(); else stopMusic(); },
    setTrack,

    confirm() {
      if (!live()) return;
      voice({ type: 'triangle', from: 196, dur: 0.5, gain: 0.09, cutoff: 1500, wet: 0.35 });
      voice({ type: 'sine', from: 294, t0: 0.055, dur: 0.62, gain: 0.06, cutoff: 2200, wet: 0.5 });
      voice({ type: 'sine', from: 98, dur: 0.7, gain: 0.05, cutoff: 700, wet: 0.3 });
    },

    dive() {
      if (!live()) return;
      voice({ type: 'sine', from: 320, to: 74, dur: 0.72, gain: 0.09, cutoff: 1100, wet: 0.7 });
      air({ dur: 0.66, gain: 0.06, hz0: 1400, hz1: 260, q: 0.6, wet: 0.7 });
    },

    land() {
      if (!live()) return;
      voice({ type: 'sine', from: 120, to: 38, dur: 0.55, gain: 0.15, cutoff: 420, wet: 0.25, curve: 'lin' });
      air({ dur: 0.42, gain: 0.07, hz0: 620, hz1: 140, q: 0.5, wet: 0.8 });
    },

    arrive() {
      if (!live()) return;
      voice({ type: 'sine', from: 523, dur: 0.9, gain: 0.028, cutoff: 3200, wet: 0.9 });
      voice({ type: 'sine', from: 784, t0: 0.14, dur: 0.9, gain: 0.02, cutoff: 3600, wet: 0.95 });
      startMusic();
    },

    move() {
      if (!live()) return;
      voice({ type: 'sine', from: 1180, dur: 0.055, gain: 0.018, cutoff: 4000, wet: 0.18 });
    },

    select() {
      if (!live()) return;
      voice({ type: 'triangle', from: 392, dur: 0.2, gain: 0.05, cutoff: 2400, wet: 0.35 });
      voice({ type: 'sine', from: 588, t0: 0.03, dur: 0.26, gain: 0.03, cutoff: 3000, wet: 0.5 });
    },

    open() {
      if (!live()) return;
      voice({ type: 'triangle', from: 174, to: 233, dur: 0.26, gain: 0.06, cutoff: 1400, wet: 0.5, curve: 'lin' });
      voice({ type: 'sine', from: 87, dur: 0.4, gain: 0.045, cutoff: 500, wet: 0.35 });
    },
    close() {
      if (!live()) return;
      voice({ type: 'triangle', from: 233, to: 155, dur: 0.24, gain: 0.04, cutoff: 1200, wet: 0.5, curve: 'lin' });
    },

    deny() {
      if (!live()) return;
      voice({ type: 'triangle', from: 138, dur: 0.22, gain: 0.05, cutoff: 900, wet: 0.3 });
    }
  };
  return api;
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(1, Math.max(0, number));
}

function silent(listeners, mix) {
  const noop = () => {};
  return {
    enabled: false,
    mix: { ...mix },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    setEnabled: noop,
    setVolume: noop,
    getVolume: () => 0,
    resume: noop,
    music: noop,
    setTrack: noop,
    confirm: noop, dive: noop, land: noop, arrive: noop,
    move: noop, select: noop, open: noop, close: noop, deny: noop
  };
}
