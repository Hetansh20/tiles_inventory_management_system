import React, { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FilterDropdown from "../components/FilterDropdown";
import SearchBar from "../components/SearchBar";
import StatusBadge from "../components/StatusBadge";
import PermissionBanner from "../components/PermissionBanner";
import useDebounce from "../hooks/useDebounce";
import { exportToCsv, exportToExcel, printRows } from "../utils/exportUtils";

export default function InventoryPage({ inventory, tiles, warehouses, canEdit }) {
  const [query, setQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");

  const debouncedQuery = useDebounce(query, 250);

  const filtered = useMemo(() => {
    return inventory
      .map((item) => {
        const tile = tiles.find((entry) => entry.id === item.tileId);
        const warehouse = warehouses.find((entry) => entry.id === item.warehouseId);
        return {
          ...item,
          tileName: tile?.name || `Tile ${item.tileId}`,
          warehouseName: warehouse?.name || `Warehouse ${item.warehouseId}`,
        };
      })
      .filter((item) => {
        const matchesQuery = `${item.tileName} ${item.warehouseName}`.toLowerCase().includes(debouncedQuery.toLowerCase());
        const matchesWarehouse = warehouseFilter === "all" || String(item.warehouseId) === warehouseFilter;
        return matchesQuery && matchesWarehouse;
      });
  }, [inventory, tiles, warehouses, debouncedQuery, warehouseFilter]);

  const columns = [
    { key: "tileName", header: "Tile" },
    { key: "warehouseName", header: "Warehouse" },
    { key: "quantityInStock", header: "Stock" },
    { key: "reorderLevel", header: "Reorder Level" },
    {
      key: "status",
      header: "Indicator",
      render: (row) => {
        const isCritical = row.quantityInStock <= row.reorderLevel * 0.7;
        const isLow = row.quantityInStock <= row.reorderLevel;
        if (isCritical) return <StatusBadge label="Critical" tone="danger" />;
        if (isLow) return <StatusBadge label="Low" tone="warning" />;
        return <StatusBadge label="Healthy" tone="success" />;
      },
    },
  ];

  const exportRows = filtered.map((item) => ({
    Tile: item.tileName,
    Warehouse: item.warehouseName,
    Stock: item.quantityInStock,
    ReorderLevel: item.reorderLevel,
  }));


  return (
    <div className="space-y-4">
      {!canEdit ? <PermissionBanner message="Staff role: inventory is view-only." /> : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <SearchBar value={query} onChange={setQuery} placeholder="Search inventory by tile or warehouse" />
          <FilterDropdown
            label="Warehouse"
            value={warehouseFilter}
            onChange={setWarehouseFilter}
            options={[
              { label: "All", value: "all" },
              ...warehouses.map((warehouse) => ({ label: warehouse.name, value: String(warehouse.id) })),
            ]}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportToCsv("inventory-report", exportRows)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => exportToExcel("inventory-report", exportRows, "Inventory")}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
          >
            Excel
          </button>
          <button
            type="button"
            onClick={() => printRows("Inventory Report", exportRows)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold"
          >
            Print
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No inventory records"
        emptyDescription="Add inventory to a warehouse to start tracking."
      />
    </div>
  );
}
