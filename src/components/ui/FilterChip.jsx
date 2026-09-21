import React from "react";

export const FilterChip = ({
  active,
  onClick,
  children,
  count,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`filter-chip inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
        active ? "filter-chip-active" : ""
      } ${className}`}
    >
      {children}
      {count !== undefined && (
        <span
          className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
            active
              ? "bg-white/20 text-white"
              : "bg-paper-muted text-slate"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export default FilterChip;
