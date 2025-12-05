"use client";

import { AudioDemo } from "@/components/preview/audio-demo";

const mockTheme = {
  styles: {
    light: {
      primary: "oklch(0.6 0.15 270)",
      secondary: "oklch(0.7 0.1 140)",
      accent: "oklch(0.8 0.1 30)",
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

export default function TestVizPage() {
  return (
    <div className="w-full h-screen bg-black p-4">
      {/* Use audio-demo directly to test its layout, unlike before where we used fractal directly */}
      <AudioDemo theme={mockTheme} mode="light" />
    </div>
  );
}
