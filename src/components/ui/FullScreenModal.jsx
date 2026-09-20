import React, { useEffect } from "react";
import { X, ArrowLeft } from "lucide-react";

export const FullScreenModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  breadcrumbs,
  menuItems = [],
  activeSection,
  onSectionChange,
  actions,
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

  const hasMultipleSections = menuItems && menuItems.length > 1;

  return (
    <div className="fixed inset-0 z-50 bg-paper flex flex-col h-screen w-screen overflow-hidden animate-in fade-in duration-200">
      {/* Top Enterprise Header Bar */}
      <header className="h-14 px-4 sm:px-6 bg-paper-raised border-b border-line flex items-center justify-between gap-4 shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-slate hover:text-ink bg-paper-subtle hover:bg-paper-muted border border-line transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="h-5 w-px bg-line hidden sm:block shrink-0" />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {breadcrumbs && (
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-soft hidden lg:inline">
                  {breadcrumbs} /
                </span>
              )}
              <h1 className="text-base font-bold text-ink tracking-tight truncate m-0">
                {title}
              </h1>
              {badge && <div className="shrink-0">{badge}</div>}
            </div>
            {subtitle && (
              <p className="text-[11.5px] text-slate truncate m-0">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Top Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate hover:text-ink hover:bg-paper-muted border border-transparent hover:border-line transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Workspace Body: Left Side Sub-Menu + Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Sub-Menu Navigation */}
        {menuItems && menuItems.length > 0 && (
          <aside className="w-60 lg:w-64 bg-paper-raised border-r border-line flex flex-col justify-between shrink-0 overflow-y-auto">
            <div className="p-3 space-y-1">
              {hasMultipleSections && (
                <div className="px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-soft">
                  Sections
                </div>
              )}

              {menuItems.map((item) => {
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSectionChange && onSectionChange(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-all flex items-center justify-between gap-2 ${
                      isActive
                        ? "bg-ink text-white shadow-sm font-semibold"
                        : "text-slate hover:text-ink hover:bg-paper-subtle font-medium"
                    }`}
                  >
                    <span className="truncate">{item.label}</span>

                    {item.badge !== undefined && item.badge !== null && (
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? "bg-white/20 text-white"
                            : item.badgeVariant === "bad"
                            ? "bg-rust-soft text-rust font-semibold"
                            : item.badgeVariant === "warn"
                            ? "bg-amber-soft text-amber font-semibold"
                            : "bg-paper-muted text-slate"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Center / Main Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto bg-paper-subtle p-4 sm:p-6 lg:p-7 custom-scroll">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FullScreenModal;
