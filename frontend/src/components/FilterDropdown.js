import React from "react";

export default function FilterDropdown({ label, value, onChange, options }) {
  return (
    <label className="flex min-w-[150px] flex-col gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-white/40 bg-white/60 px-4 py-2.5 text-sm font-semibold capitalize text-slate-700 outline-none shadow-sm backdrop-blur-md transition-all hover:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700/50 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-800/80"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-white dark:bg-slate-900">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
