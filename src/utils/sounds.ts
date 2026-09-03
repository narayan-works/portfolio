import { defineSound, ensureReady } from "@web-kits/audio";

// Sound Mute State Management with localStorage & event sync
const STORAGE_KEY = "portfolio_sound_muted";

let isMutedState = typeof window !== "undefined"
  ? localStorage.getItem(STORAGE_KEY) === "true"
  : false;

export const isSoundMuted = (): boolean => isMutedState;

export const setSoundMuted = (muted: boolean): boolean => {
  isMutedState = muted;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, String(muted));
    window.dispatchEvent(new CustomEvent("portfolio-sound-mute-change", { detail: { muted } }));
  }
  return isMutedState;
};

export const toggleSoundMute = (): boolean => {
  return setSoundMuted(!isMutedState);
};

// Unlock AudioContext on first user gesture (Safari & Chrome auto-play policy)
let isAudioUnlocked = false;
function unlockAudioContext() {
  if (typeof window === "undefined" || isAudioUnlocked) return;
  ensureReady().then(() => {
    isAudioUnlocked = true;
  }).catch(() => { });
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlockAudioContext, { once: true, capture: true });
  window.addEventListener("keydown", unlockAudioContext, { once: true, capture: true });
}

// Cooldown / Debounce Helper to prevent audio overload
let lastPlayTime = 0;
const MIN_INTERVAL_MS = 20;

function safePlay(playFn: () => void, throttleMs: number = MIN_INTERVAL_MS) {
  if (typeof window === "undefined" || isMutedState) return;
  const now = performance.now();
  if (now - lastPlayTime < throttleMs) return;
  lastPlayTime = now;

  unlockAudioContext();

  try {
    playFn();
  } catch {
    // Gracefully ignore autoplay / audio context restrictions
  }
}

// -----------------------------------------------------------------------------
// Procedural Sound Definitions (Radically distinct acoustic instruments & textures)
// -----------------------------------------------------------------------------

// 1. Card Hover (Crisp Airy Card Lift Swish - smooth silk entry, gain 0.22)
const rawCardHoverSound = defineSound({
  source: { type: "noise", color: "pink" },
  filter: {
    type: "lowpass",
    frequency: 800,
    resonance: 0.85,
    envelope: { attack: 0.03, peak: 2050, decay: 0.16 },
  },
  envelope: { attack: 0.025, decay: 0.20 },
  gain: 0.22,
});

// 1b. Card Leave (Crisp Airy Card Settle - gentle crisp settle)
const rawCardLeaveSound = defineSound({
  source: { type: "noise", color: "pink" },
  filter: {
    type: "lowpass",
    frequency: 1850,
    resonance: 0.75,
    envelope: { attack: 0.015, peak: 600, decay: 0.15 },
  },
  envelope: { attack: 0.02, decay: 0.18 },
  gain: 0.14,
});

// 2. Button & Link Click: Warm Tactile Button Pop (Mellow & soft, gain 0.18)
const rawClickSound = defineSound({
  layers: [
    {
      source: { type: "triangle", frequency: 520 },
      filter: { type: "lowpass", frequency: 1100, resonance: 0.8 },
      envelope: { attack: 0.002, decay: 0.026 },
      gain: 0.18,
    },
    {
      source: { type: "sine", frequency: 760 },
      envelope: { attack: 0.001, decay: 0.014 },
      gain: 0.10,
    },
  ],
});

// 3. Tab / Category Filter Switch: 4-Step Progressing Soft Warm Button Beat
let filterBeatStep = 0;
let lastFilterBeatTime = 0;
const FILTER_BEAT_RESET_MS = 2500;

// Step 1: Base warm button pop (440Hz, soft)
const rawTabStep1 = defineSound({
  layers: [
    { source: { type: "triangle", frequency: 440 }, filter: { type: "lowpass", frequency: 1000 }, envelope: { attack: 0.002, decay: 0.026 }, gain: 0.16 },
    { source: { type: "sine", frequency: 660 }, envelope: { attack: 0.001, decay: 0.012 }, gain: 0.08 },
  ],
});

// Step 2: Melodic step 2 (550Hz, soft)
const rawTabStep2 = defineSound({
  layers: [
    { source: { type: "triangle", frequency: 550 }, filter: { type: "lowpass", frequency: 1150 }, envelope: { attack: 0.002, decay: 0.026 }, gain: 0.16 },
    { source: { type: "sine", frequency: 825 }, envelope: { attack: 0.001, decay: 0.012 }, gain: 0.08 },
  ],
});

// Step 3: Melodic step 3 (660Hz, soft)
const rawTabStep3 = defineSound({
  layers: [
    { source: { type: "triangle", frequency: 660 }, filter: { type: "lowpass", frequency: 1300 }, envelope: { attack: 0.002, decay: 0.026 }, gain: 0.16 },
    { source: { type: "sine", frequency: 990 }, envelope: { attack: 0.001, decay: 0.012 }, gain: 0.08 },
  ],
});

// Step 4+: Peak resolution step (800Hz, soft) - stays constant on 4th+ clicks
const rawTabStep4 = defineSound({
  layers: [
    { source: { type: "triangle", frequency: 800 }, filter: { type: "lowpass", frequency: 1450 }, envelope: { attack: 0.002, decay: 0.028 }, gain: 0.18 },
    { source: { type: "sine", frequency: 1200 }, envelope: { attack: 0.001, decay: 0.014 }, gain: 0.09 },
  ],
});

// 4. Open / Expand: Airy Paper / Silk Swish (Pink noise swept through 400Hz -> 3200Hz filter)
const rawOpenSound = defineSound({
  layers: [
    {
      source: { type: "noise", color: "pink" },
      filter: {
        type: "bandpass",
        frequency: 500,
        envelope: { attack: 0.025, peak: 3200, decay: 0.09 },
      },
      envelope: { attack: 0.015, decay: 0.11 },
      gain: 0.22,
    },
  ],
});

// 5. Close / Dismiss: Soft Magnetic Latch / Snap Shut (2800Hz -> 200Hz descending noise)
const rawCloseSound = defineSound({
  layers: [
    {
      source: { type: "noise", color: "pink" },
      filter: {
        type: "bandpass",
        frequency: 2800,
        envelope: { attack: 0.002, peak: 300, decay: 0.06 },
      },
      envelope: { attack: 0.001, decay: 0.065 },
      gain: 0.18,
    },
    {
      source: { type: "sine", frequency: 240 },
      envelope: { attack: 0.001, decay: 0.04 },
      gain: 0.12,
    },
  ],
});

// 6. Theme Toggle: Soft Warm Tactile Toggle Button Pop
const rawThemeSound = defineSound({
  layers: [
    {
      source: { type: "triangle", frequency: { start: 520, end: 720 } },
      filter: { type: "lowpass", frequency: 1300 },
      envelope: { attack: 0.002, decay: 0.028 },
      gain: 0.18,
    },
    {
      source: { type: "sine", frequency: 1040 },
      envelope: { attack: 0.001, decay: 0.014 },
      gain: 0.10,
    },
  ],
});

// 7. Copy Spark (Footer Copy): 4-Step Progressing Soft Crystal Sparkle
let copyBeatStep = 0;
let lastCopyBeatTime = 0;
const COPY_BEAT_RESET_MS = 3000;

// Step 1: 2-note crystal chime (soft, gain 0.14)
const rawCopySparkStep1 = defineSound({
  layers: [
    { source: { type: "sine", frequency: 880 }, envelope: { attack: 0.001, decay: 0.14 }, gain: 0.14 },
    { source: { type: "triangle", frequency: 1320 }, delay: 0.02, envelope: { attack: 0.001, decay: 0.16 }, gain: 0.11 },
  ],
});

// Step 2: 3-note ascending crystal sparkle (soft, gain 0.14)
const rawCopySparkStep2 = defineSound({
  layers: [
    { source: { type: "sine", frequency: 1108.73 }, envelope: { attack: 0.001, decay: 0.14 }, gain: 0.14 },
    { source: { type: "triangle", frequency: 1661.22 }, delay: 0.02, envelope: { attack: 0.001, decay: 0.18 }, gain: 0.11 },
    { source: { type: "sine", frequency: 2217.46 }, delay: 0.04, envelope: { attack: 0.001, decay: 0.20 }, gain: 0.12 },
  ],
});

// Step 3: 3-note high crystal cascade (soft, gain 0.14)
const rawCopySparkStep3 = defineSound({
  layers: [
    { source: { type: "sine", frequency: 1318.51 }, envelope: { attack: 0.001, decay: 0.15 }, gain: 0.14 },
    { source: { type: "triangle", frequency: 1975.53 }, delay: 0.025, envelope: { attack: 0.001, decay: 0.19 }, gain: 0.12 },
    { source: { type: "sine", frequency: 2637.02 }, delay: 0.05, envelope: { attack: 0.001, decay: 0.22 }, gain: 0.13 },
  ],
});

// Step 4+: Peak resolution 4-note celestial harp cascade (soft, gain 0.14)
const rawCopySparkStep4 = defineSound({
  layers: [
    { source: { type: "sine", frequency: 880 }, envelope: { attack: 0.001, decay: 0.15 }, gain: 0.13 },
    { source: { type: "triangle", frequency: 1320 }, delay: 0.02, envelope: { attack: 0.001, decay: 0.18 }, gain: 0.12 },
    { source: { type: "sine", frequency: 1760 }, delay: 0.04, envelope: { attack: 0.001, decay: 0.22 }, gain: 0.14 },
    { source: { type: "triangle", frequency: 2217.46 }, delay: 0.06, envelope: { attack: 0.002, decay: 0.26 }, gain: 0.13 },
  ],
});

// 8. ASCII Fluid Ripple: 5-Step Progressing Water Droplet Beat (Footer ASCII)
let rippleBeatStep = 0;
let lastRippleBeatTime = 0;
const RIPPLE_BEAT_RESET_MS = 3000; // 3 seconds inactivity reset

// Step 1: Deep liquid bubble drop (280Hz -> 580Hz)
const rawAsciiRippleStep1 = defineSound({
  layers: [
    { source: { type: "sine", frequency: { start: 280, end: 580 } }, envelope: { attack: 0.002, decay: 0.065 }, gain: 0.14 },
    { source: { type: "sine", frequency: 1160 }, delay: 0.012, envelope: { attack: 0.001, decay: 0.05 }, gain: 0.08 },
  ],
});

// Step 2: Mid liquid bubble drop (380Hz -> 760Hz)
const rawAsciiRippleStep2 = defineSound({
  layers: [
    { source: { type: "sine", frequency: { start: 380, end: 760 } }, envelope: { attack: 0.002, decay: 0.065 }, gain: 0.14 },
    { source: { type: "sine", frequency: 1520 }, delay: 0.012, envelope: { attack: 0.001, decay: 0.05 }, gain: 0.08 },
  ],
});

// Step 3: High liquid bubble drop (500Hz -> 1000Hz)
const rawAsciiRippleStep3 = defineSound({
  layers: [
    { source: { type: "sine", frequency: { start: 500, end: 1000 } }, envelope: { attack: 0.002, decay: 0.065 }, gain: 0.14 },
    { source: { type: "sine", frequency: 2000 }, delay: 0.012, envelope: { attack: 0.001, decay: 0.05 }, gain: 0.08 },
  ],
});

// Step 4: Crisp splash droplet (640Hz -> 1280Hz)
const rawAsciiRippleStep4 = defineSound({
  layers: [
    { source: { type: "sine", frequency: { start: 640, end: 1280 } }, envelope: { attack: 0.002, decay: 0.070 }, gain: 0.15 },
    { source: { type: "sine", frequency: 2560 }, delay: 0.012, envelope: { attack: 0.001, decay: 0.055 }, gain: 0.09 },
  ],
});

// Step 5+: Celestial bell droplet (800Hz -> 1600Hz) - stays constant on 5th+ clicks
const rawAsciiRippleStep5 = defineSound({
  layers: [
    { source: { type: "sine", frequency: { start: 800, end: 1600 } }, envelope: { attack: 0.002, decay: 0.075 }, gain: 0.15 },
    { source: { type: "sine", frequency: 3200 }, delay: 0.012, envelope: { attack: 0.001, decay: 0.06 }, gain: 0.09 },
  ],
});

// -----------------------------------------------------------------------------
// GhostRunner Game Sound Definitions (Ping-Pong Reverse Pattern: 1->2->3->4->3->2->1)
// -----------------------------------------------------------------------------

const PINGPONG_LADDER_PATTERN = [1, 2, 3, 4, 3, 2];
let gameScoreLadderIdx = 0;
let gameHitLadderIdx = 0;

const rawGameJumpSound = defineSound({
  source: { type: "square", frequency: { start: 280, end: 720 } },
  envelope: { attack: 0.001, decay: 0.07 },
  gain: 0.22,
});

// Green Score Bar 8-Note Loopable Pentatonic Wave (C5 -> D5 -> E5 -> G5 -> A5 -> G5 -> E5 -> D5 -> loop)
const GREEN_MELODY_FREQS = [523.25, 587.33, 659.25, 783.99, 880.00, 783.99, 659.25, 587.33];
let greenMelodyIdx = 0;

const createGreenScoreSound = (freq: number) =>
  defineSound({
    layers: [
      { source: { type: "sine", frequency: freq }, envelope: { attack: 0.003, decay: 0.24 }, gain: 0.22 },
      { source: { type: "triangle", frequency: freq * 2 }, delay: 0.015, envelope: { attack: 0.003, decay: 0.20 }, gain: 0.16 },
    ],
  });

// Red Bar Hit Step 1 (Low thud - 160Hz)
const rawGameHitStep1 = defineSound({
  layers: [
    { source: { type: "noise", color: "white" }, filter: { type: "lowpass", frequency: 300 }, envelope: { attack: 0.001, decay: 0.12 }, gain: 0.26 },
    { source: { type: "sawtooth", frequency: { start: 160, end: 50 } }, envelope: { attack: 0.001, decay: 0.14 }, gain: 0.18 },
  ],
});

// Red Bar Hit Step 2 (Mid thud - 210Hz)
const rawGameHitStep2 = defineSound({
  layers: [
    { source: { type: "noise", color: "white" }, filter: { type: "lowpass", frequency: 380 }, envelope: { attack: 0.001, decay: 0.12 }, gain: 0.26 },
    { source: { type: "sawtooth", frequency: { start: 210, end: 70 } }, envelope: { attack: 0.001, decay: 0.14 }, gain: 0.18 },
  ],
});

// Red Bar Hit Step 3 (Higher thud - 270Hz)
const rawGameHitStep3 = defineSound({
  layers: [
    { source: { type: "noise", color: "white" }, filter: { type: "lowpass", frequency: 460 }, envelope: { attack: 0.001, decay: 0.12 }, gain: 0.26 },
    { source: { type: "sawtooth", frequency: { start: 270, end: 90 } }, envelope: { attack: 0.001, decay: 0.14 }, gain: 0.18 },
  ],
});

// Red Bar Hit Step 4 (Peak thud - 340Hz)
const rawGameHitStep4 = defineSound({
  layers: [
    { source: { type: "noise", color: "white" }, filter: { type: "lowpass", frequency: 540 }, envelope: { attack: 0.001, decay: 0.13 }, gain: 0.28 },
    { source: { type: "sawtooth", frequency: { start: 340, end: 110 } }, envelope: { attack: 0.001, decay: 0.15 }, gain: 0.20 },
  ],
});

const rawGameOverSound = defineSound({
  layers: [
    {
      source: { type: "sawtooth", frequency: 440 }, // A4
      envelope: { attack: 0.005, decay: 0.20 },
      gain: 0.25,
    },
    {
      source: { type: "sawtooth", frequency: 349.23 }, // F4
      delay: 0.09,
      envelope: { attack: 0.005, decay: 0.25 },
      gain: 0.26,
    },
    {
      source: { type: "sawtooth", frequency: 261.63 }, // C4
      delay: 0.18,
      envelope: { attack: 0.01, decay: 0.45 },
      gain: 0.28,
    },
  ],
});

const rawGameStartSound = defineSound({
  layers: [
    {
      source: { type: "triangle", frequency: 523.25 }, // C5
      envelope: { attack: 0.002, decay: 0.08 },
      gain: 0.22,
    },
    {
      source: { type: "triangle", frequency: 659.25 }, // E5
      delay: 0.035,
      envelope: { attack: 0.002, decay: 0.08 },
      gain: 0.22,
    },
    {
      source: { type: "triangle", frequency: 783.99 }, // G5
      delay: 0.07,
      envelope: { attack: 0.002, decay: 0.10 },
      gain: 0.24,
    },
    {
      source: { type: "triangle", frequency: 1046.5 }, // C6
      delay: 0.105,
      envelope: { attack: 0.002, decay: 0.22 },
      gain: 0.26,
    },
  ],
});

// -----------------------------------------------------------------------------
// Public Audio API
// -----------------------------------------------------------------------------

export const playSound = {
  cardHover: (_throttleMs = 45) => {},
  cardLeave: (_throttleMs = 45) => {},
  click: (_throttleMs = 25) => { }, // Completely disabled click sound
  tab: (throttleMs = 25) => {
    const now = performance.now();
    if (now - lastFilterBeatTime > FILTER_BEAT_RESET_MS) {
      filterBeatStep = 0;
    }
    lastFilterBeatTime = now;
    filterBeatStep = Math.min(filterBeatStep + 1, 4);

    if (filterBeatStep === 1) safePlay(() => rawTabStep1(), throttleMs);
    else if (filterBeatStep === 2) safePlay(() => rawTabStep2(), throttleMs);
    else if (filterBeatStep === 3) safePlay(() => rawTabStep3(), throttleMs);
    else safePlay(() => rawTabStep4(), throttleMs);
  },
  open: (throttleMs = 40) => safePlay(() => rawOpenSound(), throttleMs),
  close: (throttleMs = 40) => safePlay(() => rawCloseSound(), throttleMs),
  theme: (throttleMs = 50) => safePlay(() => rawThemeSound(), throttleMs),
  copySpark: (throttleMs = 50) => {
    const now = performance.now();
    if (now - lastCopyBeatTime > COPY_BEAT_RESET_MS) {
      copyBeatStep = 0;
    }
    lastCopyBeatTime = now;
    copyBeatStep = Math.min(copyBeatStep + 1, 4);

    if (copyBeatStep === 1) safePlay(() => rawCopySparkStep1(), throttleMs);
    else if (copyBeatStep === 2) safePlay(() => rawCopySparkStep2(), throttleMs);
    else if (copyBeatStep === 3) safePlay(() => rawCopySparkStep3(), throttleMs);
    else safePlay(() => rawCopySparkStep4(), throttleMs);
  },
  asciiRipple: (throttleMs = 0) => {
    const now = performance.now();
    if (now - lastRippleBeatTime > RIPPLE_BEAT_RESET_MS) {
      rippleBeatStep = 0;
    }
    lastRippleBeatTime = now;
    rippleBeatStep = Math.min(rippleBeatStep + 1, 5);

    if (rippleBeatStep === 1) safePlay(() => rawAsciiRippleStep1(), throttleMs);
    else if (rippleBeatStep === 2) safePlay(() => rawAsciiRippleStep2(), throttleMs);
    else if (rippleBeatStep === 3) safePlay(() => rawAsciiRippleStep3(), throttleMs);
    else if (rippleBeatStep === 4) safePlay(() => rawAsciiRippleStep4(), throttleMs);
    else safePlay(() => rawAsciiRippleStep5(), throttleMs);
  },

  // Game specific (8-Note Pentatonic Green Score Melody + Ping-Pong Red Hit)
  gameJump: () => safePlay(() => rawGameJumpSound(), 35),
  gameScore: () => {
    const freq = GREEN_MELODY_FREQS[greenMelodyIdx % GREEN_MELODY_FREQS.length];
    greenMelodyIdx++;
    safePlay(() => createGreenScoreSound(freq)(), 0);
  },
  gameHit: () => {
    const step = PINGPONG_LADDER_PATTERN[gameHitLadderIdx % PINGPONG_LADDER_PATTERN.length];
    gameHitLadderIdx++;
    if (step === 1) safePlay(() => rawGameHitStep1(), 0);
    else if (step === 2) safePlay(() => rawGameHitStep2(), 0);
    else if (step === 3) safePlay(() => rawGameHitStep3(), 0);
    else safePlay(() => rawGameHitStep4(), 0);
  },
  gameOver: () => safePlay(() => rawGameOverSound(), 180),
  gameStart: () => {
    greenMelodyIdx = 0;
    gameHitLadderIdx = 0;
    safePlay(() => rawGameStartSound(), 120);
  },
};

if (typeof window !== "undefined") {
  (window as any).portfolioSound = playSound;
}
