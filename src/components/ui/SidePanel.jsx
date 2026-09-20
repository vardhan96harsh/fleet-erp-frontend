import React, { useEffect } from "react";
import { X } from "lucide-react";

export const SidePanel = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badge,
  side = "left", // 'left' by default as requested by user
  maxWidth = "max-w-2xl",
  children,
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

  const isLeft = side === "left";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm animate-fade-in-backdrop transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Full Height Panel */}
      <div
        className={`fixed inset-y-0 ${
          isLeft ? "left-0 border-r animate-slide-in-left" : "right-0 border-l animate-slide-in-right"
        } w-full ${maxWidth} bg-paper-raised border-line shadow-2xl z-50 flex flex-col h-full max-h-screen overflow-hidden`}
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 px-5 py-4 sm:px-6 bg-paper-raised/95 backdrop-blur-md border-b border-line flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="p-2 rounded-lg bg-paper-subtle border border-line text-ink shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-ink tracking-tight truncate m-0">
                  {title}
                </h2>
                {badge && <div>{badge}</div>}
              </div>
              {subtitle && (
                <p className="text-[12px] text-slate mt-0.5 truncate m-0">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-line text-slate-soft bg-paper-subtle">
              ESC
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="p-1.5 rounded-lg text-slate hover:text-ink hover:bg-paper-muted transition-colors border border-transparent hover:border-line"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 custom-scroll">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
