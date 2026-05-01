import React, { useState } from "react";
import FormModal from "./FormModal";
import { FiUser, FiMail, FiShield, FiKey } from "react-icons/fi";

export default function ProfileModal({ isOpen, onClose, user, onUpdate }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(form);
    onClose();
  };

  return (
    <FormModal isOpen={isOpen} title="Account Settings" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Full Name</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 pl-10 pr-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={form.email}
                disabled
                className="w-full rounded-xl border-2 border-slate-100 bg-slate-100 pl-10 pr-4 py-3 text-sm font-bold text-slate-400 cursor-not-allowed dark:border-slate-800 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Role</label>
            <div className="relative">
              <FiShield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={user?.role?.toUpperCase() || "STAFF"}
                disabled
                className="w-full rounded-xl border-2 border-slate-100 bg-slate-100 pl-10 pr-4 py-3 text-sm font-bold text-slate-400 cursor-not-allowed dark:border-slate-800 dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 mb-4">
            <FiKey /> Change Password
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">New Password</label>
              <input
                type="password"
                placeholder="Min. 6 chars"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
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
            className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-black text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 dark:shadow-none"
          >
            Save Changes
          </button>
        </div>
      </form>
    </FormModal>
  );
}
