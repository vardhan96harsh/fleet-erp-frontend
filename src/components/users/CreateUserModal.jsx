import React, { useState } from "react";
import FullScreenModal from "../ui/FullScreenModal.jsx";
import Badge from "../ui/Badge.jsx";
import {
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";

export const CreateUserModal = ({ isOpen, onClose, onSave }) => {
  const [activeSection, setActiveSection] = useState("account");
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim() || !formData.password) {
      setError("Full Name, Username, and Password are required");
      setActiveSection("account");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setActiveSection("security");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSave({
        ...formData,
        email: formData.email.trim() || undefined,
      });
      setFormData({ name: "", username: "", email: "", password: "" });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to create Sub Admin"
      );
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      id: "account",
      label: "Account Details",
      badge: formData.username ? `@${formData.username}` : "Required",
      badgeVariant: formData.username ? "ok" : "warn",
    },
    {
      id: "security",
      label: "Password & Security",
      badge: formData.password ? "Provided" : "Required",
      badgeVariant: formData.password ? "ok" : "warn",
    },
    {
      id: "permissions",
      label: "Permissions & Scope",
      badge: "SUB_ADMIN",
      badgeVariant: "neutral",
    },
  ];

  const headerActions = (
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
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="btn btn-primary"
      >
        <Save className="w-4 h-4" />
        <span>{loading ? "Creating..." : "Create Sub Admin"}</span>
      </button>
    </div>
  );

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Sub Admin"
      subtitle="Create delegated account for fleet and inventory management"
      breadcrumbs="Users"
      badge={<Badge variant="neutral">SUB_ADMIN</Badge>}
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
        {/* SECTION 1: ACCOUNT INFORMATION */}
        {activeSection === "account" && (
          <div className="space-y-5">
            <div className="panel panel-pad">
              <div className="pb-3 border-b border-line mb-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
                  Account Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Staff Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Staff Name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="input-field text-[13.5px]"
                  />
                </div>

                <div>
                  <label className="label">System Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    className="input-field font-mono font-medium text-[13.5px]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Staff Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="input-field text-[13.5px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveSection("security")}
                className="btn btn-primary"
              >
                <span>Continue to Password →</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: SECURITY & PASSWORD */}
        {activeSection === "security" && (
          <div className="space-y-5">
            <div className="panel panel-pad">
              <div className="pb-3 border-b border-line mb-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
                  Password & Security
                </h3>
              </div>

              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="label">Initial Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Password (min 8 chars)"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="input-field font-mono"
                  />
                </div>

                <div className="p-3 bg-paper-subtle border border-line rounded-lg text-[12px] text-slate">
                  <span className="font-semibold text-ink block mb-1">
                    Password Requirements:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-soft">
                    <li>Minimum 8 characters</li>
                    <li>Hashed securely before storage</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setActiveSection("account")}
                className="btn"
              >
                <span>← Back to Account</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("permissions")}
                className="btn btn-primary"
              >
                <span>Review Permissions →</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: ROLE & SCOPE */}
        {activeSection === "permissions" && (
          <div className="space-y-5">
            <div className="panel panel-pad">
              <div className="pb-3 border-b border-line mb-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider m-0">
                  Sub Admin Permissions
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    title: "Fleet Operations",
                    desc: "Add, update, search, and manage commercial vehicles.",
                    allowed: true,
                  },
                  {
                    title: "Driver Roster & Attendance",
                    desc: "Register drivers, assign vehicles, track attendance.",
                    allowed: true,
                  },
                  {
                    title: "Warehouse Inventory",
                    desc: "Manage stock levels, units, and rates across locations.",
                    allowed: true,
                  },
                  {
                    title: "Batch Excel / CSV Import",
                    desc: "Bulk upload fleet, driver rosters, and inventory sheets.",
                    allowed: true,
                  },
                  {
                    title: "Recycle Bin Soft Delete",
                    desc: "Safely delete records and restore from recycle bin.",
                    allowed: true,
                  },
                  {
                    title: "Sub Admin Provisioning",
                    desc: "Managing other Sub Admins is restricted to Super Admin.",
                    allowed: false,
                  },
                ].map((perm, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      perm.allowed
                        ? "bg-teal-soft/20 border-teal-soft text-ink"
                        : "bg-paper-subtle border-line text-slate-soft"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {perm.allowed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-soft flex items-center justify-center text-[9px] shrink-0">
                          ✕
                        </span>
                      )}
                      <span className="font-semibold text-[12.5px]">{perm.title}</span>
                    </div>
                    <p className="text-[11px] m-0 pl-5 leading-relaxed text-slate">
                      {perm.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setActiveSection("security")}
                className="btn"
              >
                <span>← Back to Security</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? "Creating..." : "Confirm & Create Sub Admin"}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </FullScreenModal>
  );
};

export default CreateUserModal;
