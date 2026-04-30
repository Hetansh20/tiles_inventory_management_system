import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiCall } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    const handleDeactivated = (e) => {
      alert(e.detail || "Your account has been deactivated.");
      logout();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    window.addEventListener("auth:deactivated", handleDeactivated);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener("auth:deactivated", handleDeactivated);
    };
  }, []);

  const login = async ({ username, password }) => {
    try {
      const data = await apiCall("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: username, password }),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      setCurrentUser(data.user);
      return { ok: true, user: data.user };
    } catch (error) {
      return { ok: false, message: error.message || "Invalid credentials." };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
  };

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      login,
      logout,
      canManageUsers: currentUser?.role === "admin",
      canManageProducts: currentUser?.role === "admin" || currentUser?.permissions?.includes("products"),
      canManageCategories: currentUser?.role === "admin" || currentUser?.permissions?.includes("categories"),
      canManageSuppliers: currentUser?.role === "admin" || currentUser?.permissions?.includes("suppliers"),
      canManageWarehouses: currentUser?.role === "admin" || currentUser?.permissions?.includes("warehouses"),
      canManageTransfers: currentUser?.role === "admin" || currentUser?.permissions?.includes("transfers"),
      canManageOrders: currentUser?.role === "admin" || currentUser?.permissions?.includes("orders"),
      canDoTransactions: currentUser?.role === "admin" || currentUser?.permissions?.includes("inventory"),
    }),
    [currentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
