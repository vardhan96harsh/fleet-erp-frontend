import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg, dur) => addToast(msg, "success", dur),
    error: (msg, dur) => addToast(msg, "error", dur),
    warn: (msg, dur) => addToast(msg, "warn", dur),
    info: (msg, dur) => addToast(msg, "info", dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          let bg = "bg-ink text-white border-ink-soft";
          let icon = <Info className="w-4 h-4 text-slate-light shrink-0" />;

          if (t.type === "success") {
            bg = "bg-[#1B382F] text-white border-teal/40";
            icon = <CheckCircle2 className="w-4 h-4 text-teal-soft shrink-0" />;
          } else if (t.type === "error") {
            bg = "bg-[#3D1A16] text-white border-rust/40";
            icon = <XCircle className="w-4 h-4 text-rust-soft shrink-0" />;
          } else if (t.type === "warn") {
            bg = "bg-[#3B2915] text-white border-amber/40";
            icon = <AlertTriangle className="w-4 h-4 text-amber-soft shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-modal animate-in fade-in slide-in-from-bottom-2 duration-200 ${bg}`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="text-[13px] font-medium leading-tight flex-1 break-words">
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="opacity-70 hover:opacity-100 transition-opacity p-0.5 -mr-1 text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
