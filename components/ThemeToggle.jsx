"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className={`flex items-center justify-center w-8 h-8 text-[#8fb3ad] hover:text-[#F2EFE9] transition-colors ${className}`}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
