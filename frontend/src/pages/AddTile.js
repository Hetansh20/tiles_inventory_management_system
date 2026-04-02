import React, { useState } from "react";

const CATEGORIES = ["Marble", "Granite", "Porcelain", "Ceramic", "Slate", "Terracotta", "Wood", "Vitrified", "Other"];
const SIZES = ["20x20", "30x30", "30x60", "45x45", "60x60", "80x80", "60x120", "90x90"];

const defaultForm = { name: "", size: "", category: "", quantity: "", price: "" };

export default function AddTile({ onAdd }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Tile name is required.";
    if (!form.size) e.size = "Please select a size.";
    if (!form.category) e.category = "Please select a category.";
    if (!form.quantity || isNaN(form.quantity) || +form.quantity <= 0)
      e.quantity = "Enter a valid quantity (> 0).";
    if (!form.price || isNaN(form.price) || +form.price <= 0)
      e.price = "Enter a valid price (> 0).";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    onAdd({ ...form, quantity: +form.quantity, price: +form.price });
    setForm(defaultForm);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.cardHeader}>
          <div style={styles.headerIcon}>＋</div>
          <div>
            <h2 style={styles.cardTitle}>Add New Tile</h2>
            <p style={styles.cardSub}>Fill in the details to register a new tile in inventory</p>
          </div>
        </div>

        {success && (
          <div style={styles.successBanner}>
            ✅ Tile added successfully to inventory!
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            {/* Tile Name */}
            <div style={styles.fieldFull}>
              <label style={styles.label}>Tile Name <span style={styles.req}>*</span></label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Marble White Royal"
                style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
              />
              {errors.name && <span style={styles.errorText}>{errors.name}</span>}
            </div>

            {/* Size */}
            <div style={styles.field}>
              <label style={styles.label}>Size (cm) <span style={styles.req}>*</span></label>
              <select
                name="size"
                value={form.size}
                onChange={handleChange}
                style={{ ...styles.input, ...(errors.size ? styles.inputError : {}) }}
              >
                <option value="">Select size</option>
                {SIZES.map((s) => <option key={s} value={s}>{s} cm</option>)}
              </select>
              {errors.size && <span style={styles.errorText}>{errors.size}</span>}
            </div>

            {/* Category */}
            <div style={styles.field}>
              <label style={styles.label}>Category <span style={styles.req}>*</span></label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                style={{ ...styles.input, ...(errors.category ? styles.inputError : {}) }}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <span style={styles.errorText}>{errors.category}</span>}
            </div>

            {/* Quantity */}
            <div style={styles.field}>
              <label style={styles.label}>Quantity (units) <span style={styles.req}>*</span></label>
              <input
                name="quantity"
                type="number"
                min="1"
                value={form.quantity}
                onChange={handleChange}
                placeholder="e.g., 250"
                style={{ ...styles.input, ...(errors.quantity ? styles.inputError : {}) }}
              />
              {errors.quantity && <span style={styles.errorText}>{errors.quantity}</span>}
            </div>

            {/* Price */}
            <div style={styles.field}>
              <label style={styles.label}>Price per unit (₹) <span style={styles.req}>*</span></label>
              <input
                name="price"
                type="number"
                min="1"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g., 85"
                style={{ ...styles.input, ...(errors.price ? styles.inputError : {}) }}
              />
              {errors.price && <span style={styles.errorText}>{errors.price}</span>}
            </div>
          </div>

          {/* Preview */}
          {form.name && (
            <div style={styles.preview}>
              <div style={styles.previewLabel}>Preview</div>
              <div style={styles.previewRow}>
                <div style={styles.previewItem}><span style={styles.pLabel}>Name</span><span>{form.name || "—"}</span></div>
                <div style={styles.previewItem}><span style={styles.pLabel}>Size</span><span>{form.size || "—"}</span></div>
                <div style={styles.previewItem}><span style={styles.pLabel}>Category</span><span>{form.category || "—"}</span></div>
                <div style={styles.previewItem}><span style={styles.pLabel}>Qty</span><span>{form.quantity || "—"}</span></div>
                <div style={styles.previewItem}><span style={styles.pLabel}>Price</span><span>{form.price ? `₹${form.price}` : "—"}</span></div>
              </div>
            </div>
          )}

          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => { setForm(defaultForm); setErrors({}); }}
              style={styles.resetBtn}
            >
              Reset
            </button>
            <button type="submit" style={styles.submitBtn}>
              ＋ Add Tile to Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: "760px" },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "36px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "28px",
    paddingBottom: "24px",
    borderBottom: "1px solid #F1F5F9",
  },
  headerIcon: {
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "24px",
    fontWeight: "700",
    flexShrink: 0,
  },
  cardTitle: { margin: "0 0 4px", fontSize: "18px", fontWeight: "800", color: "#0F172A" },
  cardSub: { margin: 0, fontSize: "13px", color: "#94A3B8" },
  successBanner: {
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    color: "#16A34A",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "20px",
  },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  fieldFull: { gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151" },
  req: { color: "#EF4444" },
  input: {
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1.5px solid #E2E8F0",
    fontSize: "14px",
    color: "#0F172A",
    background: "#FAFAFA",
    fontFamily: "inherit",
    outline: "none",
  },
  inputError: { borderColor: "#FCA5A5", background: "#FFF5F5" },
  errorText: { fontSize: "12px", color: "#EF4444", fontWeight: "500" },
  preview: {
    background: "#F8FAFF",
    border: "1px dashed #C7D2FE",
    borderRadius: "12px",
    padding: "16px 20px",
  },
  previewLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6366F1",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "12px",
  },
  previewRow: { display: "flex", gap: "24px", flexWrap: "wrap" },
  previewItem: { display: "flex", flexDirection: "column", gap: "2px" },
  pLabel: { fontSize: "10px", color: "#94A3B8", fontWeight: "700", textTransform: "uppercase" },
  actions: { display: "flex", gap: "12px", justifyContent: "flex-end" },
  resetBtn: {
    padding: "11px 24px",
    borderRadius: "10px",
    border: "1.5px solid #E2E8F0",
    background: "#fff",
    color: "#64748B",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  submitBtn: {
    padding: "11px 28px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
    color: "#fff",
    border: "none",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
