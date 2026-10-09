import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useUser();
  const { signOut } = useClerk();

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

  // Sync Clerk OAuth logins with backend database session
  useEffect(() => {
    if (clerkLoaded && clerkSignedIn && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      const name = clerkUser.fullName || clerkUser.firstName || "Farmer";
      if (email) {
        fetch("/api/oauth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, name }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.ok && data.user) {
              setUser(data.user);
              setIsAdmin(data.user.role === "admin");
            }
          })
          .catch(() => {});
      }
    }
  }, [clerkLoaded, clerkSignedIn, clerkUser]);

  const login = (userData) => {
    setUser(userData);
    setIsAdmin(userData.role === "admin");
  };

  const logout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      if (clerkSignedIn && signOut) {
        await signOut();
      }
    } catch {
      // ignore
    } finally {
      setUser(null);
      setIsAdmin(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, checkAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
