import React from "react";

export default function Stock({ tiles }) {
  const sorted = [...tiles].sort((a, b) => a.quantity - b.quantity);

  const getLevel = (qty) => {
    if (qty < 10) return { label: "Critical", color: "#DC2626", bg: "#FEF2F2", bar: "#EF4444" };
    if (qty < 30) return { label: "Low", color: "#D97706", bg: "#FFFBEB", bar: "#F59E0B" };
    if (qty < 100) return { label: "Medium", color: "#2563EB", bg: "#EFF6FF", bar: "#3B82F6" };
    return { label: "Good", color: "#16A34A", bg: "#F0FDF4", bar: "#22C55E" };
  };

  const maxQty = Math.max(...tiles.map((t) => t.quantity), 1);

  const critical = tiles.filter((t) => t.quantity < 10).length;
  const low = tiles.filter((t) => t.quantity >= 10 && t.quantity < 30).length;
  const medium = tiles.filter((t) => t.quantity >= 30 && t.quantity < 100).length;
  const good = tiles.filter((t) => t.quantity >= 100).length;

  return (
    <div style={styles.page}>
      {/* Summary Chips */}
      <div style={styles.summaryRow}>
        {[
          { label: "Critical (< 10)", count: critical, color: "#EF4444", bg: "#FEF2F2" },
          { label: "Low (10–29)", count: low, color: "#F59E0B", bg: "#FFFBEB" },
          { label: "Medium (30–99)", count: medium, color: "#3B82F6", bg: "#EFF6FF" },
          { label: "Good (100+)", count: good, color: "#22C55E", bg: "#F0FDF4" },
        ].map((s) => (
          <div key={s.label} style={{ ...styles.summaryChip, background: s.bg, borderColor: s.color + "33" }}>
            <span style={{ ...styles.chipCount, color: s.color }}>{s.count}</span>
            <span style={styles.chipLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Stock Level Bars */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Stock Levels</h2>
          <p style={styles.cardSub}>Visual representation of all tile quantities</p>
        </div>

        <div style={styles.barList}>
          {sorted.map((tile) => {
            const level = getLevel(tile.quantity);
            const pct = Math.max((tile.quantity / maxQty) * 100, 2);
            return (
              <div key={tile.id} style={styles.barRow}>
                <div style={styles.barMeta}>
                  <span style={styles.barName}>{tile.name}</span>
                  <span style={{ ...styles.levelBadge, background: level.bg, color: level.color }}>
                    {level.label}
                  </span>
                </div>
                <div style={styles.barTrack}>
                  <div
                    style={{
                      ...styles.barFill,
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${level.bar}cc, ${level.bar})`,
                    }}
                  />
                </div>
                <div style={styles.barQty}>{tile.quantity} units</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stock Table */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Stock Details</h2>
        </div>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              {["Tile", "Category", "Size", "Qty", "Price", "Total Value", "Level"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((tile) => {
              const level = getLevel(tile.quantity);
              return (
                <tr key={tile.id} style={styles.tr}>
                  <td style={styles.td}><strong>{tile.name}</strong></td>
                  <td style={styles.td}>{tile.category}</td>
                  <td style={styles.td}>{tile.size} cm</td>
                  <td style={styles.td}>{tile.quantity}</td>
                  <td style={styles.td}>₹{tile.price}</td>
                  <td style={{ ...styles.td, fontWeight: "700" }}>₹{(tile.quantity * tile.price).toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.levelBadge, background: level.bg, color: level.color }}>
                      {level.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", gap: "20px" },
  summaryRow: { display: "flex", gap: "14px", flexWrap: "wrap" },
  summaryChip: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1.5px solid",
    borderRadius: "12px",
    padding: "12px 20px",
    flex: 1,
    minWidth: "160px",
  },
  chipCount: { fontSize: "28px", fontWeight: "900", lineHeight: 1 },
  chipLabel: { fontSize: "12px", color: "#64748B", fontWeight: "600" },
  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  cardHeader: { marginBottom: "20px" },
  cardTitle: { margin: "0 0 4px", fontSize: "16px", fontWeight: "800", color: "#0F172A" },
  cardSub: { margin: 0, fontSize: "12px", color: "#94A3B8" },
  barList: { display: "flex", flexDirection: "column", gap: "14px" },
  barRow: { display: "flex", alignItems: "center", gap: "14px" },
  barMeta: { display: "flex", alignItems: "center", gap: "8px", minWidth: "220px" },
  barName: { fontSize: "13px", fontWeight: "600", color: "#1E293B" },
  levelBadge: {
    padding: "2px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
  },
  barTrack: {
    flex: 1,
    height: "10px",
    background: "#F1F5F9",
    borderRadius: "100px",
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: "100px", transition: "width 0.5s ease" },
  barQty: { fontSize: "12px", fontWeight: "700", color: "#64748B", minWidth: "70px", textAlign: "right" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#F8FAFC" },
  th: {
    padding: "10px 14px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    borderBottom: "2px solid #E2E8F0",
  },
  tr: { borderBottom: "1px solid #F1F5F9" },
  td: { padding: "12px 14px", fontSize: "13px", color: "#334155" },
};
