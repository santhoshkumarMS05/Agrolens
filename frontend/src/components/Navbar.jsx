import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

export const Navbar = ({ mode = "farmer", activeAdminTab, onAdminTabChange }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate(mode === "admin" ? "/admin-login" : "/login");
  };

  if (mode === "admin") {
    return (
      <nav className="nav">
        <div className="nav-in">
          <Link className="brand" to="/admin">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21C7 17 4 13 4 8.5A6.5 6.5 0 0116.9 6c1.7 1.7 2.6 4.2 1.6 8-1 3.9-4 6.3-6.5 7z"
                fill="#2d4627"
              />
              <path
                d="M12 21V9"
                stroke="#f4f1e2"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            AgroLens{" "}
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--gold)",
                background: "rgba(251,191,36,.14)",
                border: "1px solid var(--gold)",
                padding: "2px 8px",
                borderRadius: "99px",
                marginLeft: "6px",
                letterSpacing: ".06em",
              }}
            >
              OPS CONSOLE
            </span>
          </Link>
          <div className="nav-links">
            <button
              type="button"
              className={`nav-link ${activeAdminTab === "staging" ? "active" : ""}`}
              onClick={() => onAdminTabChange && onAdminTabChange("staging")}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              🛡️ Staging &amp; Retraining
            </button>
            <button
              type="button"
              className={`nav-link ${activeAdminTab === "farmers" ? "active" : ""}`}
              onClick={() => onAdminTabChange && onAdminTabChange("farmers")}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              👥 Farmer Registry &amp; Scans
            </button>
          </div>
          <div className="userbox">
            <ThemeToggle />
            <span className="user-pill">
              Admin: <b>{user?.name || "Monkey D. Luffy (Admin)"}</b>
            </span>
            <button className="signout-btn" onClick={handleSignOut} type="button">
              Sign out
            </button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="nav">
      <div className="nav-in">
        <Link className="brand" to="/">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21C7 17 4 13 4 8.5A6.5 6.5 0 0116.9 6c1.7 1.7 2.6 4.2 1.6 8-1 3.9-4 6.3-6.5 7z"
              fill="#2d4627"
            />
            <path
              d="M12 21V9"
              stroke="#f4f1e2"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          AgroLens
        </Link>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end>
            Home
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Dashboard
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            History &amp; Profile
          </NavLink>
          {isAdmin && (
            <Link to="/admin" className="nav-link" style={{ color: "var(--gold)" }}>
              🛡️ Ops Console
            </Link>
          )}
        </div>
        <div className="userbox">
          <ThemeToggle />
          {user ? (
            <>
              <span className="user-pill">
                Signed in: <b>{user.name}</b>
              </span>
              <button className="signout-btn" onClick={handleSignOut} type="button">
                Sign out
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <Link to="/login" className="pill">
                Sign in
              </Link>
              <Link to="/signup" className="btn primary" style={{ padding: "8px 18px", fontSize: ".85rem" }}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
