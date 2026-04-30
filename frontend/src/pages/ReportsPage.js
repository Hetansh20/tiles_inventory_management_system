import React, { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FilterDropdown from "../components/FilterDropdown";
import { exportToCsv, exportToExcel, printRows } from "../utils/exportUtils";
import StatusBadge from "../components/StatusBadge";

export default function ReportsPage({ products, movements, users }) {
  const [activeTab, setActiveTab] = useState("valuation"); // valuation | movements | lowstock

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <TabButton active={activeTab === "valuation"} onClick={() => setActiveTab("valuation")}>Stock Valuation</TabButton>
        <TabButton active={activeTab === "movements"} onClick={() => setActiveTab("movements")}>Stock Movements</TabButton>
        <TabButton active={activeTab === "lowstock"} onClick={() => setActiveTab("lowstock")}>Low Stock Alerts</TabButton>
      </div>

      {activeTab === "valuation" && <ValuationReport products={products} />}
      {activeTab === "movements" && <MovementsReport movements={movements} products={products} users={users} />}
      {activeTab === "lowstock" && <LowStockReport products={products} />}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${
        active
          ? "bg-slate-900 text-white dark:bg-white dark:text-black"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

// 1. Stock Valuation Report
function ValuationReport({ products }) {
  const [query, setQuery] = useState("");

  const enriched = useMemo(() => {
    return products
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
      .map((p) => ({
        ...p,
        totalValue: (p.currentQuantity || 0) * (p.costPrice || 0)
      }));
  }, [products, query]);

  const totalInventoryValue = useMemo(() => enriched.reduce((sum, p) => sum + p.totalValue, 0), [enriched]);

  const columns = [
    { key: "sku", header: "SKU" },
    { key: "name", header: "Product" },
    { key: "currentQuantity", header: "Quantity on Hand" },
    { key: "costPrice", header: "Cost Price", render: (row) => `Rs ${Number(row.costPrice).toLocaleString()}` },
    { key: "totalValue", header: "Total Value", render: (row) => <span className="font-bold">Rs {Number(row.totalValue).toLocaleString()}</span> },
  ];

  const exportData = enriched.map(p => ({ SKU: p.sku, Product: p.name, Qty: p.currentQuantity, CostPrice: p.costPrice, TotalValue: p.totalValue }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Inventory Valuation</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">Rs {totalInventoryValue.toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => exportToCsv("valuation-report", exportData)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">CSV</button>
          <button type="button" onClick={() => printRows("Stock Valuation Report", exportData)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">Print</button>
        </div>
      </div>
      
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-sm rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
      />

      <DataTable columns={columns} data={enriched} />
    </div>
  );
}

// 2. Stock Movement Report
function MovementsReport({ movements, products, users }) {
  const [productFilter, setProductFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filtered = useMemo(() => {
    return movements.filter((m) => {
      const pId = String(m.product?._id || m.product?.id || m.product);
      const uId = String(m.performedBy?._id || m.performedBy?.id || m.performedBy);
      
      const matchProduct = productFilter === "all" || pId === productFilter;
      const matchType = typeFilter === "all" || m.type === typeFilter;
      const matchUser = userFilter === "all" || uId === userFilter;
      
      const time = new Date(m.createdAt).getTime();
      const matchStart = !startDate || time >= new Date(startDate).getTime();
      const matchEnd = !endDate || time <= new Date(endDate).getTime() + 86400000;

      return matchProduct && matchType && matchUser && matchStart && matchEnd;
    });
  }, [movements, productFilter, typeFilter, userFilter, startDate, endDate]);

  const columns = [
    { key: "createdAt", header: "Date", render: (row) => new Date(row.createdAt).toLocaleString() },
    { key: "type", header: "Type", render: (row) => <StatusBadge label={row.type} tone={row.type === "IN" ? "success" : row.type === "OUT" ? "warning" : "info"} /> },
    { key: "product", header: "Product", render: (row) => row.product?.name || products.find((p) => String(p.id) === String(row.product))?.name || "Unknown Product" },
    { key: "quantity", header: "Delta", render: (row) => <span className={`font-bold ${row.quantity > 0 ? "text-emerald-600" : row.quantity < 0 ? "text-rose-600" : "text-slate-600"}`}>{row.quantity > 0 ? `+${row.quantity}` : row.quantity}</span> },
    { key: "performedBy", header: "Performed By", render: (row) => row.performedBy?.name || users.find(u => String(u.id) === String(row.performedBy))?.name || "System" },
    { key: "reason", header: "Reason" },
  ];

  const exportData = filtered.map(row => ({
    Date: new Date(row.createdAt).toLocaleString(),
    Type: row.type,
    Product: row.product?.name || products.find((p) => String(p.id) === String(row.product))?.name || "Unknown Product",
    Quantity: row.quantity,
    PerformedBy: row.performedBy?.name || users.find(u => String(u.id) === String(row.performedBy))?.name || "System",
    Reason: row.reason
  }));

  const productOptions = [{ label: "All Products", value: "all" }, ...products.map(p => ({ label: p.name, value: String(p.id) }))];
  const userOptions = [{ label: "All Users", value: "all" }, ...users.map(u => ({ label: u.name, value: String(u.id) }))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <FilterDropdown label="Product" value={productFilter} onChange={setProductFilter} options={productOptions} />
        <FilterDropdown label="Type" value={typeFilter} onChange={setTypeFilter} options={[{label: "All", value: "all"}, {label: "IN", value: "IN"}, {label: "OUT", value: "OUT"}, {label: "ADJUSTMENT", value: "ADJUSTMENT"}]} />
        <FilterDropdown label="Performed By" value={userFilter} onChange={setUserFilter} options={userOptions} />
        
        <label className="flex min-w-[150px] flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          From
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
        </label>
        <label className="flex min-w-[150px] flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          To
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => exportToCsv("movements-report", exportData)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">CSV</button>
        <button type="button" onClick={() => printRows("Stock Movement Report", exportData)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">Print</button>
      </div>

      <DataTable columns={columns} data={filtered} />
    </div>
  );
}

// 3. Low Stock Report
function LowStockReport({ products }) {
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.currentQuantity <= (p.lowStockThreshold || 0));
  }, [products]);

  const columns = [
    { key: "sku", header: "SKU" },
    { key: "name", header: "Product" },
    { key: "currentQuantity", header: "Current Quantity", render: (row) => <span className="font-bold text-rose-600">{row.currentQuantity}</span> },
    { key: "lowStockThreshold", header: "Threshold Threshold" },
    { key: "supplier", header: "Supplier", render: (row) => row.supplier || "Unknown" },
  ];

  const exportData = lowStockProducts.map(p => ({ SKU: p.sku, Product: p.name, CurrentQty: p.currentQuantity, Threshold: p.lowStockThreshold, Supplier: p.supplier }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-600">Showing all active products where the current quantity on hand has dropped to or below the configured alert threshold.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => exportToCsv("low-stock-report", exportData)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">CSV</button>
          <button type="button" onClick={() => printRows("Low Stock Alert Report", exportData)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">Print</button>
        </div>
      </div>
      
      <DataTable columns={columns} data={lowStockProducts} emptyTitle="No low stock alerts!" emptyDescription="All products are well-stocked." />
    </div>
  );
}
