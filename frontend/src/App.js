import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import PageLayout from "./components/PageLayout";
import LoadingState from "./components/LoadingState";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";
import useAuth from "./hooks/useAuth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const SuppliersPage = lazy(() => import("./pages/SuppliersPage"));
const TilesPage = lazy(() => import("./pages/TilesPage"));
const TransactionsPage = lazy(() => import("./pages/TransactionsPage"));
const TransfersPage = lazy(() => import("./pages/TransfersPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const WarehousesPage = lazy(() => import("./pages/WarehousesPage"));
const ActivityLogsPage = lazy(() => import("./pages/ActivityLogsPage"));

import { apiCall } from "./utils/api";

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { currentUser, isAuthenticated, login, logout, canEdit, canDoTransactions } = useAuth();
  const [booting, setBooting] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const [users, setUsers] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (isAuthenticated && canEdit) {
          const fetchedUsers = await apiCall("/users");
          setUsers(fetchedUsers.map(u => ({ ...u, id: u._id })));
        }
      } catch (e) {
        console.error("Failed to fetch users", e);
      } finally {
        setBooting(false);
      }
    };
    
    // We only simulate booting timeout if not authenticated, else we wait for fetch.
    if (!isAuthenticated) {
      const timer = setTimeout(() => setBooting(false), 500);
      return () => clearTimeout(timer);
    } else {
      fetchInitialData();
    }
  }, [isAuthenticated, canEdit]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const searchData = useMemo(() => ({ tiles, suppliers, warehouses }), [tiles, suppliers, warehouses]);

  const saveUser = async (user) => {
    try {
      if (user.id) {
        const updated = await apiCall(`/users/${user.id}`, {
          method: "PUT",
          body: JSON.stringify(user)
        });
        setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        toast.success("User updated");
      } else {
        const created = await apiCall(`/users`, {
          method: "POST",
          body: JSON.stringify(user)
        });
        setUsers((prev) => [...prev, created]);
        toast.success("User created");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save user");
    }
  };
  const saveTile = (tile) => {
    setTiles((prev) => upsert(prev, tile));
    toast.success("Tile saved successfully");
  };
  const saveSupplier = (supplier) => {
    setSuppliers((prev) => upsert(prev, supplier));
    toast.success("Supplier saved successfully");
  };
  const saveWarehouse = (warehouse) => {
    setWarehouses((prev) => upsert(prev, warehouse));
    toast.success("Warehouse saved successfully");
  };
  const saveTransaction = (transaction) => {
    setTransactions((prev) => upsert(prev, { ...transaction, performedBy: currentUser?.name || "System" }));
    toast.info("Transaction recorded");
  };
  const saveTransfer = (transfer) => {
    setTransfers((prev) => upsert(prev, transfer));
    toast.success("Transfer created");
  };
  const saveOrder = (order) => {
    setOrders((prev) => upsert(prev, order));
    toast.success("Order created");
  };

  const toggleUserStatus = async (id) => {
    try {
      const updated = await apiCall(`/users/${id}/toggle-status`, { method: "PUT" });
      setUsers((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.info(`User status toggled`);
    } catch (e) {
      toast.error("Failed to toggle status");
    }
  };

  const toggleTileStatus = (id) => {
    setTiles((prev) => prev.map((item) => (item.id === id ? { ...item, isActive: !item.isActive } : item)));
  };

  const updateTransferStatus = (id, status) => {
    setTransfers((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const updateOrderStatus = (id, status) => {
    setOrders((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const resolveAlert = (id) => {
    setAlerts((prev) => prev.map((item) => (item.id === id ? { ...item, status: "resolved" } : item)));
    toast.warning("Alert marked as resolved");
  };

  const bulkDeleteTiles = (ids) => {
    setTiles((prev) => prev.filter((item) => !ids.includes(item.id)));
    toast.success(`${ids.length} tiles deleted`);
  };

  const bulkToggleTiles = (ids, active) => {
    setTiles((prev) => prev.map((item) => (ids.includes(item.id) ? { ...item, isActive: active } : item)));
    toast.success(`${ids.length} tiles updated`);
  };

  const bulkInventoryUpdate = (ids, delta) => {
    setInventory((prev) => prev.map((item) => (ids.includes(item.id) ? { ...item, quantityInStock: Math.max(0, item.quantityInStock + delta) } : item)));
    toast.info("Bulk stock update applied");
  };

  const handleLogin = (credentials) => {
    const result = login(credentials);
    if (result.ok) {
      toast.success(`Signed in as ${result.user.role}`);
    }
    return result;
  };

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg">
          <LoadingState label="Preparing dashboard experience..." />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Suspense
        fallback={
          <div className="p-6">
            <LoadingState label="Loading module..." />
          </div>
        }
      >
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />}
          />

          <Route
            path="/*"
            element={
              <PrivateRoute>
                <PageLayout
                  onLogout={logout}
                  currentUser={currentUser}
                  alerts={alerts}
                  transactions={transactions}
                  searchData={searchData}
                  theme={theme}
                  onToggleTheme={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
                >
                  <Routes>
                    <Route
                      path="/dashboard"
                      element={
                        <DashboardPage
                          tiles={tiles}
                          inventory={inventory}
                          suppliers={suppliers}
                          warehouses={warehouses}
                          transactions={transactions}
                          alerts={alerts}
                          resolveAlert={resolveAlert}
                          orders={orders}
                          currentUser={currentUser}
                        />
                      }
                    />
                    <Route
                      path="/users"
                      element={
                        <PrivateRoute allowedRoles={["admin"]}>
                          <UsersPage users={users} saveUser={saveUser} toggleUserStatus={toggleUserStatus} canEdit={canEdit} />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/tiles"
                      element={
                        <TilesPage
                          tiles={tiles}
                          suppliers={suppliers}
                          saveTile={saveTile}
                          toggleTileStatus={toggleTileStatus}
                          canEdit={canEdit}
                          bulkDeleteTiles={bulkDeleteTiles}
                          bulkToggleTiles={bulkToggleTiles}
                        />
                      }
                    />
                    <Route path="/warehouses" element={<WarehousesPage warehouses={warehouses} saveWarehouse={saveWarehouse} canEdit={canEdit} />} />
                    <Route path="/suppliers" element={<SuppliersPage suppliers={suppliers} saveSupplier={saveSupplier} canEdit={canEdit} />} />
                    <Route
                      path="/inventory"
                      element={
                        <InventoryPage
                          inventory={inventory}
                          tiles={tiles}
                          warehouses={warehouses}
                          canEdit={canEdit}
                          bulkInventoryUpdate={bulkInventoryUpdate}
                        />
                      }
                    />
                    <Route
                      path="/transactions"
                      element={
                        <TransactionsPage
                          transactions={transactions}
                          tiles={tiles}
                          saveTransaction={saveTransaction}
                          canDoTransactions={canDoTransactions}
                        />
                      }
                    />
                    <Route
                      path="/transfers"
                      element={
                        <TransfersPage
                          transfers={transfers}
                          warehouses={warehouses}
                          tiles={tiles}
                          saveTransfer={saveTransfer}
                          updateTransferStatus={updateTransferStatus}
                          canEdit={canEdit}
                        />
                      }
                    />
                    <Route
                      path="/orders"
                      element={
                        <OrdersPage
                          orders={orders}
                          suppliers={suppliers}
                          tiles={tiles}
                          saveOrder={saveOrder}
                          updateOrderStatus={updateOrderStatus}
                          canEdit={canEdit}
                        />
                      }
                    />
                    <Route path="/alerts" element={<AlertsPage alerts={alerts} tiles={tiles} warehouses={warehouses} resolveAlert={resolveAlert} canEdit={canEdit} />} />
                    <Route path="/activity" element={<ActivityLogsPage transactions={transactions} />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </PageLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
      <ToastContainer position="top-right" autoClose={2500} newestOnTop theme={theme === "dark" ? "dark" : "light"} />
    </Router>
  );
}

function upsert(items, candidate) {
  if (candidate?.id) {
    return items.map((item) => (item.id === candidate.id ? { ...item, ...candidate } : item));
  }

  const nextId = items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  return [...items, { ...candidate, id: nextId }];
}
