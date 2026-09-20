import React, { useState, useEffect } from "react";
import FullScreenModal from "../ui/FullScreenModal.jsx";
import Badge from "../ui/Badge.jsx";
import { Trash2, Save, AlertCircle } from "lucide-react";

// Standard Fleet & Warehouse Unit list
const INVENTORY_UNITS = [
  { value: "PCS", label: "PCS — Pieces" },
  { value: "LTR", label: "LTR — Liters" },
  { value: "SET", label: "SET — Sets" },
  { value: "PAIR", label: "PAIR — Pairs" },
  { value: "KG", label: "KG — Kilograms" },
  { value: "MTR", label: "MTR — Meters" },
  { value: "CAN", label: "CAN — Cans" },
  { value: "DRUM", label: "DRUM — Drums" },
  { value: "BOX", label: "BOX — Boxes" },
];

// Standard Transport ERP Categories
const INVENTORY_CATEGORIES = [
  { value: "Lubricants & Oils", label: "Lubricants & Oils", defaultUnit: "LTR" },
  { value: "Tires & Tubes", label: "Tires & Tubes", defaultUnit: "PCS" },
  { value: "Filters", label: "Filters", defaultUnit: "PCS" },
  { value: "Brakes & Suspension", label: "Brakes & Suspension", defaultUnit: "SET" },
  { value: "Electrical & Battery", label: "Electrical & Battery", defaultUnit: "PCS" },
  { value: "Grease & Chemicals", label: "Grease & Chemicals", defaultUnit: "KG" },
  { value: "Engine & Transmission", label: "Engine & Transmission", defaultUnit: "PCS" },
  { value: "Body & Cabin", label: "Body & Cabin", defaultUnit: "PAIR" },
  { value: "General Spares", label: "General Spares", defaultUnit: "PCS" },
];

export const InventoryModal = ({
  isOpen,
  onClose,
  item,
  onSave,
  onDelete,
  defaultLocation = "LOCATION_A",
}) => {
  const [formData, setFormData] = useState({
    itemCode: "",
    itemName: "",
    category: "",
    brand: "",
    size: "",
    quantity: 0,
    unit: "PCS",
    purchaseRate: 0,
    minimumStock: 0,
    location: "LOCATION_A",
    remarks: "",
    status: "ACTIVE",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!item?._id;

  useEffect(() => {
    if (item) {
      setFormData({
        itemCode: item.itemCode || "",
        itemName: item.itemName || "",
        category: item.category || "",
        brand: item.brand || "",
        size: item.size || "",
        quantity: item.quantity !== undefined ? item.quantity : 0,
        unit: item.unit || "PCS",
        purchaseRate: item.purchaseRate !== undefined ? item.purchaseRate : 0,
        minimumStock: item.minimumStock !== undefined ? item.minimumStock : 0,
        location: item.location || defaultLocation || "LOCATION_A",
        remarks: item.remarks || "",
        status: item.status || "ACTIVE",
      });
    } else {
      setFormData({
        itemCode: "",
        itemName: "",
        category: "",
        brand: "",
        size: "",
        quantity: 0,
        unit: "PCS",
        purchaseRate: 0,
        minimumStock: 0,
        location: defaultLocation || "LOCATION_A",
        remarks: "",
        status: "ACTIVE",
      });
    }
    setError("");
  }, [item, isOpen, defaultLocation]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Smart default: If user selects Lubricants/Oils category, auto-set unit to LTR
      if (field === "category") {
        const matched = INVENTORY_CATEGORIES.find((c) => c.value === value);
        if (matched && matched.defaultUnit) {
          updated.unit = matched.defaultUnit;
        }
      }

      // Smart check on Item Name: if user types 'oil', 'coolant', 'def', 'diesel' and unit was still PCS, suggest LTR
      if (field === "itemName" && (!prev.category || prev.category === "Lubricants & Oils")) {
        const lower = String(value).toLowerCase();
        if (
          (lower.includes("oil") || lower.includes("coolant") || lower.includes("def") || lower.includes("adblue") || lower.includes("fluid")) &&
          prev.unit === "PCS"
        ) {
          updated.unit = "LTR";
          if (!prev.category) updated.category = "Lubricants & Oils";
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.itemCode.trim() || !formData.itemName.trim()) {
      setError("Item Code (SKU) and Item Name are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity) || 0,
        purchaseRate: Number(formData.purchaseRate) || 0,
        minimumStock: Number(formData.minimumStock) || 0,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to save inventory item"
      );
    } finally {
      setLoading(false);
    }
  };

  const isLowStock =
    formData.minimumStock > 0 && formData.quantity <= formData.minimumStock;

  const totalValue = (Number(formData.quantity) || 0) * (Number(formData.purchaseRate) || 0);

  // Single clean left menu item
  const menuItems = [
    {
      id: "all",
      label: "Item Overview",
      badge: `${formData.quantity} ${formData.unit}`,
      badgeVariant: isLowStock ? "bad" : "ok",
    },
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      {isEdit && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="btn btn-danger"
          title="Delete inventory item"
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
        <span>{loading ? "Saving..." : isEdit ? "Save Changes" : "Save Item"}</span>
      </button>
    </div>
  );

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Item: ${formData.itemCode}` : "Add Item"}
      subtitle={isEdit ? "Item specifications & stock" : "Register new inventory item"}
      breadcrumbs="Inventory"
      badge={
        <Badge variant={formData.status === "ACTIVE" ? "ok" : "warn"}>
          {formData.status}
        </Badge>
      }
      menuItems={menuItems}
      activeSection="all"
      onSectionChange={() => {}}
      actions={headerActions}
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-lg bg-rust-soft/60 border border-rust/30 text-rust text-[13px] flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Clean Single-Page Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Item Details */}
        <div className="panel panel-pad">
          <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
              Item Details
            </h3>
            <Badge variant="ok">
              {formData.location === "LOCATION_A" ? "Location A" : "Location B"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Item Code (SKU) *</label>
              <input
                type="text"
                required
                placeholder="OIL-15W40"
                value={formData.itemCode}
                onChange={(e) => handleChange("itemCode", e.target.value)}
                className="input-field font-mono uppercase text-[13.5px] font-bold"
              />
            </div>

            <div>
              <label className="label">Warehouse Location *</label>
              <select
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="input-field font-semibold text-[13px]"
              >
                <option value="LOCATION_A">Location A</option>
                <option value="LOCATION_B">Location B</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">Item Name *</label>
              <input
                type="text"
                required
                placeholder="Diesel Engine Oil 15W-40"
                value={formData.itemName}
                onChange={(e) => handleChange("itemName", e.target.value)}
                className="input-field text-[13.5px]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Classification */}
        <div className="panel panel-pad">
          <div className="pb-3 border-b border-line mb-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
              Classification
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="input-field text-[13px]"
              >
                <option value="">Select Category...</option>
                {INVENTORY_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Brand / Manufacturer</label>
              <input
                type="text"
                placeholder="Castrol"
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                className="input-field text-[13.5px]"
              />
            </div>

            <div>
              <label className="label">Size / Grade</label>
              <input
                type="text"
                placeholder="15W-40"
                value={formData.size}
                onChange={(e) => handleChange("size", e.target.value)}
                className="input-field text-[13.5px]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Stock & Pricing */}
        <div className="panel panel-pad">
          <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
              Stock & Pricing
            </h3>

            <div className="text-right">
              <span className="text-[11px] text-slate font-mono uppercase mr-1.5">
                Total Value:
              </span>
              <span className="text-[13.5px] font-bold font-mono text-ink">
                ₹{totalValue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                className="input-field font-mono text-[14px] font-bold text-ink"
              />
            </div>

            <div>
              <label className="label">Unit *</label>
              <select
                value={formData.unit}
                onChange={(e) => handleChange("unit", e.target.value)}
                className="input-field font-semibold text-[13px] bg-paper-subtle border-ink/40"
              >
                {INVENTORY_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Rate (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.purchaseRate}
                onChange={(e) => handleChange("purchaseRate", e.target.value)}
                className="input-field font-mono font-semibold"
              />
            </div>

            <div>
              <label className="label">Min Stock Alert</label>
              <input
                type="number"
                min="0"
                value={formData.minimumStock}
                onChange={(e) => handleChange("minimumStock", e.target.value)}
                className="input-field font-mono font-semibold"
              />
              {isLowStock && (
                <span className="text-[11px] text-rust font-semibold mt-1 block">
                  Low stock alert active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Status & Notes */}
        <div className="panel panel-pad">
          <div className="pb-3 border-b border-line mb-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
              Status & Notes
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="input-field font-semibold max-w-xs"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div>
              <label className="label">Rack / Remarks</label>
              <input
                type="text"
                placeholder="Rack 3-B"
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
            {formData.itemCode ? `${formData.itemCode} • ${formData.quantity} ${formData.unit}` : "New Item"}
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
              disabled={loading}
              className="btn btn-primary px-4 py-1.5 text-[13px]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? "Saving..." : isEdit ? "Save Changes" : "Save Item"}</span>
            </button>
          </div>
        </div>
      </form>
    </FullScreenModal>
  );
};

export default InventoryModal;
