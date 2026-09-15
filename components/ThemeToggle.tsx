"use client";
import { useTheme } from "@/components/ThemeProvider";

// Both icons are rendered and CSS shows the right one from <html data-theme>,
// which the pre-paint script sets, so there is no hydration flicker.
export default function ThemeToggle() {
  const { toggle } = useTheme();
  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      onClick={toggle}
      aria-label="Change color theme"
      title="Change color theme"
    >
      <svg
        className="icon-moon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
      </svg>
      <svg
        className="icon-sun"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
