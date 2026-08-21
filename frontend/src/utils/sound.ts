// Web Audio API and Speech Synthesis helper for QueueFlow

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a pleasant 3-tone chime for calling a customer
 */
export function playCallChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [
      { freq: 523.25, time: 0.0, duration: 0.25 }, // C5
      { freq: 659.25, time: 0.2, duration: 0.25 }, // E5
      { freq: 783.99, time: 0.4, duration: 0.5 },  // G5
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.3, now + time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration);
    });
  } catch (e) {
    console.warn('Audio chime playback prevented or not supported', e);
  }
}

/**
 * Plays a quick positive feedback sound on service completion
 */
export function playSuccessChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [
      { freq: 587.33, time: 0.0, duration: 0.15 }, // D5
      { freq: 880.00, time: 0.12, duration: 0.35 }, // A5
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.2, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration);
    });
  } catch (e) {
    console.warn('Audio success chime playback prevented', e);
  }
}

/**
 * Announces a ticket over browser text-to-speech if available and enabled
 */
export function speakAnnouncement(tokenNumber: string, counter: string, customerName?: string): void {
  if (!('speechSynthesis' in window)) return;

  try {
    // Cancel previous speech if still talking
    window.speechSynthesis.cancel();

    // Format token with spaces so TTS speaks "A - zero - four - two"
    const formattedToken = tokenNumber.split('').join(' ');
    let text = `Ticket ${formattedToken}. Please proceed to ${counter}.`;
    if (customerName) {
      text = `Ticket ${formattedToken}, ${customerName}. Please proceed to ${counter}.`;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92; // Slightly measured, clear cadence
    utterance.pitch = 1.05;
    utterance.volume = 0.85;

    // Pick an English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Victoria')) && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis prevented', e);
  }
}
