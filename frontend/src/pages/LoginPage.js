import React, { useState } from "react";
import { FiLock, FiUser, FiEye, FiEyeOff } from "react-icons/fi";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await onLogin({ username: username.trim().toLowerCase(), password });
    if (!result.ok) {
      setError(result.message || "Invalid credentials. Use admin/admin123 or staff/staff123");
      return;
    }
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
        <section className="flex flex-col justify-between rounded-3xl bg-black dark:bg-white p-8 text-white dark:text-black">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300 dark:text-slate-600">Welcome Ceramic</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">Inventory Management</h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300 dark:text-slate-600">
              Manage tiles, suppliers, storage facilities, and stock tracking directly through this dashboard.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-300 dark:text-slate-600">
            <div className="rounded-xl bg-slate-800 dark:bg-slate-100 p-4">Monitor stock</div>
            <div className="rounded-xl bg-slate-800 dark:bg-slate-100 p-4">Prevent shortages</div>
            <div className="rounded-xl bg-slate-800 dark:bg-slate-100 p-4">Manage orders</div>
            <div className="rounded-xl bg-slate-800 dark:bg-slate-100 p-4">Track transfers</div>
          </div>
        </section>

        <section className="flex items-center justify-center rounded-3xl bg-white p-8 border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <form className="w-full max-w-md space-y-5" onSubmit={handleSubmit}>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Log In</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Access your organizational dashboard</p>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Username</span>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-black dark:focus:border-white focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
                  placeholder="admin"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Password</span>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-black dark:focus:border-white focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
                  placeholder="admin123"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-black dark:bg-white py-3 text-sm font-bold text-white dark:text-black transition hover:bg-slate-800 dark:hover:bg-slate-200"
            >
              Sign in
            </button>


          </form>
        </section>
      </div>
    </div>
  );
}
