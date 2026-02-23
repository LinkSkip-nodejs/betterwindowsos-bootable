// BWOS Audio Engine — synthesized sounds with schemes and volume integration

export type SoundEvent =
  | "startup" | "click" | "windowOpen" | "windowClose"
  | "minimize" | "maximize" | "notification" | "error"
  | "lock" | "unlock" | "snap" | "trash"
  | "recycle" | "typing" | "tabSwitch" | "screenshot"
  | "login" | "logout" | "hover";

export type SoundScheme = "default" | "retro" | "minimal" | "silent";

type ToneParams = {
  freq: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  delay?: number;
};

type SchemeDefinition = Record<SoundEvent, ToneParams[]>;

/* ── Scheme definitions ─────────────────────────────────── */

const defaultScheme: SchemeDefinition = {
  startup: [
    { freq: 523.25, duration: 0.4, type: "sine", volume: 0.12 },
    { freq: 659.25, duration: 0.4, type: "sine", volume: 0.1, delay: 0.1 },
    { freq: 783.99, duration: 0.5, type: "sine", volume: 0.1, delay: 0.2 },
    { freq: 1046.5, duration: 0.6, type: "sine", volume: 0.08, delay: 0.35 },
  ],
  click: [{ freq: 800, duration: 0.04, type: "square", volume: 0.06 }],
  windowOpen: [
    { freq: 300, duration: 0.12, type: "sine", volume: 0.08 },
    { freq: 500, duration: 0.1, type: "sine", volume: 0.06, delay: 0.04 },
  ],
  windowClose: [
    { freq: 500, duration: 0.1, type: "sine", volume: 0.06 },
    { freq: 300, duration: 0.12, type: "sine", volume: 0.08, delay: 0.04 },
  ],
  minimize: [
    { freq: 600, duration: 0.06, type: "sine", volume: 0.05 },
    { freq: 400, duration: 0.08, type: "sine", volume: 0.04, delay: 0.03 },
  ],
  maximize: [
    { freq: 400, duration: 0.06, type: "sine", volume: 0.05 },
    { freq: 600, duration: 0.08, type: "sine", volume: 0.04, delay: 0.03 },
  ],
  notification: [
    { freq: 880, duration: 0.15, type: "sine", volume: 0.1 },
    { freq: 1100, duration: 0.2, type: "sine", volume: 0.08, delay: 0.12 },
  ],
  error: [
    { freq: 200, duration: 0.15, type: "sawtooth", volume: 0.08 },
    { freq: 180, duration: 0.15, type: "sawtooth", volume: 0.06, delay: 0.12 },
  ],
  lock: [
    { freq: 600, duration: 0.08, type: "sine", volume: 0.06 },
    { freq: 400, duration: 0.12, type: "sine", volume: 0.08, delay: 0.06 },
    { freq: 300, duration: 0.15, type: "sine", volume: 0.06, delay: 0.12 },
  ],
  unlock: [
    { freq: 400, duration: 0.08, type: "sine", volume: 0.06 },
    { freq: 600, duration: 0.1, type: "sine", volume: 0.08, delay: 0.06 },
  ],
  snap: [{ freq: 700, duration: 0.05, type: "square", volume: 0.04 }],
  trash: [
    { freq: 350, duration: 0.08, type: "triangle", volume: 0.06 },
    { freq: 250, duration: 0.12, type: "triangle", volume: 0.05, delay: 0.06 },
  ],
  recycle: [
    { freq: 250, duration: 0.1, type: "triangle", volume: 0.05 },
    { freq: 350, duration: 0.1, type: "triangle", volume: 0.06, delay: 0.08 },
    { freq: 500, duration: 0.12, type: "triangle", volume: 0.05, delay: 0.16 },
  ],
  typing: [{ freq: 1200, duration: 0.02, type: "square", volume: 0.02 }],
  tabSwitch: [
    { freq: 600, duration: 0.04, type: "sine", volume: 0.04 },
    { freq: 800, duration: 0.04, type: "sine", volume: 0.03, delay: 0.03 },
  ],
  screenshot: [
    { freq: 1000, duration: 0.08, type: "sine", volume: 0.08 },
    { freq: 1200, duration: 0.06, type: "sine", volume: 0.06, delay: 0.06 },
  ],
  login: [
    { freq: 440, duration: 0.12, type: "sine", volume: 0.08 },
    { freq: 554, duration: 0.12, type: "sine", volume: 0.07, delay: 0.08 },
    { freq: 660, duration: 0.15, type: "sine", volume: 0.08, delay: 0.16 },
  ],
  logout: [
    { freq: 660, duration: 0.1, type: "sine", volume: 0.06 },
    { freq: 440, duration: 0.15, type: "sine", volume: 0.07, delay: 0.08 },
  ],
  hover: [{ freq: 1000, duration: 0.02, type: "sine", volume: 0.015 }],
};

const retroScheme: SchemeDefinition = {
  startup: [
    { freq: 262, duration: 0.15, type: "square", volume: 0.1 },
    { freq: 330, duration: 0.15, type: "square", volume: 0.1, delay: 0.15 },
    { freq: 392, duration: 0.15, type: "square", volume: 0.1, delay: 0.3 },
    { freq: 523, duration: 0.3, type: "square", volume: 0.1, delay: 0.45 },
  ],
  click: [{ freq: 1000, duration: 0.03, type: "square", volume: 0.08 }],
  windowOpen: [
    { freq: 200, duration: 0.08, type: "square", volume: 0.07 },
    { freq: 400, duration: 0.08, type: "square", volume: 0.06, delay: 0.06 },
    { freq: 800, duration: 0.06, type: "square", volume: 0.05, delay: 0.12 },
  ],
  windowClose: [
    { freq: 800, duration: 0.06, type: "square", volume: 0.05 },
    { freq: 400, duration: 0.08, type: "square", volume: 0.06, delay: 0.06 },
    { freq: 200, duration: 0.1, type: "square", volume: 0.07, delay: 0.12 },
  ],
  minimize: [
    { freq: 500, duration: 0.05, type: "square", volume: 0.05 },
    { freq: 250, duration: 0.08, type: "square", volume: 0.04, delay: 0.04 },
  ],
  maximize: [
    { freq: 250, duration: 0.05, type: "square", volume: 0.05 },
    { freq: 500, duration: 0.08, type: "square", volume: 0.04, delay: 0.04 },
  ],
  notification: [
    { freq: 660, duration: 0.1, type: "square", volume: 0.08 },
    { freq: 880, duration: 0.1, type: "square", volume: 0.08, delay: 0.1 },
    { freq: 660, duration: 0.1, type: "square", volume: 0.08, delay: 0.2 },
  ],
  error: [
    { freq: 150, duration: 0.2, type: "square", volume: 0.1 },
    { freq: 100, duration: 0.3, type: "square", volume: 0.08, delay: 0.15 },
  ],
  lock: [
    { freq: 400, duration: 0.08, type: "square", volume: 0.06 },
    { freq: 300, duration: 0.08, type: "square", volume: 0.06, delay: 0.08 },
    { freq: 200, duration: 0.12, type: "square", volume: 0.06, delay: 0.16 },
  ],
  unlock: [
    { freq: 200, duration: 0.08, type: "square", volume: 0.06 },
    { freq: 400, duration: 0.1, type: "square", volume: 0.06, delay: 0.08 },
  ],
  snap: [{ freq: 800, duration: 0.04, type: "square", volume: 0.06 }],
  trash: [
    { freq: 300, duration: 0.06, type: "square", volume: 0.05 },
    { freq: 150, duration: 0.1, type: "square", volume: 0.06, delay: 0.05 },
  ],
  recycle: [
    { freq: 150, duration: 0.08, type: "square", volume: 0.05 },
    { freq: 300, duration: 0.08, type: "square", volume: 0.05, delay: 0.06 },
    { freq: 600, duration: 0.1, type: "square", volume: 0.05, delay: 0.12 },
  ],
  typing: [{ freq: 1500, duration: 0.015, type: "square", volume: 0.03 }],
  tabSwitch: [{ freq: 700, duration: 0.04, type: "square", volume: 0.05 }],
  screenshot: [
    { freq: 1200, duration: 0.06, type: "square", volume: 0.07 },
    { freq: 600, duration: 0.08, type: "square", volume: 0.06, delay: 0.06 },
  ],
  login: [
    { freq: 330, duration: 0.1, type: "square", volume: 0.07 },
    { freq: 440, duration: 0.1, type: "square", volume: 0.07, delay: 0.1 },
    { freq: 660, duration: 0.15, type: "square", volume: 0.07, delay: 0.2 },
  ],
  logout: [
    { freq: 660, duration: 0.08, type: "square", volume: 0.06 },
    { freq: 330, duration: 0.12, type: "square", volume: 0.06, delay: 0.08 },
  ],
  hover: [{ freq: 1200, duration: 0.015, type: "square", volume: 0.02 }],
};

const minimalScheme: SchemeDefinition = {
  startup: [{ freq: 600, duration: 0.3, type: "sine", volume: 0.06 }],
  click: [{ freq: 900, duration: 0.02, type: "sine", volume: 0.03 }],
  windowOpen: [{ freq: 500, duration: 0.08, type: "sine", volume: 0.04 }],
  windowClose: [{ freq: 400, duration: 0.08, type: "sine", volume: 0.04 }],
  minimize: [{ freq: 450, duration: 0.04, type: "sine", volume: 0.03 }],
  maximize: [{ freq: 550, duration: 0.04, type: "sine", volume: 0.03 }],
  notification: [{ freq: 800, duration: 0.12, type: "sine", volume: 0.06 }],
  error: [{ freq: 250, duration: 0.12, type: "sine", volume: 0.06 }],
  lock: [{ freq: 400, duration: 0.1, type: "sine", volume: 0.04 }],
  unlock: [{ freq: 500, duration: 0.1, type: "sine", volume: 0.04 }],
  snap: [{ freq: 600, duration: 0.03, type: "sine", volume: 0.03 }],
  trash: [{ freq: 300, duration: 0.08, type: "sine", volume: 0.03 }],
  recycle: [{ freq: 400, duration: 0.08, type: "sine", volume: 0.03 }],
  typing: [],
  tabSwitch: [{ freq: 700, duration: 0.02, type: "sine", volume: 0.02 }],
  screenshot: [{ freq: 900, duration: 0.06, type: "sine", volume: 0.05 }],
  login: [{ freq: 550, duration: 0.1, type: "sine", volume: 0.05 }],
  logout: [{ freq: 450, duration: 0.1, type: "sine", volume: 0.04 }],
  hover: [],
};

const emptyTones: ToneParams[] = [];
const silentScheme: SchemeDefinition = Object.fromEntries(
  Object.keys(defaultScheme).map((k) => [k, emptyTones])
) as SchemeDefinition;

const schemes: Record<SoundScheme, SchemeDefinition> = {
  default: defaultScheme,
  retro: retroScheme,
  minimal: minimalScheme,
  silent: silentScheme,
};

/* ── Audio Engine ────────────────────────────────────────── */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _volume = 75; // 0-100
  private _muted = false;
  private _scheme: SoundScheme = "default";

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.applyVolume();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getMasterGain(): GainNode {
    this.getCtx();
    return this.masterGain!;
  }

  private applyVolume() {
    if (this.masterGain) {
      const vol = this._muted ? 0 : this._volume / 100;
      this.masterGain.gain.setValueAtTime(vol, this.masterGain.context.currentTime);
    }
  }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(100, v));
    this.applyVolume();
  }

  setMuted(m: boolean) {
    this._muted = m;
    this.applyVolume();
  }

  setScheme(s: SoundScheme) {
    this._scheme = s;
  }

  get scheme() { return this._scheme; }
  get volume() { return this._volume; }
  get muted() { return this._muted; }

  play(event: SoundEvent) {
    const tones = schemes[this._scheme][event];
    if (!tones || tones.length === 0) return;

    try {
      const ctx = this.getCtx();
      const master = this.getMasterGain();

      for (const tone of tones) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = tone.delay ?? 0;

        osc.type = tone.type;
        osc.frequency.value = tone.freq;

        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(tone.volume, ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + tone.duration);

        osc.connect(gain);
        gain.connect(master);

        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + tone.duration);
      }
    } catch {
      // Audio not available
    }
  }
}

export const audioEngine = new AudioEngine();

/* ── Backward-compatible `sounds` export ─────────────────── */

export const sounds = {
  startup: () => audioEngine.play("startup"),
  click: () => audioEngine.play("click"),
  windowOpen: () => audioEngine.play("windowOpen"),
  windowClose: () => audioEngine.play("windowClose"),
  minimize: () => audioEngine.play("minimize"),
  maximize: () => audioEngine.play("maximize"),
  notification: () => audioEngine.play("notification"),
  error: () => audioEngine.play("error"),
  lock: () => audioEngine.play("lock"),
  unlock: () => audioEngine.play("unlock"),
  snap: () => audioEngine.play("snap"),
  trash: () => audioEngine.play("trash"),
  recycle: () => audioEngine.play("recycle"),
  typing: () => audioEngine.play("typing"),
  tabSwitch: () => audioEngine.play("tabSwitch"),
  screenshot: () => audioEngine.play("screenshot"),
  login: () => audioEngine.play("login"),
  logout: () => audioEngine.play("logout"),
  hover: () => audioEngine.play("hover"),
};

export const shouldPlaySound = (): boolean => true;
