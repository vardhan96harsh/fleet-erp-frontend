import React from "react";

export const StatCard = ({
  label,
  value,
  subtitle,
  variant = "default",
  icon: Icon,
  onClick,
}) => {
  const colorMap = {
    default: "text-ink",
    warn: "text-amber",
    bad: "text-rust",
    teal: "text-teal",
  };

  const valColor = colorMap[variant] || colorMap.default;

  return (
    <div
      onClick={onClick}
      className={`panel panel-pad flex-1 min-w-[170px] ${
        onClick ? "cursor-pointer hover:border-slate-soft transition-all" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-slate uppercase tracking-wider">
          {label}
        </span>
        {Icon && <Icon className="w-4 h-4 text-slate-soft" />}
      </div>
      <div className={`text-2xl sm:text-3xl font-bold font-sans ${valColor}`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-[11.5px] text-slate mt-1.5">{subtitle}</div>
      )}
    </div>
  );
};

export default StatCard;
