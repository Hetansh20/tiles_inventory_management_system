import React, { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FilterDropdown from "../components/FilterDropdown";
import FormModal from "../components/FormModal";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import PermissionBanner from "../components/PermissionBanner";
import Button from "../components/Button";
import useDebounce from "../hooks/useDebounce";

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
    { key: "costPrice", header: "Cost Price", render: (row) => `$${Number(row.costPrice).toFixed(2)}` },
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

  const submit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    saveProduct({
      ...form,
      id: editingProduct?._id || editingProduct?.id,
      costPrice: Number(form.costPrice),
      lowStockThreshold: Number(form.lowStockThreshold),
      currentQuantity: Number(form.currentQuantity), // Even though read-only, ensure it's a number
    });
    setModalOpen(false);
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

      <FormModal isOpen={isModalOpen} title={editingProduct ? "Edit Product" : "Add Product"} onClose={() => setModalOpen(false)}>
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submit}>
          <Field label="Name" value={form.name} onChange={(val) => setForm({ ...form, name: val })} error={errors.name} required />
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

          <Field label="Unit of Measure" value={form.unitOfMeasure} onChange={(val) => setForm({ ...form, unitOfMeasure: val })} required placeholder="e.g. pcs, boxes" />
          <Field label="Cost Price" value={form.costPrice} onChange={(val) => setForm({ ...form, costPrice: val })} type="number" required error={errors.costPrice} />
          
          <Field label="Low-Stock Threshold" value={form.lowStockThreshold} onChange={(val) => setForm({ ...form, lowStockThreshold: val })} type="number" required />
          
          {/* READ ONLY QUANTITY */}
          <label className="grid gap-1 text-sm font-semibold text-slate-700 opacity-70">
            Current Quantity (Read-Only)
            <input
              type="number"
              disabled
              value={form.currentQuantity}
              className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm cursor-not-allowed dark:bg-slate-800 dark:border-slate-700"
            />
          </label>

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
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2">
              Save
            </button>
          </div>
        </form>
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
