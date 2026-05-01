import React, { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
import PermissionBanner from "../components/PermissionBanner";
import StatusBadge from "../components/StatusBadge";
import { exportToCsv, exportToExcel, printRows } from "../utils/exportUtils";

export default function OrdersPage({ orders, suppliers, tiles, saveOrder, updateOrderStatus, receiveItems, canEdit }) {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isReceiveModalOpen, setReceiveModalOpen] = useState(false);
  
  const [form, setForm] = useState({ supplier: "", expectedDeliveryDate: "", lines: [] });
  const [receiveForm, setReceiveForm] = useState(null); // active order to receive

  const enriched = useMemo(() => {
    return orders.map((order) => {
      // Handle the fact that supplier might be populated object or just an ID
      const supplierName = order.supplier?.name || suppliers.find((s) => String(s.id) === String(order.supplier))?.name || "Unknown Supplier";
      
      return {
        ...order,
        supplierName,
        totalItems: order.lines?.reduce((sum, line) => sum + line.orderedQuantity, 0) || 0,
        receivedItems: order.lines?.reduce((sum, line) => sum + line.receivedQuantity, 0) || 0,
      };
    });
  }, [orders, suppliers]);

  const columns = [
    { key: "id", header: "PO Number", render: (row) => <span className="font-bold">PO-{row.id.substring(row.id.length - 6).toUpperCase()}</span> },
    { key: "supplierName", header: "Supplier" },
    { key: "totalAmount", header: "Total Value", render: (row) => `₹${Number(row.totalAmount).toLocaleString()}` },
    { key: "progress", header: "Progress", render: (row) => <span className="text-sm text-slate-500">{row.receivedItems} / {row.totalItems} rcvd</span> },
    { key: "expectedDeliveryDate", header: "Expected", render: (row) => row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate).toLocaleDateString() : "N/A" },
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
          {["Sent", "Partially Received"].includes(row.status) && (
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => openReceiveModal(row)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              Receive
            </button>
          )}
          {["Draft"].includes(row.status) && (
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => updateOrderStatus(row.id, "Sent")}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              Send PO
            </button>
          )}
          {["Draft", "Sent"].includes(row.status) && (
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => updateOrderStatus(row.id, "Cancelled")}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  // CREATE MODAL LOGIC
  const openCreateModal = () => {
    setForm({ supplier: "", expectedDeliveryDate: "", lines: [{ product: "", orderedQuantity: 1, unitPrice: 0 }] });
    setCreateModalOpen(true);
  };

  const addLine = () => {
    setForm(prev => ({ ...prev, lines: [...prev.lines, { product: "", orderedQuantity: 1, unitPrice: 0 }] }));
  };
  const removeLine = (idx) => {
    setForm(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== idx) }));
  };
  const updateLine = (idx, field, value) => {
    setForm(prev => {
      const newLines = [...prev.lines];
      newLines[idx][field] = value;
      // Auto-fill unit price if product changes
      if (field === 'product') {
        const selectedTile = tiles.find(t => String(t.id) === String(value));
        if (selectedTile) newLines[idx].unitPrice = selectedTile.costPrice || 0;
      }
      return { ...prev, lines: newLines };
    });
  };

  const submitCreate = (event) => {
    event.preventDefault();
    if (form.lines.length === 0) return alert("Add at least one item.");
    
    // Ensure numbers
    const processedLines = form.lines.map(line => ({
      product: line.product,
      orderedQuantity: Number(line.orderedQuantity),
      unitPrice: Number(line.unitPrice)
    }));

    const totalAmount = processedLines.reduce((sum, line) => sum + (line.orderedQuantity * line.unitPrice), 0);

    saveOrder({
      supplier: form.supplier,
      status: "Draft",
      expectedDeliveryDate: form.expectedDeliveryDate,
      lines: processedLines,
      totalAmount
    });
    setCreateModalOpen(false);
  };

  // RECEIVE MODAL LOGIC
  const openReceiveModal = (order) => {
    setReceiveForm({
      id: order.id,
      itemsToReceive: order.lines.map(line => ({
        lineId: line._id || line.id, // backend assigns _id to subdocs
        productName: line.product?.name || "Unknown Product",
        ordered: line.orderedQuantity,
        alreadyReceived: line.receivedQuantity,
        receiveNow: 0 // user inputs this
      }))
    });
    setReceiveModalOpen(true);
  };

  const updateReceiveAmount = (idx, value) => {
    setReceiveForm(prev => {
      const newItems = [...prev.itemsToReceive];
      newItems[idx].receiveNow = Math.max(0, Math.min(Number(value), newItems[idx].ordered - newItems[idx].alreadyReceived));
      return { ...prev, itemsToReceive: newItems };
    });
  };

  const submitReceive = (event) => {
    event.preventDefault();
    const payload = receiveForm.itemsToReceive
      .filter(item => item.receiveNow > 0)
      .map(item => ({ lineId: item.lineId, quantity: item.receiveNow }));
      
    if (payload.length === 0) return alert("Specify at least one quantity to receive.");
    
    receiveItems(receiveForm.id, payload);
    setReceiveModalOpen(false);
  };

  const reportRows = enriched.map((row) => ({
    OrderId: row.id,
    Supplier: row.supplierName,
    TotalAmount: row.totalAmount,
    Status: row.status,
    ExpectedDeliveryDate: row.expectedDeliveryDate,
  }));

  return (
    <div className="space-y-4">
      {!canEdit ? <PermissionBanner message="Staff role: supplier orders are view-only." /> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => exportToCsv("orders-report", reportRows)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">CSV</button>
        <button type="button" onClick={() => exportToExcel("orders-report", reportRows, "Orders")} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">Excel</button>
        <button type="button" onClick={() => printRows("Supplier Orders Report", reportRows)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">Print</button>
        <button
          type="button"
          disabled={!canEdit}
          onClick={openCreateModal}
          className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700 disabled:opacity-40"
        >
          Create PO
        </button>
      </div>

      <DataTable columns={columns} data={enriched} />

      {/* CREATE MODAL */}
      <FormModal isOpen={isCreateModalOpen} title="Draft Purchase Order" onClose={() => setCreateModalOpen(false)}>
        <form className="grid grid-cols-1 gap-4" onSubmit={submitCreate}>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Supplier"
              value={form.supplier}
              onChange={(value) => setForm((prev) => ({ ...prev, supplier: value }))}
              options={suppliers.map((s) => ({ label: s.name, value: String(s.id) }))}
            />
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Expected Delivery
              <input type="date" required value={form.expectedDeliveryDate} onChange={(event) => setForm((prev) => ({ ...prev, expectedDeliveryDate: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            </label>
          </div>
          
          <div className="border-t border-slate-100 pt-4">
            <div className="mb-2 flex justify-between items-center">
              <span className="font-semibold text-sm">Order Lines</span>
              <button type="button" onClick={addLine} className="text-xs font-bold text-sky-600 hover:text-sky-700">+ Add Line</button>
            </div>
            
            <div className="space-y-3">
              {form.lines.map((line, idx) => (
                <div key={idx} className="flex gap-2 items-end bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex-1">
                    <Select
                      label="Product"
                      value={line.product}
                      onChange={(value) => updateLine(idx, "product", value)}
                      options={tiles.map((t) => ({ label: `${t.name} (${t.sku})`, value: String(t.id) }))}
                    />
                  </div>
                  <div className="w-24">
                    <label className="grid gap-1 text-xs font-semibold text-slate-700">
                      Qty
                      <input type="number" min={1} required value={line.orderedQuantity} onChange={(e) => updateLine(idx, "orderedQuantity", e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
                    </label>
                  </div>
                  <div className="w-32">
                    <label className="grid gap-1 text-xs font-semibold text-slate-700">
                      Unit Cost
                      <input type="number" min={0} required value={line.unitPrice} onChange={(e) => updateLine(idx, "unitPrice", e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
                    </label>
                  </div>
                  <button type="button" onClick={() => removeLine(idx)} className="pb-1.5 text-rose-500 font-bold hover:text-rose-700 px-2">&times;</button>
                </div>
              ))}
              {form.lines.length === 0 && <p className="text-xs text-slate-400 italic">No lines added.</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setCreateModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2">Cancel</button>
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-white">Save Draft</button>
          </div>
        </form>
      </FormModal>

      {/* RECEIVE MODAL */}
      {receiveForm && (
        <FormModal 
          isOpen={isReceiveModalOpen} 
          title="Receive PO Items" 
          onClose={() => setReceiveModalOpen(false)}
        >
          <form className="space-y-6" onSubmit={submitReceive}>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Specify the quantities that arrived at the loading dock. This will instantly update your product stock and create transaction records.
              </p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {receiveForm.itemsToReceive.map((item, idx) => (
                <div 
                  key={idx} 
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex-1 space-y-1">
                      <h4 className="text-base font-black text-slate-800 dark:text-slate-100">
                        {item.productName}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                          <span className="uppercase tracking-wider">Ordered:</span>
                          <span className="text-slate-700 dark:text-slate-300">{item.ordered}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                          <span className="uppercase tracking-wider">Received:</span>
                          <span className="text-emerald-600">{item.alreadyReceived}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                          <span className="uppercase tracking-wider">Remaining:</span>
                          <span className="text-indigo-600">{item.ordered - item.alreadyReceived}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full sm:w-32">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Receive Now
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          min={0} 
                          max={item.ordered - item.alreadyReceived} 
                          value={item.receiveNow} 
                          onChange={(e) => updateReceiveAmount(idx, e.target.value)} 
                          className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-black text-indigo-600 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-800 dark:text-indigo-400" 
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 pointer-events-none">
                          PCS
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar for this line item */}
                  <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-500" 
                      style={{ 
                        width: `${Math.min(100, (item.alreadyReceived / item.ordered) * 100)}%` 
                      }}
                    />
                    <div 
                      className="h-full bg-emerald-400/50 -mt-1.5 transition-all duration-500" 
                      style={{ 
                        width: `${Math.min(100, ((item.alreadyReceived + item.receiveNow) / item.ordered) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800">
              <button 
                type="button" 
                onClick={() => setReceiveModalOpen(false)} 
                className="rounded-xl px-6 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-indigo-600 px-8 py-3 text-sm font-black text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95 dark:shadow-none"
              >
                <span>Complete Reception</span>
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </form>
        </FormModal>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <select required value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
        <option value="">Select {label}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function orderTone(status) {
  if (status === "Received") return "success";
  if (status === "Partially Received") return "info";
  if (status === "Cancelled") return "danger";
  if (status === "Sent") return "warning";
  return "neutral"; // Draft
}
