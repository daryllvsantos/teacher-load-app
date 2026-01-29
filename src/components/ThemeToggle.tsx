"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "teacher-load-theme";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const prefersDark = stored === "dark";
    setIsDark(prefersDark);
    document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  }, []);

  const handleToggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  };

  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
      onClick={handleToggle}
      type="button"
    >
      <span
        className="inline-flex h-2 w-2 rounded-full"
        style={{ backgroundColor: isDark ? "var(--accent)" : "var(--primary)" }}
      />
      {isDark ? "Dark" : "Light"}
    </button>
  );
}