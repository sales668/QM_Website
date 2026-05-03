import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock } from "@phosphor-icons/react";
import { useAuth } from "../lib/AuthContext";
import { toast } from "sonner";

export default function AdminLogin() {
  const { user, login, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@qualitymetalsltd.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (user && user !== false && user !== null) return <Navigate to="/admin" replace />;

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      toast.success("Welcome back, admin.");
      navigate("/admin");
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6 qm-grid-bg" data-testid="admin-login-page">
      <div className="w-full max-w-md bg-white border border-gray-200 p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-8">
          <div className="grid h-10 w-10 place-items-center bg-[#002FA7] text-white">
            <Lock size={18} weight="bold" />
          </div>
          <div>
            <div className="qm-tick text-gray-400">// ADMIN ACCESS</div>
            <div className="font-display text-xl font-black uppercase tracking-tight">Quality Metals</div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5" data-testid="admin-login-form">
          <div>
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block font-mono-spec">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002FA7] focus:border-transparent rounded-none"
              data-testid="admin-email-input"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block font-mono-spec">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002FA7] focus:border-transparent rounded-none"
              data-testid="admin-password-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#002FA7] hover:bg-[#00247D] disabled:opacity-50 text-white py-4 text-sm font-bold uppercase tracking-widest"
            data-testid="admin-login-submit"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
