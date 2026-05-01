import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import GlobalSearchModal from "./GlobalSearchModal";
import QRScannerModal from "./QRScannerModal";
import ProductDetailsModal from "./ProductDetailsModal";
import { toast } from "react-toastify";

const meta = {
  "/dashboard": { title: "Dashboard", subtitle: "Inventory and stock performance overview" },
  "/products": { title: "Products", subtitle: "Manage products, attributes, and lifecycle status" },
  "/categories": { title: "Categories", subtitle: "Manage product taxonomy" },
  "/inventory": { title: "Inventory", subtitle: "Monitor stock levels by warehouse" },
  "/suppliers": { title: "Suppliers", subtitle: "Supplier contact and profile management" },
  "/warehouses": { title: "Warehouses", subtitle: "Warehouse list and operations context" },
  "/orders": { title: "Supplier Orders", subtitle: "Create and track purchase orders" },
  "/transfers": { title: "Stock Transfers", subtitle: "Move stock between warehouses" },
  "/users": { title: "Users", subtitle: "Role and access status management" },
  "/transactions": { title: "Transactions", subtitle: "Audit stock movement history" },
  "/alerts": { title: "Low Stock Alerts", subtitle: "Critical and warning-level stock alerts" },
  "/activity": { title: "Activity Logs", subtitle: "Who did what and when" },
};

export default function PageLayout({ children, onLogout, currentUser, alerts, transactions, searchData, theme, onToggleTheme, onProfileClick, onSettingsClick }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const location = useLocation();

  const pageMeta = useMemo(
    () => meta[location.pathname] || { title: "Inventory", subtitle: "Operations dashboard" },
    [location.pathname]
  );

  const unreadCount = alerts.filter((alert) => alert.status === "open").length + (transactions?.slice(0, 5).length || 0);

  const groupedResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const groups = [
      {
        type: "Products",
        items: searchData.products
          .filter((product) => !q || `${product.name} ${product.sku}`.toLowerCase().includes(q))
          .slice(0, 5)
          .map((product) => ({ id: product.id, title: product.name, subtitle: product.sku })),
      },
      {
        type: "Suppliers",
        items: searchData.suppliers
          .filter((item) => !q || item.name.toLowerCase().includes(q))
          .slice(0, 5)
          .map((item) => ({ id: item.id, title: item.name, subtitle: item.contactPerson })),
      },
      {
        type: "Warehouses",
        items: searchData.warehouses
          .filter((item) => !q || item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q))
          .slice(0, 5)
          .map((item) => ({ id: item.id, title: item.name, subtitle: item.location })),
      },
    ];

    return groups;
  }, [searchData, searchQuery]);

  const handleScan = (decodedText) => {
    setScannerOpen(false);
    const skuToFind = decodedText.trim().toLowerCase();
    const foundProduct = searchData.products.find((p) => p.sku?.toLowerCase() === skuToFind);
    if (foundProduct) {
      setScannedProduct(foundProduct);
    } else {
      toast.error(`No product found with SKU: ${decodedText}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={onLogout} role={currentUser?.role} />
      <div className="lg:pl-72">
        <Navbar
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          onMenuClick={() => setSidebarOpen((value) => !value)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenScanner={() => setScannerOpen(true)}
          unreadCount={unreadCount}
          alerts={alerts.filter((alert) => alert.status === "open")}
          transactions={transactions}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onProfileClick={onProfileClick}
          onSettingsClick={onSettingsClick}
          currentUser={currentUser}
        />
        <main className="p-4 md:p-6">{children}</main>
      </div>
      <GlobalSearchModal
        open={searchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onClose={() => setSearchOpen(false)}
        results={groupedResults}
      />
      <QRScannerModal 
        isOpen={scannerOpen} 
        onClose={() => setScannerOpen(false)} 
        onScan={handleScan} 
      />
      <ProductDetailsModal 
        isOpen={!!scannedProduct} 
        onClose={() => setScannedProduct(null)} 
        product={scannedProduct} 
        category={scannedProduct?.category}
      />
    </div>
  );
}
