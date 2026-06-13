interface AudioVisualizerWindow {
	__AUDIO_VISUALIZER_CTX_INSTANCE__?: AudioVisualizerContext;
	webkitAudioContext?: typeof AudioContext;
}

const WIN: AudioVisualizerWindow =
	typeof window !== "undefined"
		? (window as unknown as AudioVisualizerWindow)
		: {};

class AudioVisualizerContext {
	private audioContext: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private source: MediaElementAudioSourceNode | null = null;
	private dataArray: Uint8Array<ArrayBuffer> | null = null;
	private currentAudioElement: HTMLAudioElement | null = null;

	static getInstance(): AudioVisualizerContext {
		if (WIN.__AUDIO_VISUALIZER_CTX_INSTANCE__) {
			return WIN.__AUDIO_VISUALIZER_CTX_INSTANCE__;
		}
		const instance = new AudioVisualizerContext();
		WIN.__AUDIO_VISUALIZER_CTX_INSTANCE__ = instance;
		return instance;
	}

	setupAudio(audioElement: HTMLAudioElement) {
		if (
			this.currentAudioElement === audioElement &&
			this.analyser &&
			this.dataArray
		) {
			this.resume();
			return { analyser: this.analyser, dataArray: this.dataArray };
		}

		try {
			if (!this.audioContext) {
				const AudioContextCtor: typeof AudioContext =
					window.AudioContext ?? WIN.webkitAudioContext ?? AudioContext;
				this.audioContext = new AudioContextCtor();
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
					try {
						this.source.disconnect();
					} catch (_e) {}
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
			console.error("[AudioVisualizerContext] Setup failed:", error);
			// Return nulls so visualizer handles it gracefully instead of crashing
			return { analyser: null, dataArray: null };
		}
	}

	resume() {
		if (this.audioContext && this.audioContext.state === "suspended") {
			this.audioContext
				.resume()
				.catch((e) =>
					console.error("[AudioVisualizerContext] Resume failed:", e),
				);
		}
	}
}

export const audioVisualizerContext = AudioVisualizerContext.getInstance();
