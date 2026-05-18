# Host TableTop for $0 (testing)

Stack: **Vercel** (frontend) + **Render** (Django API) + **Aiven** (free MySQL).

## 1. GitHub

Push this repo to GitHub (public or private).

## 2. Free MySQL (Aiven)

1. Sign up: https://aiven.io/free-mysql-database  
2. Create a **MySQL** service (free plan).  
3. Copy connection details from **Connection information**.  
4. Click **Show** on **CA certificate** — save as `artifacts/backend/certs/ca.pem` **or** paste into `DB_SSL_CA_PEM` in Render env.

**Your Aiven service (example):**

| Variable | Value |
|----------|--------|
| `DB_HOST` | `mysql-16196df4-saihanuman-7554.e.aivencloud.com` |
| `DB_PORT` | `21875` |
| `DB_NAME` | `defaultdb` |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | *(from Aiven — click reveal)* |
| `DB_SSL` | `true` |
| `DB_SSL_CA` | `certs/ca.pem` *(after saving CA file locally)* |

**Local `.env`** (add to `artifacts/backend/.env` — keep using local MySQL OR switch to Aiven for testing):

```env
DB_HOST=mysql-16196df4-saihanuman-7554.e.aivencloud.com
DB_PORT=21875
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=YOUR_AIVEN_PASSWORD
DB_SSL=true
DB_SSL_CA=certs/ca.pem
```

Then:

```bash
mkdir -p certs
# Paste Aiven CA certificate into certs/ca.pem (from console → Show)
python manage.py migrate
python manage.py seed_demo
```

## 3. Backend on Render (free)

1. https://render.com → Sign up → **New +** → **Web Service**  
2. Connect your GitHub repo.  
3. Settings:

| Field | Value |
|--------|--------|
| **Root Directory** | `artifacts/backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate --noinput` |
| **Start Command** | `gunicorn restaurant.wsgi:application --bind 0.0.0.0:$PORT` |
| **Plan** | Free |

4. **Environment** variables:

```
SECRET_KEY=<random-long-string>
DEBUG=false
ALLOWED_HOSTS=your-service-name.onrender.com
DB_HOST=<aiven-host>
DB_PORT=<aiven-port>
DB_NAME=<aiven-db>
DB_USER=<aiven-user>
DB_PASSWORD=<aiven-password>
DB_SSL=true
DB_SSL_CA=<paste CA cert path or content — see Aiven docs>

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=<gmail-app-password>
DEFAULT_FROM_EMAIL=TableTop <your@gmail.com>

CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

5. Deploy. Note your API URL: `https://YOUR-SERVICE.onrender.com`

6. **Seed data** (Render → Shell):

```bash
python manage.py seed_demo
```

> Free Render **sleeps** after ~15 min idle. First request may take 30–60s.

## 4. Frontend on Vercel (free)

1. https://vercel.com → Import GitHub repo.  
2. Settings (monorepo — install from repo root):

| Field | Value |
|--------|--------|
| **Root Directory** | `.` (repo root) |
| **Framework** | Vite |
| **Install Command** | `pnpm install` |
| **Build Command** | `pnpm --filter @workspace/restaurant-app run build` |
| **Output Directory** | `artifacts/restaurant-app/dist/public` |

3. **Environment variable**:

```
VITE_API_URL=https://YOUR-SERVICE.onrender.com/api/
```

4. Deploy. Open `https://your-app.vercel.app`.

5. Update Render `CORS_ALLOWED_ORIGINS` to match your Vercel URL if you change it.

## 5. Test

- Login with `user@tabletop.com` → OTP in email.  
- Menu, cart, checkout (demo payments).

## Limits (free tier)

- Render API sleeps when idle (slow wake-up).  
- Uploaded menu **files** on Render disk are **not permanent** (use image URLs or re-seed).  
- Aiven ~1 GB storage.  
- Gmail SMTP daily sending limits.

## Local dev (unchanged)

```bash
# Backend — uses .env + local MySQL when DB_HOST is not set
cd artifacts/backend && source .venv/bin/activate
python manage.py runserver

# Frontend
cd artifacts/restaurant-app && pnpm run dev
```

No `VITE_API_URL` needed locally (defaults to `http://localhost:8000/api/`).
