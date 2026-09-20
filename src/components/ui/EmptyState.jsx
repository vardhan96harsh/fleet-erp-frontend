import React from "react";
import { Inbox } from "lucide-react";

export const EmptyState = ({
  icon: Icon = Inbox,
  title = "No records found",
  description,
  action,
}) => {
  return (
    <div className="text-center py-12 px-4 flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-full bg-paper-subtle flex items-center justify-center text-slate-soft mb-3">
        <Icon className="w-6 h-6 opacity-60" />
      </div>
      <h3 className="text-sm font-semibold text-ink m-0">{title}</h3>
      {description && (
        <p className="text-[12.5px] text-slate mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
