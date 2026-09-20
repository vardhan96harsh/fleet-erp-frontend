import React from "react";

export const Badge = ({ variant = "neutral", children, className = "" }) => {
  const map = {
    ok: "badge-ok",
    warn: "badge-warn",
    bad: "badge-bad",
    neutral: "badge-neutral",
    info: "badge-info",
  };

  const selected = map[variant] || map.neutral;

  return (
    <span className={`badge ${selected} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
