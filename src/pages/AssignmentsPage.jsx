import React, { useState, useEffect, useMemo } from "react";
import { assignmentService } from "../services/assignmentService.js";
import { useToast } from "../context/ToastContext.jsx";
import { SearchInput } from "../components/ui/SearchInput.jsx";
import { FilterChip } from "../components/ui/FilterChip.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.jsx";
import { AssignmentModal } from "../components/assignments/AssignmentModal.jsx";
import { fmtD } from "../utils/dates.js";
import {
  getInventoryLocationName,
  INVENTORY_LOCATIONS,
} from "../constants/inventoryLocations.js";
import {
  Plus,
  Truck,
  Package,
  Layers,
  MapPin,
  Calendar,
  RotateCcw,
  Edit3,
  Trash2,
  CheckCircle2,
  Table,
  LayoutGrid,
  ShieldAlert,
  ArrowDownCircle,
  Wrench,
  Sparkles,
} from "lucide-react";

export const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [vehicleGroups, setVehicleGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grouped'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [targetVehicleForAdd, setTargetVehicleForAdd] = useState(null);

  // Return dialog state
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnNotes, setReturnNotes] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);

  // Delete dialog state
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, groups] = await Promise.all([
        assignmentService.getAll({
          location: locationFilter === "all" ? null : locationFilter,
          status: statusFilter === "all" ? null : statusFilter,
        }),
        assignmentService.getByVehicle(
          locationFilter === "all" ? null : locationFilter
        ),
      ]);
      setAssignments(list || []);
      setVehicleGroups(groups || []);
    } catch (err) {
      toast.error("Failed to load vehicle assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [locationFilter, statusFilter]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (a.vehicleNo || "").toLowerCase().includes(q) ||
        (a.itemName || "").toLowerCase().includes(q) ||
        (a.itemCode || "").toLowerCase().includes(q) ||
        (a.category || "").toLowerCase().includes(q) ||
        (a.driverName || "").toLowerCase().includes(q) ||
        (a.purpose || "").toLowerCase().includes(q) ||
        (a.remarks || "").toLowerCase().includes(q)
      );
    });
  }, [assignments, searchQuery]);

  const filteredGroups = useMemo(() => {
    return vehicleGroups.filter((g) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (g.vehicleNo || "").toLowerCase().includes(q) ||
        g.items.some(
          (i) =>
            (i.itemName || "").toLowerCase().includes(q) ||
            (i.itemCode || "").toLowerCase().includes(q) ||
            (i.category || "").toLowerCase().includes(q)
        )
      );
    });
  }, [vehicleGroups, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const activeList = assignments.filter((a) => a.status === "ASSIGNED");
    const uniqueVehicles = new Set(activeList.map((a) => a.vehicleNo)).size;
    const totalItems = activeList.reduce(
      (sum, a) => sum + Number(a.quantity || 0),
      0
    );
    const tripals = activeList
      .filter((a) =>
        (a.category || "").toLowerCase().includes("tripal") ||
        (a.category || "").toLowerCase().includes("tarpaulin") ||
        (a.itemName || "").toLowerCase().includes("tripal")
      )
      .reduce((sum, a) => sum + Number(a.quantity || 0), 0);

    const toolsAndSafety = activeList
      .filter((a) =>
        (a.category || "").toLowerCase().includes("jack") ||
        (a.category || "").toLowerCase().includes("bolt") ||
        (a.category || "").toLowerCase().includes("rope") ||
        (a.category || "").toLowerCase().includes("safety")
      )
      .reduce((sum, a) => sum + Number(a.quantity || 0), 0);

    return { uniqueVehicles, totalItems, tripals, toolsAndSafety };
  }, [assignments]);

  const handleOpenAdd = (vehicleId = null) => {
    setSelectedAssignment(null);
    setTargetVehicleForAdd(vehicleId);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (assignment) => {
    setSelectedAssignment(assignment);
    setTargetVehicleForAdd(null);
    setIsModalOpen(true);
  };

  const handleSave = async (payload) => {
    if (selectedAssignment?._id) {
      await assignmentService.update(selectedAssignment._id, payload);
      toast.success("Assignment updated and inventory stock synced");
    } else {
      await assignmentService.create(payload);
      toast.success("Item assigned to vehicle & stock deducted from warehouse");
    }
    loadData();
  };

  const handleOpenReturn = (assignment) => {
    setReturnTarget(assignment);
    setReturnQty(assignment.quantity || 1);
    setReturnNotes("");
  };

  const handleConfirmReturn = async () => {
    if (!returnTarget) return;
    setReturnLoading(true);
    try {
      await assignmentService.returnItem(returnTarget._id, {
        returnedQuantity: Number(returnQty),
        remarks: returnNotes,
      });
      toast.success(
        `Returned ${returnQty} ${returnTarget.unit || "PCS"} to ${getInventoryLocationName(
          returnTarget.location
        )} warehouse stock`
      );
      setReturnTarget(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to return item");
    } finally {
      setReturnLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await assignmentService.delete(deleteTargetId);
      toast.success("Assignment removed and item stock refunded to warehouse");
      setDeleteTargetId(null);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete assignment");
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Quick Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="panel p-4 bg-paper-raised flex items-center justify-between shadow-card">
          <div>
            <div className="text-[11.5px] font-semibold text-slate uppercase tracking-wider">
              Equipped Trucks
            </div>
            <div className="text-2xl font-bold font-mono text-ink mt-0.5">
              {stats.uniqueVehicles}
            </div>
            <div className="text-[11px] text-slate-soft mt-0.5">
              Trucks carrying gear
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-amber-soft" />
          </div>
        </div>

        <div className="panel p-4 bg-paper-raised flex items-center justify-between shadow-card">
          <div>
            <div className="text-[11.5px] font-semibold text-slate uppercase tracking-wider">
              Active Items Assigned
            </div>
            <div className="text-2xl font-bold font-mono text-teal mt-0.5">
              {stats.totalItems}
            </div>
            <div className="text-[11px] text-slate-soft mt-0.5">
              Total units on fleet
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-soft/80 text-teal flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="panel p-4 bg-paper-raised flex items-center justify-between shadow-card">
          <div>
            <div className="text-[11.5px] font-semibold text-slate uppercase tracking-wider">
              Tripals On Fleet
            </div>
            <div className="text-2xl font-bold font-mono text-amber-dark mt-0.5">
              {stats.tripals}
            </div>
            <div className="text-[11px] text-slate-soft mt-0.5">
              Waterproof tarpaulins
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-soft/80 text-amber flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="panel p-4 bg-paper-raised flex items-center justify-between shadow-card">
          <div>
            <div className="text-[11.5px] font-semibold text-slate uppercase tracking-wider">
              Tools & Safety Gear
            </div>
            <div className="text-2xl font-bold font-mono text-sky-700 dark:text-sky-400 mt-0.5">
              {stats.toolsAndSafety}
            </div>
            <div className="text-[11px] text-slate-soft mt-0.5">
              Jacks, bolts, ropes
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Toolbar & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search vehicle no, tripal, jack, rope, driver..."
            className="w-full sm:w-auto"
          />

          {/* Location Filter */}
          <div className="flex items-center gap-1.5">
            <FilterChip
              active={locationFilter === "all"}
              onClick={() => setLocationFilter("all")}
            >
              All Depots
            </FilterChip>
            <FilterChip
              active={locationFilter === INVENTORY_LOCATIONS.LOCATION_A}
              onClick={() => setLocationFilter(INVENTORY_LOCATIONS.LOCATION_A)}
            >
              <MapPin className="w-3 h-3 text-amber" />
              <span>Vidisha</span>
            </FilterChip>
            <FilterChip
              active={locationFilter === INVENTORY_LOCATIONS.LOCATION_B}
              onClick={() => setLocationFilter(INVENTORY_LOCATIONS.LOCATION_B)}
            >
              <MapPin className="w-3 h-3 text-teal" />
              <span>Manawar</span>
            </FilterChip>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
            <FilterChip
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            >
              All Status
            </FilterChip>
            <FilterChip
              active={statusFilter === "ASSIGNED"}
              onClick={() => setStatusFilter("ASSIGNED")}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Active</span>
            </FilterChip>
            <FilterChip
              active={statusFilter === "RETURNED"}
              onClick={() => setStatusFilter("RETURNED")}
            >
              <span>Returned</span>
            </FilterChip>
          </div>
        </div>

        {/* Right side: View Mode Toggle & Add Button */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
          <div className="flex items-center p-1 rounded-lg bg-paper-subtle border border-line">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Table view"
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "table"
                  ? "bg-paper-raised text-ink shadow-sm"
                  : "text-slate hover:text-ink"
              }`}
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grouped")}
              title="Group by Vehicle"
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "grouped"
                  ? "bg-paper-raised text-ink shadow-sm"
                  : "text-slate hover:text-ink"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="btn btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Assign to Vehicle</span>
          </button>
        </div>
      </div>

      {/* 3. Main View: Table Mode or Grouped by Vehicle */}
      {viewMode === "table" ? (
        <div className="panel overflow-hidden">
          {loading && assignments.length === 0 ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-8 bg-paper-subtle rounded-md" />
              <div className="h-8 bg-paper-subtle rounded-md" />
              <div className="h-8 bg-paper-subtle rounded-md" />
              <div className="h-8 bg-paper-subtle rounded-md" />
            </div>
          ) : filteredAssignments.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No vehicle assignments found"
              description="Issue tripals, toolkits, jacks, or spares to commercial trucks with live stock synchronization."
              action={
                <button
                  onClick={() => handleOpenAdd()}
                  className="btn btn-sm btn-primary"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign First Item</span>
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Vehicle Number</th>
                    <th>Assigned Product</th>
                    <th>Qty & Unit</th>
                    <th>Depot Location</th>
                    <th>Assignment Date</th>
                    <th>Driver In Charge</th>
                    <th>Purpose / Notes</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((a) => (
                    <tr key={a._id}>
                      {/* Vehicle */}
                      <td>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-slate shrink-0" />
                          <div>
                            <div className="font-mono font-bold text-ink text-[13.5px]">
                              {a.vehicleNo}
                            </div>
                            <span className="text-[11px] text-slate">
                              {a.vehicle?.type || "Commercial Truck"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td>
                        <div className="font-semibold text-ink">
                          {a.itemName}
                        </div>
                        <div className="text-[11.5px] text-slate font-mono flex items-center gap-1.5">
                          <span>{a.itemCode}</span>
                          {a.category && <span>• {a.category}</span>}
                          {a.size && <span>• {a.size}</span>}
                        </div>
                      </td>

                      {/* Quantity & Unit */}
                      <td>
                        <div className="font-mono font-bold text-[14px] text-ink">
                          {a.quantity}{" "}
                          <span className="text-[11.5px] font-normal text-slate">
                            {a.unit || "PCS"}
                          </span>
                        </div>
                        {a.returnedQuantity > 0 && (
                          <span className="text-[10.5px] text-slate block">
                            (Returned: {a.returnedQuantity})
                          </span>
                        )}
                      </td>

                      {/* Warehouse Location */}
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[11.5px] font-bold px-2 py-0.5 rounded border ${
                            a.location === "LOCATION_A"
                              ? "bg-amber-soft/40 text-amber-dark border-amber/30"
                              : "bg-teal-soft/40 text-teal-dark border-teal/30"
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{getInventoryLocationName(a.location)}</span>
                        </span>
                      </td>

                      {/* Assigned Date */}
                      <td>
                        <div className="font-mono text-[12.5px] text-ink">
                          {fmtD(a.assignedDate)}
                        </div>
                      </td>

                      {/* Driver */}
                      <td>
                        {a.driverName ? (
                          <div className="text-[12.5px] font-medium text-ink">
                            {a.driverName}
                          </div>
                        ) : (
                          <span className="text-slate text-[12px]">—</span>
                        )}
                      </td>

                      {/* Purpose & Notes */}
                      <td>
                        <div className="text-[12.5px] font-medium text-ink">
                          {a.purpose || "Trip Equipment"}
                        </div>
                        {a.remarks && (
                          <div className="text-[11px] text-slate truncate max-w-xs">
                            {a.remarks}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <Badge variant={a.status === "ASSIGNED" ? "ok" : "default"}>
                          {a.status === "ASSIGNED" ? "Active on Truck" : "Returned"}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {a.status === "ASSIGNED" && (
                            <button
                              type="button"
                              onClick={() => handleOpenReturn(a)}
                              className="btn btn-sm btn-teal"
                              title="Return to warehouse"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline">Return</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(a)}
                            className="btn btn-sm"
                            title="Edit assignment"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Grouped View By Vehicle */
        <div>
          {loading && vehicleGroups.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              <div className="h-48 bg-paper-subtle rounded-xl border border-line" />
              <div className="h-48 bg-paper-subtle rounded-xl border border-line" />
              <div className="h-48 bg-paper-subtle rounded-xl border border-line" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="panel p-10 text-center">
              <EmptyState
                icon={Truck}
                title="No active equipment assignments"
                description="No vehicles currently have assigned equipment matching the filter."
                action={
                  <button
                    onClick={() => handleOpenAdd()}
                    className="btn btn-sm btn-primary"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Equipment</span>
                  </button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map((g) => (
                <div
                  key={g.vehicleNo}
                  className="panel p-4 bg-paper-raised flex flex-col justify-between shadow-card hover:border-slate/40 transition-all"
                >
                  <div>
                    {/* Vehicle Header */}
                    <div className="flex items-start justify-between pb-3 border-b border-line mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-amber" />
                          <span className="font-mono font-bold text-base text-ink">
                            {g.vehicleNo}
                          </span>
                        </div>
                        <span className="text-[11.5px] text-slate mt-0.5 block">
                          {g.vehicle?.type || "Truck"} • {g.vehicle?.capacity || "Fleet"}
                        </span>
                      </div>
                      <Badge variant="ok">
                        {g.items.length} {g.items.length === 1 ? "Item" : "Items"}
                      </Badge>
                    </div>

                    {/* Assigned Items List */}
                    <div className="space-y-2">
                      {g.items.map((item) => (
                        <div
                          key={item._id}
                          className="p-2.5 rounded-lg bg-paper-subtle border border-line/70 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-ink flex items-center gap-1.5">
                              <span>{item.itemName}</span>
                              <span className="font-mono text-[10.5px] text-slate">
                                ({item.itemCode})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate mt-0.5 flex items-center gap-2">
                              <span>{getInventoryLocationName(item.location)}</span>
                              <span>•</span>
                              <span>{fmtD(item.assignedDate)}</span>
                              {item.driverName && (
                                <>
                                  <span>•</span>
                                  <span>{item.driverName}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-[13px] text-ink block">
                              {item.quantity} {item.unit || "PCS"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenReturn(item)}
                              className="text-[10.5px] text-teal hover:underline font-medium mt-0.5 block"
                            >
                              Return
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add More button */}
                  <div className="pt-3 mt-3 border-t border-line/60">
                    <button
                      type="button"
                      onClick={() => handleOpenAdd(g.vehicle?._id)}
                      className="btn btn-sm w-full justify-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Issue More Equipment</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Assignment Add / Edit Modal */}
      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignment={selectedAssignment}
        onSave={handleSave}
        onDelete={() => setDeleteTargetId(selectedAssignment?._id)}
        defaultLocation={
          locationFilter === "all" ? "LOCATION_A" : locationFilter
        }
        defaultVehicleId={targetVehicleForAdd}
      />

      {/* 5. Return Item Dialog */}
      {returnTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-paper-raised border border-line rounded-xl max-w-md w-full p-5 shadow-modal space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-line">
              <div className="p-2.5 rounded-lg bg-teal-soft/80 text-teal">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink m-0">
                  Return Equipment to Warehouse
                </h3>
                <p className="text-[12px] text-slate mt-0.5">
                  Restores stock back into {getInventoryLocationName(returnTarget.location)} inventory
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-paper-subtle border border-line text-xs space-y-1">
              <div>
                <span className="text-slate">Vehicle:</span>{" "}
                <span className="font-bold text-ink">{returnTarget.vehicleNo}</span>
              </div>
              <div>
                <span className="text-slate">Product:</span>{" "}
                <span className="font-semibold text-ink">
                  {returnTarget.itemName} ({returnTarget.itemCode})
                </span>
              </div>
              <div>
                <span className="text-slate">Currently Assigned:</span>{" "}
                <span className="font-mono font-bold text-ink">
                  {returnTarget.quantity} {returnTarget.unit || "PCS"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Quantity to Return *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.01"
                    max={returnTarget.quantity}
                    step="any"
                    value={returnQty}
                    onChange={(e) => setReturnQty(e.target.value)}
                    className="input-field font-mono font-bold text-[14px]"
                  />
                  <span className="font-mono text-slate text-[13px] font-semibold">
                    {returnTarget.unit || "PCS"}
                  </span>
                </div>
              </div>

              <div>
                <label className="label">Condition / Return Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Returned after trip, intact condition"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="input-field text-[13px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReturnTarget(null)}
                disabled={returnLoading}
                className="btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                disabled={returnLoading}
                className="btn btn-teal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {returnLoading ? "Processing..." : "Confirm Return & Refund Stock"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Equipment Assignment"
        message="Deleting this assignment will automatically refund and restore the item quantity back to the warehouse inventory."
        confirmText="Delete & Refund Stock"
        confirmVariant="danger"
      />
    </div>
  );
};

export default AssignmentsPage;
