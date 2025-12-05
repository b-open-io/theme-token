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
			return { analyser: this.analyser, dataArray: this.dataArray };
		}
		
		try {
			// Create audio context if needed
			if (!this.audioContext) {
				this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			}
			
			// Create analyser
			this.analyser = this.audioContext.createAnalyser();
			this.analyser.fftSize = 512;
			this.analyser.smoothingTimeConstant = 0.9;
			
			// Only create source if we don't have one
			if (!this.source) {
				try {
					this.source = this.audioContext.createMediaElementSource(audioElement);
					this.source.connect(this.analyser);
					this.analyser.connect(this.audioContext.destination);
				} catch (e) {
					console.log("Audio element already connected");
				}
			}
			
			// Create data array
			const bufferLength = this.analyser.frequencyBinCount;
			this.dataArray = new Uint8Array(bufferLength);
			
			return { analyser: this.analyser, dataArray: this.dataArray };
		} catch (error) {
			console.error("Failed to setup audio context:", error);
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