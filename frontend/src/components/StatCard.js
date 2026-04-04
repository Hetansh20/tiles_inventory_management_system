import React from "react";

export default function StatCard({ title, value, icon: Icon, hint, tone = "sky" }) {
  const tones = {
    sky: "from-sky-500 to-indigo-500 shadow-sky-500/20",
    emerald: "from-emerald-400 to-teal-500 shadow-emerald-500/20",
    amber: "from-amber-400 to-orange-500 shadow-amber-500/20",
    rose: "from-rose-400 to-red-500 shadow-rose-500/20",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/50 dark:bg-slate-900/50">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-40 dark:opacity-30 dark:group-hover:opacity-60" />
      
      <div className="relative flex items-start justify-between z-10">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-800 transition-colors group-hover:text-slate-900 dark:text-slate-100 dark:group-hover:text-white">{value}</p>
          {hint ? <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{hint}</p> : null}
        </div>
        <div className={`rounded-xl bg-gradient-to-br p-3 text-white shadow-lg ${tones[tone] || tones.sky} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
          {Icon ? <Icon size={20} /> : null}
        </div>
      </div>
    </div>
  );
}
