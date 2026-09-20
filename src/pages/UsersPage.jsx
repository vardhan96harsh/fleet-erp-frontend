import React, { useState, useEffect } from "react";
import { userService } from "../services/userService.js";
import { useToast } from "../context/ToastContext.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { CreateUserModal } from "../components/users/CreateUserModal.jsx";
import { ResetPasswordModal } from "../components/users/ResetPasswordModal.jsx";
import { fmtDT } from "../utils/dates.js";
import { UserPlus, ShieldCheck, KeyRound, Power } from "lucide-react";

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);

  const toast = useToast();

  const loadUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data || []);
    } catch (err) {
      toast.error("Failed to load Sub Admin users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (data) => {
    const created = await userService.create(data);
    setUsers((prev) => [created, ...prev]);
    toast.success(`Sub Admin @${created.username} created successfully`);
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.isActive;
    try {
      const updated = await userService.updateStatus(user._id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u._id === updated.id ? { ...u, isActive: updated.isActive } : u))
      );
      toast.success(
        `Account @${user.username} ${nextStatus ? "enabled" : "disabled"}`
      );
    } catch (err) {
      toast.error("Failed to update user account status");
    }
  };

  const handleResetPassword = async (userId, newPassword) => {
    await userService.resetPassword(userId, newPassword);
    toast.success("Password reset successfully");
  };

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink m-0">
            Sub Admin Staff Accounts
          </h3>
          <p className="text-[12.5px] text-slate mt-0.5">
            Create and manage operator accounts with operational access to fleet and warehouse data.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="btn btn-primary shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Sub Admin</span>
        </button>
      </div>

      {/* Users Table Panel */}
      <div className="panel overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate font-mono text-[13px]">
            Loading Sub Admin accounts...
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No Sub Admins created yet"
            description="You have not provisioned any Sub Admin accounts yet."
            action={
              <button
                onClick={() => setIsCreateOpen(true)}
                className="btn btn-sm btn-primary"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create First Sub Admin</span>
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Sign In</th>
                  <th>Created At</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="font-semibold text-ink">{u.name}</td>
                    <td className="font-mono text-[12.5px]">@{u.username}</td>
                    <td className="text-slate">{u.email || "—"}</td>
                    <td>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-paper-subtle border border-line text-slate">
                        SUB_ADMIN
                      </span>
                    </td>
                    <td>
                      <Badge variant={u.isActive ? "ok" : "bad"}>
                        {u.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="font-mono text-[12px] text-slate">
                      {fmtDT(u.lastLoginAt)}
                    </td>
                    <td className="font-mono text-[12px] text-slate">
                      {fmtDT(u.createdAt)}
                    </td>
                    <td className="text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setResetTargetUser(u)}
                        className="btn btn-sm"
                        title="Reset password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Reset PW</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        className={`btn btn-sm ${
                          u.isActive ? "btn-danger" : "btn-teal"
                        }`}
                        title={u.isActive ? "Disable Account" : "Enable Account"}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{u.isActive ? "Disable" : "Enable"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreateUser}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={!!resetTargetUser}
        onClose={() => setResetTargetUser(null)}
        targetUser={resetTargetUser}
        onReset={handleResetPassword}
      />
    </div>
  );
};

export default UsersPage;
