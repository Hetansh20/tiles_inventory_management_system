import React, { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
import PermissionBanner from "../components/PermissionBanner";
import StatusBadge from "../components/StatusBadge";
import { exportToCsv, exportToExcel, printRows } from "../utils/exportUtils";

const defaultForm = {
  supplierId: "",
  tileId: "",
  quantity: 1,
  status: "pending",
  expectedDeliveryDate: "",
};

export default function OrdersPage({ orders, suppliers, tiles, saveOrder, updateOrderStatus, canEdit }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const enriched = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        supplierName: suppliers.find((supplier) => supplier.id === order.supplierId)?.name || `Supplier ${order.supplierId}`,
      })),
    [orders, suppliers]
  );

  const columns = [
    { key: "id", header: "Order ID", render: (row) => `PO-${row.id}` },
    { key: "supplierName", header: "Supplier" },
    { key: "totalAmount", header: "Total", render: (row) => `Rs ${Number(row.totalAmount).toLocaleString()}` },
    { key: "expectedDeliveryDate", header: "Expected Delivery" },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge label={row.status} tone={orderTone(row.status)} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => updateOrderStatus(row.id, "received")}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            Mark Received
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => updateOrderStatus(row.id, "cancelled")}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      ),
    },
  ];

  const submit = (event) => {
    event.preventDefault();
    const selectedTile = tiles.find((tile) => tile.id === Number(form.tileId));
    const unitPrice = selectedTile?.costPrice || 0;
    const quantity = Number(form.quantity);

    saveOrder({
      supplierId: Number(form.supplierId),
      items: [{ tileId: Number(form.tileId), quantity, unitPrice }],
      totalAmount: quantity * unitPrice,
      status: form.status,
      expectedDeliveryDate: form.expectedDeliveryDate,
    });

    setForm(defaultForm);
    setModalOpen(false);
  };

  const reportRows = enriched.map((row) => ({
    OrderId: `PO-${row.id}`,
    Supplier: row.supplierName,
    TotalAmount: row.totalAmount,
    Status: row.status,
    ExpectedDeliveryDate: row.expectedDeliveryDate,
  }));

  return (
    <div className="space-y-4">
      {!canEdit ? <PermissionBanner message="Staff role: supplier orders are view-only." /> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => exportToCsv("orders-report", reportRows)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
        >
          CSV
        </button>
        <button
          type="button"
          onClick={() => exportToExcel("orders-report", reportRows, "Orders")}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
        >
          Excel
        </button>
        <button
          type="button"
          onClick={() => printRows("Supplier Orders Report", reportRows)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
        >
          Print
        </button>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => setModalOpen(true)}
          className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700 disabled:opacity-40"
        >
          Create Order
        </button>
      </div>

      <DataTable columns={columns} data={enriched} />

      <FormModal isOpen={isModalOpen} title="Create Supplier Order" onClose={() => setModalOpen(false)}>
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={submit}>
          <Select
            label="Supplier"
            value={form.supplierId}
            onChange={(value) => setForm((prev) => ({ ...prev, supplierId: value }))}
            options={suppliers.map((supplier) => ({ label: supplier.name, value: String(supplier.id) }))}
          />
          <Select
            label="Tile"
            value={form.tileId}
            onChange={(value) => setForm((prev) => ({ ...prev, tileId: value }))}
            options={tiles.map((tile) => ({ label: `${tile.name} (${tile.sku})`, value: String(tile.id) }))}
          />
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Quantity
            <input
              type="number"
              min={1}
              required
              value={form.quantity}
              onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Expected Delivery Date
            <input
              type="date"
              required
              value={form.expectedDeliveryDate}
              onChange={(event) => setForm((prev) => ({ ...prev, expectedDeliveryDate: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-white">
              Save Order
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <select
        required
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

function orderTone(status) {
  if (status === "received") return "success";
  if (status === "cancelled") return "danger";
  return "warning";
}
