import React from "react";
import { FiSearch } from "react-icons/fi";

export default function SearchBar({ value, onChange, placeholder = "Search" }) {
  return (
    <div className="relative flex w-full max-w-sm flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 opacity-0 dark:text-slate-400">
        Search
      </span>
      <div className="relative block h-full w-full">
        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors peer-focus:text-sky-500 dark:text-slate-500" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="peer w-full rounded-xl border border-white/40 bg-white/60 py-2.5 pl-11 pr-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md outline-none transition-all placeholder:font-medium placeholder:text-slate-400 hover:bg-white focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700/50 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-800/80 dark:focus:bg-slate-900"
        />
      </div>
    </div>
  );
}
