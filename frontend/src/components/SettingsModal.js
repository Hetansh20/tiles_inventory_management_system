import React, { useState } from "react";
import FormModal from "./FormModal";
import { FiMonitor, FiBell, FiBriefcase } from "react-icons/fi";

export default function SettingsModal({ isOpen, onClose, settings, onUpdate, theme, onToggleTheme }) {
  const [form, setForm] = useState({
    notifications: settings?.notifications ?? true,
    companyName: settings?.companyName || "Welcome Ceramic",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(form);
    onClose();
  };

  return (
    <FormModal isOpen={isOpen} title="System Settings" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Appearance Section */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Appearance</h4>
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-slate-800">
                <FiMonitor className="text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Dark Mode</p>
                <p className="text-[10px] text-slate-500">Adjust the interface theme</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className={`relative h-6 w-11 rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Preferences</h4>
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-slate-800">
                <FiBell className="text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Desktop Notifications</p>
                <p className="text-[10px] text-slate-500">Get alerts for low stock</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, notifications: !form.notifications })}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.notifications ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${form.notifications ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Company Section */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Company Profile</h4>
          <div className="relative">
            <FiBriefcase className="absolute left-3 top-[34px] -translate-y-1/2 text-slate-400" />
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Company Name</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 pl-10 pr-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-6 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-black px-8 py-3 text-sm font-black text-white shadow-lg transition-all hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200"
          >
            Apply Settings
          </button>
        </div>
      </form>
    </FormModal>
  );
}
