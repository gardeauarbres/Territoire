
class AudioService {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private alarmOsc: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;
  private isInitialized = false;
  private hapticEnabled = 'vibrate' in navigator;

  init() {
    if (this.isInitialized) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.isInitialized = true;
    this.startAmbient();
  }

  private startAmbient() {
    if (!this.ctx) return;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    this.ambientGain.connect(this.ctx.destination);

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.Q.setValueAtTime(10, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    lfo.start();
    whiteNoise.connect(filter);
    filter.connect(this.ambientGain);
    whiteNoise.start();

    setInterval(() => {
      if (Math.random() > 0.7) this.playChirp();
    }, 4000);
  }

  private playChirp() {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    osc.type = 'sine';
    const freq = 800 + Math.random() * 2000;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq / 2, this.ctx.currentTime + 0.1);
    
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
    
    osc.connect(g);
    g.connect(this.ambientGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  vibrate(pattern: number | number[]) {
    if (this.hapticEnabled) {
      navigator.vibrate(pattern);
    }
  }

  playClick() {
    this.vibrate(10); // Petit choc haptique
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.05);
    
    g.gain.setValueAtTime(0.1, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playHover() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(40, this.ctx.currentTime);
    
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.05);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
    
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  toggleAlarm(active: boolean) {
    if (!this.ctx) return;
    if (active && !this.alarmOsc) {
      this.alarmGain = this.ctx.createGain();
      this.alarmGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.alarmGain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 1);
      
      this.alarmOsc = this.ctx.createOscillator();
      this.alarmOsc.type = 'sawtooth';
      this.alarmOsc.frequency.setValueAtTime(110, this.ctx.currentTime);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, this.ctx.currentTime);
      
      this.alarmOsc.connect(filter);
      filter.connect(this.alarmGain);
      this.alarmGain.connect(this.ctx.destination);
      this.alarmOsc.start();
    } else if (!active && this.alarmOsc) {
      this.alarmGain?.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      setTimeout(() => {
        this.alarmOsc?.stop();
        this.alarmOsc = null;
      }, 500);
    }
  }
}

export const audioService = new AudioService();
