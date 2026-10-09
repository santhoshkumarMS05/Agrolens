import React from "react";
import { useTheme } from "../context/ThemeContext";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      id="themeToggle"
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      <span className="theme-icon">{theme === "dark" ? "🌙" : "☀️"}</span>
    </button>
  );
};

export default ThemeToggle;
