import React, { useState, useEffect, useMemo } from "react";
import { inventoryService } from "../services/inventoryService.js";
import { useToast } from "../context/ToastContext.jsx";
import { SearchInput } from "../components/ui/SearchInput.jsx";
import { FilterChip } from "../components/ui/FilterChip.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.jsx";
import { InventoryModal } from "../components/inventory/InventoryModal.jsx";
import { formatCurrency } from "../utils/formatters.js";
import { Plus, Package, Edit3, MapPin } from "lucide-react";
import {
  getInventoryLocationName,
  INVENTORY_LOCATIONS,
} from "../constants/inventoryLocations.js";

export const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const toast = useToast();

  const loadData = async (loc = null) => {
    try {
      const data = await inventoryService.getAll(
        loc === "all" ? null : loc
      );
      setItems(data || []);
    } catch (err) {
      toast.error("Failed to load inventory records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(locationFilter);
  }, [locationFilter]);

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (i.itemCode || "").toLowerCase().includes(q) ||
        (i.itemName || "").toLowerCase().includes(q) ||
        (i.category || "").toLowerCase().includes(q) ||
        (i.brand || "").toLowerCase().includes(q) ||
        (i.size || "").toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery]);

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    if (selectedItem?._id) {
      const updated = await inventoryService.update(
        selectedItem._id,
        formData
      );
      setItems((prev) =>
        prev.map((i) => (i._id === updated._id ? updated : i))
      );
      toast.success(`Product ${updated.itemName || updated.itemCode} updated`);
    } else {
      const created = await inventoryService.create(formData);
      setItems((prev) => [created, ...prev]);
      toast.success(
        `Product ${created.itemName || created.itemCode} added to ${getInventoryLocationName(created.location)} inventory`
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await inventoryService.delete(deleteTargetId);
      setItems((prev) => prev.filter((i) => i._id !== deleteTargetId));
      toast.success("Product moved to Recycle Bin");
      setDeleteTargetId(null);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete item");
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search product code, name, category, brand..."
            className="w-full sm:w-auto"
          />
          <div className="flex items-center gap-1.5">
            <FilterChip
              active={locationFilter === "all"}
              onClick={() => setLocationFilter("all")}
            >
              All Locations
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
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="btn btn-primary shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Inventory Table Panel */}
      <div className="panel overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-8 bg-paper-subtle rounded-md" />
            <div className="h-8 bg-paper-subtle rounded-md" />
            <div className="h-8 bg-paper-subtle rounded-md" />
            <div className="h-8 bg-paper-subtle rounded-md" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No inventory products found"
            description="No products match your search query or location filter."
            action={
              <button onClick={handleOpenAdd} className="btn btn-sm btn-primary">
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Product</span>
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Category / Brand</th>
                  <th>Location</th>
                  <th>Quantity & Unit</th>
                  <th>Purchase Rate</th>
                  <th>Stock Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLow =
                    Number(item.quantity) <= Number(item.minimumStock || 0);

                  return (
                    <tr key={item._id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="font-mono font-bold text-ink hover:underline text-left block"
                        >
                          {item.itemCode}
                        </button>
                        {item.size && (
                          <span className="text-[11px] text-slate font-sans">
                            Spec: {item.size}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold text-ink">
                          {item.itemName}
                        </div>
                        {item.remarks && (
                          <div className="text-[11.5px] text-slate truncate max-w-xs">
                            {item.remarks}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="font-medium">{item.category || "—"}</div>
                        {item.brand && (
                          <div className="text-[11.5px] text-slate">
                            {item.brand}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[11.5px] font-bold px-2 py-0.5 rounded border ${
                            item.location === "LOCATION_A"
                              ? "bg-amber-soft/40 text-amber-dark border-amber/30"
                              : "bg-teal-soft/40 text-teal-dark border-teal/30"
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{getInventoryLocationName(item.location)}</span>
                        </span>
                      </td>
                      <td>
                        <div className="font-mono font-bold text-[13.5px]">
                          {item.quantity}{" "}
                          <span className="text-[11.5px] font-normal text-slate">
                            {item.unit || "PCS"}
                          </span>
                        </div>
                        {item.minimumStock > 0 && (
                          <div className="text-[11px] text-slate">
                            Min: {item.minimumStock}
                          </div>
                        )}
                      </td>
                      <td className="font-mono text-[12.5px]">
                        {formatCurrency(item.purchaseRate)}
                      </td>
                      <td>
                        <Badge variant={isLow ? "bad" : "ok"}>
                          {isLow ? "Low Stock" : "Healthy"}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
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

      {/* Inventory Modal */}
      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        onSave={handleSave}
        onDelete={() => setDeleteTargetId(selectedItem?._id)}
        defaultLocation={
          locationFilter === "all" ? "LOCATION_A" : locationFilter
        }
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Move Product to Recycle Bin"
        message="This inventory product will be soft-deleted and moved to the Recycle Bin. You can restore it at any time."
        confirmText="Move to Recycle Bin"
        confirmVariant="danger"
      />
    </div>
  );
};

export default InventoryPage;
