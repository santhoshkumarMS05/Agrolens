import React, { useEffect } from "react";
import { AuthenticateWithRedirectCallback, useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const SSOCallbackPage = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress;
      const name = user.fullName || user.firstName || "Farmer";

      fetch("/api/oauth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, name }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.user) {
            login(data.user);
            navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
          } else {
            navigate("/dashboard");
          }
        })
        .catch(() => {
          navigate("/dashboard");
        });
    }
  }, [isLoaded, isSignedIn, user, login, navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--bg, #0b140d)",
        color: "var(--fg, #f4f1e2)",
        fontFamily: "inherit",
      }}
    >
      <AuthenticateWithRedirectCallback />
      <div style={{ marginTop: "1.5rem", fontSize: "1.05rem", opacity: 0.85 }}>
        Verifying and signing you in with Google...
      </div>
    </div>
  );
};

export default SSOCallbackPage;
