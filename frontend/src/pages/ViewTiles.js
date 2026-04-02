import React, { useState } from "react";

export default function ViewTiles({ tiles, onUpdate, onDelete }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = tiles.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (tile) => {
    setEditId(tile.id);
    setEditForm({ ...tile });
  };

  const saveEdit = () => {
    onUpdate(editId, {
      ...editForm,
      quantity: +editForm.quantity,
      price: +editForm.price,
    });
    setEditId(null);
  };

  const cancelEdit = () => setEditId(null);

  const confirmDelete = (id) => setDeleteConfirm(id);
  const doDelete = () => {
    onDelete(deleteConfirm);
    setDeleteConfirm(null);
  };

  return (
    <div style={styles.page}>
      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>🗑</div>
            <h3 style={styles.modalTitle}>Confirm Delete</h3>
            <p style={styles.modalSub}>Are you sure you want to remove this tile from inventory? This action cannot be undone.</p>
            <div style={styles.modalActions}>
              <button onClick={() => setDeleteConfirm(null)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={doDelete} style={styles.deleteBtn}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.card}>
        {/* Header Row */}
        <div style={styles.headerRow}>
          <div>
            <h2 style={styles.title}>All Tiles</h2>
            <p style={styles.sub}>{filtered.length} of {tiles.length} records</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍  Search by name or category..."
            style={styles.searchInput}
          />
        </div>

        {/* Table */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Tile Name</th>
                <th style={styles.th}>Size</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Quantity</th>
                <th style={styles.th}>Price (₹)</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.emptyRow}>
                    No tiles found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((tile, i) =>
                  editId === tile.id ? (
                    // Edit Row
                    <tr key={tile.id} style={styles.editRow}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}>
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          style={styles.editInput}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          value={editForm.size}
                          onChange={(e) => setEditForm((f) => ({ ...f, size: e.target.value }))}
                          style={{ ...styles.editInput, width: "70px" }}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          value={editForm.category}
                          onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                          style={styles.editInput}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="number"
                          value={editForm.quantity}
                          onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
                          style={{ ...styles.editInput, width: "70px" }}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                          style={{ ...styles.editInput, width: "70px" }}
                        />
                      </td>
                      <td style={styles.td}>—</td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <button onClick={saveEdit} style={styles.saveBtn}>Save</button>
                        <button onClick={cancelEdit} style={styles.cancelEditBtn}>Cancel</button>
                      </td>
                    </tr>
                  ) : (
                    // View Row
                    <tr key={tile.id} style={styles.tr}>
                      <td style={{ ...styles.td, color: "#94A3B8", fontWeight: "600" }}>{i + 1}</td>
                      <td style={styles.td}>
                        <span style={styles.tileName}>{tile.name}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.sizeChip}>{tile.size} cm</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.catChip}>{tile.category}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.qtyBadge,
                          background: tile.quantity < 15 ? "#FEF2F2" : "#F0FDF4",
                          color: tile.quantity < 15 ? "#DC2626" : "#16A34A",
                          border: `1px solid ${tile.quantity < 15 ? "#FECACA" : "#BBF7D0"}`,
                        }}>
                          {tile.quantity}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: "700", color: "#1E293B" }}>
                        ₹{tile.price}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusChip,
                          background: tile.quantity < 15 ? "#FEF2F2" : "#F0FDF4",
                          color: tile.quantity < 15 ? "#DC2626" : "#16A34A",
                        }}>
                          {tile.quantity < 15 ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <button onClick={() => startEdit(tile)} style={styles.editBtn}>
                          ✏ Edit
                        </button>
                        <button onClick={() => confirmDelete(tile.id)} style={styles.deleteRowBtn}>
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div style={styles.footer}>
          <span>Total Value in Stock: <strong>₹{tiles.reduce((s, t) => s + t.quantity * t.price, 0).toLocaleString()}</strong></span>
          <span>Total Units: <strong>{tiles.reduce((s, t) => s + t.quantity, 0).toLocaleString()}</strong></span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {},
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  },
  title: { margin: "0 0 4px", fontSize: "18px", fontWeight: "800", color: "#0F172A" },
  sub: { margin: 0, fontSize: "12px", color: "#94A3B8" },
  searchInput: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1.5px solid #E2E8F0",
    fontSize: "13px",
    width: "280px",
    fontFamily: "inherit",
    color: "#0F172A",
    background: "#F8FAFC",
    outline: "none",
  },
  tableWrapper: { overflowX: "auto" },
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
    whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px solid #F1F5F9", transition: "background 0.1s" },
  editRow: { borderBottom: "1px solid #E0E7FF", background: "#F5F3FF" },
  td: { padding: "13px 14px", fontSize: "13px", color: "#334155", verticalAlign: "middle" },
  emptyRow: { textAlign: "center", padding: "40px", color: "#94A3B8", fontSize: "14px" },
  tileName: { fontWeight: "600", color: "#1E293B" },
  sizeChip: {
    background: "#F1F5F9",
    color: "#475569",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
  },
  catChip: {
    background: "#EEF2FF",
    color: "#4338CA",
    padding: "3px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
  },
  qtyBadge: {
    padding: "3px 10px",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: "700",
  },
  statusChip: {
    padding: "3px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
  },
  editBtn: {
    marginRight: "6px",
    padding: "6px 12px",
    borderRadius: "7px",
    background: "#EEF2FF",
    color: "#4338CA",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  deleteRowBtn: {
    padding: "6px 12px",
    borderRadius: "7px",
    background: "#FEF2F2",
    color: "#DC2626",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  editInput: {
    padding: "6px 10px",
    borderRadius: "7px",
    border: "1.5px solid #C7D2FE",
    fontSize: "13px",
    fontFamily: "inherit",
    width: "120px",
    background: "#fff",
  },
  saveBtn: {
    marginRight: "6px",
    padding: "6px 14px",
    borderRadius: "7px",
    background: "#6366F1",
    color: "#fff",
    border: "none",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  cancelEditBtn: {
    padding: "6px 12px",
    borderRadius: "7px",
    background: "#F1F5F9",
    color: "#64748B",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  footer: {
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid #F1F5F9",
    display: "flex",
    gap: "32px",
    fontSize: "13px",
    color: "#64748B",
  },
  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "#fff",
    borderRadius: "18px",
    padding: "36px",
    maxWidth: "380px",
    width: "90%",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  modalIcon: { fontSize: "36px", marginBottom: "12px" },
  modalTitle: { margin: "0 0 8px", fontSize: "18px", fontWeight: "800", color: "#0F172A" },
  modalSub: { margin: "0 0 24px", fontSize: "13px", color: "#64748B", lineHeight: "1.6" },
  modalActions: { display: "flex", gap: "12px", justifyContent: "center" },
  cancelBtn: {
    padding: "10px 24px",
    borderRadius: "10px",
    border: "1.5px solid #E2E8F0",
    background: "#fff",
    color: "#64748B",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  deleteBtn: {
    padding: "10px 24px",
    borderRadius: "10px",
    background: "#EF4444",
    color: "#fff",
    border: "none",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
