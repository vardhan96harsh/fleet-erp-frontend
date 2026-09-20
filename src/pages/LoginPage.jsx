import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Lock, User, Shield, AlertCircle } from "lucide-react";

export const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(username.trim().toLowerCase(), password);
      toast.success("Signed in successfully");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Invalid username or password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-ink p-4">
      <div className="w-full max-w-sm bg-paper rounded-2xl p-7 sm:p-9 shadow-2xl border border-line animate-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center mb-3 shadow-md">
            <Shield className="w-5 h-5 text-amber-soft" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight m-0">
            Fleet Ledger
          </h1>
          <div className="font-mono text-[11px] text-slate tracking-wider uppercase mt-0.5">
            Fleet · Compliance · Warehouse ERP
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rust-soft/60 border border-rust/30 text-rust text-[12.5px] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-soft absolute left-3 pointer-events-none" />
              <input
                type="text"
                required
                autoFocus
                placeholder="Username or admin ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field pl-9 bg-white"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-soft absolute left-3 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-9 bg-white"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-2.5 text-sm font-semibold justify-center shadow-sm mt-2"
          >
            {loading ? "Authenticating..." : "Sign in to ERP"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-line text-center">
          <p className="text-[11.5px] text-slate m-0 leading-relaxed">
            Enterprise RBAC System • Super Admin & Sub Admin Access
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
