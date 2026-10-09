import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export const AdminLoginPage = () => {
  const [email, setEmail] = useState("mugiwarayaluffy185@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please provide administrator email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Administrative authentication failed.");
      }

      if (data.user?.role !== "admin") {
        throw new Error("Access denied: Account does not possess administrative privileges.");
      }

      login(data.user);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Failed to authenticate administrator.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <aside className="side admin-side" style={{ background: "linear-gradient(130deg, #0f2314, #19381e 40%, #164020 70%, #0d1e12)" }}>
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
          AgroLens Ops
        </Link>
        <div>
          <span
            style={{
              display: "inline-block",
              background: "rgba(251,191,36,.18)",
              border: "1px solid var(--gold)",
              color: "var(--gold-l)",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "99px",
              marginBottom: "12px",
              letterSpacing: ".06em",
            }}
          >
            🛡️ Internal Console
          </span>
          <h2>Operations &amp; Model <em>Staging.</em></h2>
          <p className="lede">
            Restricted control center for model retraining, human-in-the-loop candidate curation, and edge weight deployment.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              padding: "10px 14px",
              borderRadius: "10px",
              marginTop: "16px",
              fontSize: "0.82rem",
              color: "#fff",
            }}
          >
            <span>🔒 Primary Admin:</span>
            <code style={{ color: "var(--gold-l)", fontFamily: "monospace" }}>mugiwarayaluffy185@gmail.com</code>
          </div>
        </div>

        <div className="proofs">
          <div className="proof">
            <div className="n">Active</div>
            <div className="l">Data Pool Staging</div>
          </div>
          <div className="proof">
            <div className="n">Frozen</div>
            <div className="l">Backbone Weights</div>
          </div>
          <div className="proof">
            <div className="n">RBAC</div>
            <div className="l">Admin Privilege Guard</div>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="auth-top-actions">
          <ThemeToggle />
          <Link className="back" to="/">← Back to AgroLens</Link>
        </div>

        <div className="form-wrap">
          <span className="eyebrow" style={{ color: "var(--gold)" }}>Restricted Admin Access</span>
          <h1>Admin Portal.</h1>
          <p className="sub">
            Sign in with authorized administrator credentials to review user images and manage continuous learning.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="banner is-error" role="alert" style={{ display: "block" }}>
                {error}
              </div>
            )}

            <div className="field">
              <label htmlFor="adminEmail">Admin Email</label>
              <div className="inp">
                <input
                  id="adminEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@agrolens.com"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="adminPassword">Admin Password</label>
              <div className="inp has-eye">
                <input
                  id="adminPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  required
                />
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Show or hide password"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              className="btn submit"
              type="submit"
              disabled={loading}
              style={{ background: "linear-gradient(110deg,#c19c40 0%,#2d4627 60%,#1f3320 100%)" }}
            >
              {loading && <span className="spin"></span>}
              <span>{loading ? "Authenticating..." : "Access Admin Console 🛡️"}</span>
            </button>
          </form>

          <p className="alt">
            Farmer account? <Link to="/login">Farmer Sign In</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminLoginPage;
