import React, { useState, useEffect } from "react";
import FullScreenModal from "../ui/FullScreenModal.jsx";
import Badge from "../ui/Badge.jsx";
import { daysUntil, docBadgeStatus, fmtD } from "../../utils/dates.js";
import { formatVehicleStatus, getVehicleStatusBadgeVariant } from "../../utils/formatters.js";
import {
  Plus,
  Trash2,
  Save,
  AlertCircle,
} from "lucide-react";

export const VehicleModal = ({
  isOpen,
  onClose,
  vehicle,
  onSave,
  onDelete,
}) => {
  const [activeSection, setActiveSection] = useState("details");
  const [formData, setFormData] = useState({
    vehicleNo: "",
    type: "",
    capacity: "",
    ownership: "",
    ownerName: "",
    ownerMobile: "",
    pucExpiry: "",
    fitnessExpiry: "",
    insuranceExpiry: "",
    permitExpiry: "",
    permitType: "NATIONAL",
    rcNumber: "",
    rcExpiry: "",
    status: "ACTIVE",
    serviceHistory: [],
    accidentReports: [],
  });

  const [newService, setNewService] = useState({ date: "", description: "" });
  const [newAccident, setNewAccident] = useState({
    date: "",
    description: "",
    driverName: "",
    driverMobile: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!vehicle?._id;

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicleNo: vehicle.vehicleNo || "",
        type: vehicle.type || "",
        capacity: vehicle.capacity || "",
        ownership: vehicle.ownership || "",
        ownerName: vehicle.ownerName || "",
        ownerMobile: vehicle.ownerMobile || "",
        pucExpiry: vehicle.pucExpiry ? String(vehicle.pucExpiry).slice(0, 10) : "",
        fitnessExpiry: vehicle.fitnessExpiry ? String(vehicle.fitnessExpiry).slice(0, 10) : "",
        insuranceExpiry: vehicle.insuranceExpiry ? String(vehicle.insuranceExpiry).slice(0, 10) : "",
        permitExpiry: vehicle.permitExpiry ? String(vehicle.permitExpiry).slice(0, 10) : "",
        permitType: vehicle.permitType || "NATIONAL",
        rcNumber: vehicle.rcNumber || "",
        rcExpiry: vehicle.rcExpiry ? String(vehicle.rcExpiry).slice(0, 10) : "",
        status: vehicle.status || "ACTIVE",
        serviceHistory: vehicle.serviceHistory || [],
        accidentReports: vehicle.accidentReports || [],
      });
    } else {
      setFormData({
        vehicleNo: "",
        type: "",
        capacity: "",
        ownership: "",
        ownerName: "",
        ownerMobile: "",
        pucExpiry: "",
        fitnessExpiry: "",
        insuranceExpiry: "",
        permitExpiry: "",
        permitType: "NATIONAL",
        rcNumber: "",
        rcExpiry: "",
        status: "ACTIVE",
        serviceHistory: [],
        accidentReports: [],
      });
    }
    setActiveSection("details");
    setError("");
  }, [vehicle, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddService = () => {
    if (!newService.date || !newService.description.trim()) return;
    setFormData((prev) => ({
      ...prev,
      serviceHistory: [
        { date: newService.date, description: newService.description.trim() },
        ...prev.serviceHistory,
      ],
    }));
    setNewService({ date: "", description: "" });
  };

  const handleRemoveService = (index) => {
    setFormData((prev) => ({
      ...prev,
      serviceHistory: prev.serviceHistory.filter((_, i) => i !== index),
    }));
  };

  const handleAddAccident = () => {
    if (!newAccident.date || !newAccident.description.trim()) return;
    setFormData((prev) => ({
      ...prev,
      accidentReports: [
        {
          date: newAccident.date,
          description: newAccident.description.trim(),
          driverName: (newAccident.driverName || "").trim(),
          driverMobile: (newAccident.driverMobile || "").trim(),
        },
        ...prev.accidentReports,
      ],
    }));
    setNewAccident({
      date: "",
      description: "",
      driverName: "",
      driverMobile: "",
    });
  };

  const handleRemoveAccident = (index) => {
    setFormData((prev) => ({
      ...prev,
      accidentReports: prev.accidentReports.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.vehicleNo.trim()) {
      setError("Vehicle Number is required");
      setActiveSection("details");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to save vehicle"
      );
    } finally {
      setLoading(false);
    }
  };

  const DOC_FIELDS = [
    { key: "pucExpiry", label: "PUC Certificate", hint: "Pollution Under Control" },
    { key: "fitnessExpiry", label: "Fitness Certificate", hint: "RTO Fitness inspection" },
    { key: "insuranceExpiry", label: "Commercial Insurance", hint: "Third-party / comprehensive policy" },
    { key: "permitExpiry", label: "Goods Transport Permit", hint: "National / state permit" },
    { key: "rcExpiry", label: "Registration (RC)", hint: "Registration term validity" },
  ];

  const expiredDocsCount = DOC_FIELDS.filter(({ key }) => {
    const d = daysUntil(formData[key]);
    return formData[key] && d < 0;
  }).length;

  const menuItems = [
    {
      id: "details",
      label: "General Specifications",
      badge: formatVehicleStatus(formData.status),
      badgeVariant: getVehicleStatusBadgeVariant(formData.status),
    },
    {
      id: "ownership",
      label: "Ownership & Vendor",
      badge: formData.ownership || "Unset",
    },
    {
      id: "documents",
      label: "Compliance & Documents",
      badge: expiredDocsCount > 0 ? `${expiredDocsCount} Expired` : "5 Docs",
      badgeVariant: expiredDocsCount > 0 ? "bad" : "ok",
    },
    {
      id: "service",
      label: "Service History",
      badge: formData.serviceHistory.length,
    },
    {
      id: "accidents",
      label: "Accident Reports",
      badge: formData.accidentReports.length,
      badgeVariant: formData.accidentReports.length > 0 ? "bad" : "neutral",
    },
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      {isEdit && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="btn btn-danger"
          title="Delete vehicle permanently"
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
        <span>{loading ? "Saving..." : isEdit ? "Save Changes" : "Register Vehicle"}</span>
      </button>
    </div>
  );

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Vehicle: ${formData.vehicleNo || "Edit"}` : "Add Vehicle"}
      subtitle={isEdit ? "Specifications, compliance certificates & logs" : "Register commercial vehicle"}
      breadcrumbs="Vehicles"
      badge={
        <Badge variant={getVehicleStatusBadgeVariant(formData.status)}>
          {formatVehicleStatus(formData.status)}
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
        {/* SECTION 1: GENERAL SPECIFICATIONS */}
        {activeSection === "details" && (
          <div className="space-y-5">
            <div className="panel panel-pad">
              <div className="pb-3 border-b border-line mb-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
                  Vehicle Specifications
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="MH 04 AB 1234"
                    value={formData.vehicleNo}
                    onChange={(e) => handleChange("vehicleNo", e.target.value)}
                    className="input-field uppercase font-mono text-[14px] font-bold tracking-wider"
                  />
                </div>

                <div>
                  <label className="label">Vehicle Category / Type</label>
                  <input
                    type="text"
                    placeholder="16 Wheeler"
                    value={formData.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="input-field text-[13.5px]"
                  />
                </div>

                <div>
                  <label className="label">Carrying Capacity</label>
                  <input
                    type="text"
                    placeholder="25 MT"
                    value={formData.capacity}
                    onChange={(e) => handleChange("capacity", e.target.value)}
                    className="input-field text-[13.5px]"
                  />
                </div>

                <div>
                  <label className="label">Fleet Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="input-field font-semibold text-[13px]"
                  >
                    <option value="ACTIVE">Active (Available for Dispatch)</option>
                    <option value="DRIVER_NOT_AVAILABLE">Driver Not Available</option>
                    <option value="UNDER_SERVICE">Under Service (In Workshop)</option>
                    <option value="INACTIVE">Inactive (Standby / Grounded)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveSection("ownership")}
                className="btn btn-primary"
              >
                <span>Continue to Ownership →</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: OWNERSHIP & VENDOR */}
        {activeSection === "ownership" && (
          <div className="space-y-5">
            <div className="panel panel-pad">
              <div className="pb-3 border-b border-line mb-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
                  Ownership & Vendor
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Ownership Type</label>
                  <select
                    value={formData.ownership}
                    onChange={(e) => handleChange("ownership", e.target.value)}
                    className="input-field font-semibold text-[13px]"
                  >
                    <option value="">Select Ownership Type</option>
                    <option value="OWNED">Company Owned (Direct Asset)</option>
                    <option value="ATTACHED">Market / Attached Vendor Vehicle</option>
                    <option value="LEASED">Leased / Long-term Contract</option>
                  </select>
                </div>

                <div>
                  <label className="label">Owner / Vendor Name</label>
                  <input
                    type="text"
                    placeholder="Owner Name"
                    value={formData.ownerName}
                    onChange={(e) => handleChange("ownerName", e.target.value)}
                    className="input-field text-[13.5px]"
                  />
                </div>

                <div>
                  <label className="label">Contact Mobile</label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={formData.ownerMobile}
                    onChange={(e) => handleChange("ownerMobile", e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setActiveSection("details")}
                className="btn"
              >
                <span>← Back to Specs</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("documents")}
                className="btn btn-primary"
              >
                <span>Continue to Documents →</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: COMPLIANCE & DOCUMENTS */}
        {activeSection === "documents" && (
          <div className="space-y-5">
            <div className="panel panel-pad">
              <div className="pb-3 border-b border-line mb-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
                  Compliance Documents
                </h3>
              </div>

              <div className="mb-4">
                <label className="label">Registration Certificate (RC) Number</label>
                <input
                  type="text"
                  placeholder="RC Number"
                  value={formData.rcNumber}
                  onChange={(e) => handleChange("rcNumber", e.target.value)}
                  className="input-field font-mono uppercase"
                />
              </div>

              <div className="border border-line rounded-xl overflow-hidden divide-y divide-line shadow-sm">
                {DOC_FIELDS.map(({ key, label, hint }) => {
                  const val = formData[key];
                  const days = daysUntil(val);
                  const status = docBadgeStatus(days);

                  return (
                    <div
                      key={key}
                      className="p-3.5 bg-paper-raised flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-paper-subtle/40 transition-colors"
                    >
                      <div className="sm:w-1/2">
                        <span className="text-[13px] font-bold text-ink block">
                          {label}
                        </span>
                        <span className="text-[11px] text-slate-soft">
                          {hint}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 sm:w-1/2 justify-end flex-wrap sm:flex-nowrap">
                        {key === "permitExpiry" && (
                          <select
                            value={formData.permitType || "NATIONAL"}
                            onChange={(e) => handleChange("permitType", e.target.value)}
                            className="input-field py-1 text-[12px] max-w-[140px] font-semibold text-ink bg-paper-subtle cursor-pointer"
                          >
                            <option value="NATIONAL">National Permit</option>
                            <option value="STATE">State Permit</option>
                          </select>
                        )}

                        <input
                          type="date"
                          value={val}
                          onChange={(e) => handleChange(key, e.target.value)}
                          className="input-field py-1 text-[12.5px] max-w-[170px]"
                        />

                        <div className="w-28 flex justify-end shrink-0">
                          {val ? (
                            <Badge variant={status} className="px-2 py-0.5 text-[10.5px]">
                              {days < 0
                                ? `${Math.abs(days)}d Overdue`
                                : days <= 30
                                ? `${days}d Left`
                                : `${days}d Valid`}
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-slate-soft italic">
                              Not Set
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setActiveSection("ownership")}
                className="btn"
              >
                <span>← Back to Ownership</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("service")}
                className="btn btn-primary"
              >
                <span>Continue to Service Log →</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 4: SERVICE & MAINTENANCE LOG */}
        {activeSection === "service" && (
          <div className="space-y-5">
            <div className="panel panel-pad">
              <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
                  Service & Maintenance History
                </h3>
                <Badge variant="neutral">
                  {formData.serviceHistory.length} Records
                </Badge>
              </div>

              {/* Add New Record Row */}
              <div className="p-3.5 bg-paper-subtle border border-line rounded-xl space-y-3 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label">Service Date</label>
                    <input
                      type="date"
                      value={newService.date}
                      onChange={(e) =>
                        setNewService((p) => ({ ...p, date: e.target.value }))
                      }
                      className="input-field py-1.5 text-[13px]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Work Description / Replaced Parts</label>
                    <input
                      type="text"
                      placeholder="Work description"
                      value={newService.description}
                      onChange={(e) =>
                        setNewService((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      className="input-field text-[13px]"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="btn btn-sm btn-primary"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Service Record</span>
                  </button>
                </div>
              </div>

              {/* Records List */}
              <div className="space-y-2">
                {formData.serviceHistory.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-line rounded-xl bg-paper-subtle/50 text-[12.5px] text-slate-soft">
                    No service records logged yet.
                  </div>
                ) : (
                  formData.serviceHistory.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-paper-raised border border-line rounded-lg text-[13px] hover:border-slate-soft transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11.5px] font-semibold px-2 py-0.5 rounded bg-paper-subtle border border-line text-slate">
                          {fmtD(s.date)}
                        </span>
                        <span className="font-medium text-ink">{s.description}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(idx)}
                        aria-label="Remove record"
                        className="text-slate-soft hover:text-rust p-1 rounded hover:bg-rust-soft/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setActiveSection("documents")}
                className="btn"
              >
                <span>← Back to Documents</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("accidents")}
                className="btn btn-primary"
              >
                <span>Continue to Accidents →</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 5: ACCIDENTS & INCIDENTS */}
        {activeSection === "accidents" && (
          <div className="space-y-5">
            <div className="panel panel-pad">
              <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
                  Accident & Incident Reports
                </h3>
                <Badge variant={formData.accidentReports.length > 0 ? "bad" : "neutral"}>
                  {formData.accidentReports.length} Incidents
                </Badge>
              </div>

              {/* Add New Incident Row */}
              <div className="p-3.5 bg-rust-soft/20 border border-rust-soft rounded-xl space-y-3 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="label">Incident Date *</label>
                    <input
                      type="date"
                      value={newAccident.date}
                      onChange={(e) =>
                        setNewAccident((p) => ({ ...p, date: e.target.value }))
                      }
                      className="input-field bg-white py-1.5 text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="label">Driver Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Singh"
                      value={newAccident.driverName}
                      onChange={(e) =>
                        setNewAccident((p) => ({ ...p, driverName: e.target.value }))
                      }
                      className="input-field bg-white text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="label">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={newAccident.driverMobile}
                      onChange={(e) =>
                        setNewAccident((p) => ({ ...p, driverMobile: e.target.value }))
                      }
                      className="input-field bg-white font-mono text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="label">Incident & Damage *</label>
                    <input
                      type="text"
                      placeholder="Details / damage description"
                      value={newAccident.description}
                      onChange={(e) =>
                        setNewAccident((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      className="input-field bg-white text-[13px]"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddAccident}
                    className="btn btn-sm bg-rust text-white border-rust hover:bg-rust-dark"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Incident Record</span>
                  </button>
                </div>
              </div>

              {/* Incidents List */}
              <div className="space-y-2">
                {formData.accidentReports.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-line rounded-xl bg-paper-subtle/50 text-[12.5px] text-teal font-medium">
                    Clean Record — No accident reports on file.
                  </div>
                ) : (
                  formData.accidentReports.map((a, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-rust-soft/10 border border-rust-soft/60 rounded-lg text-[13px] hover:border-rust transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
                        <span className="font-mono text-[11.5px] font-bold text-rust px-2 py-0.5 rounded bg-rust-soft/50 border border-rust/30 shrink-0 self-start sm:self-auto">
                          {fmtD(a.date)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-ink block">{a.description}</span>
                          {(a.driverName || a.driverMobile) && (
                            <div className="text-[11.5px] text-slate mt-0.5 flex items-center gap-2 flex-wrap">
                              {a.driverName && (
                                <span>
                                  <strong className="text-slate-800">Driver:</strong> {a.driverName}
                                </span>
                              )}
                              {a.driverMobile && (
                                <span className="font-mono text-slate-soft">
                                  ({a.driverMobile})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAccident(idx)}
                        aria-label="Remove incident"
                        className="text-slate-soft hover:text-rust p-1 rounded hover:bg-rust-soft/30 transition-colors shrink-0 ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setActiveSection("service")}
                className="btn"
              >
                <span>← Back to Service Log</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? "Saving..." : isEdit ? "Save Changes" : "Save Vehicle"}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </FullScreenModal>
  );
};

export default VehicleModal;
