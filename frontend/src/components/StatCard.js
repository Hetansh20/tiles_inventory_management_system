import React from "react";

export default function StatCard({ label, value, icon, color, bg, trend }) {
  return (
    <div style={{ ...styles.card, borderTop: `3px solid ${color}` }}>
      <div style={styles.top}>
        <div>
          <div style={styles.label}>{label}</div>
          <div style={styles.value}>{value}</div>
          {trend && <div style={{ ...styles.trend, color: trend.up ? "#10B981" : "#F87171" }}>
            {trend.up ? "▲" : "▼"} {trend.text}
          </div>}
        </div>
        <div style={{ ...styles.iconBox, background: bg }}>
          <span style={{ fontSize: "22px" }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#FFFFFF",
    borderRadius: "14px",
    padding: "22px 24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    flex: "1",
    minWidth: "180px",
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "8px",
  },
  value: {
    fontSize: "30px",
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 1,
  },
  trend: {
    fontSize: "11px",
    marginTop: "6px",
    fontWeight: "600",
  },
  iconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
