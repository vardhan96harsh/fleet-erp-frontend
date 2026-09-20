import React, { useState, useEffect } from "react";
import FullScreenModal from "../ui/FullScreenModal.jsx";
import Badge from "../ui/Badge.jsx";
import { Trash2, Save, AlertCircle, MapPin, Sparkles } from "lucide-react";
import {
  INVENTORY_LOCATIONS,
  INVENTORY_LOCATION_NAMES,
  getInventoryLocationName,
} from "../../constants/inventoryLocations.js";

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

// Standard Transport ERP Categories (without Body & Cabin, including Tripal, Safety Gear, Rope, Jack, Wheel Bolt)
const INVENTORY_CATEGORIES = [
  { value: "Tripal / Waterproof Tarpaulin", label: "Tripal / Waterproof Tarpaulin", defaultUnit: "PCS" },
  { value: "Safety Gear", label: "Safety Gear", defaultUnit: "PCS" },
  { value: "Rope", label: "Rope", defaultUnit: "MTR" },
  { value: "Jack", label: "Jack", defaultUnit: "PCS" },
  { value: "Wheel Bolt", label: "Wheel Bolt", defaultUnit: "PCS" },
  { value: "Lubricants & Oils", label: "Lubricants & Oils", defaultUnit: "LTR" },
  { value: "Tires & Tubes", label: "Tires & Tubes", defaultUnit: "PCS" },
  { value: "Filters", label: "Filters", defaultUnit: "PCS" },
  { value: "Brakes & Suspension", label: "Brakes & Suspension", defaultUnit: "SET" },
  { value: "Electrical & Battery", label: "Electrical & Battery", defaultUnit: "PCS" },
  { value: "Grease & Chemicals", label: "Grease & Chemicals", defaultUnit: "KG" },
  { value: "Engine & Transmission", label: "Engine & Transmission", defaultUnit: "PCS" },
  { value: "General Spares", label: "General Spares", defaultUnit: "PCS" },
];

const OTHER_CATEGORY_KEY = "OTHER";

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

  const [selectedCategoryType, setSelectedCategoryType] = useState("");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [autoCodeEnabled, setAutoCodeEnabled] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!item?._id;

  // Initialize form state
  useEffect(() => {
    if (item) {
      const existingCategory = item.category || "";
      const isPredefined = INVENTORY_CATEGORIES.some(
        (c) => c.value === existingCategory
      );

      if (existingCategory && !isPredefined) {
        setSelectedCategoryType(OTHER_CATEGORY_KEY);
        setCustomCategoryInput(existingCategory);
      } else {
        setSelectedCategoryType(existingCategory);
        setCustomCategoryInput("");
      }

      setFormData({
        itemCode: item.itemCode || "",
        itemName: item.itemName || "",
        category: existingCategory,
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
      setAutoCodeEnabled(false);
    } else {
      setSelectedCategoryType("");
      setCustomCategoryInput("");
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
      setAutoCodeEnabled(true);
    }
    setError("");
  }, [item, isOpen, defaultLocation]);

  // Handle standard field changes
  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // If user types product name and auto SKU generation is enabled on new item
      if (field === "itemName" && !isEdit && autoCodeEnabled) {
        const cleanName = String(value)
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 24);
        if (cleanName) {
          updated.itemCode = cleanName;
        }
      }

      return updated;
    });
  };

  // Handle category dropdown change (auto sets unit)
  const handleCategorySelect = (selectedValue) => {
    setSelectedCategoryType(selectedValue);

    if (selectedValue === OTHER_CATEGORY_KEY) {
      setFormData((prev) => ({
        ...prev,
        category: customCategoryInput.trim(),
        // Keep current unit or default to PCS for custom category
        unit: prev.unit || "PCS",
      }));
    } else if (selectedValue === "") {
      setFormData((prev) => ({
        ...prev,
        category: "",
      }));
    } else {
      const matched = INVENTORY_CATEGORIES.find((c) => c.value === selectedValue);
      setFormData((prev) => ({
        ...prev,
        category: selectedValue,
        // Automatically set unit from category configuration
        unit: matched?.defaultUnit || prev.unit || "PCS",
      }));
    }
  };

  // Handle custom category typing
  const handleCustomCategoryChange = (val) => {
    setCustomCategoryInput(val);
    setFormData((prev) => ({
      ...prev,
      category: val,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.itemName.trim()) {
      setError("Product Name is required");
      return;
    }
    if (!formData.itemCode.trim()) {
      setError("Product Code (SKU) is required");
      return;
    }
    if (selectedCategoryType === OTHER_CATEGORY_KEY && !customCategoryInput.trim()) {
      setError("Please enter a Custom Category name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        category:
          selectedCategoryType === OTHER_CATEGORY_KEY
            ? customCategoryInput.trim()
            : formData.category.trim(),
        quantity: Number(formData.quantity) || 0,
        purchaseRate: Number(formData.purchaseRate) || 0,
        minimumStock: Number(formData.minimumStock) || 0,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to save inventory product"
      );
    } finally {
      setLoading(false);
    }
  };

  const isLowStock =
    formData.minimumStock > 0 && formData.quantity <= formData.minimumStock;

  const totalValue = (Number(formData.quantity) || 0) * (Number(formData.purchaseRate) || 0);

  const menuItems = [
    {
      id: "all",
      label: "Product Overview",
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
          title="Delete inventory product"
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
        <span>{loading ? "Saving..." : isEdit ? "Save Changes" : "Save Product"}</span>
      </button>
    </div>
  );

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Product: ${formData.itemName || formData.itemCode}` : "Add Product"}
      subtitle={
        isEdit
          ? `Stored in ${getInventoryLocationName(formData.location)} warehouse`
          : "Register new inventory product"
      }
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
        {/* Section 1: Location & Product Selection */}
        <div className="panel panel-pad">
          <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
              Warehouse Location & Product Details
            </h3>
            <span
              className={`inline-flex items-center gap-1 font-mono text-[12px] font-bold px-2.5 py-0.5 rounded border ${
                formData.location === "LOCATION_A"
                  ? "bg-amber-soft/50 text-amber-dark border-amber/40"
                  : "bg-teal-soft/50 text-teal-dark border-teal/40"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{getInventoryLocationName(formData.location)}</span>
            </span>
          </div>

          <div className="space-y-4">
            {/* 1. FIRST CHOOSE LOCATION */}
            <div>
              <label className="label text-[13px] font-bold text-ink mb-1.5 flex items-center gap-1.5">
                <span>1. Select Warehouse Location</span>
                <span className="text-rust">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange("location", "LOCATION_A")}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    formData.location === "LOCATION_A"
                      ? "border-amber bg-amber-soft/40 shadow-sm ring-2 ring-amber/50"
                      : "border-line bg-paper-subtle hover:border-slate/40 hover:bg-paper-raised"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-lg transition-colors ${
                      formData.location === "LOCATION_A"
                        ? "bg-amber text-white shadow-sm"
                        : "bg-paper-raised text-slate border border-line"
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-ink text-[14px]">Vidisha</div>
                    <div className="text-[11.5px] text-slate">
                      Primary Central Warehouse
                    </div>
                  </div>
                  {formData.location === "LOCATION_A" && (
                    <Badge variant="ok" className="text-[11px]">
                      Selected
                    </Badge>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleChange("location", "LOCATION_B")}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    formData.location === "LOCATION_B"
                      ? "border-teal bg-teal-soft/40 shadow-sm ring-2 ring-teal/50"
                      : "border-line bg-paper-subtle hover:border-slate/40 hover:bg-paper-raised"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-lg transition-colors ${
                      formData.location === "LOCATION_B"
                        ? "bg-teal text-white shadow-sm"
                        : "bg-paper-raised text-slate border border-line"
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-ink text-[14px]">Manawar</div>
                    <div className="text-[11.5px] text-slate">
                      Regional Branch Depot
                    </div>
                  </div>
                  {formData.location === "LOCATION_B" && (
                    <Badge variant="ok" className="text-[11px]">
                      Selected
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            {/* 2. THEN PRODUCT NAME & PRODUCT CODE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-2">
                <label className="label text-[13px] font-bold text-ink mb-1.5 flex items-center gap-1.5">
                  <span>2. Product Name</span>
                  <span className="text-rust">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Waterproof Tarpaulin / Tripal 24x18, Safety Helmet, Hydraulic Jack 20 Ton..."
                  value={formData.itemName}
                  onChange={(e) => handleChange("itemName", e.target.value)}
                  className="input-field text-[14px] font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label text-[13px] font-bold text-ink m-0 flex items-center gap-1.5">
                    <span>Product Code (SKU)</span>
                    <span className="text-rust">*</span>
                  </label>
                  {!isEdit && (
                    <button
                      type="button"
                      onClick={() => setAutoCodeEnabled((prev) => !prev)}
                      className="text-[11px] text-slate hover:text-ink font-mono flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber" />
                      <span>{autoCodeEnabled ? "Auto-fill ON" : "Manual"}</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRP-24X18, JCK-20T"
                  value={formData.itemCode}
                  onChange={(e) => {
                    setAutoCodeEnabled(false);
                    handleChange("itemCode", e.target.value);
                  }}
                  className="input-field font-mono uppercase text-[13.5px] font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Classification */}
        <div className="panel panel-pad">
          <div className="pb-3 border-b border-line mb-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
              Product Classification
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Category</label>
              <select
                value={selectedCategoryType}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="input-field text-[13px] font-medium"
              >
                <option value="">Select Category...</option>
                {INVENTORY_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} (Unit: {cat.defaultUnit})
                  </option>
                ))}
                <option value={OTHER_CATEGORY_KEY}>
                  ✨ Other (Custom Category)...
                </option>
              </select>
            </div>

            {selectedCategoryType === OTHER_CATEGORY_KEY ? (
              <div>
                <label className="label text-amber-dark font-bold">
                  Custom Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Type custom category name..."
                  value={customCategoryInput}
                  onChange={(e) => handleCustomCategoryChange(e.target.value)}
                  className="input-field text-[13.5px] border-amber/60 bg-amber-soft/20 focus:border-amber font-medium"
                />
              </div>
            ) : (
              <div>
                <label className="label">Brand / Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. Castrol, Bosch, Tata, Supreme..."
                  value={formData.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                  className="input-field text-[13.5px]"
                />
              </div>
            )}

            <div>
              <label className="label">Size / Grade / Specification</label>
              <input
                type="text"
                placeholder="e.g. 24x18 Ft, 15W-40, 20 Ton, 12mm..."
                value={formData.size}
                onChange={(e) => handleChange("size", e.target.value)}
                className="input-field text-[13.5px]"
              />
            </div>

            {selectedCategoryType === OTHER_CATEGORY_KEY && (
              <div>
                <label className="label">Brand / Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. Castrol, Bosch, Tata, Supreme..."
                  value={formData.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                  className="input-field text-[13.5px]"
                />
              </div>
            )}
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
              <div className="flex items-center justify-between mb-1">
                <label className="label m-0">Unit *</label>
                {selectedCategoryType && selectedCategoryType !== OTHER_CATEGORY_KEY && (
                  <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Auto-set
                  </span>
                )}
              </div>
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
              <label className="label">Purchase Rate (₹)</label>
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
              <label className="label">Rack / Storage Bin / Remarks</label>
              <input
                type="text"
                placeholder="e.g. Bin A-12, Upper Shelf, Tripal Rack"
                value={formData.remarks}
                onChange={(e) => handleChange("remarks", e.target.value)}
                className="input-field text-[13.5px]"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="p-3.5 bg-paper-raised border border-line rounded-xl flex items-center justify-between shadow-card">
          <div className="text-[12.5px] text-slate font-mono flex items-center gap-2">
            <span className="font-bold text-ink">
              {getInventoryLocationName(formData.location)}:
            </span>
            <span>
              {formData.itemName
                ? `${formData.itemName} (${formData.itemCode || "SKU"}) • ${formData.quantity} ${formData.unit}`
                : "New Product"}
            </span>
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
              <span>
                {loading ? "Saving..." : isEdit ? "Save Changes" : "Save Product"}
              </span>
            </button>
          </div>
        </div>
      </form>
    </FullScreenModal>
  );
};

export default InventoryModal;
