import React, { useState, useEffect, useMemo } from "react";
import FullScreenModal from "../ui/FullScreenModal.jsx";
import Badge from "../ui/Badge.jsx";
import { vehicleService } from "../../services/vehicleService.js";
import { driverService } from "../../services/driverService.js";
import { inventoryService } from "../../services/inventoryService.js";
import {
  INVENTORY_LOCATIONS,
  getInventoryLocationName,
} from "../../constants/inventoryLocations.js";
import {
  Save,
  Trash2,
  AlertCircle,
  Truck,
  Package,
  MapPin,
  Calendar,
  User,
  Layers,
  ArrowDownCircle,
} from "lucide-react";

const PURPOSE_PRESETS = [
  "Trip Tarpaulin / Waterproof Tripal",
  "Hydraulic Jack & Wheel Tools",
  "Cargo Lashing Rope",
  "Wheel Bolts & Fasteners",
  "Driver Safety Gear",
  "Engine Oil & Consumables",
  "Spare Parts / Maintenance",
  "General Fleet Kit",
];

export const AssignmentModal = ({
  isOpen,
  onClose,
  assignment,
  onSave,
  onDelete,
  defaultLocation = "LOCATION_A",
  defaultVehicleId = null,
}) => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [formData, setFormData] = useState({
    vehicleId: "",
    inventoryItemId: "",
    quantity: 1,
    location: "LOCATION_A",
    assignedDate: new Date().toISOString().slice(0, 10),
    driverId: "",
    purpose: "Trip Tarpaulin / Waterproof Tripal",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!assignment?._id;

  // Load supporting fleet data
  useEffect(() => {
    if (!isOpen) return;

    const loadLookups = async () => {
      setDataLoading(true);
      try {
        const [vList, dList, iList] = await Promise.all([
          vehicleService.getAll(),
          driverService.getAll(),
          inventoryService.getAll(),
        ]);
        setVehicles(vList || []);
        setDrivers(dList || []);
        setInventoryItems(iList || []);
      } catch (err) {
        console.error("Failed to load assignment lookups:", err);
      } finally {
        setDataLoading(false);
      }
    };

    loadLookups();
  }, [isOpen]);

  // Sync form data with selected assignment or defaults
  useEffect(() => {
    if (assignment) {
      setFormData({
        vehicleId: assignment.vehicle?._id || assignment.vehicle || "",
        inventoryItemId:
          assignment.inventoryItem?._id || assignment.inventoryItem || "",
        quantity: assignment.quantity || 1,
        location: assignment.location || defaultLocation || "LOCATION_A",
        assignedDate: assignment.assignedDate
          ? new Date(assignment.assignedDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        driverId: assignment.driver?._id || assignment.driver || "",
        purpose: assignment.purpose || "Trip Tarpaulin / Waterproof Tripal",
        remarks: assignment.remarks || "",
      });
    } else {
      setFormData({
        vehicleId: defaultVehicleId || "",
        inventoryItemId: "",
        quantity: 1,
        location: defaultLocation || "LOCATION_A",
        assignedDate: new Date().toISOString().slice(0, 10),
        driverId: "",
        purpose: "Trip Tarpaulin / Waterproof Tripal",
        remarks: "",
      });
    }
    setError("");
  }, [assignment, isOpen, defaultLocation, defaultVehicleId]);

  // When Vehicle changes, auto-suggest assigned driver if available
  const handleVehicleChange = (vId) => {
    const matchedVehicle = vehicles.find((v) => v._id === vId);
    setFormData((prev) => ({
      ...prev,
      vehicleId: vId,
      driverId:
        matchedVehicle?.assignedDriver?._id ||
        matchedVehicle?.assignedDriver ||
        prev.driverId,
    }));
  };

  // Filter available inventory items by selected warehouse location
  const locationInventory = useMemo(() => {
    return inventoryItems.filter((i) => i.location === formData.location);
  }, [inventoryItems, formData.location]);

  // Selected item object
  const selectedProduct = useMemo(() => {
    return inventoryItems.find((i) => i._id === formData.inventoryItemId);
  }, [inventoryItems, formData.inventoryItemId]);

  // Max assignable quantity (for edit mode, add back existing assignment quantity)
  const availableStock = useMemo(() => {
    if (!selectedProduct) return 0;
    const baseStock = Number(selectedProduct.quantity) || 0;
    if (
      isEdit &&
      assignment &&
      (assignment.inventoryItem?._id === selectedProduct._id ||
        assignment.inventoryItem === selectedProduct._id)
    ) {
      return baseStock + Number(assignment.quantity || 0);
    }
    return baseStock;
  }, [selectedProduct, isEdit, assignment]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // If location changed and selected item is from different location, reset item
      if (field === "location") {
        const item = inventoryItems.find((i) => i._id === prev.inventoryItemId);
        if (item && item.location !== value) {
          updated.inventoryItemId = "";
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.vehicleId) {
      setError("Please select a Vehicle");
      return;
    }
    if (!formData.inventoryItemId) {
      setError("Please select an Inventory Product to assign");
      return;
    }
    if (Number(formData.quantity) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (Number(formData.quantity) > availableStock) {
      setError(
        `Quantity (${formData.quantity}) exceeds available warehouse stock (${availableStock} ${
          selectedProduct?.unit || "PCS"
        })`
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to process vehicle assignment"
      );
    } finally {
      setLoading(false);
    }
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      {isEdit && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="btn btn-danger"
          title="Delete assignment"
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
        disabled={loading || dataLoading}
        className="btn btn-primary"
      >
        <Save className="w-4 h-4" />
        <span>
          {loading
            ? "Processing..."
            : isEdit
            ? "Save Changes"
            : "Confirm & Assign"}
        </span>
      </button>
    </div>
  );

  const menuItems = [
    {
      id: "assignment",
      label: "Assignment Specs",
      badge: `${formData.quantity || 1} ${selectedProduct?.unit || "PCS"}`,
      badgeVariant: "ok",
    },
  ];

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEdit
          ? `Edit Assignment: ${assignment.vehicleNo || "Vehicle"}`
          : "Assign Equipment to Vehicle"
      }
      subtitle={
        isEdit
          ? `Assigned item specs & inventory sync`
          : "Issue tools, tripals, jacks, or spares to commercial trucks with real-time stock deduction"
      }
      breadcrumbs="Assignments"
      badge={
        <Badge variant="ok">
          {formData.location === "LOCATION_A" ? "Vidisha" : "Manawar"}
        </Badge>
      }
      menuItems={menuItems}
      activeSection="assignment"
      onSectionChange={() => {}}
      actions={headerActions}
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-lg bg-rust-soft/60 border border-rust/30 text-rust text-[13px] flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Sync Warning Notice */}
      <div className="mb-5 p-3.5 rounded-xl bg-amber-soft/40 border border-amber/30 text-ink text-[13px] flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <ArrowDownCircle className="w-5 h-5 text-amber shrink-0" />
          <div>
            <span className="font-bold">Automatic Inventory Synchronization:</span>{" "}
            Confirming this assignment will instantly deduct the quantity from the{" "}
            <span className="font-semibold text-amber-dark">
              {getInventoryLocationName(formData.location)}
            </span>{" "}
            warehouse stock.
          </div>
        </div>
        <Badge variant="warn" className="text-[11px] shrink-0 font-mono">
          Live Stock Sync
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Vehicle & Warehouse Target */}
        <div className="panel panel-pad">
          <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate" />
              <span>1. Select Vehicle & Warehouse Depot</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Choose Vehicle */}
            <div>
              <label className="label text-[13px] font-bold text-ink mb-1.5 flex items-center gap-1.5">
                <span>Vehicle (Truck / Container)</span>
                <span className="text-rust">*</span>
              </label>
              <select
                required
                value={formData.vehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="input-field font-semibold text-[13.5px]"
              >
                <option value="">Select Vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.vehicleNo} — {v.type || "Vehicle"}{" "}
                    {v.capacity ? `(${v.capacity})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Choose Warehouse Location */}
            <div>
              <label className="label text-[13px] font-bold text-ink mb-1.5 flex items-center gap-1.5">
                <span>Issue From Warehouse Depot</span>
                <span className="text-rust">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleChange("location", "LOCATION_A")}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                    formData.location === "LOCATION_A"
                      ? "border-amber bg-amber-soft/50 ring-2 ring-amber/50 font-bold"
                      : "border-line bg-paper-subtle hover:bg-paper-raised"
                  }`}
                >
                  <MapPin className="w-4 h-4 text-amber" />
                  <span className="text-[13px]">Vidisha</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChange("location", "LOCATION_B")}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                    formData.location === "LOCATION_B"
                      ? "border-teal bg-teal-soft/50 ring-2 ring-teal/50 font-bold"
                      : "border-line bg-paper-subtle hover:bg-paper-raised"
                  }`}
                >
                  <MapPin className="w-4 h-4 text-teal" />
                  <span className="text-[13px]">Manawar</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Product & Quantity Selection */}
        <div className="panel panel-pad">
          <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0 flex items-center gap-2">
              <Package className="w-4 h-4 text-slate" />
              <span>2. Product & Quantity to Issue</span>
            </h3>
            {selectedProduct && (
              <span className="font-mono text-[12px] text-slate font-medium">
                In-Stock at {getInventoryLocationName(formData.location)}:{" "}
                <span className="font-bold text-ink">
                  {availableStock} {selectedProduct.unit || "PCS"}
                </span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Select Product */}
            <div className="md:col-span-2">
              <label className="label text-[13px] font-bold text-ink mb-1.5 flex items-center gap-1.5">
                <span>Select Inventory Product</span>
                <span className="text-rust">*</span>
              </label>
              <select
                required
                value={formData.inventoryItemId}
                onChange={(e) => handleChange("inventoryItemId", e.target.value)}
                className="input-field text-[13.5px]"
              >
                <option value="">
                  Select Product from {getInventoryLocationName(formData.location)}...
                </option>
                {locationInventory.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.itemName} ({item.itemCode}) — Stock: {item.quantity}{" "}
                    {item.unit || "PCS"}
                    {item.category ? ` • ${item.category}` : ""}
                  </option>
                ))}
              </select>
              {locationInventory.length === 0 && !dataLoading && (
                <span className="text-[11.5px] text-rust mt-1 block">
                  No products registered in {getInventoryLocationName(formData.location)} inventory yet.
                </span>
              )}
            </div>

            {/* Quantity */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label text-[13px] font-bold text-ink m-0 flex items-center gap-1.5">
                  <span>Quantity</span>
                  <span className="text-rust">*</span>
                </label>
                {selectedProduct && (
                  <span className="text-[11px] text-slate font-mono">
                    Max: {availableStock} {selectedProduct.unit}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.01"
                  max={availableStock || 999999}
                  step="any"
                  required
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  className="input-field font-mono text-[14px] font-bold text-ink flex-1"
                />
                <span className="font-mono text-[12.5px] font-semibold text-slate px-3 py-2 rounded-lg bg-paper-subtle border border-line">
                  {selectedProduct?.unit || "PCS"}
                </span>
              </div>
            </div>
          </div>

          {/* Product Quick Details Pill */}
          {selectedProduct && (
            <div className="mt-3 p-3 rounded-lg bg-paper-subtle border border-line grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate block text-[11px]">Category:</span>
                <span className="font-semibold text-ink">
                  {selectedProduct.category || "General"}
                </span>
              </div>
              <div>
                <span className="text-slate block text-[11px]">Brand:</span>
                <span className="font-semibold text-ink">
                  {selectedProduct.brand || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate block text-[11px]">Specification / Size:</span>
                <span className="font-semibold text-ink">
                  {selectedProduct.size || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate block text-[11px]">Remaining After Assignment:</span>
                <span
                  className={`font-bold font-mono ${
                    availableStock - Number(formData.quantity || 0) < 0
                      ? "text-rust"
                      : "text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {Math.max(0, availableStock - Number(formData.quantity || 0))}{" "}
                  {selectedProduct.unit || "PCS"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Personnel & Purpose */}
        <div className="panel panel-pad">
          <div className="pb-3 border-b border-line mb-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate" />
              <span>3. Assignment Date & Driver In Charge</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Assignment Date */}
            <div>
              <label className="label text-[13px] font-bold text-ink mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate" />
                <span>Assignment Date *</span>
              </label>
              <input
                type="date"
                required
                value={formData.assignedDate}
                onChange={(e) => handleChange("assignedDate", e.target.value)}
                className="input-field text-[13px] font-mono"
              />
            </div>

            {/* Assigned Driver */}
            <div>
              <label className="label text-[13px] font-bold text-ink mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate" />
                <span>Driver In Charge (Optional)</span>
              </label>
              <select
                value={formData.driverId || ""}
                onChange={(e) => handleChange("driverId", e.target.value)}
                className="input-field text-[13px]"
              >
                <option value="">Select Driver...</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.mobile || "No Mobile"})
                  </option>
                ))}
              </select>
            </div>

            {/* Purpose */}
            <div>
              <label className="label text-[13px] font-bold text-ink mb-1.5">
                Purpose / Allocation Reason
              </label>
              <select
                value={formData.purpose}
                onChange={(e) => handleChange("purpose", e.target.value)}
                className="input-field text-[13px]"
              >
                {PURPOSE_PRESETS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Remarks */}
            <div className="md:col-span-3">
              <label className="label text-[13px] font-bold text-ink mb-1.5">
                Remarks / Condition Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Issued 2 brand new waterproof tripals for Mumbai monsoon trip, verified in good condition"
                value={formData.remarks}
                onChange={(e) => handleChange("remarks", e.target.value)}
                className="input-field text-[13.5px]"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="p-3.5 bg-paper-raised border border-line rounded-xl flex items-center justify-between shadow-card">
          <div className="text-[12.5px] text-slate font-mono">
            {formData.vehicleId && formData.inventoryItemId ? (
              <span className="text-ink font-semibold">
                Ready to assign {formData.quantity} {selectedProduct?.unit || "PCS"} to vehicle
              </span>
            ) : (
              "Complete vehicle and product selections"
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || dataLoading}
              className="btn btn-primary px-4 py-1.5 text-[13px]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {loading
                  ? "Processing..."
                  : isEdit
                  ? "Save Changes"
                  : "Confirm & Deduct Stock"}
              </span>
            </button>
          </div>
        </div>
      </form>
    </FullScreenModal>
  );
};

export default AssignmentModal;
