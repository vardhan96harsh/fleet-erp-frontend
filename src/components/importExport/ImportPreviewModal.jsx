import React, { useState } from "react";
import FullScreenModal from "../ui/FullScreenModal.jsx";
import Badge from "../ui/Badge.jsx";
import {
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";

export const ImportPreviewModal = ({
  isOpen,
  onClose,
  previewData,
  onConfirm,
}) => {
  const [activeSection, setActiveSection] = useState("summary");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  if (!previewData) return null;

  const { batchId, type, locationName, summary, rows = [] } = previewData;

  const handleConfirm = async () => {
    setConfirming(true);
    setError("");
    try {
      await onConfirm(batchId);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to commit import"
      );
    } finally {
      setConfirming(false);
    }
  };

  const validRows = rows.filter((r) => r.action === "NEW");
  const invalidRows = rows.filter((r) => r.action === "INVALID");

  const menuItems = [
    {
      id: "summary",
      label: "Batch Summary",
      badge: `${rows.length} Rows`,
    },
    {
      id: "valid",
      label: "Valid Records",
      badge: validRows.length,
      badgeVariant: "ok",
    },
    {
      id: "invalid",
      label: "Validation Issues",
      badge: invalidRows.length,
      badgeVariant: invalidRows.length > 0 ? "bad" : "neutral",
    },
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClose}
        disabled={confirming}
        className="btn"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={confirming || validRows.length === 0}
        className="btn btn-primary"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>
          {confirming
            ? "Committing..."
            : `Confirm (${validRows.length} Records)`}
        </span>
      </button>
    </div>
  );

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Import Review: ${type} ${locationName ? `(${locationName})` : ""}`}
      subtitle="Verify parsed rows before saving to database"
      breadcrumbs="Import"
      badge={<Badge variant="ok">Batch {batchId?.slice(-6)}</Badge>}
      menuItems={menuItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      actions={headerActions}
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-lg bg-rust-soft/60 border border-rust/30 text-rust text-[13px] flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* SECTION 1: SUMMARY */}
      {activeSection === "summary" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="panel panel-pad bg-paper-raised">
              <span className="label">Total Processed</span>
              <div className="text-2xl font-bold font-mono text-ink mt-1">
                {rows.length}
              </div>
              <p className="text-[11.5px] text-slate mt-1 m-0">
                Total spreadsheet rows
              </p>
            </div>

            <div className="panel panel-pad bg-teal-soft/20 border-teal-soft">
              <span className="label text-teal">Valid Records</span>
              <div className="text-2xl font-bold font-mono text-teal mt-1">
                {summary?.newCount || validRows.length}
              </div>
              <p className="text-[11.5px] text-teal/80 mt-1 m-0">
                Ready for database commit
              </p>
            </div>

            <div className="panel panel-pad bg-rust-soft/20 border-rust-soft">
              <span className="label text-rust">Issues / Skipped</span>
              <div className="text-2xl font-bold font-mono text-rust mt-1">
                {invalidRows.length}
              </div>
              <p className="text-[11.5px] text-rust/80 mt-1 m-0">
                Missing required fields
              </p>
            </div>
          </div>

          <div className="panel panel-pad space-y-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
              Import Target Parameters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <div className="p-3 bg-paper-subtle rounded-lg border border-line">
                <span className="label">Entity Type</span>
                <span className="font-semibold text-ink">{type}</span>
              </div>
              <div className="p-3 bg-paper-subtle rounded-lg border border-line">
                <span className="label">Target Location</span>
                <span className="font-semibold text-ink">{locationName || "Central ERP"}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveSection("valid")}
              className="btn btn-primary"
            >
              <span>View Valid Records ({validRows.length}) →</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: VALID RECORDS PREVIEW */}
      {activeSection === "valid" && (
        <div className="space-y-5">
          <div className="panel panel-pad">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
                Staged Records ({validRows.length})
              </h3>
              <Badge variant="ok">Ready</Badge>
            </div>

            <div className="border border-line rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th className="w-16">Row</th>
                    <th>Identifier</th>
                    <th>Details</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 100).map((r, i) => {
                    const data = r.data || {};
                    const id =
                      data.vehicleNo || data.name || data.itemCode || `Row #${r.rowNumber}`;
                    const detail =
                      data.type ||
                      data.mobile ||
                      data.itemName ||
                      data.category ||
                      "—";

                    return (
                      <tr key={i}>
                        <td className="font-mono text-slate text-[11.5px]">
                          #{r.rowNumber}
                        </td>
                        <td className="font-mono font-bold text-ink">{id}</td>
                        <td className="text-slate text-[12.5px]">{detail}</td>
                        <td>
                          <Badge variant="ok">Insert</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {validRows.length > 100 && (
              <p className="text-[11.5px] text-slate-soft text-right mt-2 m-0">
                Showing first 100 of {validRows.length} rows
              </p>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setActiveSection("summary")}
              className="btn"
            >
              <span>← Back to Summary</span>
            </button>
            {invalidRows.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveSection("invalid")}
                className="btn btn-secondary"
              >
                <span>Check Validation Issues ({invalidRows.length}) →</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: INVALID ROWS & LOGS */}
      {activeSection === "invalid" && (
        <div className="space-y-5">
          <div className="panel panel-pad">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
                Validation Issues ({invalidRows.length})
              </h3>
              <Badge variant="bad">Skipped</Badge>
            </div>

            {invalidRows.length === 0 ? (
              <div className="text-center py-8 text-teal font-medium text-[13px]">
                No validation errors detected. All rows are valid.
              </div>
            ) : (
              <div className="border border-line rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th className="w-16">Row</th>
                      <th>Identifier</th>
                      <th>Error Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidRows.map((r, i) => {
                      const data = r.data || {};
                      const id =
                        data.vehicleNo ||
                        data.name ||
                        data.itemCode ||
                        `Row #${r.rowNumber}`;
                      return (
                        <tr key={i} className="bg-rust-soft/10">
                          <td className="font-mono text-rust text-[11.5px] font-bold">
                            #{r.rowNumber}
                          </td>
                          <td className="font-mono text-ink">{id}</td>
                          <td className="text-rust text-[12.5px] font-medium">
                            {r.errors?.join("; ") || "Invalid data format"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setActiveSection("summary")}
              className="btn"
            >
              <span>← Back to Summary</span>
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming || validRows.length === 0}
              className="btn btn-primary"
            >
              <span>Confirm Import ({validRows.length} Valid Records)</span>
            </button>
          </div>
        </div>
      )}
    </FullScreenModal>
  );
};

export default ImportPreviewModal;
