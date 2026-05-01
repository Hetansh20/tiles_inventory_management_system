import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { FiAlertTriangle, FiArchive, FiLayers, FiMapPin, FiTruck } from "react-icons/fi";
import ActivityTimeline from "../components/ActivityTimeline";
import ChartCard from "../components/ChartCard";
import DataTable from "../components/DataTable";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

const palette = ["#0ea5e9", "#14b8a6", "#f59e0b", "#f43f5e", "#6366f1", "#22c55e"];

export default function DashboardPage({ tiles, inventory, suppliers, warehouses, transactions, alerts, resolveAlert, orders, currentUser }) {
  const lowStockCount = inventory.filter((item) => item.quantityInStock <= item.reorderLevel).length;
  const pendingOrdersCount = orders?.filter((o) => ["Draft", "Sent", "Partially Received"].includes(o.status)).length || 0;
  const totalStockValue = inventory.reduce((sum, item) => sum + (item.quantityInStock * (tiles.find(t=>t.id===item.tileId)?.costPrice || 0)), 0);
  const activeAlerts = alerts.filter((alert) => alert.status === "open");

  const stockByCategory = useMemo(() => {
    const map = new Map();
    tiles.forEach((tile) => {
      const catName = tile.category?.name || "Uncategorized";
      const qty = inventory
        .filter((stock) => stock.tileId === tile.id)
        .reduce((sum, stock) => sum + stock.quantityInStock, 0);
      map.set(catName, (map.get(catName) || 0) + qty);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [tiles, inventory]);

  const monthlyFlow = useMemo(() => {
    const map = new Map();
    transactions.forEach((item) => {
      const month = (item.createdAt || item.date || new Date().toISOString()).slice(0, 7);
      const existing = map.get(month) || { month, stockIn: 0, stockOut: 0 };
      if (item.type === "IN") existing.stockIn += item.quantity;
      if (item.type === "OUT") existing.stockOut += item.quantity;
      map.set(month, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const topSelling = useMemo(() => {
    const sold = transactions.filter((item) => item.type === "OUT");
    const map = new Map();
    sold.forEach((item) => {
      map.set(item.tileId, (map.get(item.tileId) || 0) + item.quantity);
    });
    return [...map.entries()]
      .map(([tileId, quantity]) => ({
        tileId,
        quantity,
        name: tiles.find((tile) => tile.id === tileId)?.name || `Tile ${tileId}`,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [transactions, tiles]);

  const recentColumns = [
    { key: "date", header: "Date" },
    { key: "type", header: "Type", render: (row) => <StatusBadge label={row.type} tone={typeTone(row.type)} /> },
    { key: "quantity", header: "Quantity" },
    { key: "performedBy", header: "Performed By", render: (row) => row.performedBy?.name || row.performedBy || "Unknown" },
    { key: "referenceId", header: "Reference" },
  ];

  const timeline = [...transactions]
    .sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''))
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      action: `${item.type} · ${item.quantity} units · ${item.reason}`,
      performedBy: item.performedBy?.name || item.performedBy || "Unknown",
      date: item.createdAt || item.date,
    }));

  return (
    <div className="space-y-6">
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Products" value={tiles.length} icon={FiLayers} hint="Active SKUs cataloged" tone="emerald" />
        <StatCard title="Low-Stock Items" value={lowStockCount} icon={FiAlertTriangle} hint="Below reorder threshold" tone="rose" />
        
        {currentUser?.role === "admin" && (
          <>
            <StatCard title="Pending Purchase Orders" value={pendingOrdersCount} icon={FiTruck} hint="Awaiting delivery" tone="amber" />
            <StatCard title="Total Stock Value" value={`Rs ${totalStockValue.toLocaleString()}`} icon={FiArchive} hint="Current gross value" tone="sky" />
          </>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Stock Distribution by Category">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={stockByCategory} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#475569" opacity={0.2} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: '12px', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }} 
                  itemStyle={{ color: "#38bdf8", fontWeight: 'bold' }} 
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {stockByCategory.map((item, index) => (
                    <Cell key={`${item.name}-${index}`} fill={palette[index % palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Monthly Stock-In vs Stock-Out">
          <div className="h-72">
            {monthlyFlow.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.35} />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#475569" }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#475569" }} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: '12px', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }} 
                    itemStyle={{ color: "#38bdf8", fontWeight: 'bold' }} 
                  />
                  <Bar dataKey="stockIn" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="stockOut" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                No transaction data available yet.
              </div>
            )}
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Recent Stock Movements</h2>
          <DataTable columns={recentColumns} data={[...transactions].map(t => ({...t, date: t.createdAt || t.date })).sort((a, b) => (b.date || '').localeCompare(a.date || ''))} pageSize={10} />
        </div>

        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Top Selling Tiles</h3>
            <div className="space-y-3 relative z-10">
              {topSelling.length ? (
                topSelling.map((item) => (
                  <div key={item.tileId} className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-900">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
                    <StatusBadge label={`${item.quantity} units`} tone="info" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No sales activity yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Low Stock Alerts</h2>
              <StatusBadge label={`${activeAlerts.length} open`} tone={activeAlerts.length ? "danger" : "success"} />
            </div>

            <div className="space-y-3">
              {activeAlerts.length ? (
                activeAlerts.slice(0, 5).map((alert) => {
                  const critical = alert.currentStock <= Math.max(1, Math.floor(alert.reorderLevel * 0.5));
                  return (
                    <div key={alert.id} className={`rounded-xl border p-3 ${critical ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"}`}>
                      <p className="text-sm font-bold text-slate-800">Tile #{alert.tileId} • Warehouse #{alert.warehouseId}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Current {alert.currentStock} / Reorder {alert.reorderLevel}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusBadge label={critical ? "Critical" : "Warning"} tone={critical ? "danger" : "warning"} />
                        <button
                          type="button"
                          onClick={() => resolveAlert(alert.id)}
                          className="text-xs font-semibold text-slate-700 underline"
                        >
                          Mark resolved
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                  No active alerts. Inventory health is stable.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ChartCard title="Recent Activity Timeline">
        <ActivityTimeline activities={timeline} />
      </ChartCard>
    </div>
  );
}

function typeTone(type) {
  if (type === "IN") return "success";
  if (type === "OUT") return "warning";
  if (type === "ADJUSTMENT") return "info";
  return "danger";
}
