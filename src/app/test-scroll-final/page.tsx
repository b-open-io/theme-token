"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioDemo } from "@/components/preview/audio-demo";
import { motion } from "framer-motion";
import { LayoutDashboard, Palette, Type, CreditCard, AudioWaveform } from "lucide-react";

export default function TestScrollFinal() {
  const [activeTab, setActiveTab] = useState("audio");

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "audio", label: "Audio", icon: AudioWaveform },
  ];

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


  return (
    <div className="min-h-screen bg-background font-sans relative">
      <header className="sticky top-0 z-50 border-b backdrop-blur" style={{ height: '65px', borderColor: 'var(--border)' }}>
        <div className="h-full flex items-center px-6">Header</div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 h-20 bg-muted/20">Title Placeholder</div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-2 h-auto p-1 bg-muted/50 w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="audio" className="mt-0">
            <AudioDemo theme={mockTheme} mode="light" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
