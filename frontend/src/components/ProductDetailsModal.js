import React from "react";
import { FiX, FiBox, FiMapPin, FiTruck } from "react-icons/fi";
import StatusBadge from "./StatusBadge";

export default function ProductDetailsModal({ isOpen, onClose, product, supplier, category, inventory }) {
  if (!isOpen || !product) return null;

  const totalStock = inventory?.filter((s) => s.tileId === product.id).reduce((sum, item) => sum + item.quantityInStock, 0) || product.currentQuantity || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Product Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex gap-6 items-start">
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <FiBox size={32} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{product.name}</h3>
                  <p className="text-sm font-semibold text-slate-500">SKU: {product.sku}</p>
                </div>
                <StatusBadge label={product.isActive ? "Active" : "Inactive"} tone={product.isActive ? "success" : "danger"} />
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{product.description || "No description provided."}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Category</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{category?.name || "Uncategorized"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Supplier</p>
              <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                <FiTruck size={14} className="text-slate-400" />
                {supplier?.name || product.supplier || "Unknown"}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cost Price</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">${Number(product.costPrice).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Dimensions</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{product.size || "N/A"}</p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-bold text-slate-700 dark:text-slate-200">Inventory Status</h4>
              <StatusBadge 
                label={`${totalStock} ${product.unitOfMeasure}`} 
                tone={totalStock <= product.lowStockThreshold ? "danger" : "info"} 
              />
            </div>
            <div className="w-full rounded-full bg-slate-200 h-2.5 dark:bg-slate-700 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full ${totalStock <= product.lowStockThreshold ? "bg-rose-500" : "bg-emerald-500"}`} 
                style={{ width: `${Math.min(100, (totalStock / (product.lowStockThreshold * 3)) * 100)}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500 text-right">
              Reorder Level: {product.lowStockThreshold}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-600 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
