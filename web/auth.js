/* AgroLens — shared behaviour for login.html and signup.html */
(function () {
  const $ = (s, r = document) => r.querySelector(s);

  // Only follow same-site relative paths from ?next= (mirrors the server check).
  function safeNext() {
    const n = new URLSearchParams(location.search).get("next");
    if (!n || n.startsWith("//") || n.includes("\\") || n.includes("://")) return "dashboard.html";
    return n;
  }

  async function post(url, body) {
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
    } catch (e) {
      return { ok: false, status: 0, error: "Can't reach the server. Is the backend running?" };
    }
    let data = {};
    try { data = await res.json(); } catch (e) { /* non-JSON error page */ }
    return { ...data, ok: res.ok && data.ok !== false, status: res.status };
  }

  function clearErrors(form) {
    form.querySelectorAll(".field.bad").forEach((f) => f.classList.remove("bad"));
    const b = $(".banner", form); if (b) { b.classList.remove("show"); b.textContent = ""; }
  }
  function fieldError(form, name, msg) {
    const input = form.elements[name];
    const field = input && input.closest(".field");
    if (!field) return false;
    field.classList.add("bad");
    const e = $(".ferr", field); if (e) e.textContent = msg;
    return true;
  }
  function banner(form, msg) {
    const b = $(".banner", form); if (!b) return;
    b.textContent = msg; b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
  }
  function busy(btn, on) {
    btn.classList.toggle("busy", on);
    btn.disabled = on;
  }

  // show / hide password
  document.querySelectorAll(".eye").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
      btn.setAttribute("aria-pressed", String(show));
    });
  });

  // password strength: a hint only — the server is the real gatekeeper
  function strength(pw) {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
    if (pw.length < 8) s = Math.min(s, 1);
    return Math.max(pw ? 1 : 0, s);
  }
  const meter = $(".meter");
  const pwInput = $("#password");
  if (meter && pwInput) {
    const labels = ["", "Weak", "Fair", "Good", "Strong"];
    pwInput.addEventListener("input", () => {
      const s = strength(pwInput.value);
      meter.dataset.s = s;
      $(".txt", meter).textContent = labels[s];
    });
  }

  // clear a field's error as soon as the user edits it
  document.querySelectorAll(".field input").forEach((i) =>
    i.addEventListener("input", () => i.closest(".field").classList.remove("bad")));

  const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  // ---- login ----
  const login = $("#loginForm");
  if (login) {
    login.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors(login);
      const email = login.elements.email.value.trim();
      const password = login.elements.password.value;
      let bad = false;
      if (!EMAIL.test(email)) { fieldError(login, "email", "Enter a valid email address."); bad = true; }
      if (!password) { fieldError(login, "password", "Enter your password."); bad = true; }
      if (bad) return;

      const btn = $(".submit", login);
      busy(btn, true);
      const r = await post("/api/login", { email, password });
      if (r.ok) { location.href = safeNext(); return; }
      busy(btn, false);
      banner(login, r.error || "Something went wrong. Please try again.");
    });
  }

  // ---- signup ----
  const signup = $("#signupForm");
  if (signup) {
    signup.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors(signup);
      const name = signup.elements.name.value.trim();
      const email = signup.elements.email.value.trim();
      const password = signup.elements.password.value;
      const confirm = signup.elements.confirm.value;
      let bad = false;
      if (!name) { fieldError(signup, "name", "Please enter your name."); bad = true; }
      if (!EMAIL.test(email)) { fieldError(signup, "email", "Enter a valid email address."); bad = true; }
      if (password.length < 8) { fieldError(signup, "password", "Use at least 8 characters."); bad = true; }
      if (confirm !== password) { fieldError(signup, "confirm", "Passwords don't match."); bad = true; }
      if (bad) return;

      const btn = $(".submit", signup);
      busy(btn, true);
      const r = await post("/api/signup", { name, email, password });
      if (r.ok) { location.href = "dashboard.html"; return; }
      busy(btn, false);
      // put server-side validation next to the right field when we can
      if (!(r.field && fieldError(signup, r.field, r.error))) {
        banner(signup, r.error || "Something went wrong. Please try again.");
      }
    });
  }
})();
