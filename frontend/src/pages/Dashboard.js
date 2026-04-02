import React from "react";
import StatCard from "../components/StatCard";

export default function Dashboard({ tiles }) {
  const totalTiles = tiles.reduce((sum, t) => sum + t.quantity, 0);
  const lowStock = tiles.filter((t) => t.quantity < 15).length;
  const categories = [...new Set(tiles.map((t) => t.category))].length;
  const totalProducts = tiles.length;

  // Top 5 recent tiles (just last 5)
  const recentTiles = [...tiles].slice(-5).reverse();

  return (
    <div style={styles.page}>
      {/* Welcome Banner */}
      <div style={styles.banner}>
        <div>
          <h2 style={styles.bannerTitle}>Good Morning, Admin! 👋</h2>
          <p style={styles.bannerSub}>Here's what's happening in your inventory today.</p>
        </div>
        <div style={styles.bannerIcon}>⬡</div>
      </div>

      {/* Stat Cards */}
      <div style={styles.cards}>
        <StatCard
          label="Total Tiles"
          value={totalTiles.toLocaleString()}
          icon="🟦"
          color="#6366F1"
          bg="#EEF2FF"
          trend={{ up: true, text: "In stock" }}
        />
        <StatCard
          label="Low Stock"
          value={lowStock}
          icon="⚠️"
          color="#F59E0B"
          bg="#FFFBEB"
          trend={{ up: false, text: "Needs reorder" }}
        />
        <StatCard
          label="Categories"
          value={categories}
          icon="📂"
          color="#10B981"
          bg="#ECFDF5"
          trend={{ up: true, text: "Active types" }}
        />
        <StatCard
          label="Total Products"
          value={totalProducts}
          icon="📦"
          color="#8B5CF6"
          bg="#F5F3FF"
          trend={{ up: true, text: "SKUs listed" }}
        />
      </div>

      {/* Bottom Section */}
      <div style={styles.bottomGrid}>
        {/* Recent Tiles Table */}
        <div style={styles.tableCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Recent Tiles</span>
            <span style={styles.badge}>{tiles.length} total</span>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Tile Name", "Category", "Size", "Qty", "Price"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTiles.map((tile) => (
                <tr key={tile.id} style={styles.tr}>
                  <td style={styles.td}><strong>{tile.name}</strong></td>
                  <td style={styles.td}>
                    <span style={styles.catChip}>{tile.category}</span>
                  </td>
                  <td style={styles.td}>{tile.size} cm</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.qtyBadge,
                      background: tile.quantity < 15 ? "#FEF2F2" : "#F0FDF4",
                      color: tile.quantity < 15 ? "#DC2626" : "#16A34A",
                    }}>
                      {tile.quantity}
                    </span>
                  </td>
                  <td style={styles.td}>₹{tile.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low Stock Alert */}
        <div style={styles.alertCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>⚠ Low Stock Alerts</span>
          </div>
          {tiles.filter((t) => t.quantity < 15).length === 0 ? (
            <div style={styles.allGood}>✅ All items are sufficiently stocked!</div>
          ) : (
            tiles
              .filter((t) => t.quantity < 15)
              .map((tile) => (
                <div key={tile.id} style={styles.alertItem}>
                  <div>
                    <div style={styles.alertName}>{tile.name}</div>
                    <div style={styles.alertMeta}>{tile.category} · {tile.size} cm</div>
                  </div>
                  <div style={styles.alertQty}>{tile.quantity} left</div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", gap: "24px" },
  banner: {
    background: "linear-gradient(135deg, #1E293B, #312E81)",
    borderRadius: "16px",
    padding: "28px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerTitle: { margin: "0 0 6px", fontSize: "22px", fontWeight: "800", color: "#fff" },
  bannerSub: { margin: 0, color: "#94A3B8", fontSize: "14px" },
  bannerIcon: { fontSize: "56px", color: "#4338CA", opacity: 0.6 },
  cards: { display: "flex", gap: "20px", flexWrap: "wrap" },
  bottomGrid: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" },
  tableCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  alertCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },
  cardTitle: { fontSize: "15px", fontWeight: "700", color: "#0F172A" },
  badge: {
    background: "#EEF2FF",
    color: "#6366F1",
    fontSize: "11px",
    fontWeight: "700",
    padding: "3px 10px",
    borderRadius: "100px",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    borderBottom: "1px solid #F1F5F9",
  },
  tr: { borderBottom: "1px solid #F8FAFC" },
  td: { padding: "12px 12px", fontSize: "13px", color: "#334155" },
  catChip: {
    background: "#F1F5F9",
    color: "#475569",
    padding: "2px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
  },
  qtyBadge: {
    padding: "2px 10px",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: "700",
  },
  alertItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #FEF2F2",
  },
  alertName: { fontSize: "13px", fontWeight: "600", color: "#0F172A" },
  alertMeta: { fontSize: "11px", color: "#94A3B8", marginTop: "2px" },
  alertQty: {
    background: "#FEF2F2",
    color: "#DC2626",
    fontWeight: "700",
    fontSize: "12px",
    padding: "4px 10px",
    borderRadius: "8px",
  },
  allGood: {
    textAlign: "center",
    padding: "24px 0",
    color: "#10B981",
    fontSize: "13px",
    fontWeight: "600",
  },
};
