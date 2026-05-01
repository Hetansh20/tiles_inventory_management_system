import React, { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FilterDropdown from "../components/FilterDropdown";
import FormModal from "../components/FormModal";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import PermissionBanner from "../components/PermissionBanner";
import Button from "../components/Button";
import useDebounce from "../hooks/useDebounce";
import { QRCodeCanvas } from "qrcode.react";

const defaultForm = {
  name: "",
  sku: "",
  category: "",
  supplier: "",
  unitOfMeasure: "",
  currentQuantity: 0,
  lowStockThreshold: 10,
  costPrice: 0,
  description: "",
  isActive: true,
  imageUrl: "",
  size: "",
};

export default function ProductsPage({
  products,
  categories,
  suppliers,
  saveProduct,
  toggleProductStatus,
  canEdit,
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [generatedProduct, setGeneratedProduct] = useState(null);

  const debouncedQuery = useDebounce(query, 250);

  const activeCategories = useMemo(() => categories.map((c) => ({ label: c.name, value: String(c._id) })), [categories]);
  const activeSuppliers = useMemo(() => suppliers.map((s) => ({ label: s.name, value: String(s.id || s._id || s.name) })), [suppliers]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = `${product.name} ${product.sku}`.toLowerCase().includes(debouncedQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || String(product.category?._id) === categoryFilter;
      // We fall back to standardizing supplier comparison since it can be string or ID based on implementation
      const matchesSupplier = supplierFilter === "all" || product.supplier === supplierFilter;
      return matchesQuery && matchesCategory && matchesSupplier;
    });
  }, [products, debouncedQuery, categoryFilter, supplierFilter]);

  const columns = [
    { key: "name", header: "Product", render: (row) => <p className="font-semibold">{row.name}</p> },
    { key: "sku", header: "SKU" },
    { key: "category", header: "Category", render: (row) => row.category?.name || "N/A" },
    { key: "supplier", header: "Supplier", render: (row) => suppliers.find(s => String(s.id) === row.supplier)?.name || row.supplier },
    { key: "currentQuantity", header: "Stock", render: (row) => `${row.currentQuantity} ${row.unitOfMeasure}` },
    { key: "costPrice", header: "Cost Price", render: (row) => `₹${Number(row.costPrice).toFixed(2)}` },
    {
      key: "isActive",
      header: "Status",
      render: (row) => <StatusBadge label={row.isActive ? "Active" : "Inactive"} tone={row.isActive ? "success" : "danger"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canEdit}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 transition dark:border-slate-600 dark:hover:bg-slate-700 disabled:opacity-40"
            onClick={() => openEditModal(row)}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition dark:border-slate-600 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
            onClick={() => { setGeneratedProduct(row); setQrModalOpen(true); }}
          >
            QR
          </button>
          <button
            type="button"
            disabled={!canEdit}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-40 ${row.isActive ? "bg-black dark:bg-white dark:text-black hover:bg-slate-800" : "bg-emerald-500 hover:bg-emerald-600"} shadow-sm`}
            onClick={() => toggleProductStatus(row._id || row.id)}
          >
            {row.isActive ? "Disable" : "Enable"}
          </button>
        </div>
      ),
    },
  ];

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(defaultForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      ...product,
      category: product.category?._id || product.category || "",
      supplier: String(product.supplier),
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.sku.trim()) nextErrors.sku = "SKU is required";
    if (!form.category) nextErrors.category = "Category is required";
    if (Number(form.costPrice) <= 0) nextErrors.costPrice = "Cost price must be greater than 0";
    
    const duplicateSku = products.some(
      (product) => product.sku.toLowerCase() === form.sku.trim().toLowerCase() && product._id !== editingProduct?._id
    );
    if (duplicateSku) nextErrors.sku = "SKU must be unique";
    
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const saved = await saveProduct({
      ...form,
      id: editingProduct?._id || editingProduct?.id,
      costPrice: Number(form.costPrice),
      lowStockThreshold: Number(form.lowStockThreshold),
      currentQuantity: Number(form.currentQuantity), // Ensure it's a number
    });
    setModalOpen(false);

    if (saved && !editingProduct) {
      setGeneratedProduct(saved);
      setQrModalOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      {!canEdit ? <PermissionBanner message="Staff role: view-only products access." /> : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <SearchBar value={query} onChange={setQuery} placeholder="Search by name or SKU" />
          <FilterDropdown label="Category" value={categoryFilter} onChange={setCategoryFilter} options={[{ label: "All", value: "all" }, ...activeCategories]} />
          <FilterDropdown label="Supplier" value={supplierFilter} onChange={setSupplierFilter} options={[{ label: "All", value: "all" }, ...activeSuppliers]} />
        </div>
        <div className="flex gap-2">
          <Button variant="primary" disabled={!canEdit} onClick={openCreateModal}>
            Add Product
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No products match your filters"
      />

      <FormModal isOpen={isModalOpen} title={editingProduct ? "Edit Product" : "Add New Item"} onClose={() => setModalOpen(false)}>
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2 overflow-visible" onSubmit={submit}>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Add Photo</label>
            <div className="flex items-center gap-4">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="Preview" className="h-24 w-24 object-cover rounded-xl border border-slate-200" />
              ) : (
                <div className="h-24 w-24 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                  No Photo
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setForm({ ...form, imageUrl: reader.result });
                    reader.readAsDataURL(file);
                  }
                }}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
              />
            </div>
          </div>
          
          <Field label="Item Name" value={form.name} onChange={(val) => setForm({ ...form, name: val })} error={errors.name} required />
          <Field label="SKU" value={form.sku} onChange={(val) => setForm({ ...form, sku: val })} error={errors.sku} required />
          
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              required
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {errors.category ? <span className="text-xs text-rose-600">{errors.category}</span> : null}
          </label>

          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Supplier
            <select
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id || s.name} value={s.id || s.name}>{s.name}</option>
              ))}
            </select>
          </label>

          <Field label="Size" value={form.size} onChange={(val) => setForm({ ...form, size: val })} placeholder="e.g. 600x600 mm" />
          <Field label="Unit of Measure" value={form.unitOfMeasure} onChange={(val) => setForm({ ...form, unitOfMeasure: val })} required placeholder="e.g. pcs, boxes" />
          
          <div className="md:col-span-2 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4"><h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pricing & Stock</h3></div>

          <Field label="Price (₹/box)" value={form.costPrice} onChange={(val) => setForm({ ...form, costPrice: val })} type="number" required error={errors.costPrice} />
          
          <label className={`grid gap-1 text-sm font-semibold text-slate-700 ${editingProduct ? "opacity-70" : ""}`}>
            {editingProduct ? "Current Quantity (Read-Only)" : "Quantity (boxes)"}
            <input
              type="number"
              disabled={!!editingProduct}
              value={form.currentQuantity}
              onChange={(e) => setForm({ ...form, currentQuantity: e.target.value })}
              className={`rounded-xl border border-slate-200 px-3 py-2.5 text-sm ${editingProduct ? "bg-slate-100 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700" : ""}`}
            />
          </label>

          <Field label="Low-Stock Alert (boxes)" value={form.lowStockThreshold} onChange={(val) => setForm({ ...form, lowStockThreshold: val })} type="number" required />

          <label className="md:col-span-2 grid gap-1 text-sm font-semibold text-slate-700">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              rows={2}
            />
          </label>

          <label className="md:col-span-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active Product
          </label>
          <div className="md:col-span-2 flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-3 font-semibold hover:bg-slate-50 transition">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 font-semibold transition">
              {editingProduct ? "Save Changes" : "Add Item & Generate QR"}
            </button>
          </div>
        </form>
      </FormModal>

      <FormModal isOpen={qrModalOpen} title="Item Added Successfully!" onClose={() => setQrModalOpen(false)}>
        {generatedProduct && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-slate-600 text-center">Scan this QR code to quickly access product details in the future.</p>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <QRCodeCanvas value={generatedProduct.sku} size={200} />
            </div>
            <p className="font-bold text-lg">{generatedProduct.name}</p>
            <p className="text-sm text-slate-500">SKU: {generatedProduct.sku}</p>
            <div className="flex gap-2 w-full mt-4">
              <button onClick={() => setQrModalOpen(false)} className="w-full rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-3 font-semibold transition">
                Done
              </button>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, error, placeholder }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <input
        required={required}
        type={type}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
      />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
