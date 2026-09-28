// Native Web Audio API Sound Synthesizer for Police Emergency Alarms & Radar Pings
// Runs 100% locally with zero external audio assets or load delay

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isSoundEnabled() {
  if (typeof window === 'undefined') return false;
  const setting = localStorage.getItem('netra_sound_enabled');
  return setting === null ? true : setting === 'true'; // Default enabled
}

export function setSoundEnabled(enabled) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('netra_sound_enabled', enabled ? 'true' : 'false');
  if (enabled) {
    // Play test confirmation ping
    playRadarPing();
  }
}

// 🚨 Authentic Police 2-Tone Emergency Warning Chime for Watchlist Alerts
export function playAlertSiren(severity = 'HIGH') {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const isCritical = severity === 'CRITICAL';
    const now = ctx.currentTime;

    // Dual Oscillator for richer emergency alarm timbre
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    // Frequency sequence: High tone -> Drop -> High tone (Police dispatch chime)
    if (isCritical) {
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(783.99, now + 0.15); // G5
      osc1.frequency.setValueAtTime(1046.50, now + 0.3); // C6

      osc2.frequency.setValueAtTime(493.88, now);
      osc2.frequency.setValueAtTime(392.00, now + 0.15);
      osc2.frequency.setValueAtTime(523.25, now + 0.3);
    } else {
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(659.25, now + 0.15); // E5
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(329.63, now + 0.15);
    }

    // Volume envelope
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (isCritical ? 0.5 : 0.35));

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + (isCritical ? 0.5 : 0.35));
    osc2.stop(now + (isCritical ? 0.5 : 0.35));
  } catch (err) {
    // Benign autoplay policy catch
  }
}

// Gentle Radar Ping for standard AI vehicle detections
export function playRadarPing() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {}
}
