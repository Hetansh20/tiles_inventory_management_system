import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { FiX } from "react-icons/fi";

export default function QRScannerModal({ isOpen, onClose, onScan }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Initialize the scanner when the modal opens
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      /* verbose= */ false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Stop scanning after successful read to prevent multiple triggers
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
          scannerRef.current = null;
        }
        onScan(decodedText);
      },
      (error) => {
        // Ignore normal scan failures (e.g. no QR code found in current frame)
      }
    );

    return () => {
      // Cleanup on unmount or close
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Scan QR Code</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <FiX size={20} />
          </button>
        </div>
        <div className="p-4">
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400 text-center">
            Point your camera at a product's QR code to view its details.
          </p>
          <div id="qr-reader" className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
