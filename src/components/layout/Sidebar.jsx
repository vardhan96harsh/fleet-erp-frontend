import React from "react";
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  Layers,
  CalendarCheck,
  ArrowLeftRight,
  Trash2,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { normalizeRole } from "../../utils/formatters.js";

export const Sidebar = ({ currentRoute, onNavigate }) => {
  const { user, isAdmin, logout } = useAuth();

  const NAV_SECTIONS = [
    {
      label: "Overview",
      items: [
        {
          key: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "Records",
      items: [
        {
          key: "vehicles",
          label: "Vehicles",
          icon: Truck,
        },
        {
          key: "drivers",
          label: "Drivers",
          icon: Users,
        },
        {
          key: "inventory",
          label: "Inventory",
          icon: Package,
        },
        {
          key: "assignments",
          label: "Assignments",
          icon: Layers,
        },
        {
          key: "attendance",
          label: "Attendance",
          icon: CalendarCheck,
        },
      ],
    },
    {
      label: "Data Management",
      items: [
        {
          key: "import-export",
          label: "Import / Export",
          icon: ArrowLeftRight,
        },
        {
          key: "recycle-bin",
          label: "Recycle Bin",
          icon: Trash2,
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: "Administration",
            items: [
              {
                key: "users",
                label: "Sub Admins",
                icon: ShieldCheck,
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <aside className="w-56 shrink-0 bg-ink text-[#D9DCE4] flex flex-col h-full border-r border-ink-soft select-none">
      {/* Brand Header */}
      <div className="px-5 pt-5 pb-4 border-b border-ink-soft">
        <div className="font-mono text-[10.5px] uppercase tracking-wider text-slate-soft">
          Fleet Ledger
        </div>
        <div className="text-base font-semibold text-white tracking-tight mt-0.5">
          Enterprise ERP
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="text-[10px] font-semibold text-slate-soft uppercase tracking-wider px-2.5 mb-1.5">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onNavigate(item.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors text-left ${
                      isActive
                        ? "bg-ink-muted text-white shadow-sm font-semibold"
                        : "text-[#B7BCC9] hover:bg-ink-soft/80 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 opacity-80" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Profile */}
      <div className="p-3.5 border-t border-ink-soft bg-ink-dark/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal shrink-0 animate-pulse" />
          <div className="truncate text-[12.5px] font-medium text-white">
            {user?.name || "Logged User"}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] font-mono text-slate-soft">
            {normalizeRole(user?.role)}
          </span>
          <button
            type="button"
            onClick={logout}
            className="text-[11px] text-slate-light hover:text-rust-soft transition-colors flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
