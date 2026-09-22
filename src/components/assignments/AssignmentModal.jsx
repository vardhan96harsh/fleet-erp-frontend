import React, { useState, useEffect, useMemo } from "react";
import FullScreenModal from "../ui/FullScreenModal.jsx";
import Badge from "../ui/Badge.jsx";
import { vehicleService } from "../../services/vehicleService.js";
import { driverService } from "../../services/driverService.js";
import { inventoryService } from "../../services/inventoryService.js";
import { assignmentService } from "../../services/assignmentService.js";
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
  Search,
  CheckCircle2,
  Plus,
  Minus,
  Wrench,
  ShieldCheck,
  Sparkles,
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

const CATEGORY_TABS = [
  { id: "all", label: "All Items" },
  { id: "tripal", label: "Tripals & Tarpaulins", keywords: ["tripal", "tarpaulin", "tirpal", "cover"] },
  { id: "jack", label: "Jacks & Tools", keywords: ["jack", "tool", "wrench", "spanner", "lever", "hydraulic"] },
  { id: "rope", label: "Cargo Ropes", keywords: ["rope", "lash", "belt", "strap", "tie"] },
  { id: "bolt", label: "Bolts & Fasteners", keywords: ["bolt", "nut", "screw", "fastener", "washer", "pin"] },
  { id: "safety", label: "Safety Gear", keywords: ["safety", "jacket", "vest", "helmet", "cone", "extinguisher", "first aid"] },
  { id: "spares", label: "Spares & Fluids", keywords: ["spare", "oil", "filter", "coolant", "lubricant", "grease", "part", "def", "urea", "adblue"] },
];

export const AssignmentModal = ({
  isOpen,
  onClose,
  assignment,
  onSave,
  onDelete,
  defaultLocation = "all",
  defaultVehicleId = null,
}) => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Form State
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

  // Product Browser UI State
  const [productSearch, setProductSearch] = useState("");
  const [productDepotFilter, setProductDepotFilter] = useState("all"); // 'all' | 'LOCATION_A' | 'LOCATION_B'
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("all");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!assignment?._id;

  // Load supporting fleet data
  useEffect(() => {
    if (!isOpen) return;

    const loadLookups = async () => {
      setDataLoading(true);
      try {
        const [vList, dList, iList, aList] = await Promise.all([
          vehicleService.getAll(),
          driverService.getAll(),
          inventoryService.getAll(),
          assignmentService.getAll({ status: "ASSIGNED" }),
        ]);
        setVehicles(vList || []);
        setDrivers(dList || []);
        setInventoryItems(iList || []);
        setActiveAssignments(aList || []);
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
        location: assignment.location || "LOCATION_A",
        assignedDate: assignment.assignedDate
          ? new Date(assignment.assignedDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        driverId: assignment.driver?._id || assignment.driver || "",
        purpose: assignment.purpose || "Trip Tarpaulin / Waterproof Tripal",
        remarks: assignment.remarks || "",
      });
      setProductDepotFilter(assignment.location || "all");
    } else {
      setFormData({
        vehicleId: defaultVehicleId || "",
        inventoryItemId: "",
        quantity: 1,
        location: defaultLocation === "all" ? "LOCATION_A" : defaultLocation,
        assignedDate: new Date().toISOString().slice(0, 10),
        driverId: "",
        purpose: "Trip Tarpaulin / Waterproof Tripal",
        remarks: "",
      });
      setProductDepotFilter(defaultLocation || "all");
      setProductSearch("");
      setSelectedCategoryTab("all");
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

  // Selected vehicle object & its currently assigned equipment
  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v._id === formData.vehicleId);
  }, [vehicles, formData.vehicleId]);

  const vehicleEquippedItems = useMemo(() => {
    if (!formData.vehicleId) return [];
    return activeAssignments.filter(
      (a) =>
        (a.vehicle?._id === formData.vehicleId ||
          a.vehicle === formData.vehicleId ||
          a.vehicleNo === selectedVehicle?.vehicleNo) &&
        a._id !== assignment?._id
    );
  }, [activeAssignments, formData.vehicleId, selectedVehicle, assignment]);

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

  // Filtered in-stock inventory items for browser
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    const activeTab = CATEGORY_TABS.find((t) => t.id === selectedCategoryTab);

    return inventoryItems.filter((item) => {
      // 1. Depot filter
      if (productDepotFilter !== "all" && item.location !== productDepotFilter) {
        return false;
      }

      // 2. Category tab filter
      if (activeTab && activeTab.keywords) {
        const itemText = `${item.itemName || ""} ${item.category || ""} ${item.brand || ""} ${item.size || ""}`.toLowerCase();
        const matchesCategory = activeTab.keywords.some((kw) =>
          itemText.includes(kw)
        );
        if (!matchesCategory) return false;
      }

      // 3. Search query filter
      if (q) {
        const combined = `${item.itemName || ""} ${item.itemCode || ""} ${item.category || ""} ${item.brand || ""} ${item.size || ""}`.toLowerCase();
        if (!combined.includes(q)) return false;
      }

      return true;
    });
  }, [inventoryItems, productSearch, productDepotFilter, selectedCategoryTab]);

  // Counts for depot tabs
  const depotCounts = useMemo(() => {
    const vidishaCount = inventoryItems.filter(
      (i) => i.location === "LOCATION_A" && Number(i.quantity) > 0
    ).length;
    const manawarCount = inventoryItems.filter(
      (i) => i.location === "LOCATION_B" && Number(i.quantity) > 0
    ).length;
    const totalCount = inventoryItems.filter(
      (i) => Number(i.quantity) > 0
    ).length;
    return { vidishaCount, manawarCount, totalCount };
  }, [inventoryItems]);

  const handleSelectProduct = (item) => {
    setFormData((prev) => {
      const isDifferent = prev.inventoryItemId !== item._id;
      return {
        ...prev,
        inventoryItemId: item._id,
        location: item.location,
        quantity: isDifferent ? 1 : prev.quantity,
        // Auto-select purpose preset based on item name/category if default
        purpose:
          item.category?.toLowerCase().includes("tripal") ||
          item.itemName?.toLowerCase().includes("tripal")
            ? "Trip Tarpaulin / Waterproof Tripal"
            : item.category?.toLowerCase().includes("jack") ||
              item.itemName?.toLowerCase().includes("jack")
            ? "Hydraulic Jack & Wheel Tools"
            : item.category?.toLowerCase().includes("rope") ||
              item.itemName?.toLowerCase().includes("rope")
            ? "Cargo Lashing Rope"
            : item.category?.toLowerCase().includes("bolt") ||
              item.itemName?.toLowerCase().includes("bolt")
            ? "Wheel Bolts & Fasteners"
            : item.category?.toLowerCase().includes("def") ||
              item.category?.toLowerCase().includes("urea") ||
              item.itemName?.toLowerCase().includes("def") ||
              item.itemName?.toLowerCase().includes("urea")
            ? "Engine Oil & Consumables"
            : prev.purpose,
      };
    });
  };

  const handleQuantityStep = (delta) => {
    setFormData((prev) => {
      const current = Number(prev.quantity) || 1;
      const next = Math.max(1, Math.min(availableStock || 999999, current + delta));
      return { ...prev, quantity: next };
    });
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.vehicleId) {
      setError("Please select a target Vehicle to assign equipment to");
      return;
    }
    if (!formData.inventoryItemId) {
      setError("Please select an in-stock Inventory Product from the list below");
      return;
    }
    if (Number(formData.quantity) <= 0) {
      setError("Quantity must be at least 1");
      return;
    }
    if (Number(formData.quantity) > availableStock) {
      setError(
        `Requested quantity (${formData.quantity}) exceeds available stock (${availableStock} ${
          selectedProduct?.unit || "PCS"
        }) in ${getInventoryLocationName(formData.location)} warehouse`
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
        disabled={loading || dataLoading || !formData.vehicleId || !formData.inventoryItemId}
        className="btn btn-primary"
      >
        <Save className="w-4 h-4" />
        <span>
          {loading
            ? "Processing..."
            : isEdit
            ? "Save Changes"
            : "Assign to Vehicle"}
        </span>
      </button>
    </div>
  );

  const menuItems = [
    {
      id: "assignment",
      label: "Vehicle Assignment",
      badge: selectedProduct
        ? `${formData.quantity || 1} ${selectedProduct.unit || "PCS"}`
        : "Select Product",
      badgeVariant: selectedProduct ? "ok" : "neutral",
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
      subtitle="Select a fleet vehicle, browse in-stock equipment, and assign with automatic warehouse inventory deduction"
      breadcrumbs="Assignments"
      badge={
        selectedProduct ? (
          <Badge variant="ok" className="inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{selectedProduct.itemName}</span>
          </Badge>
        ) : (
          <Badge variant="neutral">New Assignment</Badge>
        )
      }
      menuItems={menuItems}
      activeSection="assignment"
      onSectionChange={() => {}}
      actions={headerActions}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rust-soft/60 border border-rust/30 text-rust text-[13px] flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Target Vehicle Selection */}
        <div className="panel p-4 bg-paper-raised border border-line rounded-xl shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-soft/80 text-amber flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="text-[13.5px] font-bold text-ink uppercase tracking-wider m-0 flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate" />
                <span>Select Target Vehicle</span>
              </h3>
            </div>
            {selectedVehicle && (
              <span className="text-[11.5px] font-mono font-semibold text-slate">
                {selectedVehicle.type || "Truck"} • Capacity: {selectedVehicle.capacity || "N/A"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="label text-[12.5px] font-bold text-ink mb-1 flex items-center gap-1">
                <span>Vehicle (Registration No)</span>
                <span className="text-rust">*</span>
              </label>
              <select
                required
                value={formData.vehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="input-field font-mono font-bold text-[14px]"
              >
                <option value="">— Select Fleet Vehicle —</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.vehicleNo} {v.type ? `(${v.type})` : ""} {v.capacity ? `• ${v.capacity}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Currently Equipped Equipment Preview */}
            <div className="p-2.5 rounded-lg bg-paper-subtle border border-line/70 flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-slate uppercase tracking-wider mb-1 block">
                Equipment Already on this Vehicle:
              </span>
              {formData.vehicleId ? (
                vehicleEquippedItems.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                    {vehicleEquippedItems.map((item) => (
                      <span
                        key={item._id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-paper-raised border border-line text-ink"
                      >
                        <Package className="w-3 h-3 text-amber" />
                        <span>
                          {item.quantity}x {item.itemName}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[12px] text-slate-soft italic">
                    No active equipment currently assigned to this vehicle.
                  </span>
                )
              ) : (
                <span className="text-[12px] text-slate-soft italic">
                  Choose a vehicle above to check currently equipped gear.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: In-Stock Product Browser */}
        <div className="panel p-4 bg-paper-raised border border-line rounded-xl shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line mb-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-teal-soft/80 text-teal flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="text-[13.5px] font-bold text-ink uppercase tracking-wider m-0 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate" />
                <span>Choose Equipment from In-Stock Inventory</span>
              </h3>
            </div>

            {/* Depot Selector Tabs */}
            <div className="flex items-center gap-1 bg-paper-subtle p-1 rounded-lg border border-line text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setProductDepotFilter("all")}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  productDepotFilter === "all"
                    ? "bg-paper-raised text-ink shadow-sm font-bold"
                    : "text-slate hover:text-ink"
                }`}
              >
                All Depots ({depotCounts.totalCount})
              </button>
              <button
                type="button"
                onClick={() => setProductDepotFilter("LOCATION_A")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
                  productDepotFilter === "LOCATION_A"
                    ? "bg-amber-soft text-amber-dark shadow-sm font-bold"
                    : "text-slate hover:text-ink"
                }`}
              >
                <MapPin className="w-3 h-3 text-amber" />
                <span>Vidisha ({depotCounts.vidishaCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setProductDepotFilter("LOCATION_B")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
                  productDepotFilter === "LOCATION_B"
                    ? "bg-teal-soft text-teal-dark shadow-sm font-bold"
                    : "text-slate hover:text-ink"
                }`}
              >
                <MapPin className="w-3 h-3 text-teal" />
                <span>Manawar ({depotCounts.manawarCount})</span>
              </button>
            </div>
          </div>

          {/* Search Bar & Category Filter Pills */}
          <div className="space-y-2.5 mb-3.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by product name, item code, brand, or size (e.g. Tripal, 20T Jack, Lashing Rope, Bolt)..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="input-field pl-9 text-[13px] w-full"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate hover:text-ink"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Quick Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategoryTab(tab.id)}
                  className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all border ${
                    selectedCategoryTab === tab.id
                      ? "bg-ink text-white border-ink font-bold shadow-sm"
                      : "bg-paper-subtle text-slate hover:text-ink border-line hover:bg-paper-raised"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* In-Stock Product Grid */}
          <div className="max-h-64 overflow-y-auto pr-1">
            {dataLoading ? (
              <div className="p-6 text-center text-xs text-slate animate-pulse">
                Loading available inventory items...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 rounded-lg bg-paper-subtle border border-dashed border-line text-center">
                <Package className="w-8 h-8 text-slate mx-auto mb-2 opacity-50" />
                <div className="text-sm font-semibold text-ink">
                  No matching in-stock items found
                </div>
                <p className="text-xs text-slate mt-0.5">
                  Try adjusting the search query, category filter, or depot warehouse.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredProducts.map((item) => {
                  const isSelected = formData.inventoryItemId === item._id;
                  const stock = Number(item.quantity) || 0;
                  const isOutOfStock = stock <= 0 && !isSelected;

                  return (
                    <button
                      key={item._id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleSelectProduct(item)}
                      className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500 shadow-sm"
                          : isOutOfStock
                          ? "border-line/40 bg-paper-subtle/50 opacity-50 cursor-not-allowed"
                          : "border-line bg-paper-subtle hover:bg-paper-raised hover:border-slate/40"
                      }`}
                    >
                      <div>
                        {/* Top row: Item Name & Selection Icon */}
                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <span className="font-semibold text-ink text-[13px] leading-snug line-clamp-2">
                            {item.itemName}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                        </div>

                        {/* Middle: Code, Category, Size */}
                        <div className="text-[11px] text-slate font-mono space-x-1.5 mb-2">
                          <span className="font-bold text-ink">{item.itemCode}</span>
                          {item.brand && <span>• {item.brand}</span>}
                          {item.size && <span>• {item.size}</span>}
                        </div>
                      </div>

                      {/* Bottom Row: Location & Available Stock */}
                      <div className="flex items-center justify-between gap-1 pt-2 border-t border-line/50 text-[11.5px]">
                        {/* Location */}
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold px-1.5 py-0.5 rounded text-[10.5px] ${
                            item.location === "LOCATION_A"
                              ? "bg-amber-soft text-amber-dark"
                              : "bg-teal-soft text-teal-dark"
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{getInventoryLocationName(item.location)}</span>
                        </span>

                        {/* Stock Quantity */}
                        <span
                          className={`font-mono font-bold ${
                            stock > 5
                              ? "text-emerald-700 dark:text-emerald-400"
                              : stock > 0
                              ? "text-amber-dark font-bold"
                              : "text-rust"
                          }`}
                        >
                          {stock > 0 ? `${stock} ${item.unit || "PCS"}` : "Out of stock"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Quantity & Purpose Configuration */}
        {selectedProduct && (
          <div className="panel p-4 bg-paper-raised border border-line rounded-xl shadow-card animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h3 className="text-[13.5px] font-bold text-ink uppercase tracking-wider m-0 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate" />
                  <span>Quantity & Assignment Details</span>
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold text-slate">
                Available:{" "}
                <span className="font-bold text-ink">
                  {availableStock} {selectedProduct.unit || "PCS"}
                </span>{" "}
                in {getInventoryLocationName(formData.location)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Quantity Stepper */}
              <div>
                <label className="label text-[12.5px] font-bold text-ink mb-1 flex items-center justify-between">
                  <span>Quantity to Assign *</span>
                  <span className="text-[11px] font-mono text-slate">
                    Max: {availableStock} {selectedProduct.unit || "PCS"}
                  </span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuantityStep(-1)}
                    disabled={Number(formData.quantity) <= 1}
                    className="p-2.5 rounded-lg border border-line bg-paper-subtle hover:bg-paper-raised text-ink disabled:opacity-40"
                    title="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={availableStock}
                    step="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => handleChange("quantity", e.target.value)}
                    className="input-field font-mono text-center font-bold text-[15px] flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityStep(1)}
                    disabled={Number(formData.quantity) >= availableStock}
                    className="p-2.5 rounded-lg border border-line bg-paper-subtle hover:bg-paper-raised text-ink disabled:opacity-40"
                    title="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("quantity", availableStock)}
                    className="btn btn-sm px-2 text-[11px] font-mono font-bold"
                    title="Assign all available stock"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Assignment Date */}
              <div>
                <label className="label text-[12.5px] font-bold text-ink mb-1 flex items-center gap-1">
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

              {/* Driver In Charge */}
              <div>
                <label className="label text-[12.5px] font-bold text-ink mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate" />
                  <span>Driver In Charge (Optional)</span>
                </label>
                <select
                  value={formData.driverId || ""}
                  onChange={(e) => handleChange("driverId", e.target.value)}
                  className="input-field text-[13px]"
                >
                  <option value="">— Select Driver —</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} {d.mobile ? `(${d.mobile})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose Selection */}
              <div>
                <label className="label text-[12.5px] font-bold text-ink mb-1">
                  Purpose / Allocation Category
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
              <div className="md:col-span-2">
                <label className="label text-[12.5px] font-bold text-ink mb-1">
                  Condition Notes / Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Issued 2 brand new waterproof tripals for Mumbai monsoon trip, verified intact"
                  value={formData.remarks}
                  onChange={(e) => handleChange("remarks", e.target.value)}
                  className="input-field text-[13px]"
                />
              </div>
            </div>

            {/* Remaining Stock Calculation Info */}
            <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between text-xs">
              <span className="text-slate">
                Warehouse Stock after assignment:{" "}
                <strong className="text-ink font-mono">
                  {Math.max(0, availableStock - Number(formData.quantity || 0))}{" "}
                  {selectedProduct.unit || "PCS"}
                </strong>{" "}
                in {getInventoryLocationName(formData.location)}
              </span>
              <span className="font-mono text-slate text-[11px]">
                Item Code: {selectedProduct.itemCode}
              </span>
            </div>
          </div>
        )}

        {/* Bottom Save Action Bar */}
        <div className="p-3.5 bg-paper-raised border border-line rounded-xl flex items-center justify-between shadow-card">
          <div className="text-[12.5px] text-slate">
            {formData.vehicleId && formData.inventoryItemId && selectedProduct ? (
              <span className="text-ink font-semibold flex items-center gap-1.5 flex-wrap">
                <span>Assigning</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {formData.quantity} {selectedProduct.unit || "PCS"}
                </span>
                <span>of</span>
                <span className="font-bold text-ink">{selectedProduct.itemName}</span>
                <span>to</span>
                <span className="font-mono font-bold text-amber-dark">
                  {selectedVehicle?.vehicleNo || "Vehicle"}
                </span>
              </span>
            ) : (
              "Please select both a Vehicle and an Inventory Product"
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
              disabled={loading || dataLoading || !formData.vehicleId || !formData.inventoryItemId}
              className="btn btn-primary px-4 py-1.5 text-[13px]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {loading
                  ? "Processing..."
                  : isEdit
                  ? "Save Changes"
                  : "Assign to Vehicle"}
              </span>
            </button>
          </div>
        </div>
      </form>
    </FullScreenModal>
  );
};

export default AssignmentModal;
