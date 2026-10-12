"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

export function ThemeToggle({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    let initialTheme: Theme = "dark";
    try {
      initialTheme = localStorage.getItem("lspd-theme") === "light" ? "light" : "dark";
    } catch (error) {
      console.warn("Could not read the saved theme preference.", error);
    }
    document.documentElement.dataset.theme = initialTheme;
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
    try {
      localStorage.setItem("lspd-theme", nextTheme);
    } catch (error) {
      console.warn("Could not save the theme preference.", error);
    }
  };

  const label = theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn("theme-toggle", compact && "theme-toggle-compact", className)}
      title={label}
      aria-label={label}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {!compact && <span>{theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}</span>}
    </button>
  );
}
