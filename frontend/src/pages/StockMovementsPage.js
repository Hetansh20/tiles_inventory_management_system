import React, { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FilterDropdown from "../components/FilterDropdown";
import FormModal from "../components/FormModal";
import PermissionBanner from "../components/PermissionBanner";
import StatusBadge from "../components/StatusBadge";

const defaultForm = {
  type: "IN",
  product: "",
  quantity: 0,
  reason: "",
};

export default function StockMovementsPage({ movements, products, saveMovement, canDoTransactions }) {
  const [type, setType] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const filtered = useMemo(() => {
    return movements.filter((row) => {
      const matchesType = type === "all" || row.type === type;
      const matchesProduct = productFilter === "all" || String(row.product?._id || row.product?.id || row.product) === productFilter;
      
      const rowDate = new Date(row.createdAt).getTime();
      const matchesStartDate = !startDate || rowDate >= new Date(startDate).getTime();
      // Add 86400000 (24h) to endDate so it includes the whole day
      const matchesEndDate = !endDate || rowDate <= new Date(endDate).getTime() + 86400000;
      
      return matchesType && matchesProduct && matchesStartDate && matchesEndDate;
    });
  }, [movements, type, productFilter, startDate, endDate]);

  const activeProducts = useMemo(() => products.map((p) => ({ label: p.name, value: String(p.id) })), [products]);

  const columns = [
    { key: "createdAt", header: "Date", render: (row) => new Date(row.createdAt).toLocaleString() },
    { key: "type", header: "Type", render: (row) => <StatusBadge label={row.type} tone={tone(row.type)} /> },
    {
      key: "product",
      header: "Product",
      render: (row) => row.product?.name || products.find((p) => p.id === row.product)?.name || "Unknown Product",
    },
    { key: "quantity", header: "Delta", render: (row) => <span className={`font-bold ${row.quantity > 0 ? "text-emerald-600" : row.quantity < 0 ? "text-rose-600" : "text-slate-600"}`}>{row.quantity > 0 ? `+${row.quantity}` : row.quantity}</span> },
    { key: "performedBy", header: "Performed By", render: (row) => row.performedBy?.name || "System" },
    { key: "reason", header: "Reason" },
  ];

  const submit = (event) => {
    event.preventDefault();
    saveMovement({ ...form, quantity: Number(form.quantity) });
    setForm(defaultForm);
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {!canDoTransactions ? <PermissionBanner message="You do not have 'inventory' permission to record movements." /> : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <FilterDropdown
            label="Type"
            value={type}
            onChange={setType}
            options={[
              { label: "All", value: "all" },
              { label: "Stock IN (+)", value: "IN" },
              { label: "Stock OUT (-)", value: "OUT" },
              { label: "Adjustment (+/-)", value: "ADJUSTMENT" },
            ]}
          />
          <FilterDropdown label="Product" value={productFilter} onChange={setProductFilter} options={[{ label: "All Products", value: "all" }, ...activeProducts]} />
          
          <label className="flex min-w-[150px] flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            From
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </label>
          <label className="flex min-w-[150px] flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            To
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={!canDoTransactions}
          onClick={() => setModalOpen(true)}
          className="rounded-xl bg-black dark:bg-white px-4 py-2.5 text-sm font-bold text-white dark:text-black transition hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-40 shadow-sm"
        >
          Record Movement
        </button>
      </div>

      <DataTable columns={columns} data={filtered} emptyTitle="No movements recorded." />

      <FormModal isOpen={isModalOpen} title="Record Stock Movement" onClose={() => setModalOpen(false)}>
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submit}>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Type
            <select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="IN">Stock IN (+)</option>
              <option value="OUT">Stock OUT (-)</option>
              <option value="ADJUSTMENT">Adjustment (+/-)</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Product
            <select
              required
              value={form.product}
              onChange={(event) => setForm((prev) => ({ ...prev, product: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          
          <div className="md:col-span-2">
            <Field
              label={`Quantity Delta ${form.type === 'IN' ? '(Absolute Amount to Add)' : form.type === 'OUT' ? '(Absolute Amount to Deduct)' : '(Signed +/- Amount to Adjust)'}`}
              value={form.quantity}
              onChange={(value) => setForm((prev) => ({ ...prev, quantity: value }))}
              type="number"
              required
            />
          </div>
          
          <label className="grid gap-1 text-sm font-semibold text-slate-700 md:col-span-2">
            Reason
            <textarea
              required
              placeholder="e.g. Received PO-102, or damaged in transit..."
              value={form.reason}
              onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
              className="min-h-[80px] rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-white">
              Save Movement
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}

function tone(type) {
  if (type === "IN") return "success";
  if (type === "OUT") return "warning";
  if (type === "ADJUSTMENT") return "info";
  return "neutral";
}

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <input
        required={required}
        type={type}
        step={type === "number" ? "any" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
      />
    </label>
  );
}
