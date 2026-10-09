import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const clerk = useClerk();

  const handleGoogleSignUp = async () => {
    setError("");
    setLoading(true);
    try {
      const c = window.Clerk || clerk;
      if (c && c.client && c.client.signUp) {
        await c.client.signUp.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: `${window.location.origin}/sso-callback`,
          redirectUrlComplete: `${window.location.origin}/sso-callback`,
        });
        return;
      }
      if (c && c.openSignUp) {
        c.openSignUp();
        setLoading(false);
      }
    } catch (err) {
      console.error("Google sign up error:", err);
      setError(err?.errors?.[0]?.message || err?.message || "Failed to launch Google sign up.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please complete all required fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Signup failed.");
      }

      login(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <aside className="side">
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
        <div>
          <h2>Precision crop health for <em>every farmer.</em></h2>
          <p className="lede">
            Join thousands of growers protecting yields with instant on-device diagnosis and AI guidance.
          </p>
        </div>
        <div className="proofs">
          <div className="proof">
            <div className="n">25+</div>
            <div className="l">Diagnosed Crops</div>
          </div>
          <div className="proof">
            <div className="n">3-Phase</div>
            <div className="l">Active Advisory</div>
          </div>
          <div className="proof">
            <div className="n">3 Langs</div>
            <div className="l">EN · தமிழ் · हिंदी</div>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="auth-top-actions">
          <ThemeToggle />
          <Link className="back" to="/">← Back to AgroLens</Link>
        </div>

        <div className="form-wrap">
          <span className="eyebrow">Farmer Registration</span>
          <h1>Join AgroLens.</h1>
          <p className="sub">Set up your account in seconds to begin scanning crops.</p>

          {error && (
            <div className="banner is-error" role="alert" style={{ display: "block" }}>
              {error}
            </div>
          )}

          <button
            type="button"
            className="google-signin-btn"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.4 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.6 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>Sign up with Google</span>
          </button>

          <div className="auth-divider">
            <span>or sign up with email</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            <div className="field">
              <label htmlFor="name">Full name</label>
              <div className="inp">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <div className="inp">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="inp has-eye">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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

            <div className="field">
              <label htmlFor="confirm">Confirm password</label>
              <div className="inp">
                <input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Type it again"
                  required
                />
              </div>
            </div>

            <button className="btn submit" type="submit" disabled={loading}>
              {loading && <span className="spin"></span>}
              <span>{loading ? "Creating account..." : "Create account →"}</span>
            </button>
          </form>

          <p className="alt">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default SignupPage;
