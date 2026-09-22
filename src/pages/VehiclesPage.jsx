import React, { useState, useEffect, useMemo } from "react";
import { vehicleService } from "../services/vehicleService.js";
import { driverService } from "../services/driverService.js";
import { useToast } from "../context/ToastContext.jsx";
import { SearchInput } from "../components/ui/SearchInput.jsx";
import { FilterChip } from "../components/ui/FilterChip.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.jsx";
import { VehicleModal } from "../components/vehicles/VehicleModal.jsx";
import { worstVehicleStatus, daysUntil, fmtD } from "../utils/dates.js";
import { formatVehicleStatus, getVehicleStatusBadgeVariant } from "../utils/formatters.js";
import { Plus, Truck, Edit3, Trash2 } from "lucide-react";

export const VehiclesPage = ({ preOpenId }) => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const toast = useToast();

  const loadData = async () => {
    try {
      const [vList, dList] = await Promise.all([
        vehicleService.getAll(),
        driverService.getAll(),
      ]);
      setVehicles(vList || []);
      setDrivers(dList || []);

      if (preOpenId) {
        const target = (vList || []).find((v) => v._id === preOpenId);
        if (target) {
          setSelectedVehicle(target);
          setIsModalOpen(true);
        }
      }
    } catch (err) {
      toast.error("Failed to load vehicle records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [preOpenId]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (v.vehicleNo || "").toLowerCase().includes(q) ||
        (v.ownerName || "").toLowerCase().includes(q) ||
        (v.type || "").toLowerCase().includes(q) ||
        (v.rcNumber || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === "all") return true;
      const status = worstVehicleStatus(v);
      return status === statusFilter;
    });
  }, [vehicles, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    const res = { all: vehicles.length, ok: 0, warn: 0, bad: 0 };
    vehicles.forEach((v) => {
      const s = worstVehicleStatus(v);
      if (s === "ok") res.ok++;
      else if (s === "warn") res.warn++;
      else if (s === "bad") res.bad++;
    });
    return res;
  }, [vehicles]);

  const handleOpenAdd = () => {
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (veh) => {
    setSelectedVehicle(veh);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    if (selectedVehicle?._id) {
      const updated = await vehicleService.update(
        selectedVehicle._id,
        formData
      );
      setVehicles((prev) =>
        prev.map((v) => (v._id === updated._id ? updated : v))
      );
      toast.success(`Vehicle ${updated.vehicleNo} updated`);
    } else {
      const created = await vehicleService.create(formData);
      setVehicles((prev) => [created, ...prev]);
      toast.success(`Vehicle ${created.vehicleNo} added to fleet`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await vehicleService.delete(deleteTargetId);
      setVehicles((prev) => prev.filter((v) => v._id !== deleteTargetId));
      toast.success("Vehicle moved to Recycle Bin");
      setDeleteTargetId(null);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to delete vehicle"
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search vehicle no, owner, type..."
            className="w-full sm:w-auto"
          />
          <div className="flex items-center gap-1.5 flex-wrap">
            <FilterChip
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
              count={counts.all}
            >
              All
            </FilterChip>
            <FilterChip
              active={statusFilter === "ok"}
              onClick={() => setStatusFilter("ok")}
              count={counts.ok}
            >
              Compliant
            </FilterChip>
            <FilterChip
              active={statusFilter === "warn"}
              onClick={() => setStatusFilter("warn")}
              count={counts.warn}
            >
              Expiring Soon
            </FilterChip>
            <FilterChip
              active={statusFilter === "bad"}
              onClick={() => setStatusFilter("bad")}
              count={counts.bad}
            >
              Expired Docs
            </FilterChip>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="btn btn-primary shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Vehicles Table Panel */}
      <div className="panel overflow-hidden">
        {loading && vehicles.length === 0 ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-8 bg-paper-subtle rounded-md" />
            <div className="h-8 bg-paper-subtle rounded-md" />
            <div className="h-8 bg-paper-subtle rounded-md" />
            <div className="h-8 bg-paper-subtle rounded-md" />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No vehicles found"
            description="No vehicles match your search or selected filter."
            action={
              <button
                onClick={handleOpenAdd}
                className="btn btn-sm btn-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Vehicle</span>
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Vehicle No</th>
                  <th>Type & Capacity</th>
                  <th>Assigned Driver</th>
                  <th>Owner / Vendor</th>
                  <th>Operational</th>
                  <th>Compliance Status</th>
                  <th>Nearest Expiry</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((v) => {
                  const status = worstVehicleStatus(v);
                  const docEntries = [
                    { key: "puc", name: "PUC", date: v.pucExpiry },
                    { key: "fitness", name: "Fitness", date: v.fitnessExpiry },
                    { key: "insurance", name: "Insurance", date: v.insuranceExpiry },
                    { key: "permit", name: "Permit", date: v.permitExpiry },
                    { key: "rc", name: "RC", date: v.rcExpiry },
                  ].map((d) => ({
                    ...d,
                    days: daysUntil(d.date),
                  }));

                  const activeDocs = docEntries
                    .filter((d) => Boolean(d.date))
                    .sort((a, b) => a.days - b.days);

                  const nearest = activeDocs[0];
                  const expiredDocs = activeDocs.filter((d) => d.days < 0);
                  const expiringDocs = activeDocs.filter(
                    (d) => d.days >= 0 && d.days <= 30
                  );

                  return (
                    <tr key={v._id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(v)}
                          className="font-mono font-bold text-ink hover:underline text-left block"
                        >
                          {v.vehicleNo}
                        </button>
                        {v.ownership && (
                          <span className="text-[11px] text-slate font-sans uppercase">
                            {v.ownership}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="font-medium text-ink">
                          {v.type || "—"}
                        </div>
                        {v.capacity && (
                          <div className="text-[11.5px] text-slate">
                            {v.capacity}
                          </div>
                        )}
                      </td>
                      <td>
                        {v.assignedDriver ? (
                          <div className="font-medium text-ink flex items-center gap-1.5 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>{v.assignedDriver.name}</span>
                          </div>
                        ) : (
                          <span className="text-[11.5px] text-slate-soft italic">
                            Unassigned (Free)
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="font-medium">
                          {v.ownerName || "—"}
                        </div>
                        {v.ownerMobile && (
                          <div className="font-mono text-[11.5px] text-slate">
                            {v.ownerMobile}
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge variant={getVehicleStatusBadgeVariant(v.status)}>
                          {formatVehicleStatus(v.status)}
                        </Badge>
                      </td>
                      <td>
                        <div className="space-y-1.5">
                          <Badge variant={status}>
                            {status === "ok"
                              ? "Compliant"
                              : status === "warn"
                              ? "Expiring Soon"
                              : status === "bad"
                              ? "Expired"
                              : "No Data"}
                          </Badge>

                          {/* Quick visual pills for all 5 documents */}
                          <div className="flex items-center gap-1 flex-wrap">
                            {docEntries.map((doc) => {
                              let pillStyle =
                                "bg-paper-raised text-slate-soft border border-line";
                              let tip = `${doc.name}: Not recorded`;

                              if (doc.date) {
                                if (doc.days < 0) {
                                  pillStyle =
                                    "bg-rust/15 text-rust border border-rust/30 font-bold";
                                  tip = `${doc.name}: Expired ${fmtD(doc.date)} (${Math.abs(doc.days)}d overdue)`;
                                } else if (doc.days <= 30) {
                                  pillStyle =
                                    "bg-amber/15 text-amber border border-amber/30 font-bold";
                                  tip = `${doc.name}: Expiring ${fmtD(doc.date)} (${doc.days}d left)`;
                                } else {
                                  pillStyle =
                                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
                                  tip = `${doc.name}: Valid until ${fmtD(doc.date)} (${doc.days}d left)`;
                                }
                              }

                              return (
                                <span
                                  key={doc.key}
                                  title={tip}
                                  className={`text-[9.5px] px-1 py-0.2 rounded font-mono cursor-help ${pillStyle}`}
                                >
                                  {doc.name}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                      <td>
                        {nearest ? (
                          <div className="text-[12px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`font-bold text-[10.5px] px-1.5 py-0.5 rounded font-mono uppercase ${
                                  nearest.days < 0
                                    ? "bg-rust-soft text-rust border border-rust/30"
                                    : nearest.days <= 30
                                    ? "bg-amber-soft text-amber border border-amber/30"
                                    : "bg-paper-raised text-ink border border-line"
                                }`}
                              >
                                {nearest.name}
                              </span>
                              <span className="font-mono text-ink text-[12px]">
                                {fmtD(nearest.date)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              <span
                                className={`text-[11px] font-semibold ${
                                  nearest.days < 0
                                    ? "text-rust font-bold"
                                    : nearest.days <= 30
                                    ? "text-amber font-bold"
                                    : "text-slate"
                                }`}
                              >
                                {nearest.days < 0
                                  ? `⚠️ ${Math.abs(nearest.days)}d overdue`
                                  : nearest.days <= 30
                                  ? `⏳ ${nearest.days}d left`
                                  : `${nearest.days}d left`}
                              </span>
                              {activeDocs.length > 1 &&
                                (expiredDocs.length > 1 ||
                                  (expiredDocs.length === 0 &&
                                    expiringDocs.length > 1)) && (
                                  <span
                                    title={activeDocs
                                      .slice(1)
                                      .map((d) => `${d.name}: ${fmtD(d.date)}`)
                                      .join("\n")}
                                    className="text-[10.5px] text-slate-soft cursor-help underline decoration-dotted"
                                  >
                                    (+
                                    {expiredDocs.length > 1
                                      ? expiredDocs.length - 1
                                      : expiringDocs.length - 1}{" "}
                                    more)
                                  </span>
                                )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-soft text-[12px]">—</span>
                        )}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(v)}
                          className="btn btn-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vehicle Modal */}
      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicle={selectedVehicle}
        onSave={handleSave}
        onDelete={() => setDeleteTargetId(selectedVehicle?._id)}
        driverList={drivers}
      />

      {/* Soft Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Move Vehicle to Recycle Bin"
        message="This vehicle will be soft-deleted and moved to the Recycle Bin. You can restore it at any time."
        confirmText="Move to Recycle Bin"
        confirmVariant="danger"
      />
    </div>
  );
};

export default VehiclesPage;
