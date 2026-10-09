# AgroLens — landing page, sign-in, and live model dashboard

Flask + PostgreSQL authentication in front of the in-browser MobileNetV3
diagnosis dashboard.

```
agrolens/
├── backend/
│   ├── app.py            Flask app: auth API + serves ../web
│   ├── schema.sql        users + login_attempts tables (idempotent)
│   ├── requirements.txt
│   └── .env.example      copy to .env
└── web/
    ├── index.html        landing page (public)
    ├── login.html        sign in
    ├── signup.html       create account
    ├── dashboard.html    the model — signed-in users only
    ├── leaflet_model.onnx  your checkpoint — signed-in users only
    ├── ort/              ONNX Runtime Web (vendored)
    └── app.css, auth.css, auth.js
```

## Setup

### 1. Create the database

In `psql` (or pgAdmin's query tool) as a superuser:

```sql
CREATE USER agrolens WITH PASSWORD 'choose-a-real-password';
CREATE DATABASE agrolens OWNER agrolens;
```

You don't need to create tables by hand — `app.py` applies `schema.sql` on
startup. It's safe to re-run.

### 2. Configure

```bash
cd backend
cp .env.example .env          # Windows: copy .env.example .env
```

Edit `.env`:

- `DATABASE_URL` — `postgresql://agrolens:YOUR_PASSWORD@localhost:5432/agrolens`
- `SECRET_KEY` — generate one:
  `python -c "import secrets; print(secrets.token_hex(32))"`

If `SECRET_KEY` is missing the app still starts with a random one, but
everyone is signed out on every restart.

### 3. Run

```bash
pip install -r requirements.txt
python app.py
```

Open <http://localhost:8000>. Click **Sign in → Create an account**.

## What is stored

| Column | Notes |
|---|---|
| `email` | lower-cased; unique index on `lower(email)` |
| `password_hash` | salted **scrypt** hash (werkzeug). The password itself is never stored or logged |
| `full_name`, `created_at`, `last_login_at` | |
| `login_attempts` | email, IP, success flag, timestamp — used for throttling |

Check it yourself: `SELECT id, email, left(password_hash, 30) FROM users;`

## API

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/signup` | `{name, email, password}` | 201 and signs you in |
| POST | `/api/login` | `{email, password}` | 401 with a generic message on any failure; 429 when throttled |
| POST | `/api/logout` | — | |
| GET | `/api/me` | — | 401 if not signed in |

Routes: `/dashboard` redirects to `/login?next=/dashboard` when signed out,
and `/leaflet_model.onnx` returns 401.

## Security: what's covered

- **Password storage** — scrypt with a per-user salt.
- **No account probing on login** — unknown email and wrong password return
  the identical message, and a dummy hash is checked for unknown emails so the
  response time doesn't give it away.
- **Brute-force throttling** — after 5 failed attempts on an email (or 20 from
  one IP) in 15 minutes, login returns 429. Tracked in Postgres, so it holds
  across restarts and multiple workers.
- **SQL injection** — every query is parameterised.
- **Cookies** — `HttpOnly`, `SameSite=Lax`, signed. Set
  `SESSION_COOKIE_SECURE=1` in `.env` once you're on HTTPS.
- **CSRF** — the API only accepts `application/json`, which a cross-site HTML
  form can't send, plus `SameSite=Lax`.
- **Open redirects** — `?next=` accepts only same-site relative paths.
- **Password rules** — 8–128 characters, and a short blocklist of very common
  passwords. Length is enforced rather than character-class rules.

## Known limitations — read before deploying for real

1. **Sign-out doesn't revoke a copied cookie.** Sessions are signed cookies
   with no server-side record, so a cookie stolen before sign-out stays valid
   until it expires (7 days). If that matters, move to a `sessions` table where
   the cookie holds only a random token — then logout and "sign out
   everywhere" become real.
2. **The lockout can be abused.** Because throttling is per email, anyone can
   lock a known user out for 15 minutes by failing logins on purpose. It's the
   usual trade-off; the alternative is per-IP-plus-email or a CAPTCHA.
3. **No email verification or password reset.** Anyone can register any
   address, and a forgotten password can't be recovered. Both need an email
   service.
4. **Development server.** `python app.py` uses Flask's built-in server. For
   production use a WSGI server behind HTTPS, e.g.
   `pip install gunicorn && gunicorn -w 2 -b 127.0.0.1:8000 app:app`
   (Linux/macOS; on Windows use `waitress`). Behind a reverse proxy, wrap the
   app in `werkzeug.middleware.proxy_fix.ProxyFix` so the throttle sees real
   client IPs instead of the proxy's.
5. **The model file is gated, but not secret.** A signed-in user's browser
   downloads `leaflet_model.onnx` to run it, so any account holder can keep a
   copy. That's inherent to in-browser inference.
6. **Connection per request.** Fine for a prototype; use `psycopg_pool` if
   traffic grows.

## Model notes

Carried over from before: the ONNX export matches PyTorch to 1e-6; the
dashboard's relevance gate is a colour/coverage heuristic, not a trained
detector; and the checkpoint predicts crop + condition only (no growth stage).
