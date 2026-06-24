/**
 * Release Desk design tokens — single source of truth for colors.
 * Tailwind (`tailwind.config.ts`) and CSS variables (`globals.css`) mirror these values.
 */

export const palette = {
  brand: {
    25: "#f2f7ff",
    50: "#ecf3ff",
    100: "#dde9ff",
    200: "#c2d6ff",
    300: "#9cb9ff",
    400: "#7592ff",
    500: "#465fff",
    600: "#3641f5",
    700: "#2a31d8",
    800: "#252dae",
    900: "#262e89",
    950: "#161950",
  },
  accent: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#7a5af8",
    600: "#6938ef",
    700: "#5925dc",
    800: "#4c1d95",
    900: "#3b1578",
  },
  gray: {
    25: "#fcfcfd",
    50: "#f9fafb",
    100: "#f2f4f7",
    200: "#e4e7ec",
    300: "#d0d5dd",
    400: "#98a2b3",
    500: "#667085",
    600: "#475467",
    700: "#344054",
    800: "#1d2939",
    900: "#101828",
    950: "#0c111d",
  },
  success: {
    50: "#ecfdf3",
    100: "#d1fadf",
    500: "#12b76a",
    600: "#039855",
    700: "#027a48",
  },
  warning: {
    50: "#fffaeb",
    100: "#fef0c7",
    500: "#f79009",
    600: "#dc6803",
    700: "#b54708",
  },
  error: {
    50: "#fef3f2",
    100: "#fee4e2",
    500: "#f04438",
    600: "#d92d20",
    700: "#b42318",
  },
  surface: "#f9fafb",
  border: "#e4e7ec",
  sidebar: "#0b0e14",
  foreground: "#101828",
  ai: "#7a5af8",
} as const;

export type ReadinessTier = "high" | "medium" | "low";

export const readinessTokens: Record<
  ReadinessTier,
  { color: string; ring: string; bg: string; text: string; label: string }
> = {
  high: {
    color: palette.success[500],
    ring: "ring-success-500/30",
    bg: "bg-success-50",
    text: "text-success-700",
    label: "Ready",
  },
  medium: {
    color: palette.warning[500],
    ring: "ring-warning-500/30",
    bg: "bg-warning-50",
    text: "text-warning-700",
    label: "At risk",
  },
  low: {
    color: palette.error[500],
    ring: "ring-error-500/30",
    bg: "bg-error-50",
    text: "text-error-700",
    label: "Not ready",
  },
};

export function readinessTier(value: number): ReadinessTier {
  if (value >= 80) return "high";
  if (value >= 50) return "medium";
  return "low";
}

export function readinessColor(value: number): string {
  return readinessTokens[readinessTier(value)].color;
}

export const sourceTokens = {
  database: {
    bg: "bg-brand-100",
    text: "text-brand-700",
    border: "border-brand-200",
  },
  demo: {
    bg: "bg-accent-100",
    text: "text-accent-700",
    border: "border-accent-200",
  },
} as const;

export const statusTokens: Record<string, { bg: string; text: string }> = {
  Approved: { bg: "bg-success-50", text: "text-success-600" },
  Passed: { bg: "bg-success-50", text: "text-success-600" },
  Ready: { bg: "bg-success-50", text: "text-success-600" },
  Connected: { bg: "bg-success-50", text: "text-success-600" },
  Shipped: { bg: "bg-success-50", text: "text-success-600" },
  Go: { bg: "bg-success-50", text: "text-success-600" },
  Active: { bg: "bg-success-50", text: "text-success-600" },
  Verified: { bg: "bg-success-50", text: "text-success-600" },
  Pending: { bg: "bg-warning-50", text: "text-warning-600" },
  Running: { bg: "bg-warning-50", text: "text-warning-600" },
  "At Risk": { bg: "bg-warning-50", text: "text-warning-600" },
  Verifying: { bg: "bg-warning-50", text: "text-warning-600" },
  Scheduled: { bg: "bg-brand-50", text: "text-brand-600" },
  Planned: { bg: "bg-brand-50", text: "text-brand-600" },
  "In Progress": { bg: "bg-brand-50", text: "text-brand-600" },
  Deferred: { bg: "bg-gray-100", text: "text-gray-600" },
  Rejected: { bg: "bg-error-50", text: "text-error-600" },
  Failed: { bg: "bg-error-50", text: "text-error-600" },
  Blocked: { bg: "bg-error-50", text: "text-error-600" },
  "No-Go": { bg: "bg-error-50", text: "text-error-600" },
  Error: { bg: "bg-error-50", text: "text-error-600" },
  "Rolled Back": { bg: "bg-error-50", text: "text-error-600" },
  Disconnected: { bg: "bg-gray-100", text: "text-gray-600" },
  Paused: { bg: "bg-gray-100", text: "text-gray-600" },
  "Not Started": { bg: "bg-gray-100", text: "text-gray-600" },
  Complete: { bg: "bg-success-50", text: "text-success-600" },
  "N/A": { bg: "bg-gray-100", text: "text-gray-600" },
};

/** Chart / knowledge-graph node colors */
export const chartColors = {
  person: palette.success[500],
  release: palette.brand[500],
  service: "#2563eb",
  ticket: palette.warning[500],
  change: palette.accent[500],
  incident: palette.error[500],
} as const;
