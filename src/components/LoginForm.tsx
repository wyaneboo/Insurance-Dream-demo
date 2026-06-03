import { FormEvent, useState } from "react";
import { api } from "../api/client";
import { UserRole } from "../types";

interface Props {
  onLogin?: () => void;
  role?: UserRole;
}

const getDevCredentials = (role?: UserRole) => {
  if (!import.meta.env.DEV) {
    return { identifier: "", password: "" };
  }

  if (role === UserRole.CUSTOMER) {
    return {
      identifier: import.meta.env.VITE_DEV_CUSTOMER_LOGIN_IDENTIFIER ?? "",
      password: import.meta.env.VITE_DEV_CUSTOMER_LOGIN_PASSWORD ?? "",
    };
  }

  return {
    identifier: import.meta.env.VITE_DEV_AGENT_LOGIN_IDENTIFIER ?? "",
    password: import.meta.env.VITE_DEV_AGENT_LOGIN_PASSWORD ?? "",
  };
};

export function LoginForm({ onLogin, role }: Props) {
  const devCredentials = getDevCredentials(role);
  const [identifier, setIdentifier] = useState(devCredentials.identifier);
  const [password, setPassword] = useState(devCredentials.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(identifier, password);
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("userRole", res.user.role);
      if (onLogin) onLogin();
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded-2xl shadow border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Sign In</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Email or Phone</label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="user@example.com"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 text-white rounded-lg py-2 font-semibold hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
