import React, { useEffect, useState, useMemo } from "react";
import PageLayout from "../components/PageLayout";
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
import { apiCall } from "../utils/api";
import { toast } from "react-toastify";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [inventories, setInventories] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingInventory, setEditingInventory] = useState(null);
  const [filterWarehouse, setFilterWarehouse] = useState("");
  const [filterProduct, setFilterProduct] = useState("");

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [invRes, prodRes, whRes, sumRes, lowRes] = await Promise.all([
        apiCall("/inventory"),
        apiCall("/products"),
        apiCall("/warehouses"),
        apiCall("/inventory/summary"),
        apiCall("/inventory/low-stock"),
      ]);
      setInventories(invRes);
      setProducts(prodRes);
      setWarehouses(whRes);
      setSummary(sumRes);
      setLowStockItems(lowRes);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter inventories
  const filteredInventories = useMemo(() => {
    let filtered = inventories;
    if (filterWarehouse) {
      filtered = filtered.filter((inv) => inv.warehouse._id === filterWarehouse);
    }
    if (filterProduct) {
      filtered = filtered.filter((inv) => inv.product._id === filterProduct);
    }
    return filtered;
  }, [inventories, filterWarehouse, filterProduct]);

  // Handle create/update inventory
  const handleSaveInventory = async (formData) => {
    try {
      if (modalMode === "create") {
        await apiCall("/inventory", {
          method: "POST",
          body: JSON.stringify({
            productId: formData.productId,
            warehouseId: formData.warehouseId,
            quantity: Number(formData.quantity),
          }),
        });
        toast.success("Inventory created successfully");
      } else {
        await apiCall(`/inventory/${editingInventory.id}`, {
          method: "PUT",
          body: JSON.stringify({
            quantity: Number(formData.quantity),
          }),
        });
        toast.success("Inventory updated successfully");
      }
      setIsModalOpen(false);
      loadAllData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (inventory) => {
    setEditingInventory(inventory);
    setModalMode("update");
    setIsModalOpen(true);
  };

  const handleTransfer = async () => {
    const fromWh = prompt("Enter source warehouse ID:");
    if (!fromWh) return;

    const toWh = prompt("Enter destination warehouse ID:");
    if (!toWh) return;

    const prodId = prompt("Enter product ID:");
    if (!prodId) return;

    const qty = prompt("Enter quantity to transfer:");
    if (!qty) return;

    const reason = prompt("Enter transfer reason:");
    if (!reason) return;

    try {
      await apiCall("/inventory/transfer", {
        method: "POST",
        body: JSON.stringify({
          productId: prodId,
          fromWarehouseId: fromWh,
          toWarehouseId: toWh,
          quantity: Number(qty),
          reason,
        }),
      });
      toast.success("Stock transferred successfully");
      loadAllData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleExport = async (format) => {
    try {
      const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : 'https://tiles-inventory-management-system.onrender.com/api';

      const response = await fetch(
        `${BASE_URL}/inventory/export?format=${format}${filterWarehouse ? `&warehouseId=${filterWarehouse}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (format === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `inventory-${Date.now()}.csv`;
        link.click();
      } else {
        const data = await response.json();
        console.log(data);
      }
      toast.success(`Inventory exported as ${format}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Tab components
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">Total Products</p>
            <p className="text-2xl font-bold text-blue-600">{summary.totalProducts}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600">Total Stock</p>
            <p className="text-2xl font-bold text-green-600">{summary.totalQuantity}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600">Inventory Value</p>
            <p className="text-2xl font-bold text-purple-600">₹{(summary.totalValue || 0).toLocaleString()}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{summary.outOfStockCount}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-600">Low Stock Items</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.lowStockCount}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <p className="text-sm text-gray-600">Warehouses</p>
            <p className="text-2xl font-bold text-orange-600">{summary.totalWarehouses}</p>
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-3">⚠️ Low Stock Alert</h3>
          <div className="space-y-2">
            {lowStockItems.slice(0, 5).map((item) => (
              <div key={item.inventoryId} className="flex justify-between text-sm">
                <span>{item.productName} ({item.warehouseName})</span>
                <span className="text-red-600 font-semibold">
                  {item.currentStock}/{item.threshold}
                </span>
              </div>
            ))}
          </div>
          {lowStockItems.length > 5 && (
            <p className="text-xs text-red-600 mt-2">+{lowStockItems.length - 5} more items</p>
          )}
        </div>
      )}
    </div>
  );

  const ManagementTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setEditingInventory(null);
            setModalMode("create");
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Inventory
        </button>
        <button
          onClick={handleTransfer}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Transfer Stock
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          value={filterWarehouse}
          onChange={(e) => setFilterWarehouse(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={[
          { key: "product.name", label: "Product" },
          { key: "warehouse.name", label: "Warehouse" },
          {
            key: "quantity",
            label: "Quantity",
            render: (row) => (
              <span
                className={
                  row.isLowStock
                    ? "text-red-600 font-semibold"
                    : "text-green-600 font-semibold"
                }
              >
                {row.quantity} {row.product?.unitOfMeasure || "pcs"}
              </span>
            ),
          },
          {
            key: "product.lowStockThreshold",
            label: "Threshold",
            render: (row) => row.product?.lowStockThreshold,
          },
          {
            key: "total_value",
            label: "Value",
            render: (row) => `₹${(row.quantity * (row.product?.costPrice || 0)).toLocaleString()}`,
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(row)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                >
                  Edit
                </button>
              </div>
            ),
          },
        ]}
        data={filteredInventories}
        loading={loading}
      />
    </div>
  );

  const ReportsTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleExport("csv")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          📥 Export CSV
        </button>
        <button
          onClick={() => handleExport("json")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          📥 Export JSON
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-4">Inventory Report</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-right">Total Stock</th>
                <th className="px-4 py-2 text-right">Value</th>
                <th className="px-4 py-2 text-center">Locations</th>
                <th className="px-4 py-2 text-center">Empty</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventories.map((inv) => (
                <tr key={inv.id} className="border-t">
                  <td className="px-4 py-2">{inv.product?.name}</td>
                  <td className="px-4 py-2 text-right">{inv.quantity}</td>
                  <td className="px-4 py-2 text-right">
                    ₹{(inv.quantity * (inv.product?.costPrice || 0)).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-center">1</td>
                  <td className="px-4 py-2 text-center">{inv.quantity === 0 ? "✓" : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const LowStockTab = () => (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="font-semibold mb-4">Low Stock Items ({lowStockItems.length})</h3>
      {lowStockItems.length === 0 ? (
        <p className="text-gray-500">No low stock items</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-left">SKU</th>
                <th className="px-4 py-2 text-left">Warehouse</th>
                <th className="px-4 py-2 text-right">Current</th>
                <th className="px-4 py-2 text-right">Threshold</th>
                <th className="px-4 py-2 text-right">To Order</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((item) => (
                <tr key={item.inventoryId} className="border-t">
                  <td className="px-4 py-2 font-medium">{item.productName}</td>
                  <td className="px-4 py-2 text-gray-500">{item.sku}</td>
                  <td className="px-4 py-2">{item.warehouseName}</td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-red-600 font-semibold">{item.currentStock}</span>
                  </td>
                  <td className="px-4 py-2 text-right">{item.threshold}</td>
                  <td className="px-4 py-2 text-right font-semibold">
                    {Math.max(0, item.threshold - item.currentStock)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <PageLayout title="Inventory Management" description="Manage warehouse inventory and stock levels">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b">
          {[
            { id: "overview", label: "📊 Overview" },
            { id: "management", label: "📦 Management" },
            { id: "low-stock", label: "⚠️ Low Stock" },
            { id: "reports", label: "📋 Reports" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "management" && <ManagementTab />}
        {activeTab === "low-stock" && <LowStockTab />}
        {activeTab === "reports" && <ReportsTab />}
      </div>

      {/* Modal */}
      <FormModal
        isOpen={isModalOpen}
        title={modalMode === "create" ? "Add Inventory" : "Update Inventory"}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveInventory}
        fields={
          modalMode === "create"
            ? [
                {
                  name: "productId",
                  label: "Product",
                  type: "select",
                  options: products.map((p) => ({ value: p.id, label: p.name })),
                  required: true,
                },
                {
                  name: "warehouseId",
                  label: "Warehouse",
                  type: "select",
                  options: warehouses.map((w) => ({ value: w.id, label: w.name })),
                  required: true,
                },
                {
                  name: "quantity",
                  label: "Quantity",
                  type: "number",
                  required: true,
                  min: 0,
                },
              ]
            : [
                {
                  name: "quantity",
                  label: "Quantity",
                  type: "number",
                  required: true,
                  min: 0,
                  defaultValue: editingInventory?.quantity,
                },
              ]
        }
      />
    </PageLayout>
  );
}
