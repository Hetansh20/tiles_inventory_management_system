import React from "react";

const palettes = {
  success: "bg-emerald-100 text-emerald-800 ring-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)] dark:shadow-[0_0_10px_rgba(16,185,129,0.2)]",
  danger: "bg-rose-100 text-rose-800 ring-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)] dark:shadow-[0_0_10px_rgba(244,63,94,0.2)]",
  warning: "bg-amber-100 text-amber-800 ring-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)] dark:shadow-[0_0_10px_rgba(245,158,11,0.2)]",
  info: "bg-sky-100 text-sky-800 ring-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.1)] dark:shadow-[0_0_10px_rgba(14,165,233,0.2)]",
  neutral: "bg-slate-100 text-slate-800 ring-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/30",
};

export default function StatusBadge({ label, tone = "neutral" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        palettes[tone] || palettes.neutral
      }`}
    >
      {label}
    </span>
  );
}
