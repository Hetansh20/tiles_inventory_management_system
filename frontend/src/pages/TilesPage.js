import React, { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FilterDropdown from "../components/FilterDropdown";
import FormModal from "../components/FormModal";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import PermissionBanner from "../components/PermissionBanner";
import Button from "../components/Button";
import useDebounce from "../hooks/useDebounce";
import { exportToCsv, exportToExcel } from "../utils/exportUtils";

const defaultForm = {
  name: "",
  sku: "",
  category: "",
  size: "",
  finish: "",
  material: "",
  color: "",
  brand: "",
  unitPrice: 0,
  supplierId: "",
  isActive: true,
};

export default function TilesPage({
  tiles,
  suppliers,
  saveTile,
  toggleTileStatus,
  canEdit,
  bulkDeleteTiles,
  bulkToggleTiles,
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [material, setMaterial] = useState("all");
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingTile, setEditingTile] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortBy, setSortBy] = useState("name_asc");

  const debouncedQuery = useDebounce(query, 250);

  const categories = uniq(tiles.map((tile) => tile.category));
  const brands = uniq(tiles.map((tile) => tile.brand));
  const materials = uniq(tiles.map((tile) => tile.material));

  const filtered = useMemo(
    () => {
      let result = tiles.filter((tile) => {
        const matchesQuery = `${tile.name} ${tile.sku}`.toLowerCase().includes(debouncedQuery.toLowerCase());
        const matchesCategory = category === "all" || tile.category === category;
        const matchesBrand = brand === "all" || tile.brand === brand;
        const matchesMaterial = material === "all" || tile.material === material;
        return matchesQuery && matchesCategory && matchesBrand && matchesMaterial;
      });
      
      if (sortBy === "name_asc") result.sort((a, b) => a.name.localeCompare(b.name));
      else if (sortBy === "name_desc") result.sort((a, b) => b.name.localeCompare(a.name));
      else if (sortBy === "price_asc") result.sort((a, b) => a.unitPrice - b.unitPrice);
      else if (sortBy === "price_desc") result.sort((a, b) => b.unitPrice - a.unitPrice);

      return result;
    },
    [tiles, debouncedQuery, category, brand, material, sortBy]
  );

  const columns = [
    { key: "name", header: "Tile", render: (row) => <p className="font-semibold">{row.name}</p> },
    { key: "sku", header: "SKU" },
    { key: "category", header: "Category" },
    { key: "brand", header: "Brand" },
    { key: "material", header: "Material" },
    { key: "unitPrice", header: "Unit Price", render: (row) => `Rs ${Number(row.unitPrice).toLocaleString()}` },
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
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-40 ${row.isActive ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"} shadow-lg`}
            onClick={() => toggleTileStatus(row.id)}
          >
            {row.isActive ? "Disable" : "Enable"}
          </button>
        </div>
      ),
    },
  ];

  const openCreateModal = () => {
    setEditingTile(null);
    setForm(defaultForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (tile) => {
    setEditingTile(tile);
    setForm({ ...tile, supplierId: String(tile.supplierId) });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.sku.trim()) nextErrors.sku = "SKU is required";
    if (Number(form.unitPrice) <= 0) nextErrors.unitPrice = "Unit price must be greater than 0";
    const duplicateSku = tiles.some(
      (tile) => tile.sku.toLowerCase() === form.sku.trim().toLowerCase() && tile.id !== editingTile?.id
    );
    if (duplicateSku) nextErrors.sku = "SKU must be unique";
    if (!form.supplierId) nextErrors.supplierId = "Supplier is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    saveTile({
      ...form,
      id: editingTile?.id,
      supplierId: Number(form.supplierId),
      unitPrice: Number(form.unitPrice),
    });
    setModalOpen(false);
  };

  const exportRows = filtered.map((tile) => ({
    Name: tile.name,
    SKU: tile.sku,
    Category: tile.category,
    Brand: tile.brand,
    Material: tile.material,
    UnitPrice: tile.unitPrice,
    Status: tile.isActive ? "Active" : "Inactive",
  }));

  const bulkActions = canEdit
    ? [
        { label: "Delete", onClick: (ids) => { bulkDeleteTiles(ids); setSelectedRows([]); } },
        { label: "Activate", onClick: (ids) => { bulkToggleTiles(ids, true); setSelectedRows([]); } },
        { label: "Deactivate", onClick: (ids) => { bulkToggleTiles(ids, false); setSelectedRows([]); } },
      ]
    : [];

  return (
    <div className="space-y-4">
      {!canEdit ? <PermissionBanner message="Staff role: view-only tiles access." /> : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <SearchBar value={query} onChange={setQuery} placeholder="Search by tile name or SKU" />
          <FilterDropdown label="Category" value={category} onChange={setCategory} options={toOptions(categories)} />
          <FilterDropdown label="Brand" value={brand} onChange={setBrand} options={toOptions(brands)} />
          <FilterDropdown label="Material" value={material} onChange={setMaterial} options={toOptions(materials)} />
          <FilterDropdown 
            label="Sort By" 
            value={sortBy} 
            onChange={setSortBy} 
            options={[
              { label: "Name A-Z", value: "name_asc" },
              { label: "Name Z-A", value: "name_desc" },
              { label: "Price Low-High", value: "price_asc" },
              { label: "Price High-Low", value: "price_desc" }
            ]} 
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportToCsv("tiles-report", exportRows)}>
            CSV
          </Button>
          <Button variant="secondary" onClick={() => exportToExcel("tiles-report", exportRows, "Tiles")}>
            Excel
          </Button>
          <Button variant="primary" disabled={!canEdit} onClick={openCreateModal}>
            Add Tile
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No tiles match your filters"
        emptyDescription="Try adjusting category, brand or material."
        selectable={canEdit}
        selectedRows={selectedRows}
        onSelectedRowsChange={setSelectedRows}
        bulkActions={bulkActions}
      />

      <FormModal isOpen={isModalOpen} title={editingTile ? "Edit Tile" : "Add Tile"} onClose={() => setModalOpen(false)}>
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submit}>
          <Field label="Name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} error={errors.name} required />
          <Field label="SKU" value={form.sku} onChange={(value) => setForm((prev) => ({ ...prev, sku: value }))} error={errors.sku} required />
          <Field label="Category" value={form.category} onChange={(value) => setForm((prev) => ({ ...prev, category: value }))} required />
          <Field label="Size" value={form.size} onChange={(value) => setForm((prev) => ({ ...prev, size: value }))} required />
          <Field label="Finish" value={form.finish} onChange={(value) => setForm((prev) => ({ ...prev, finish: value }))} required />
          <Field label="Material" value={form.material} onChange={(value) => setForm((prev) => ({ ...prev, material: value }))} required />
          <Field label="Color" value={form.color} onChange={(value) => setForm((prev) => ({ ...prev, color: value }))} required />
          <Field label="Brand" value={form.brand} onChange={(value) => setForm((prev) => ({ ...prev, brand: value }))} required />
          <Field
            label="Unit Price"
            value={form.unitPrice}
            onChange={(value) => setForm((prev) => ({ ...prev, unitPrice: value }))}
            type="number"
            required
            error={errors.unitPrice}
          />
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Supplier
            <select
              value={form.supplierId}
              onChange={(event) => setForm((prev) => ({ ...prev, supplierId: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              required
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            {errors.supplierId ? <span className="text-xs text-rose-600">{errors.supplierId}</span> : null}
          </label>
          <label className="md:col-span-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Active Tile
          </label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-white">
              Save
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}

function uniq(list) {
  return [...new Set(list)].filter(Boolean);
}

function toOptions(values) {
  return [{ label: "All", value: "all" }, ...values.map((value) => ({ label: value, value }))];
}

function Field({ label, value, onChange, type = "text", required = false, error }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <input
        required={required}
        type={type}
        min={type === "number" ? 0 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
      />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
