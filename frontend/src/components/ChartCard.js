import React from "react";

export default function ChartCard({ title, children, actions }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-xl dark:border-slate-700/50 dark:bg-slate-900/50">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h3>
        <div>{actions}</div>
      </div>
      <div className="relative z-10 w-full">
        {children}
      </div>
    </section>
  );
}
