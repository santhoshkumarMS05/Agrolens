import React, { createContext, useContext, useState, useEffect } from "react";
import { googleLogout } from "@react-oauth/google";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const currentUser = data.user || data;
        setUser(currentUser);
        setIsAdmin(currentUser.role === "admin");
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch {
      setUser(null);
      setIsAdmin(false);
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
