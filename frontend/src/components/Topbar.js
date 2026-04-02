import React from "react";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/dashboard": { title: "Dashboard", sub: "Overview of your inventory" },
  "/add-tile": { title: "Add Tile", sub: "Register a new tile to inventory" },
  "/view-tiles": { title: "View Tiles", sub: "Browse and manage all tiles" },
  "/stock": { title: "Stock Manager", sub: "Monitor stock levels" },
};

export default function Topbar() {
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: "Dashboard", sub: "" };
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header style={styles.topbar}>
      <div>
        <h1 style={styles.title}>{page.title}</h1>
        <p style={styles.sub}>{page.sub}</p>
      </div>
      <div style={styles.right}>
        <div style={styles.dateChip}>
          <span style={styles.calIcon}>📅</span>
          <span style={styles.dateText}>{today}</span>
        </div>
        <div style={styles.avatar}>
          <span style={styles.avatarInitial}>A</span>
        </div>
        <div>
          <div style={styles.userName}>Admin</div>
          <div style={styles.userRole}>Manager</div>
        </div>
      </div>
    </header>
  );
}

const styles = {
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 32px",
    background: "#FFFFFF",
    borderBottom: "1px solid #E2E8F0",
    boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: "'Outfit', sans-serif",
  },
  sub: {
    margin: "2px 0 0",
    fontSize: "12px",
    color: "#94A3B8",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  dateChip: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#F1F5F9",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "6px 12px",
  },
  calIcon: { fontSize: "13px" },
  dateText: { fontSize: "12px", color: "#64748B", fontWeight: "500" },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
  },
  userName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#1E293B",
  },
  userRole: {
    fontSize: "11px",
    color: "#94A3B8",
  },
};
