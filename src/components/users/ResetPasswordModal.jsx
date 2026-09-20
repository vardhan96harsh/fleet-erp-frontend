import React, { useState } from "react";
import FullScreenModal from "../ui/FullScreenModal.jsx";
import Badge from "../ui/Badge.jsx";
import { AlertCircle, Save } from "lucide-react";

export const ResetPasswordModal = ({
  isOpen,
  onClose,
  targetUser,
  onReset,
}) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!targetUser) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!password || password.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onReset(targetUser._id, password);
      setPassword("");
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

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
        <span>{loading ? "Resetting..." : "Reset Password"}</span>
      </button>
    </div>
  );

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reset Password: @${targetUser.username}`}
      subtitle={`Change password for ${targetUser.name}`}
      breadcrumbs="Security"
      badge={<Badge variant="neutral">Sub Admin</Badge>}
      actions={headerActions}
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-lg bg-rust-soft/60 border border-rust/30 text-rust text-[13px] flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl mx-auto">
        <div className="panel panel-pad">
          <div className="flex items-center gap-3 pb-3 border-b border-line mb-4">
            <div className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center font-bold text-sm">
              {targetUser.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink m-0">
                {targetUser.name}
              </h3>
              <p className="text-[11.5px] font-mono text-slate m-0">
                @{targetUser.username} {targetUser.email ? `• ${targetUser.email}` : ""}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">New Password *</label>
              <input
                type="password"
                required
                placeholder="New Password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field text-[13.5px] font-mono"
              />
            </div>

            <div className="p-3 bg-paper-subtle border border-line rounded-lg text-[12px] text-slate">
              <span>
                Updating password will invalidate current active sessions for this sub-admin account.
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
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
            className="btn btn-primary"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{loading ? "Resetting..." : "Reset Password"}</span>
          </button>
        </div>
      </form>
    </FullScreenModal>
  );
};

export default ResetPasswordModal;
