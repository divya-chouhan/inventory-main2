# Nexus — Inventory & Order Management System

A full-stack Inventory & Order Management application: a **FastAPI** backend, a **React** frontend with a premium dark UI, and **PostgreSQL** for storage. Fully containerized with Docker Compose and ready to deploy to free hosting.

---

## Features

- **Products** — create, edit, delete, search; live stock status (in stock / low / out).
- **Customers** — directory with unique-email enforcement.
- **Orders** — multi-line order builder with live totals; placing an order validates and reduces stock atomically.
- **Dashboard** — totals for products, customers, orders and revenue, plus low-stock / out-of-stock watch.
- **Premium dark UI** — Sora + Manrope typography, emerald accent, lucide icons, hover states, and GSAP animations (staggered card/row reveals, modal spring-in, toast slide-in).
- **Responsive** — collapsible sidebar and adaptive layout on mobile.

## Business rules (enforced server-side)

| Rule | How it's enforced |
|------|-------------------|
| Unique product SKU | DB unique index + pre-check → `409 Conflict` |
| Unique customer email | DB unique index + pre-check → `409 Conflict` |
| Inventory validation | Stock checked for every line **before** any write |
| Orders blocked on insufficient stock | Transaction aborts → `409 Conflict`, stock untouched |
| Automatic stock reduction | Stock decremented inside the order transaction |
| No overselling under concurrency | `SELECT … FOR UPDATE` row locks (verified with a 10-way concurrent race test) |
| Cancelling an order | Restores the reserved stock |
| `stock >= 0`, `price >= 0`, `quantity > 0` | DB `CHECK` constraints |

## Tech stack

- **Backend:** FastAPI, SQLAlchemy 2, Pydantic v2, psycopg 3, Uvicorn
- **Frontend:** React 18, Vite, React Router, Axios, GSAP, lucide-react
- **Database:** PostgreSQL 16
- **Infra:** Docker, Docker Compose, nginx (frontend), GitHub Actions (image publishing)

---

## Project structure

```
inventory-order-management/
├── docker-compose.yml          # 3 services: db, backend, frontend
├── render.yaml                 # Render blueprint: backend + Postgres
├── .env.example                # root config (copy to .env)
├── .github/workflows/          # CI: build & push both Docker images
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # app, CORS, dashboard, startup init
│       ├── config.py           # env-driven settings (no hardcoded secrets)
│       ├── database.py         # engine + session
│       ├── models.py           # Product, Customer, Order, OrderItem
│       ├── schemas.py          # Pydantic request/response models
│       ├── seed.py             # demo data
│       └── routers/            # products, customers, orders
└── frontend/
    ├── Dockerfile              # multi-stage build → nginx
    ├── nginx.conf              # SPA fallback
    ├── vercel.json
    └── src/
        ├── api/client.js
        ├── components/         # Sidebar, Modal, Toast, etc.
        └── pages/              # Dashboard, Products, Customers, Orders
```

---

## Run locally (one command)

Requires Docker + Docker Compose.

```bash
cp .env.example .env          # adjust credentials if you like
docker compose up --build
```

- Frontend → http://localhost:8080
- Backend API → http://localhost:8000  (Swagger docs at `/docs`)
- PostgreSQL → localhost:5432

The backend auto-creates tables and seeds demo data on first start.

### Run without Docker (dev mode)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+psycopg://USER:PASS@localhost:5432/iom"
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm run dev          # http://localhost:5173
```

---

## API reference

Base path: `/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Aggregate stats |
| GET/POST | `/products` | List / create products |
| GET/PUT/DELETE | `/products/{id}` | Read / update / delete |
| GET/POST | `/customers` | List / create customers |
| GET/PUT/DELETE | `/customers/{id}` | Read / update / delete |
| GET/POST | `/orders` | List / create orders |
| PATCH | `/orders/{id}/status` | Update status (cancel restocks) |
| GET | `/health` | Health check |

Create-order payload:
```json
{ "customer_id": 1, "items": [ { "product_id": 3, "quantity": 2 } ] }
```

---

## Configuration (environment variables)

No credentials are hardcoded. Everything is read from the environment.

**Backend**

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | `postgresql+psycopg://user:pass@host:5432/db` |
| `CORS_ORIGINS` | Comma-separated allowed origins (your frontend URL) |
| `ENVIRONMENT` | `development` / `production` |
| `AUTO_INIT_DB` | Create tables on startup (`true`/`false`) |
| `SEED_DEMO_DATA` | Seed demo rows on first start |

**Frontend**

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend API base URL, e.g. `https://your-backend.onrender.com/api` |

---

## Deploying to free hosting

This deploys the three required deliverables: **GitHub repo**, **Docker images**, and **live URLs** (frontend + backend deployed individually).

### 0. Push to GitHub

```bash
git init && git add . && git commit -m "Inventory & Order Management System"
git branch -M main
git remote add origin https://github.com/<you>/inventory-order-management.git
git push -u origin main
```

### 1. Backend + Database → Render (free)

The included `render.yaml` provisions a free PostgreSQL database and the backend together.

1. Render Dashboard → **New + → Blueprint** → connect this repo.
2. Render reads `render.yaml`, creates `iom-db` (Postgres) and `iom-backend` (Docker web service), and wires `DATABASE_URL` automatically.
3. After the first deploy, copy your frontend URL (step 2) and set the backend env var `CORS_ORIGINS` to it, then redeploy.
4. Your API is live at `https://iom-backend-XXXX.onrender.com` (docs at `/docs`).

> Render's free Postgres + web service is the simplest path. Railway, Fly.io, or Koyeb work equally well — point `DATABASE_URL` at the managed DB and deploy `backend/Dockerfile`.

### 2. Frontend → Vercel (free)

1. Vercel → **Add New → Project** → import this repo.
2. Set **Root Directory** to `frontend`. Framework preset: **Vite**.
3. Add an environment variable: `VITE_API_URL = https://<your-render-backend>/api`.
4. Deploy. `vercel.json` handles SPA routing. Your app is live at `https://<project>.vercel.app`.

   (Netlify works the same: base dir `frontend`, build `npm run build`, publish `dist`.)

### 3. Docker images → GHCR (free, automated)

`.github/workflows/docker-publish.yml` builds **both** images and pushes them to the GitHub Container Registry on every push to `main`:

```
ghcr.io/<you>/iom-backend:latest
ghcr.io/<you>/iom-frontend:latest
```

No setup needed — it uses the built-in `GITHUB_TOKEN`. After the first run, open your repo's **Packages** tab and set each package to public if you want a shareable pull URL:

```bash
docker pull ghcr.io/<you>/iom-backend:latest
docker pull ghcr.io/<you>/iom-frontend:latest
```

### Submission checklist

- [ ] GitHub repository link
- [ ] Docker image links (GHCR backend + frontend)
- [ ] Live frontend URL (Vercel)
- [ ] Live backend URL (Render, with `/docs`)

---

## Verified

The following were tested against a real PostgreSQL instance before shipping:

- All CRUD endpoints for products, customers, orders.
- Unique SKU and unique email both return `409`.
- Insufficient-stock orders are rejected with stock left untouched.
- Valid orders reduce stock and compute the correct total.
- Cancelling an order restores stock.
- **10 concurrent orders against 5 units → exactly 5 succeed, 5 rejected, final stock 0** (no overselling).
- Frontend production build compiles cleanly.
"# inventory" 
