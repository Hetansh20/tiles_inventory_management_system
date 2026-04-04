import React from "react";
import { FiX } from "react-icons/fi";

export default function FormModal({ isOpen, title, children, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl transform overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl transition-all dark:border-slate-700/50 dark:bg-slate-900/95">
        <div className="flex items-center justify-between border-b border-slate-200/50 px-6 py-4 dark:border-slate-700/50">
          <h3 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-200/50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <FiX size={18} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
