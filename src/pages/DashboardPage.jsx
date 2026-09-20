import React, { useState, useEffect } from "react";
import { dashboardService } from "../services/dashboardService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { StatCard } from "../components/ui/StatCard.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { fmtD, fmtDT } from "../utils/dates.js";
import {
  Truck,
  Users,
  Package,
  AlertTriangle,
  FileCheck2,
  PackageCheck,
  ArrowUpRight,
} from "lucide-react";

export const DashboardPage = ({ onNavigate, onOpenVehicle }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const summary = await dashboardService.getSummary();
      setData(summary);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-paper-raised rounded-xl border border-line" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-24 bg-paper-raised rounded-xl border border-line" />
          <div className="h-24 bg-paper-raised rounded-xl border border-line" />
          <div className="h-24 bg-paper-raised rounded-xl border border-line" />
          <div className="h-24 bg-paper-raised rounded-xl border border-line" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-paper-raised rounded-xl border border-line" />
          <div className="h-64 bg-paper-raised rounded-xl border border-line" />
        </div>
      </div>
    );
  }

  const totals = data?.totals || {};
  const attentionDocs = data?.documentsNeedingAttention || [];
  const lowStock = data?.lowStockItems || [];
  const recent = data?.recent || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-4 rounded-xl bg-paper-raised border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card">
        <div>
          <h2 className="text-base font-bold text-ink m-0">
            Welcome back, {user?.name || "Operator"}
          </h2>
          <p className="text-[12.5px] text-slate mt-0.5">
            Overview of fleet operational compliance and warehouse inventory levels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("vehicles")}
            className="btn btn-sm"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Vehicles</span>
          </button>
          <button
            onClick={() => onNavigate("inventory")}
            className="btn btn-sm"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventory</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          label="Active Fleet"
          value={totals.vehicles || 0}
          icon={Truck}
          onClick={() => onNavigate("vehicles")}
        />
        <StatCard
          label="Active Drivers"
          value={totals.drivers || 0}
          icon={Users}
          onClick={() => onNavigate("drivers")}
        />
        <StatCard
          label="Inventory SKUs"
          value={totals.inventoryItems || 0}
          icon={Package}
          onClick={() => onNavigate("inventory")}
        />
        <StatCard
          label="Expiring ≤30d"
          value={totals.vehiclesWithDocumentsExpiringIn30Days || 0}
          variant={
            totals.vehiclesWithDocumentsExpiringIn30Days > 0 ? "warn" : "default"
          }
          icon={AlertTriangle}
          onClick={() => onNavigate("vehicles")}
        />
        <StatCard
          label="Expired Docs"
          value={totals.vehiclesWithExpiredDocuments || 0}
          variant={totals.vehiclesWithExpiredDocuments > 0 ? "bad" : "default"}
          icon={AlertTriangle}
          onClick={() => onNavigate("vehicles")}
        />
        <StatCard
          label="Low Stock Alert"
          value={totals.lowStockItems || 0}
          variant={totals.lowStockItems > 0 ? "bad" : "default"}
          icon={PackageCheck}
          onClick={() => onNavigate("inventory")}
        />
      </div>

      {/* Two Column Section: Compliance Attention & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Compliance Attention (Next 45 Days) */}
        <div className="panel flex flex-col">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink m-0">
                Documents Needing Attention
              </h3>
              <p className="text-[12px] text-slate mt-0.5">
                PUC, Fitness, Insurance, Permit & RC expiring in ≤45 days
              </p>
            </div>
            <button
              onClick={() => onNavigate("vehicles")}
              className="text-[12px] font-medium text-slate hover:text-ink flex items-center gap-1"
            >
              <span>View Fleet</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {attentionDocs.length === 0 ? (
              <EmptyState
                icon={FileCheck2}
                title="All fleet paperwork is in order"
                description="No vehicle documents are expired or expiring in the next 45 days."
              />
            ) : (
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Vehicle No</th>
                    <th>Document</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attentionDocs.slice(0, 8).map((doc, idx) => (
                    <tr key={idx}>
                      <td
                        onClick={() =>
                          onOpenVehicle && onOpenVehicle(doc.vehicleId)
                        }
                        className="font-mono font-semibold text-ink cursor-pointer hover:underline"
                      >
                        {doc.vehicleNo}
                      </td>
                      <td className="font-medium">{doc.document}</td>
                      <td className="font-mono text-[12px]">
                        {fmtD(doc.expiryDate)}
                      </td>
                      <td>
                        <Badge
                          variant={
                            doc.status === "EXPIRED"
                              ? "bad"
                              : doc.status === "EXPIRING_SOON"
                              ? "warn"
                              : "neutral"
                          }
                        >
                          {doc.daysRemaining < 0
                            ? `${Math.abs(doc.daysRemaining)}d Overdue`
                            : `${doc.daysRemaining}d Left`}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="panel flex flex-col">
          <div className="p-4 border-b border-line flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink m-0">
                Low Stock Threshold Alerts
              </h3>
              <p className="text-[12px] text-slate mt-0.5">
                Spare parts & tires at or below minimum threshold
              </p>
            </div>
            <button
              onClick={() => onNavigate("inventory")}
              className="text-[12px] font-medium text-slate hover:text-ink flex items-center gap-1"
            >
              <span>View Stock</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {lowStock.length === 0 ? (
              <EmptyState
                icon={PackageCheck}
                title="Inventory stock is healthy"
                description="All inventory items are currently above minimum threshold levels."
              />
            ) : (
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Item Name</th>
                    <th>Current Qty</th>
                    <th>Min Level</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.slice(0, 8).map((item) => (
                    <tr key={item._id}>
                      <td className="font-mono font-semibold text-ink">
                        {item.itemCode}
                      </td>
                      <td className="font-medium truncate max-w-[180px]">
                        {item.itemName}
                      </td>
                      <td className="font-mono font-bold text-rust">
                        {item.quantity} {item.unit || "PCS"}
                      </td>
                      <td className="font-mono text-slate">
                        {item.minimumStock}
                      </td>
                      <td>
                        <Badge variant="bad">Critical Low</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Recent Fleet Activity / Records Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="panel p-4">
          <h4 className="text-[12px] font-semibold uppercase tracking-wider text-slate mb-3">
            Recent Vehicles
          </h4>
          <div className="space-y-2">
            {(recent.vehicles || []).map((v) => (
              <div
                key={v._id}
                className="flex items-center justify-between p-2 rounded bg-paper-subtle border border-line/60 text-[12.5px]"
              >
                <span className="font-mono font-semibold">{v.vehicleNo}</span>
                <span className="text-slate text-[11.5px]">{v.type || "Commercial"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <h4 className="text-[12px] font-semibold uppercase tracking-wider text-slate mb-3">
            Recent Drivers
          </h4>
          <div className="space-y-2">
            {(recent.drivers || []).map((d) => (
              <div
                key={d._id}
                className="flex items-center justify-between p-2 rounded bg-paper-subtle border border-line/60 text-[12.5px]"
              >
                <span className="font-medium">{d.name}</span>
                <span className="font-mono text-slate text-[11.5px]">
                  {d.assignedVehicle?.vehicleNo || "Unassigned"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <h4 className="text-[12px] font-semibold uppercase tracking-wider text-slate mb-3">
            Recent Inventory
          </h4>
          <div className="space-y-2">
            {(recent.inventory || []).map((i) => (
              <div
                key={i._id}
                className="flex items-center justify-between p-2 rounded bg-paper-subtle border border-line/60 text-[12.5px]"
              >
                <span className="font-mono font-medium">{i.itemCode}</span>
                <span className="text-slate text-[11.5px]">
                  {i.quantity} {i.unit || "PCS"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
