import React, { useState, useEffect } from "react";
import { vehicleService } from "../services/vehicleService.js";
import { driverService } from "../services/driverService.js";
import { inventoryService } from "../services/inventoryService.js";
import { useToast } from "../context/ToastContext.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { fmtDT } from "../utils/dates.js";
import { Trash2, RotateCcw, Truck, Users, Package } from "lucide-react";

export const RecycleBinPage = () => {
  const [activeTab, setActiveTab] = useState("vehicles");
  const [deletedVehicles, setDeletedVehicles] = useState([]);
  const [deletedDrivers, setDeletedDrivers] = useState([]);
  const [deletedInventory, setDeletedInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [v, d, i] = await Promise.all([
        vehicleService.getDeleted(),
        driverService.getDeleted(),
        inventoryService.getDeleted(),
      ]);
      setDeletedVehicles(v || []);
      setDeletedDrivers(d || []);
      setDeletedInventory(i || []);
    } catch (err) {
      toast.error("Failed to fetch deleted records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleRestoreVehicle = async (id, vehicleNo) => {
    try {
      await vehicleService.restore(id);
      setDeletedVehicles((prev) => prev.filter((v) => v._id !== id));
      toast.success(`Vehicle ${vehicleNo} restored to active fleet`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore vehicle");
    }
  };

  const handleRestoreDriver = async (id, name) => {
    try {
      await driverService.restore(id);
      setDeletedDrivers((prev) => prev.filter((d) => d._id !== id));
      toast.success(`Driver ${name} restored to active roster`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore driver");
    }
  };

  const handleRestoreInventory = async (id, itemCode) => {
    try {
      await inventoryService.restore(id);
      setDeletedInventory((prev) => prev.filter((i) => i._id !== id));
      toast.success(`Item ${itemCode} restored to inventory`);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to restore inventory item"
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex border-b border-line gap-2">
        <button
          onClick={() => setActiveTab("vehicles")}
          className={`flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "vehicles"
              ? "border-ink text-ink font-bold"
              : "border-transparent text-slate hover:text-ink"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Vehicles ({deletedVehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("drivers")}
          className={`flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "drivers"
              ? "border-ink text-ink font-bold"
              : "border-transparent text-slate hover:text-ink"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Drivers ({deletedDrivers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "inventory"
              ? "border-ink text-ink font-bold"
              : "border-transparent text-slate hover:text-ink"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Inventory ({deletedInventory.length})</span>
        </button>
      </div>

      {/* Main Content Table Panel */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate font-mono text-[13px]">
            Loading deleted items...
          </div>
        ) : activeTab === "vehicles" ? (
          deletedVehicles.length === 0 ? (
            <EmptyState
              icon={Trash2}
              title="Vehicle bin is empty"
              description="No soft-deleted vehicles on file."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Vehicle No</th>
                    <th>Type</th>
                    <th>Deleted By</th>
                    <th>Deleted At</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedVehicles.map((v) => (
                    <tr key={v._id}>
                      <td className="font-mono font-bold text-ink">
                        {v.vehicleNo}
                      </td>
                      <td>{v.type || "—"}</td>
                      <td>
                        <span className="text-slate">
                          {v.deletedBy?.name || "Admin"}
                        </span>
                      </td>
                      <td className="font-mono text-[12px] text-slate">
                        {fmtDT(v.deletedAt)}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleRestoreVehicle(v._id, v.vehicleNo)
                          }
                          className="btn btn-sm btn-teal"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === "drivers" ? (
          deletedDrivers.length === 0 ? (
            <EmptyState
              icon={Trash2}
              title="Driver bin is empty"
              description="No soft-deleted drivers on file."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Driver Name</th>
                    <th>Mobile</th>
                    <th>Deleted By</th>
                    <th>Deleted At</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedDrivers.map((d) => (
                    <tr key={d._id}>
                      <td className="font-bold text-ink">{d.name}</td>
                      <td className="font-mono">{d.mobile || "—"}</td>
                      <td>
                        <span className="text-slate">
                          {d.deletedBy?.name || "Admin"}
                        </span>
                      </td>
                      <td className="font-mono text-[12px] text-slate">
                        {fmtDT(d.deletedAt)}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => handleRestoreDriver(d._id, d.name)}
                          className="btn btn-sm btn-teal"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          deletedInventory.length === 0 ? (
            <EmptyState
              icon={Trash2}
              title="Inventory bin is empty"
              description="No soft-deleted inventory items on file."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Item Name</th>
                    <th>Location</th>
                    <th>Deleted By</th>
                    <th>Deleted At</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedInventory.map((i) => (
                    <tr key={i._id}>
                      <td className="font-mono font-bold text-ink">
                        {i.itemCode}
                      </td>
                      <td>{i.itemName}</td>
                      <td>
                        <span className="font-mono text-[12px]">
                          {i.location}
                        </span>
                      </td>
                      <td>
                        <span className="text-slate">
                          {i.deletedBy?.name || "Admin"}
                        </span>
                      </td>
                      <td className="font-mono text-[12px] text-slate">
                        {fmtDT(i.deletedAt)}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleRestoreInventory(i._id, i.itemCode)
                          }
                          className="btn btn-sm btn-teal"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default RecycleBinPage;
