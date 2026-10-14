import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import InstallButton from "./InstallButton";
import BrandLogo from "./BrandLogo";

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
            <BrandLogo size={28} style={{ marginRight: "8px" }} />
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
          <div className="nav-links is-admin-console">
            <button
              type="button"
              className={`nav-link ${activeAdminTab === "staging" ? "active" : ""}`}
              onClick={() => onAdminTabChange && onAdminTabChange("staging")}
            >
              <span className="nav-icon">🛡️</span>
              <span className="nav-label">
                <span>Staging &amp;</span>
                <span>Retraining</span>
              </span>
            </button>
            <button
              type="button"
              className={`nav-link ${activeAdminTab === "farmers" ? "active" : ""}`}
              onClick={() => onAdminTabChange && onAdminTabChange("farmers")}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-label">
                <span>Farmers &amp;</span>
                <span>Scans</span>
              </span>
            </button>
          </div>
          <div className="userbox">
            <InstallButton />
            <ThemeToggle />
            <span className="user-pill admin-user-pill">
              Admin: <b>{user?.name ? user.name.split(" ")[0] : "Luffy"}</b>
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
          <BrandLogo size={28} style={{ marginRight: "8px" }} />
          AgroLens
        </Link>
        <div className={`nav-links ${isAdmin ? "is-admin" : ""}`}>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <span className="nav-icon">🌱</span>
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <span className="nav-icon">📚</span>
            <span className="nav-label">
              <span>History &amp;</span>
              <span>Profile</span>
            </span>
          </NavLink>
          {isAdmin && (
            <Link to="/admin" className="nav-link admin-nav-link" style={{ color: "var(--gold)" }}>
              <span className="nav-icon">🛡️</span>
              <span className="nav-label">
                <span>Ops</span>
                <span>Console</span>
              </span>
            </Link>
          )}
        </div>
        <div className="userbox">
          <InstallButton />
          <ThemeToggle />
          {user ? (
            <div className="user-controls" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="user-pill">
                👨‍🌾 <b>{user.name ? user.name.split(" ")[0] : "Farmer"}</b>
              </span>
              <button className="signout-btn" onClick={handleSignOut} type="button">
                Sign out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "6px" }}>
              <Link to="/login" className="pill login-btn-compact">
                Sign in
              </Link>
              <Link to="/signup" className="btn primary signup-btn-compact">
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
