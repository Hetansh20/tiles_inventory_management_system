import React, { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import PermissionBanner from "../components/PermissionBanner";
import StatusBadge from "../components/StatusBadge";

const defaultForm = {
  tileId: "",
  fromWarehouse: "",
  toWarehouse: "",
  quantity: 0,
  status: "pending",
  createdAt: "",
};

export default function TransfersPage({ transfers, warehouses, tiles, saveTransfer, updateTransferStatus, canEdit }) {
  const [form, setForm] = useState(defaultForm);

  const transfersWithNames = useMemo(
    () =>
      transfers.map((transfer) => ({
        ...transfer,
        tileName: tiles.find((tile) => tile.id === transfer.tileId)?.name || `Tile ${transfer.tileId}`,
        fromName: warehouses.find((warehouse) => warehouse.id === transfer.fromWarehouse)?.name || `Warehouse ${transfer.fromWarehouse}`,
        toName: warehouses.find((warehouse) => warehouse.id === transfer.toWarehouse)?.name || `Warehouse ${transfer.toWarehouse}`,
      })),
    [transfers, warehouses, tiles]
  );

  const columns = [
    { key: "createdAt", header: "Date" },
    { key: "tileName", header: "Tile" },
    { key: "fromName", header: "From" },
    { key: "toName", header: "To" },
    { key: "quantity", header: "Quantity" },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge label={row.status} tone={row.status === "completed" ? "success" : "warning"} />,
    },
    {
      key: "action",
      header: "Action",
      render: (row) =>
        row.status === "pending" ? (
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => updateTransferStatus(row.id, "completed")}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            Mark Completed
          </button>
        ) : (
          <span className="text-xs font-medium text-slate-500">Done</span>
        ),
    },
  ];

  const submit = (event) => {
    event.preventDefault();
    saveTransfer({
      ...form,
      tileId: Number(form.tileId),
      fromWarehouse: Number(form.fromWarehouse),
      toWarehouse: Number(form.toWarehouse),
      quantity: Number(form.quantity),
    });
    setForm(defaultForm);
  };

  return (
    <div className="space-y-5">
      {!canEdit ? <PermissionBanner message="Staff role: transfers are view-only." /> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">Create Stock Transfer</h2>
        <p className="mb-4 text-sm text-slate-500">Move inventory between warehouses and track transfer status.</p>

        <form className="grid grid-cols-1 gap-4 md:grid-cols-3" onSubmit={submit}>
          <Select
            label="Tile"
            value={form.tileId}
            onChange={(value) => setForm((prev) => ({ ...prev, tileId: value }))}
            options={tiles.map((tile) => ({ label: tile.name, value: String(tile.id) }))}
            disabled={!canEdit}
          />
          <Select
            label="From Warehouse"
            value={form.fromWarehouse}
            onChange={(value) => setForm((prev) => ({ ...prev, fromWarehouse: value }))}
            options={warehouses.map((warehouse) => ({ label: warehouse.name, value: String(warehouse.id) }))}
            disabled={!canEdit}
          />
          <Select
            label="To Warehouse"
            value={form.toWarehouse}
            onChange={(value) => setForm((prev) => ({ ...prev, toWarehouse: value }))}
            options={warehouses.map((warehouse) => ({ label: warehouse.name, value: String(warehouse.id) }))}
            disabled={!canEdit}
          />
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Quantity
            <input
              required
              min={1}
              type="number"
              disabled={!canEdit}
              value={form.quantity}
              onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Date
            <input
              required
              type="date"
              disabled={!canEdit}
              value={form.createdAt}
              onChange={(event) => setForm((prev) => ({ ...prev, createdAt: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={!canEdit} className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
              Create Transfer
            </button>
          </div>
        </form>
      </section>

      <DataTable columns={columns} data={[...transfersWithNames].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))} />
    </div>
  );
}

function Select({ label, value, onChange, options, disabled = false }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <select
        required
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
