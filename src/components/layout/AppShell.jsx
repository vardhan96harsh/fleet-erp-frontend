import React from "react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export const AppShell = ({
  currentRoute,
  onNavigate,
  title,
  subtitle,
  actions,
  children,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-paper">
      <Sidebar currentRoute={currentRoute} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title={title} subtitle={subtitle} actions={actions} />
        <main className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto pb-8">
          {children}
        </main>
        <footer className="w-full border-t border-line/60 bg-paper/80 backdrop-blur-sm py-4 px-6 md:px-8 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate">
            <div>
              @{currentYear} Surya Developed by <span className="font-medium text-ink">Harshvardhan</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-soft">
              <span>Enterprise Fleet &amp; Inventory Management</span>
              <span>&bull;</span>
              <span>All rights reserved</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppShell;
