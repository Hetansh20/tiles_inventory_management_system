import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import PageLayout from "./components/PageLayout";
import ProfileModal from "./components/ProfileModal";
import SettingsModal from "./components/SettingsModal";
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
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const StockMovementsPage = lazy(() => import("./pages/StockMovementsPage"));
const TransfersPage = lazy(() => import("./pages/TransfersPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const WarehousesPage = lazy(() => import("./pages/WarehousesPage"));
const ActivityLogsPage = lazy(() => import("./pages/ActivityLogsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));

import { apiCall } from "./utils/api";

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { currentUser, isAuthenticated, login, logout, canManageUsers, canManageProducts, canManageCategories, canManageSuppliers, canManageWarehouses, canManageTransfers, canManageOrders, canDoTransactions } = useAuth();
  const [booting, setBooting] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    setInventory(products.map(p => ({
      id: p.id,
      tileId: p.id,
      warehouseId: warehouses.length > 0 ? warehouses[0].id : "default",
      quantityInStock: p.currentQuantity || 0,
      reorderLevel: p.lowStockThreshold || 10
    })));
  }, [products, warehouses]);
  const [movements, setMovements] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState({
    currency: "₹",
    notifications: true,
    companyName: "Welcome Ceramic"
  });

  // Auto-generate alerts from inventory
  useEffect(() => {
    setAlerts(prev => {
      const resolvedIds = prev.filter(a => a.status === 'resolved').map(a => a.id);
      return products
        .filter(p => p.currentQuantity <= (p.lowStockThreshold || 10))
        .map(p => {
          const id = `alert-${p.id}`;
          const existing = prev.find(a => a.id === id);
          return {
            id,
            tileId: p.id,
            warehouseId: warehouses.length > 0 ? warehouses[0].id : (warehouses[0]?._id || "Main"),
            currentStock: p.currentQuantity,
            reorderLevel: p.lowStockThreshold || 10,
            status: resolvedIds.includes(id) ? "resolved" : "open",
            createdAt: existing?.createdAt || new Date().toISOString()
          };
        });
    });
  }, [products, warehouses]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (isAuthenticated) {
          const [fetchedUsers, fetchedProducts, fetchedCategories, fetchedMovements, fetchedSuppliers, fetchedOrders, fetchedWarehouses] = await Promise.all([
            canManageUsers ? apiCall("/users").catch(()=>[]) : Promise.resolve([]),
            apiCall("/products").catch(()=>[]),
            apiCall("/categories").catch(()=>[]),
            apiCall("/movements").catch(()=>[]),
            apiCall("/suppliers").catch(()=>[]),
            apiCall("/orders").catch(()=>[]),
            apiCall("/warehouses").catch(()=>[])
          ]);
          if (canManageUsers) setUsers(fetchedUsers.map(u => ({ ...u, id: u._id })));
          setProducts(fetchedProducts.map(p => ({ ...p, id: p._id })));
          setCategories(fetchedCategories.map(c => ({ ...c, id: c._id })));
          setMovements(fetchedMovements.map(normalizeMovement));
          setSuppliers(fetchedSuppliers.map(s => ({ ...s, id: s._id })));
          setOrders(fetchedOrders.map(o => ({ ...o, id: o._id })));
          setWarehouses(fetchedWarehouses.map(w => ({ ...w, id: w._id })));
        }
      } catch (e) {
        console.error("Failed to fetch initial data", e);
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
  }, [isAuthenticated, canManageUsers]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const searchData = useMemo(() => ({ products, suppliers, warehouses }), [products, suppliers, warehouses]);

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
  const saveCategory = async (category) => {
    try {
      if (category.id) {
        const updated = await apiCall(`/categories/${category.id}`, { method: "PUT", body: JSON.stringify(category) });
        setCategories((prev) => prev.map((item) => (item.id === updated._id ? { ...updated, id: updated._id } : item)));
        toast.success("Category updated");
      } else {
        const created = await apiCall(`/categories`, { method: "POST", body: JSON.stringify(category) });
        setCategories((prev) => [...prev, { ...created, id: created._id }]);
        toast.success("Category created");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save category");
    }
  };

  const deleteCategory = async (id) => {
    try {
      await apiCall(`/categories/${id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((item) => item.id !== id));
      toast.success("Category deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete category");
    }
  };

  const saveProduct = async (product) => {
    try {
      if (product.id) {
        const updated = await apiCall(`/products/${product.id}`, { method: "PUT", body: JSON.stringify(product) });
        setProducts((prev) => prev.map((item) => (item.id === updated._id ? { ...updated, id: updated._id } : item)));
        toast.success("Product updated");
        return updated;
      } else {
        const created = await apiCall(`/products`, { method: "POST", body: JSON.stringify(product) });
        setProducts((prev) => [...prev, { ...created, id: created._id }]);
        toast.success("Product created");
        return created;
      }
    } catch (error) {
      toast.error(error.message || "Failed to save product");
    }
  };

  const toggleProductStatus = async (id) => {
    try {
      const updated = await apiCall(`/products/${id}/toggle-status`, { method: "PUT" });
      setProducts((prev) => prev.map((item) => (item.id === updated._id ? { ...updated, id: updated._id } : item)));
      toast.info("Product status toggled");
    } catch (e) {
      toast.error("Failed to toggle status");
    }
  };
  const saveSupplier = async (supplier) => {
    try {
      if (supplier.id) {
        const updated = await apiCall(`/suppliers/${supplier.id}`, { method: "PUT", body: JSON.stringify(supplier) });
        setSuppliers((prev) => prev.map((item) => (item.id === updated._id ? { ...updated, id: updated._id } : item)));
        toast.success("Supplier updated");
      } else {
        const created = await apiCall(`/suppliers`, { method: "POST", body: JSON.stringify(supplier) });
        setSuppliers((prev) => [...prev, { ...created, id: created._id }]);
        toast.success("Supplier created");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save supplier");
    }
  };
  const saveWarehouse = async (warehouse) => {
    try {
      if (warehouse.id) {
        const updated = await apiCall(`/warehouses/${warehouse.id}`, {
          method: "PUT",
          body: JSON.stringify(warehouse)
        });
        setWarehouses((prev) => prev.map((item) => (item.id === updated._id ? { ...updated, id: updated._id } : item)));
        toast.success("Warehouse updated successfully");
      } else {
        const created = await apiCall(`/warehouses`, {
          method: "POST",
          body: JSON.stringify(warehouse)
        });
        setWarehouses((prev) => [...prev, { ...created, id: created._id }]);
        toast.success("Warehouse created successfully");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save warehouse");
    }
  };
  const saveMovement = async (movement) => {
    try {
      const created = await apiCall("/movements", {
        method: "POST",
        body: JSON.stringify(movement)
      });
      setMovements((prev) => [normalizeMovement(created), ...prev]);
      
      // Also update the local product quantity so UI reflects it immediately
      setProducts(prev => prev.map(p => {
        if (p.id === movement.product) {
          let delta = Number(movement.quantity);
          if (movement.type === 'OUT') delta = -Math.abs(delta);
          else if (movement.type === 'IN') delta = Math.abs(delta);
          return { ...p, currentQuantity: p.currentQuantity + delta };
        }
        return p;
      }));
      
      toast.success("Stock movement recorded");
    } catch (e) {
      toast.error(e.message || "Failed to record movement");
    }
  };
  const saveTransfer = (transfer) => {
    setTransfers((prev) => upsert(prev, transfer));
    toast.success("Transfer created");
  };
  const saveOrder = async (order) => {
    try {
      const created = await apiCall("/orders", { method: "POST", body: JSON.stringify(order) });
      setOrders((prev) => [{ ...created, id: created._id }, ...prev]);
      toast.success("Purchase order created");
    } catch (e) {
      toast.error(e.message || "Failed to create order");
    }
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



  const updateTransferStatus = (id, status) => {
    setTransfers((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const updated = await apiCall(`/orders/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      setOrders((prev) => prev.map((item) => (item.id === id ? { ...updated, id: updated._id } : item)));
      toast.success(`Order status updated to ${status}`);
    } catch (e) {
      toast.error(e.message || "Failed to update order status");
    }
  };

  const receiveItems = async (orderId, itemsToReceive) => {
    try {
      const updatedOrder = await apiCall(`/orders/${orderId}/receive`, {
        method: "POST",
        body: JSON.stringify({ items: itemsToReceive })
      });
      setOrders((prev) => prev.map((item) => (item.id === orderId ? { ...updatedOrder, id: updatedOrder._id } : item)));
      
      // Also silently fetch products and movements again since they got updated in backend
      const [newProducts, newMovements] = await Promise.all([
        apiCall("/products").catch(()=>[]),
        apiCall("/movements").catch(()=>[])
      ]);
      setProducts(newProducts.map(p => ({ ...p, id: p._id })));
      setMovements(newMovements.map(normalizeMovement));

      toast.success("Items received and inventory updated");
    } catch (e) {
      toast.error(e.message || "Failed to receive items");
    }
  };

  const resolveAlert = (id) => {
    setAlerts((prev) => prev.map((item) => (item.id === id ? { ...item, status: "resolved" } : item)));
    toast.warning("Alert marked as resolved");
  };

  const updateProfile = async (formData) => {
    try {
      if (formData.name !== currentUser.name) {
        toast.success("Profile name updated (Preview)");
      }
      if (formData.newPassword) {
        toast.info("Password change request submitted");
      }
    } catch (e) {
      toast.error("Profile update failed");
    }
  };

  const updateSettings = (newData) => {
    setAppSettings(newData);
    toast.success("Settings applied successfully!");
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
                  transactions={movements}
                  searchData={searchData}
                  theme={theme}
                  onToggleTheme={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
                  onProfileClick={() => setProfileOpen(true)}
                  onSettingsClick={() => setSettingsOpen(true)}
                >
                  <Routes>
                    <Route
                      path="/dashboard"
                      element={
                        <DashboardPage
                          tiles={products}
                          inventory={inventory}
                          suppliers={suppliers}
                          warehouses={warehouses}
                          transactions={movements}
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
                          <UsersPage users={users} saveUser={saveUser} toggleUserStatus={toggleUserStatus} canEdit={canManageUsers} />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/categories"
                      element={
                        <CategoriesPage
                          categories={categories}
                          saveCategory={saveCategory}
                          deleteCategory={deleteCategory}
                          canEdit={canManageCategories}
                        />
                      }
                    />
                    <Route
                      path="/products"
                      element={
                        <ProductsPage
                          products={products}
                          categories={categories}
                          suppliers={suppliers}
                          saveProduct={saveProduct}
                          toggleProductStatus={toggleProductStatus}
                          canEdit={canManageProducts}
                        />
                      }
                    />
                    <Route path="/warehouses" element={<WarehousesPage warehouses={warehouses} saveWarehouse={saveWarehouse} canEdit={canManageWarehouses} />} />
                    <Route path="/suppliers" element={<SuppliersPage suppliers={suppliers} saveSupplier={saveSupplier} canEdit={canManageSuppliers} />} />
                    <Route
                      path="/inventory"
                      element={
                        <InventoryPage
                          inventory={inventory}
                          tiles={products}
                          warehouses={warehouses}
                          canEdit={canManageProducts}
                          bulkInventoryUpdate={bulkInventoryUpdate}
                        />
                      }
                    />
                    <Route
                      path="/transactions"
                      element={
                        <StockMovementsPage
                          movements={movements}
                          products={products}
                          saveMovement={saveMovement}
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
                          tiles={products}
                          saveTransfer={saveTransfer}
                          updateTransferStatus={updateTransferStatus}
                          canEdit={canManageTransfers}
                        />
                      }
                    />
                    <Route
                      path="/orders"
                      element={
                        <OrdersPage
                          orders={orders}
                          suppliers={suppliers}
                          tiles={products}
                          saveOrder={saveOrder}
                          updateOrderStatus={updateOrderStatus}
                          receiveItems={receiveItems}
                          canEdit={canManageOrders}
                        />
                      }
                    />
                    <Route path="/alerts" element={<AlertsPage alerts={alerts} tiles={products} warehouses={warehouses} resolveAlert={resolveAlert} canEdit={canManageProducts} />} />
                    <Route path="/reports" element={<ReportsPage products={products} movements={movements} users={users} />} />

                    <Route path="/activity" element={<ActivityLogsPage transactions={movements} />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </PageLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setProfileOpen(false)} 
        user={currentUser}
        onUpdate={updateProfile}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={appSettings}
        onUpdate={updateSettings}
        theme={theme}
        onToggleTheme={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
      />
      <ToastContainer position="top-right" autoClose={2500} newestOnTop theme={theme === "dark" ? "dark" : "light"} />
    </Router>
  );
}

function normalizeMovement(movement) {
  const productId = movement.product?._id || movement.product?.id || movement.product;
  return {
    ...movement,
    id: movement._id || movement.id,
    tileId: productId,
    date: movement.createdAt || movement.date || new Date().toISOString(),
  };
}

function upsert(items, candidate) {
  if (candidate?.id) {
    return items.map((item) => (item.id === candidate.id ? { ...item, ...candidate } : item));
  }

  const nextId = items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  return [...items, { ...candidate, id: nextId }];
}
