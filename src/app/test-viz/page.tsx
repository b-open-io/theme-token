"use client";

import { AudioVisualizerFractal } from "@/components/preview/audio-visualizer-fractal";
import { AudioDemoProvider } from "@/components/preview/audio-demo-provider";

const mockTheme = {
  styles: {
    light: {
      primary: "oklch(0.6 0.15 270)", // Purple
      secondary: "oklch(0.7 0.1 140)", // Green
      accent: "oklch(0.8 0.1 30)", // Orange
      background: "oklch(0.1 0.02 270)",
      text: "oklch(0.9 0.05 270)",
    },
    dark: {
      primary: "oklch(0.6 0.15 270)",
      secondary: "oklch(0.7 0.1 140)",
      accent: "oklch(0.8 0.1 30)",
      background: "oklch(0.1 0.02 270)",
      text: "oklch(0.9 0.05 270)",
    }
  }
};

const demoTracks = [
  {
    title: "Test Track",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Public domain test track
    artist: "Test Artist"
  }
];

export default function TestVizPage() {
  return (
    <div className="w-full h-screen bg-black">
      <AudioDemoProvider tracks={demoTracks}>
        <div className="relative w-full h-full">
          <AudioVisualizerFractal theme={mockTheme} mode="light" />
          <div className="absolute top-4 left-4 z-50 text-white bg-black/50 p-4 rounded">
            <h1 className="text-xl font-bold">Fractal Verification</h1>
            <p>Verify that:</p>
            <ul className="list-disc ml-5">
              <li>Colors are Purple/Green/Orange (not black or broken)</li>
              <li>Zoom is infinite and smooth (no teleporting/jumping)</li>
            </ul>
          </div>
        </div>
      </AudioDemoProvider>
    </div>
  );
}
