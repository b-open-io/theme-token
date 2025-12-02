"use client";

import { Suspense } from "react";
import { ThemeStudio } from "@/components/theme-studio";
import { Loader2 } from "lucide-react";

export default function StudioPage() {
  return (
    <div className="h-screen bg-background">
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ThemeStudio />
      </Suspense>
    </div>
  );
}
