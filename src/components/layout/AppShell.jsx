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
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-paper">
      <Sidebar currentRoute={currentRoute} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title={title} subtitle={subtitle} actions={actions} />
        <main className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto pb-16">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
