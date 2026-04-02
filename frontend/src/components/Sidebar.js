import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "▦" },
  { path: "/add-tile", label: "Add Tile", icon: "＋" },
  { path: "/view-tiles", label: "View Tiles", icon: "☰" },
  { path: "/stock", label: "Stock", icon: "◈" },
];

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.brand}>
        <div style={styles.logoMark}>
          <span style={styles.logoIcon}>⬡</span>
        </div>
        <div>
          <div style={styles.brandName}>TileERP</div>
          <div style={styles.brandSub}>Inventory Suite</div>
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Nav Label */}
      <div style={styles.navLabel}>MAIN MENU</div>

      {/* Nav Links */}
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
            {/* Active indicator bar */}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={styles.bottom}>
        <div style={styles.divider} />
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <span style={styles.navIcon}>⏻</span>
          <span>Logout</span>
        </button>
        <div style={styles.versionTag}>v1.0.0 — Academic Build</div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "240px",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
    display: "flex",
    flexDirection: "column",
    padding: "0",
    boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
    flexShrink: 0,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "24px 20px 20px",
  },
  logoMark: {
    width: "40px",
    height: "40px",
    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    fontSize: "20px",
    color: "#fff",
  },
  brandName: {
    color: "#F1F5F9",
    fontSize: "17px",
    fontWeight: "700",
    letterSpacing: "0.3px",
  },
  brandSub: {
    color: "#64748B",
    fontSize: "11px",
    letterSpacing: "0.5px",
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.07)",
    margin: "0 20px",
  },
  navLabel: {
    color: "#475569",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    padding: "16px 24px 8px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "4px 12px",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "11px 14px",
    borderRadius: "10px",
    color: "#94A3B8",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.18s ease",
  },
  navItemActive: {
    background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))",
    color: "#A5B4FC",
    borderLeft: "3px solid #6366F1",
  },
  navIcon: {
    fontSize: "16px",
    width: "20px",
    textAlign: "center",
  },
  bottom: {
    padding: "0 0 16px",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "11px 26px",
    background: "none",
    border: "none",
    color: "#F87171",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    width: "100%",
    marginTop: "8px",
  },
  versionTag: {
    color: "#334155",
    fontSize: "10px",
    padding: "6px 24px 0",
    letterSpacing: "0.4px",
  },
};
