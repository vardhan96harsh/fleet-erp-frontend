import React, { useState, useEffect, useMemo } from "react";
import FullScreenModal from "../ui/FullScreenModal.jsx";
import Badge from "../ui/Badge.jsx";
import { daysUntil, docBadgeStatus } from "../../utils/dates.js";
import { formatVehicleStatus } from "../../utils/formatters.js";
import {
  Trash2,
  Save,
  AlertCircle,
  Truck,
  CheckCircle2,
  Lock,
  Search,
  ArrowRightLeft,
  UserCheck,
} from "lucide-react";

export const DriverModal = ({
  isOpen,
  onClose,
  driver,
  onSave,
  onDelete,
  vehicleList = [],
  driverList = [],
}) => {
  const [activeSection, setActiveSection] = useState("personal");
  const [formData, setFormData] = useState({
    name: "",
    driverId: "",
    fatherName: "",
    mobile: "",
    licenceNo: "",
    licenceExpiry: "",
    joiningDate: "",
    status: "ACTIVE",
    assignedVehicleId: "",
  });

  const [forceReassign, setForceReassign] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState("all"); // 'all' | 'available' | 'assigned'
  const [vehicleSearch, setVehicleSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!driver?._id;

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name || "",
        driverId: driver.driverId || "",
        fatherName: driver.fatherName || "",
        mobile: driver.mobile || "",
        licenceNo: driver.licenceNo || "",
        licenceExpiry: driver.licenceExpiry
          ? String(driver.licenceExpiry).slice(0, 10)
          : "",
        joiningDate: driver.joiningDate
          ? String(driver.joiningDate).slice(0, 10)
          : "",
        status: driver.status || "ACTIVE",
        assignedVehicleId: driver.assignedVehicle?._id || driver.assignedVehicle || "",
      });
    } else {
      setFormData({
        name: "",
        driverId: "",
        fatherName: "",
        mobile: "",
        licenceNo: "",
        licenceExpiry: "",
        joiningDate: "",
        status: "ACTIVE",
        assignedVehicleId: "",
      });
    }
    setForceReassign(false);
    setVehicleFilter("all");
    setVehicleSearch("");
    setActiveSection("personal");
    setError("");
  }, [driver, isOpen]);

  // Compute live vehicle assignment statuses
  const processedVehicles = useMemo(() => {
    return vehicleList.map((v) => {
      // Find driver assigned to this vehicle
      let assignedDriver = v.assignedDriver;
      if (!assignedDriver && driverList.length > 0) {
        const found = driverList.find(
          (d) =>
            (d.assignedVehicle?._id === v._id || d.assignedVehicle === v._id) &&
            d._id !== driver?._id
        );
        if (found) {
          assignedDriver = {
            _id: found._id,
            name: found.name,
            driverId: found.driverId,
            mobile: found.mobile,
          };
        }
      }

      const isCurrentDriverVehicle =
        (v.assignedDriver?._id && v.assignedDriver._id === driver?._id) ||
        (driver?.assignedVehicle?._id === v._id || driver?.assignedVehicle === v._id);

      const isAvailable = !assignedDriver || isCurrentDriverVehicle;

      return {
        ...v,
        assignedDriverInfo: isCurrentDriverVehicle ? null : assignedDriver,
        isCurrentDriverVehicle,
        isAvailable,
      };
    });
  }, [vehicleList, driverList, driver]);

  // Filtered vehicles for modal selector
  const filteredVehicles = useMemo(() => {
    const q = vehicleSearch.toLowerCase().trim();
    return processedVehicles.filter((v) => {
      if (vehicleFilter === "available" && !v.isAvailable) return false;
      if (vehicleFilter === "assigned" && v.isAvailable) return false;
      if (q) {
        const matchNo = (v.vehicleNo || "").toLowerCase().includes(q);
        const matchType = (v.type || "").toLowerCase().includes(q);
        const matchDriver = (v.assignedDriverInfo?.name || "").toLowerCase().includes(q);
        return matchNo || matchType || matchDriver;
      }
      return true;
    });
  }, [processedVehicles, vehicleFilter, vehicleSearch]);

  const availableVehicles = useMemo(
    () => processedVehicles.filter((v) => v.isAvailable),
    [processedVehicles]
  );

  const occupiedVehicles = useMemo(
    () => processedVehicles.filter((v) => !v.isAvailable),
    [processedVehicles]
  );

  const selectedVehicleObj = useMemo(() => {
    return processedVehicles.find((v) => v._id === formData.assignedVehicleId);
  }, [processedVehicles, formData.assignedVehicleId]);

  const isSelectedVehicleOccupied =
    selectedVehicleObj && !selectedVehicleObj.isAvailable;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "assignedVehicleId") {
      setForceReassign(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      setError("Driver Name is required");
      setActiveSection("personal");
      return;
    }

    if (isSelectedVehicleOccupied && !forceReassign) {
      setError(
        `Vehicle ${selectedVehicleObj.vehicleNo} is currently assigned to ${selectedVehicleObj.assignedDriverInfo?.name}. Please tick the transfer checkbox below to confirm reassignment.`
      );
      setActiveSection("employment");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        assignedVehicleId: formData.assignedVehicleId || null,
        mobile: formData.mobile || null,
        forceReassign: isSelectedVehicleOccupied ? forceReassign : false,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to save driver"
      );
    } finally {
      setLoading(false);
    }
  };

  const licenceDays = daysUntil(formData.licenceExpiry);
  const licenceStatus = docBadgeStatus(licenceDays);

  const menuItems = [
    {
      id: "personal",
      label: "Personal Details",
      badge: formData.status,
      badgeVariant: formData.status === "ACTIVE" ? "ok" : "warn",
    },
    {
      id: "licence",
      label: "Licence Details",
      badge: formData.licenceExpiry
        ? licenceDays < 0
          ? "Expired"
          : `${licenceDays}d Valid`
        : "No Date",
      badgeVariant: licenceDays < 0 ? "bad" : licenceDays <= 30 ? "warn" : "ok",
    },
    {
      id: "employment",
      label: "Vehicle Assignment",
      badge: formData.assignedVehicleId
        ? selectedVehicleObj?.vehicleNo || "Assigned"
        : "Unassigned",
      badgeVariant: formData.assignedVehicleId ? "ok" : "neutral",
    },
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      {isEdit && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="btn btn-danger"
          title="Delete driver permanently"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="btn"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="btn btn-primary"
      >
        <Save className="w-4 h-4" />
        <span>{loading ? "Saving..." : isEdit ? "Save Changes" : "Register Driver"}</span>
      </button>
    </div>
  );

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Driver: ${formData.name || "Edit"}` : "Add Driver"}
      subtitle={isEdit ? "Personal details, licence & vehicle assignment" : "Register commercial driver in personnel directory"}
      breadcrumbs="Drivers"
      badge={
        <Badge variant={formData.status === "ACTIVE" ? "ok" : "warn"}>
          {formData.status}
        </Badge>
      }
      menuItems={menuItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      actions={headerActions}
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-lg bg-rust-soft/60 border border-rust/30 text-rust text-[13px] flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* SECTION 1: PERSONAL DETAILS */}
        {activeSection === "personal" && (
          <div className="space-y-5">
            <div className="panel panel-pad">
              <div className="pb-3 border-b border-line mb-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
                  Personal Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Driver Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="input-field text-[13.5px]"
                  />
                </div>

                <div>
                  <label className="label">Driver ID / Badge No</label>
                  <input
                    type="text"
                    placeholder="e.g. DRV-101"
                    value={formData.driverId}
                    onChange={(e) => handleChange("driverId", e.target.value)}
                    className="input-field font-mono uppercase text-[13.5px]"
                  />
                </div>

                <div>
                  <label className="label">
                    Father's Name <span className="text-slate-soft text-[11px] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh Kumar"
                    value={formData.fatherName}
                    onChange={(e) => handleChange("fatherName", e.target.value)}
                    className="input-field text-[13.5px]"
                  />
                </div>

                <div>
                  <label className="label">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={formData.mobile}
                    onChange={(e) => handleChange("mobile", e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveSection("licence")}
                className="btn btn-primary"
              >
                <span>Continue to Licence →</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: LICENCE & COMPLIANCE */}
        {activeSection === "licence" && (
          <div className="space-y-5">
            <div className="panel panel-pad">
              <div className="pb-3 border-b border-line mb-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
                  Licence Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Driving Licence Number</label>
                  <input
                    type="text"
                    placeholder="DL-0420110012345"
                    value={formData.licenceNo}
                    onChange={(e) => handleChange("licenceNo", e.target.value)}
                    className="input-field font-mono uppercase font-semibold text-[13.5px]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0">Licence Expiry Date</label>
                    {formData.licenceExpiry && (
                      <Badge variant={licenceStatus} className="text-[10.5px]">
                        {licenceDays < 0
                          ? `${Math.abs(licenceDays)}d Overdue`
                          : licenceDays <= 30
                          ? `${licenceDays}d Left`
                          : `${licenceDays}d Valid`}
                      </Badge>
                    )}
                  </div>
                  <input
                    type="date"
                    value={formData.licenceExpiry}
                    onChange={(e) => handleChange("licenceExpiry", e.target.value)}
                    className="input-field py-1.5"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setActiveSection("personal")}
                className="btn"
              >
                <span>← Back to Personal</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("employment")}
                className="btn btn-primary"
              >
                <span>Continue to Assignment →</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: ASSIGNMENT & STATUS */}
        {activeSection === "employment" && (
          <div className="space-y-5">
            <div className="panel panel-pad">
              <div className="pb-3 border-b border-line mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate" />
                  <span>Vehicle Assignment & Status</span>
                </h3>
                <span className="text-xs font-mono font-semibold text-slate">
                  {availableVehicles.length} Free / {vehicleList.length} Total Vehicles
                </span>
              </div>

              {/* Status & Joining Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => handleChange("joiningDate", e.target.value)}
                    className="input-field py-1.5"
                  />
                </div>

                <div>
                  <label className="label">Driver Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="input-field font-semibold text-[13px]"
                  >
                    <option value="ACTIVE">Active (On Duty)</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="INACTIVE">Inactive / Relieved</option>
                  </select>
                </div>
              </div>

              {/* Vehicle Dropdown Selector with Optgroups */}
              <div className="space-y-3 pt-2 border-t border-line/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="label text-[13px] font-bold text-ink mb-0 flex items-center gap-1.5">
                    <span>Select Assigned Vehicle</span>
                    <span className="text-slate-soft text-xs font-normal">
                      (Clear indicators for Free vs Occupied)
                    </span>
                  </label>

                  {/* Availability Filter Chips */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setVehicleFilter("all")}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all ${
                        vehicleFilter === "all"
                          ? "bg-ink text-white border-ink font-bold"
                          : "bg-paper-subtle text-slate border-line"
                      }`}
                    >
                      All ({processedVehicles.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicleFilter("available")}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all ${
                        vehicleFilter === "available"
                          ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                          : "bg-paper-subtle text-emerald-700 dark:text-emerald-400 border-line"
                      }`}
                    >
                      🟢 Free ({availableVehicles.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicleFilter("assigned")}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all ${
                        vehicleFilter === "assigned"
                          ? "bg-amber text-white border-amber font-bold"
                          : "bg-paper-subtle text-amber-dark border-line"
                      }`}
                    >
                      🔒 Occupied ({occupiedVehicles.length})
                    </button>
                  </div>
                </div>

                <select
                  value={formData.assignedVehicleId}
                  onChange={(e) => handleChange("assignedVehicleId", e.target.value)}
                  className="input-field font-mono font-medium text-[13.5px] py-2"
                >
                  <option value="">— No Vehicle Assigned (Floating Pool) —</option>

                  {/* Group 1: Available / Free Vehicles */}
                  {availableVehicles.length > 0 && (
                    <optgroup label="🟢 AVAILABLE VEHICLES (FREE TO ASSIGN)">
                      {availableVehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.vehicleNo} {v.type ? `— ${v.type}` : ""} {v.capacity ? `(${v.capacity})` : ""}{" "}
                          {v.isCurrentDriverVehicle ? "• [CURRENTLY ASSIGNED TO THIS DRIVER]" : "• [FREE]"}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* Group 2: Already Assigned Vehicles */}
                  {occupiedVehicles.length > 0 && (
                    <optgroup label="🔒 OCCUPIED VEHICLES (ASSIGNED TO OTHER DRIVERS)">
                      {occupiedVehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.vehicleNo} {v.type ? `— ${v.type}` : ""} • [Assigned to {v.assignedDriverInfo?.name || "Another Driver"}]
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {/* Selected Vehicle Context Card */}
                {selectedVehicleObj ? (
                  <div
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      selectedVehicleObj.isAvailable
                        ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/50"
                        : "bg-amber-soft/50 border-amber/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {selectedVehicleObj.isAvailable ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-amber shrink-0" />
                        )}
                        <span className="font-mono font-bold text-ink text-[13px]">
                          {selectedVehicleObj.vehicleNo}
                        </span>
                        <span className="text-slate">
                          {selectedVehicleObj.type || "Vehicle"} {selectedVehicleObj.capacity ? `• ${selectedVehicleObj.capacity}` : ""}
                        </span>
                      </div>

                      <Badge
                        variant={selectedVehicleObj.isAvailable ? "ok" : "warn"}
                        className="text-[11px]"
                      >
                        {selectedVehicleObj.isCurrentDriverVehicle
                          ? "Assigned to This Driver"
                          : selectedVehicleObj.isAvailable
                          ? "Available (Free)"
                          : `With ${selectedVehicleObj.assignedDriverInfo?.name}`}
                      </Badge>
                    </div>

                    {/* If occupied, show Reassign / Transfer Checkbox */}
                    {isSelectedVehicleOccupied && (
                      <div className="mt-2.5 pt-2.5 border-t border-amber/30 space-y-1.5">
                        <div className="text-amber-dark font-medium flex items-center gap-1.5">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>
                            This vehicle is currently driven by{" "}
                            <strong>{selectedVehicleObj.assignedDriverInfo?.name}</strong>{" "}
                            {selectedVehicleObj.assignedDriverInfo?.mobile && `(${selectedVehicleObj.assignedDriverInfo.mobile})`}.
                          </span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer pt-1 font-semibold text-ink select-none">
                          <input
                            type="checkbox"
                            checked={forceReassign}
                            onChange={(e) => setForceReassign(e.target.checked)}
                            className="rounded border-line text-amber focus:ring-amber w-4 h-4"
                          />
                          <span>
                            Transfer and reassign {selectedVehicleObj.vehicleNo} from{" "}
                            {selectedVehicleObj.assignedDriverInfo?.name} to {formData.name || "this driver"}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-paper-subtle border border-line text-xs text-slate flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate" />
                    <span>
                      Driver will be in the <strong>Floating Pool</strong> (no dedicated truck assigned).
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setActiveSection("licence")}
                className="btn"
              >
                <span>← Back to Licence</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? "Saving..." : isEdit ? "Save Changes" : "Save Driver"}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </FullScreenModal>
  );
};

export default DriverModal;
