// Shared audio context for visualizers to prevent multiple connections
class AudioVisualizerContext {
	private static instance: AudioVisualizerContext;
	private audioContext: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private source: MediaElementAudioSourceNode | null = null;
	private dataArray: Uint8Array | null = null;
	
	private constructor() {}
	
	static getInstance(): AudioVisualizerContext {
		if (!AudioVisualizerContext.instance) {
			AudioVisualizerContext.instance = new AudioVisualizerContext();
		}
		return AudioVisualizerContext.instance;
	}
	
	setupAudio(audioElement: HTMLAudioElement): {
		analyser: AnalyserNode | null;
		dataArray: Uint8Array | null;
	} {
		// If already setup with this element, just return existing
		if (this.source && this.analyser && this.dataArray) {
			console.log('[AudioContext] Reusing existing audio connection');
			return { analyser: this.analyser, dataArray: this.dataArray };
		}
		
		try {
			// Create audio context if needed
			if (!this.audioContext) {
				this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
				console.log('[AudioContext] Created new AudioContext');
			}
			
			// Always recreate analyser for fresh connection
			this.analyser = this.audioContext.createAnalyser();
			this.analyser.fftSize = 512;
			this.analyser.smoothingTimeConstant = 0.9;
			
			// Only create source if we don't have one
			if (!this.source) {
				try {
					console.log('[AudioContext] Creating MediaElementSource');
					this.source = this.audioContext.createMediaElementSource(audioElement);
					this.source.connect(this.analyser);
					this.analyser.connect(this.audioContext.destination);
					console.log('[AudioContext] Audio pipeline connected: Element -> Analyser -> Destination');
				} catch (e) {
					console.log("[AudioContext] Audio element already connected to another context:", e);
					// Try to reconnect with existing source
					if (this.source) {
						this.source.connect(this.analyser);
						this.analyser.connect(this.audioContext.destination);
						console.log('[AudioContext] Reconnected existing source');
					} else {
						throw new Error("Cannot create audio source - element may be connected to another context");
					}
				}
			} else {
				// Reconnect existing source to new analyser
				this.source.disconnect();
				this.source.connect(this.analyser);
				this.analyser.connect(this.audioContext.destination);
				console.log('[AudioContext] Reconnected existing source to new analyser');
			}
			
			// Create data array
			const bufferLength = this.analyser.frequencyBinCount;
			this.dataArray = new Uint8Array(bufferLength);
			console.log('[AudioContext] Created data array with buffer length:', bufferLength);
			
			return { analyser: this.analyser, dataArray: this.dataArray };
		} catch (error) {
			console.error("[AudioContext] Failed to setup audio context:", error);
			return { analyser: null, dataArray: null };
		}
	}
	
	resume() {
		if (this.audioContext && this.audioContext.state === 'suspended') {
			this.audioContext.resume();
		}
	}
	
	cleanup() {
		// Don't actually cleanup as other components might be using it
		// Just here for API completeness
	}
}

export const audioVisualizerContext = AudioVisualizerContext.getInstance();