const WIN = typeof window !== 'undefined' ? (window as any) : {};

class AudioVisualizerContext {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;

  constructor() {
    if (WIN.__AUDIO_VISUALIZER_CTX_INSTANCE__) {
      return WIN.__AUDIO_VISUALIZER_CTX_INSTANCE__;
    }
    WIN.__AUDIO_VISUALIZER_CTX_INSTANCE__ = this;
  }

  setupAudio(audioElement: HTMLAudioElement) {
    if (this.currentAudioElement === audioElement && this.analyser && this.dataArray) {
      this.resume();
      return { analyser: this.analyser, dataArray: this.dataArray };
    }

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      this.resume();

      if (!this.analyser) {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
      }

      if (this.currentAudioElement !== audioElement) {
        if (this.source) {
          try { this.source.disconnect(); } catch (e) { }
        }

        // createMediaElementSource can be fragile if called multiple times on same element
        // in different contexts, but here we enforce singleton context + re-use.
        this.source = this.audioContext.createMediaElementSource(audioElement);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.currentAudioElement = audioElement;
      }

      return { analyser: this.analyser, dataArray: this.dataArray };
    } catch (error) {
      console.error('[AudioVisualizerContext] Setup failed:', error);
      // Return nulls so visualizer handles it gracefully instead of crashing
      return { analyser: null, dataArray: null };
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(e => console.error('[AudioVisualizerContext] Resume failed:', e));
    }
  }
}

export const audioVisualizerContext = new AudioVisualizerContext();