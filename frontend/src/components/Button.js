import React from "react";

export default function Button({ children, onClick, disabled, type = "button", variant = "primary", className = "", ...props }) {
  const baseStyle = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const variants = {
    primary: "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-0.5",
    secondary: "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 hover:shadow-lg hover:bg-white dark:hover:bg-slate-700 hover:-translate-y-0.5",
    danger: "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-0.5"
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
