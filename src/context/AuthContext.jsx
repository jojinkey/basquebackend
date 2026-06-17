import { createContext, useContext, useState, useEffect, useCallback } from "react";

const PERMISSIONS = {
  owner: [
    "floor_view", "orders_view", "kitchen_view", "waitlist_view",
    "reservations_view", "service_alerts", "insights",
    "audit_reports", "audit_export", "settings", "god_view",
  ],
  owner_full: [
    "floor_view", "floor_manage", "orders_view", "orders_manage",
    "kitchen_view", "kitchen_manage", "waitlist_view", "waitlist_manage",
    "reservations_view", "reservations_manage", "service_alerts",
    "insights", "menu_availability", "audit_reports", "audit_export",
    "settings", "god_view", "table_orders",
  ],
  restaurant_manager: [
    "floor_view", "floor_manage", "orders_view", "orders_manage",
    "kitchen_view", "waitlist_view", "waitlist_manage",
    "reservations_view", "reservations_manage", "service_alerts",
    "insights", "menu_availability", "audit_export", "table_orders", "audit_reports",
  ],
  floor_manager: [
    "floor_view", "floor_manage", "waitlist_view", "waitlist_manage",
    "reservations_view", "service_alerts", "kitchen_view", "table_orders",
  ],
  server: [
    "floor_view", "floor_manage", "orders_view", "service_alerts", "table_orders",
  ],
  kitchen: [
    "kitchen_view", "kitchen_manage", "orders_view", "menu_availability",
  ],
  auditor: [
    "audit_reports", "audit_export",
  ],
};

const AuthContext = createContext(null);

const SESSION_KEY = "basque_session";
const INACTIVITY_LIMIT = 8 * 60 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overrideMode, setOverrideMode] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        const age = Date.now() - new Date(session.loginTime).getTime();
        if (age < INACTIVITY_LIMIT) {
          setUser(session);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (_) {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((userData) => {
    const session = { ...userData, loginTime: new Date().toISOString() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const can = useCallback(
    (permission) => {
      if (!user) return false;
      if (user.role === "owner" && overrideMode) {
        return (PERMISSIONS.owner_full || []).includes(permission);
      }
      return (PERMISSIONS[user.role] || []).includes(permission);
    },
    [user, overrideMode]
  );

  const toggleOverride = useCallback(() => {
    setOverrideMode((prev) => !prev);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can, overrideMode, toggleOverride }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
