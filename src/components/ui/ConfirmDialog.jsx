import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  confirmVariant = "danger",
  loading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-backdrop">
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-paper-raised rounded-xl shadow-2xl border border-line p-5 sm:p-6 z-10">
        <div className="flex items-start justify-between pb-3 border-b border-line mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rust-soft text-rust shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-ink m-0">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate hover:text-ink p-1 rounded-md hover:bg-paper-muted transition-colors -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[13.5px] text-ink leading-relaxed my-3">
          {message}
        </p>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-line mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`btn ${
              confirmVariant === "danger"
                ? "bg-rust text-white border-rust hover:bg-rust-dark"
                : "btn-primary"
            }`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
