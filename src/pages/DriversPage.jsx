import React, { useState, useEffect, useMemo } from "react";
import { driverService } from "../services/driverService.js";
import { vehicleService } from "../services/vehicleService.js";
import { useToast } from "../context/ToastContext.jsx";
import { SearchInput } from "../components/ui/SearchInput.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.jsx";
import { DriverModal } from "../components/drivers/DriverModal.jsx";
import { daysUntil, docBadgeStatus, fmtD } from "../utils/dates.js";
import { Plus, Users, Edit3, Truck } from "lucide-react";

export const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const toast = useToast();

  const loadData = async () => {
    try {
      const [dList, vList] = await Promise.all([
        driverService.getAll(),
        vehicleService.getAll(),
      ]);
      setDrivers(dList || []);
      setVehicles(vList || []);
    } catch (err) {
      toast.error("Failed to load driver records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (d.name || "").toLowerCase().includes(q) ||
        (d.mobile || "").toLowerCase().includes(q) ||
        (d.licenceNo || "").toLowerCase().includes(q) ||
        (d.assignedVehicle?.vehicleNo || "").toLowerCase().includes(q)
      );
    });
  }, [drivers, searchQuery]);

  const handleOpenAdd = () => {
    setSelectedDriver(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (drv) => {
    setSelectedDriver(drv);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    if (selectedDriver?._id) {
      const updated = await driverService.update(selectedDriver._id, formData);
      setDrivers((prev) =>
        prev.map((d) => (d._id === updated._id ? updated : d))
      );
      toast.success(`Driver ${updated.name} updated`);
    } else {
      const created = await driverService.create(formData);
      setDrivers((prev) => [created, ...prev]);
      toast.success(`Driver ${created.name} registered`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await driverService.delete(deleteTargetId);
      setDrivers((prev) => prev.filter((d) => d._id !== deleteTargetId));
      toast.success("Driver moved to Recycle Bin");
      setDeleteTargetId(null);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete driver");
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search driver by name, mobile, vehicle..."
          className="w-full sm:w-80"
        />

        <button
          type="button"
          onClick={handleOpenAdd}
          className="btn btn-primary shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Driver</span>
        </button>
      </div>

      {/* Drivers Table Panel */}
      <div className="panel overflow-hidden">
        {loading && drivers.length === 0 ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-8 bg-paper-subtle rounded-md" />
            <div className="h-8 bg-paper-subtle rounded-md" />
            <div className="h-8 bg-paper-subtle rounded-md" />
            <div className="h-8 bg-paper-subtle rounded-md" />
          </div>
        ) : filteredDrivers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No drivers found"
            description="No drivers match your search query."
            action={
              <button onClick={handleOpenAdd} className="btn btn-sm btn-primary">
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Driver</span>
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>Contact</th>
                  <th>Licence Number</th>
                  <th>Licence Expiry</th>
                  <th>Assigned Vehicle</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((d) => {
                  const days = daysUntil(d.licenceExpiry);
                  const status = docBadgeStatus(days);
                  const veh = d.assignedVehicle;

                  return (
                    <tr key={d._id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(d)}
                          className="font-semibold text-ink hover:underline text-left block"
                        >
                          {d.name}
                        </button>
                        {d.joiningDate && (
                          <span className="text-[11px] text-slate">
                            Joined {fmtD(d.joiningDate)}
                          </span>
                        )}
                      </td>
                      <td className="font-mono">{d.mobile || "—"}</td>
                      <td className="font-mono uppercase">{d.licenceNo || "—"}</td>
                      <td>
                        {d.licenceExpiry ? (
                          <div className="text-[12.5px] font-mono">
                            <div>{fmtD(d.licenceExpiry)}</div>
                            <Badge variant={status} className="mt-0.5">
                              {days < 0
                                ? "Expired"
                                : days <= 30
                                ? `${days}d left`
                                : "Valid"}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-slate-soft text-[12px]">—</span>
                        )}
                      </td>
                      <td>
                        {veh ? (
                          <div className="inline-flex items-center gap-1.5 font-mono text-[12.5px] font-semibold text-ink px-2 py-0.5 bg-paper-subtle rounded border border-line">
                            <Truck className="w-3.5 h-3.5 text-slate" />
                            <span>{veh.vehicleNo || veh}</span>
                          </div>
                        ) : (
                          <span className="text-slate-soft text-[12px] italic">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td>
                        <Badge
                          variant={
                            d.status === "ACTIVE"
                              ? "ok"
                              : d.status === "ON_LEAVE"
                              ? "warn"
                              : "neutral"
                          }
                        >
                          {d.status === "ON_LEAVE"
                            ? "On Leave"
                            : d.status === "ACTIVE"
                            ? "Active"
                            : "Inactive"}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(d)}
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

      {/* Driver Modal */}
      <DriverModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        driver={selectedDriver}
        onSave={handleSave}
        onDelete={() => setDeleteTargetId(selectedDriver?._id)}
        vehicleList={vehicles}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Move Driver to Recycle Bin"
        message="This driver record will be soft-deleted and moved to the Recycle Bin. Vehicle assignment will be freed up."
        confirmText="Move to Recycle Bin"
        confirmVariant="danger"
      />
    </div>
  );
};

export default DriversPage;
