import React, { useState, useEffect } from "react";
import FullScreenModal from "../ui/FullScreenModal.jsx";
import Badge from "../ui/Badge.jsx";
import { daysUntil, docBadgeStatus } from "../../utils/dates.js";
import { formatVehicleStatus } from "../../utils/formatters.js";
import {
  Trash2,
  Save,
  AlertCircle,
} from "lucide-react";

export const DriverModal = ({
  isOpen,
  onClose,
  driver,
  onSave,
  onDelete,
  vehicleList = [],
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
    setActiveSection("personal");
    setError("");
  }, [driver, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      setError("Driver Name is required");
      setActiveSection("personal");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        assignedVehicleId: formData.assignedVehicleId || null,
        mobile: formData.mobile || null,
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
      badge: formData.assignedVehicleId ? "Assigned" : "Unassigned",
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
              <div className="pb-3 border-b border-line mb-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
                  Vehicle Assignment & Status
                </h3>
              </div>

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
                  <label className="label">Status</label>
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

              <div>
                <label className="label">Assigned Vehicle</label>
                <select
                  value={formData.assignedVehicleId}
                  onChange={(e) => handleChange("assignedVehicleId", e.target.value)}
                  className="input-field font-mono font-medium text-[13px]"
                >
                  <option value="">No Vehicle Assigned (Floating Pool)</option>
                  {vehicleList.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.vehicleNo} {v.type ? `— ${v.type}` : ""} ({formatVehicleStatus(v.status)})
                    </option>
                  ))}
                </select>
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
