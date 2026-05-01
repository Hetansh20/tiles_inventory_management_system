import React, { useMemo, useState } from "react";
import { FiMenu, FiBell, FiMoon, FiSearch, FiSun, FiUser, FiLogOut, FiSettings, FiCamera } from "react-icons/fi";
import NotificationDropdown from "./NotificationDropdown";

export default function Navbar({
  title,
  subtitle,
  onMenuClick,
  onOpenSearch,
  onOpenScanner,
  unreadCount,
  alerts,
  transactions,
  theme,
  onToggleTheme,
  onProfileClick,
  onSettingsClick,
  currentUser,
}) {
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);


  const recentTransactions = useMemo(
    () =>
      [...(transactions || [])]
        .map((item) => ({ ...item, date: item.createdAt || item.date || "" }))
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 5),
    [transactions]
  );

  const recentTransactions = useMemo(() => {
    if (!transactions) return [];
    return [...transactions]
      .sort((a, b) => {
        const dateA = a.createdAt || a.date || "";
        const dateB = b.createdAt || b.date || "";
        return dateB.localeCompare(dateA);
      })
      .slice(0, 5);
  }, [transactions]);


  // Note: For full logout context, we will trigger page refresh or we expect the app layer to handle it.
  const handleLogout = () => {
    // Rely on Sidebar logout or add onLogout prop to Navbar. 
    // Here we will just close.
    setOpenProfile(false);
    window.location.href = '/login'; 
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 lg:hidden"
          >
            <FiMenu size={18} />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">{title}</h1>
            <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex flex-1 sm:flex-none items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-500 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <FiSearch size={16} />
            <span className="hidden sm:inline">Search anything... (Ctrl+K)</span>
            <span className="sm:hidden">Search</span>
          </button>
          
          <button
            type="button"
            onClick={onOpenScanner}
            className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 border border-indigo-100 transition-all hover:bg-indigo-100 dark:border-indigo-900/30 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
            title="Scan QR Code"
          >
            <FiCamera size={18} />
          </button>
          
          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-xl bg-slate-50 p-2.5 text-slate-600 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => { setOpenNotifications(!openNotifications); setOpenProfile(false); }}
              className="relative rounded-xl bg-slate-50 p-2.5 text-slate-600 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <FiBell size={18} />
              {unreadCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-black text-white dark:border-slate-900">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>
            <NotificationDropdown open={openNotifications} alerts={alerts} recentTransactions={recentTransactions} />
          </div>

          <div className="relative">
            <button 
              onClick={() => { setOpenProfile(!openProfile); setOpenNotifications(false); }}
              className="flex items-center gap-3 rounded-xl p-1 pr-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold">
                {currentUser?.name?.charAt(0) || "U"}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{currentUser?.name || "User"}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{currentUser?.role || "staff"}</p>
              </div>
            </button>

            {openProfile && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">My Account</p>
                </div>
                <button 
                  onClick={() => { onProfileClick(); setOpenProfile(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <FiUser size={16} /> Profile
                </button>
                <button 
                  onClick={() => { onSettingsClick(); setOpenProfile(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <FiSettings size={16} /> Settings
                </button>
                <button 
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <FiLogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
