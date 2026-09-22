import React, { useState } from "react";
import { importExportService } from "../services/importExportService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { ImportPreviewModal } from "../components/importExport/ImportPreviewModal.jsx";
import {
  Download,
  Upload,
  Shield,
  FileSpreadsheet,
  Package,
  Truck,
  Users,
  Database,
  ArrowRight,
} from "lucide-react";

export const ImportExportPage = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [previewData, setPreviewData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDownloadTemplate = async (type, location) => {
    try {
      if (type === "VEHICLE") {
        await importExportService.downloadVehicleTemplate();
      } else if (type === "DRIVER") {
        await importExportService.downloadDriverTemplate();
      } else if (type === "INVENTORY") {
        await importExportService.downloadInventoryTemplate(location);
      }
      toast.success(`${type} template downloaded`);
    } catch (err) {
      toast.error("Failed to download template");
    }
  };

  const handleFileUpload = async (e, type, location = "LOCATION_A") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      toast.error("The selected file is empty (0 bytes). Please upload a populated spreadsheet.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      let preview;
      if (type === "VEHICLE") {
        preview = await importExportService.previewVehicleImport(file);
      } else if (type === "DRIVER") {
        preview = await importExportService.previewDriverImport(file);
      } else if (type === "INVENTORY") {
        preview = await importExportService.previewInventoryImport(file, location);
      }

      setPreviewData(preview);
      setIsPreviewOpen(true);
    } catch (err) {
      const serverMsg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : null);
      toast.error(
        serverMsg || err.message || "Failed to process Excel spreadsheet"
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleConfirmImport = async (batchId) => {
    const result = await importExportService.confirmImport(batchId);
    toast.success(
      `Import successfully committed: ${result.data?.created || 0} records created`
    );
  };

  const handleExport = async (type, location) => {
    try {
      if (type === "VEHICLE") {
        await importExportService.exportVehicles();
      } else if (type === "DRIVER") {
        await importExportService.exportDrivers();
      } else if (type === "INVENTORY") {
        await importExportService.exportInventory(location);
      }
      toast.success(`Export downloaded`);
    } catch (err) {
      toast.error("Failed to export records");
    }
  };

  const handleFullBackup = async () => {
    try {
      await importExportService.downloadFullBackup();
      toast.success("Full system backup downloaded (.json)");
    } catch (err) {
      toast.error("Failed to generate system backup");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Download Templates Section */}
      <div className="panel p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-teal-soft/40 text-teal shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink m-0">
              Download Standard Excel Templates
            </h3>
            <p className="text-[12.5px] text-slate mt-0.5">
              Use these pre-formatted sheets to prepare bulk data with standard column validation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleDownloadTemplate("VEHICLE")}
            className="btn py-2.5 justify-start text-left"
          >
            <Truck className="w-4 h-4 text-slate shrink-0" />
            <div className="truncate">
              <div className="font-medium text-ink">Vehicles Template</div>
              <span className="text-[11px] text-slate font-mono">.xlsx</span>
            </div>
          </button>

          <button
            onClick={() => handleDownloadTemplate("DRIVER")}
            className="btn py-2.5 justify-start text-left"
          >
            <Users className="w-4 h-4 text-slate shrink-0" />
            <div className="truncate">
              <div className="font-medium text-ink">Drivers Template</div>
              <span className="text-[11px] text-slate font-mono">.xlsx</span>
            </div>
          </button>

          <button
            onClick={() => handleDownloadTemplate("INVENTORY", "LOCATION_A")}
            className="btn py-2.5 justify-start text-left"
          >
            <Package className="w-4 h-4 text-amber shrink-0" />
            <div className="truncate">
              <div className="font-medium text-ink">Inventory (Vidisha)</div>
              <span className="text-[11px] text-slate font-mono">.xlsx</span>
            </div>
          </button>

          <button
            onClick={() => handleDownloadTemplate("INVENTORY", "LOCATION_B")}
            className="btn py-2.5 justify-start text-left"
          >
            <Package className="w-4 h-4 text-teal shrink-0" />
            <div className="truncate">
              <div className="font-medium text-ink">Inventory (Manawar)</div>
              <span className="text-[11px] text-slate font-mono">.xlsx</span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Upload & Import Section */}
      <div className="panel p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-soft/40 text-amber shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink m-0">
              Bulk Import with Staged Preview
            </h3>
            <p className="text-[12.5px] text-slate mt-0.5">
              Upload populated sheets. You will review a line-by-line validation diff before records are saved.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Vehicles Import */}
          <div className="p-4 rounded-lg bg-paper-subtle border border-line flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-semibold text-ink text-[13.5px] mb-1">
                <Truck className="w-4 h-4 text-slate" />
                <span>Import Vehicles</span>
              </div>
              <p className="text-[12px] text-slate m-0">
                Bulk register fleet trucks, containers & RC records.
              </p>
            </div>
            <label className="btn btn-sm btn-primary mt-3 cursor-pointer justify-center">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? "Parsing..." : "Upload Vehicles (.xlsx)"}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                disabled={uploading}
                onChange={(e) => handleFileUpload(e, "VEHICLE")}
                className="hidden"
              />
            </label>
          </div>

          {/* Drivers Import */}
          <div className="p-4 rounded-lg bg-paper-subtle border border-line flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-semibold text-ink text-[13.5px] mb-1">
                <Users className="w-4 h-4 text-slate" />
                <span>Import Drivers</span>
              </div>
              <p className="text-[12px] text-slate m-0">
                Bulk register drivers & assign vehicles by number.
              </p>
            </div>
            <label className="btn btn-sm btn-primary mt-3 cursor-pointer justify-center">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? "Parsing..." : "Upload Drivers (.xlsx)"}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                disabled={uploading}
                onChange={(e) => handleFileUpload(e, "DRIVER")}
                className="hidden"
              />
            </label>
          </div>

          {/* Inventory Import */}
          <div className="p-4 rounded-lg bg-paper-subtle border border-line flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-semibold text-ink text-[13.5px] mb-1">
                <Package className="w-4 h-4 text-slate" />
                <span>Import Inventory</span>
              </div>
              <p className="text-[12px] text-slate m-0">
                Load warehouse SKUs into Vidisha or Manawar.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <label className="btn btn-sm flex-1 cursor-pointer justify-center">
                <Upload className="w-3 h-3 text-amber" />
                <span>Vidisha</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  disabled={uploading}
                  onChange={(e) =>
                    handleFileUpload(e, "INVENTORY", "LOCATION_A")
                  }
                  className="hidden"
                />
              </label>
              <label className="btn btn-sm flex-1 cursor-pointer justify-center">
                <Upload className="w-3 h-3 text-teal" />
                <span>Manawar</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  disabled={uploading}
                  onChange={(e) =>
                    handleFileUpload(e, "INVENTORY", "LOCATION_B")
                  }
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Export Data Section */}
      <div className="panel p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-paper-subtle text-ink shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink m-0">
              Export Fleet & Warehouse Data
            </h3>
            <p className="text-[12.5px] text-slate mt-0.5">
              Extract live database records to styled Excel workbooks for reporting and audits.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => handleExport("VEHICLE")}
            className="btn"
          >
            <Download className="w-4 h-4 text-slate" />
            <span>Export Vehicles (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExport("DRIVER")}
            className="btn"
          >
            <Download className="w-4 h-4 text-slate" />
            <span>Export Drivers (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExport("INVENTORY", null)}
            className="btn"
          >
            <Download className="w-4 h-4 text-slate" />
            <span>Export All Inventory (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExport("INVENTORY", "LOCATION_A")}
            className="btn"
          >
            <Download className="w-4 h-4 text-amber" />
            <span>Export Vidisha (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExport("INVENTORY", "LOCATION_B")}
            className="btn"
          >
            <Download className="w-4 h-4 text-teal" />
            <span>Export Manawar (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 4. Full JSON Backup (Admin & Management) */}
      <div className="panel p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-ink text-white shrink-0">
              <Database className="w-5 h-5 text-amber-soft" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink m-0">
                Complete Business Data Backup
              </h3>
              <p className="text-[12.5px] text-slate mt-0.5 max-w-xl">
                Downloads every operational fleet, driver, and inventory record (including soft-deleted history) in standard JSON format. Sensitive credentials and tokens are strictly excluded.
              </p>
            </div>
          </div>

          <button
            onClick={handleFullBackup}
            className="btn btn-primary self-center"
          >
            <Shield className="w-4 h-4" />
            <span>Download Backup (.json)</span>
          </button>
        </div>
      </div>

      {/* Staged Import Preview Modal */}
      <ImportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        previewData={previewData}
        onConfirm={handleConfirmImport}
      />
    </div>
  );
};

export default ImportExportPage;
