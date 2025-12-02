"use client";

export function ThemeStripes({
  styles,
  mode,
  size = "md",
}: {
  styles: { light: Record<string, string>; dark: Record<string, string> };
  mode: "light" | "dark";
  size?: "sm" | "md" | "lg";
}) {
  const colors = [
    styles[mode].primary,
    styles[mode].secondary,
    styles[mode].accent,
    styles[mode].background,
  ];

  const sizeClasses = {
    sm: "h-4 w-8",
    md: "h-6 w-12",
    lg: "h-8 w-16",
  };

  return (
    <div
      className={`flex overflow-hidden rounded border border-border ${sizeClasses[size]}`}
    >
      {colors.map((color, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

export function formatBSV(satoshis: number): string {
  return (satoshis / 100_000_000).toFixed(8);
}
