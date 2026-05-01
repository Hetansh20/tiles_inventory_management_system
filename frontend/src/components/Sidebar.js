import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiBox,
  FiGrid,
  FiLogOut,
  FiMapPin,
  FiRepeat,
  FiShoppingBag,
  FiTruck,
  FiUsers,
  FiActivity,
  FiLayers,
  FiClock,
  FiPieChart,
  FiShield,
} from "react-icons/fi";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: FiGrid, roles: ["admin", "staff"] },
  { path: "/products", label: "Products", icon: FiBox, roles: ["admin", "staff"] },
  { path: "/categories", label: "Categories", icon: FiLayers, roles: ["admin", "staff"] },
  { path: "/inventory", label: "Inventory", icon: FiActivity, roles: ["admin", "staff"] },
  { path: "/suppliers", label: "Suppliers", icon: FiTruck, roles: ["admin", "staff"] },
  { path: "/warehouses", label: "Warehouses", icon: FiMapPin, roles: ["admin", "staff"] },
  { path: "/orders", label: "Orders", icon: FiShoppingBag, roles: ["admin", "staff"] },
  { path: "/transfers", label: "Transfers", icon: FiRepeat, roles: ["admin", "staff"] },
  { path: "/users", label: "Users", icon: FiUsers, roles: ["admin"] },
  { path: "/transactions", label: "Transactions", icon: FiActivity, roles: ["admin", "staff"] },
  { path: "/alerts", label: "Alerts", icon: FiAlertTriangle, roles: ["admin", "staff"] },
  { path: "/reports", label: "Reports", icon: FiPieChart, roles: ["admin", "staff"] },
  { path: "/activity", label: "Activity Logs", icon: FiClock, roles: ["admin", "staff"] },
];

export default function Sidebar({ isOpen, onClose, onLogout, role = "staff" }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/80 lg:hidden transition-opacity"
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800 bg-slate-900 text-slate-200 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm text-center">
            <img src="/logo.png" alt="Welcome Ceramic" className="mx-auto max-h-20 object-contain" />
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto px-1 scrollbar-hide py-2">
            {navItems.filter((item) => item.roles.includes(role)).map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                      isActive
                        ? "bg-slate-100 text-black dark:bg-white dark:text-black border border-slate-200 dark:border-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
                    }`
                  }
                >
                  <Icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-4 pt-4 border-t border-slate-800 px-1">
            <button
              onClick={handleLogout}
              className="w-full group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-all duration-300"
            >
              <FiLogOut size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
