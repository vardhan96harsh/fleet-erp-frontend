import React from "react";
import { fmtD } from "../../utils/dates.js";

export const Topbar = ({ title, subtitle, actions }) => {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-paper-raised/95 backdrop-blur-sm border-b border-line">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-ink tracking-tight m-0">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[12.5px] text-slate mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="hidden sm:block font-mono text-[11.5px] text-slate px-2.5 py-1 rounded bg-paper-subtle border border-line">
          {fmtD(new Date().toISOString())}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
