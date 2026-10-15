import React, { createContext, useContext, useState, useEffect } from "react";
import { googleLogout } from "@react-oauth/google";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("agrolens_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem("agrolens_user");
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed?.role === "admin";
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(false);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const currentUser = data.user || data;
        setUser(currentUser);
        setIsAdmin(currentUser.role === "admin");
        try {
          localStorage.setItem("agrolens_user", JSON.stringify(currentUser));
        } catch {}
      }
      // Note: Do not wipe cached user on 401 so offline farmers and session hiccups
      // don't unexpectedly sign the user out. Only explicit logout() clears the user.
    } catch (e) {
      console.warn("[AgroLens] Auth check offline/network warning:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const syncGoogleUser = async ({ email, name }) => {
    if (!email) return null;
    try {
      const res = await fetch("/api/oauth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (data.ok && data.user) {
        setUser(data.user);
        setIsAdmin(data.user.role === "admin");
        try {
          localStorage.setItem("agrolens_user", JSON.stringify(data.user));
        } catch {}
        return data.user;
      }
    } catch (err) {
      console.error("[AgroLens] Google OAuth sync error:", err);
    }
    return null;
  };

  const login = (userData) => {
    setUser(userData);
    setIsAdmin(userData.role === "admin");
    try {
      localStorage.setItem("agrolens_user", JSON.stringify(userData));
    } catch {}
  };

  const logout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      try {
        googleLogout();
      } catch {
        // ignore
      }
    } catch {
      // ignore
    } finally {
      setUser(null);
      setIsAdmin(false);
      try {
        localStorage.removeItem("agrolens_user");
      } catch {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        checkAuth,
        login,
        logout,
        syncGoogleUser,
        syncOAuthUser: syncGoogleUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
