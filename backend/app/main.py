import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, users, partners, schemes, applications, reports, audit, grievances, dashboard, public

app = FastAPI(
    title="ArthaSetu Admin API",
    description="Government admin panel backend for ArthSetu — Smart India Hackathon 2026 (SIH26092)",
    version="1.0.0",
)

# CORS: allow the frontend dev server / deployed frontend origin
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(users.router)
app.include_router(partners.router)
app.include_router(schemes.router)
app.include_router(applications.router)
app.include_router(reports.router)
app.include_router(audit.router)
app.include_router(grievances.router)
app.include_router(public.router)


@app.get("/")
def root():
    return {
        "service": "ArthaSetu Admin API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
