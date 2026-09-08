# ArthaSetu Admin Panel — Full Stack

Government admin panel for ArthaSetu (Smart India Hackathon 2026, SIH26092).
FastAPI + PostgreSQL/PostGIS backend, React + Tailwind + Recharts frontend,
seeded with real NSFDC scheme (12) and channel partner (92) data.

**Live demo (frontend only, falls back to local demo data):**
https://frontend-psi-livid-j3kj5o9v24.vercel.app

## Quick start (backend, via Docker)

```bash
docker-compose up
```

This brings up Postgres (with PostGIS), Redis, and the FastAPI backend on
`http://localhost:8000`, seeding the database automatically on first run.
API docs: `http://localhost:8000/docs`.

To re-seed from scratch:
```bash
docker-compose run backend python seed_db.py --reset
```

## Quick start (frontend)

```bash
cd frontend
npm install
cp .env.example .env      # point VITE_API_URL at your backend
npm run dev
```

Open the printed localhost URL. Log in with **any email + any password** —
pick a role from the dropdown (Super Admin, Scheme Manager, Partner
Relationship Manager, Compliance / Auditor, State/Regional Officer, Support
Staff) to see how the RBAC permissions differ.

If the backend isn't running, the login screen falls back to local demo
data automatically so the UI still works standalone.

## Demo admin accounts (seeded)

Any password works in demo mode. Real accounts seeded in the database:

| Email | Role |
|---|---|
| priya.sharma@arthasetu.gov.in | Super Admin |
| data.admin@arthasetu.gov.in | Scheme Manager |
| partner.admin@arthasetu.gov.in | Partner Relationship Manager |
| ml.analyst@arthasetu.gov.in | Compliance / Auditor |
| scheme.admin@arthasetu.gov.in | State/Regional Officer |
| viewer@arthasetu.gov.in | Support Staff |

## Demo data story

The seed data tells one connected story across modules: Mohammad Ashraf
(USR003) missed EMIs on a Micro Credit Finance loan → his account was
blocked → the routing partner's NPA ratio crossed 15% and was suspended →
both actions are in the audit log → both Ashraf and the partner raised
grievances disputing their status. Check Users, Partners, Audit Logs, and
Grievances to see the same story from each angle.

## Project structure

```
/backend           FastAPI app (see backend/README below)
  app/
    routers/        auth, dashboard, users, partners, schemes, applications,
                     reports, audit, grievances
    models.py        SQLAlchemy models
    auth.py           JWT + RBAC permission matrix
  seed_db.py
/frontend           React + Vite + Tailwind admin console
  src/
    App.jsx           Slim app shell — auth state + page routing
    pages/            One component per screen (Dashboard, Schemes,
                      Partners, Partner Router, Users, Data Management,
                      Audit Logs, Grievances, Settings, Login)
    components/       Shared UI (Sidebar, Topbar, DataTable, StatCard,
                      MiniDonut, ConfirmModal, Drawer, Chip, PageHeader)
    lib/              rbac.js, demoData.js, format.js
    api.js            Backend API client
/seed_data          Real NSFDC data + generated demo data (JSON)
docker-compose.yml  Postgres + Redis + FastAPI, one command to run
```

## Deploying

- **Backend**: any Docker host (Render, Railway, Fly.io) — point it at a
  managed Postgres instance and set `DATABASE_URL`, `JWT_SECRET`,
  `CORS_ORIGINS` env vars, then run `python seed_db.py` once.
- **Frontend**: Vercel/Netlify — set `VITE_API_URL` to your deployed
  backend's URL before building.

## Security notes for production

This demo build logs in with any password (`STRICT_AUTH` disabled) to make
the RBAC roles easy to explore in a hackathon demo. Before any real
deployment: enforce real password verification in
`backend/app/routers/auth.py`, rotate `JWT_SECRET`, add MFA per PDF
Section 3, and put the whole stack behind HTTPS.
