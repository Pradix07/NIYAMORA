# NIYAMORA Deployment Guide

This document outlines the deployment topology for NIYAMORA on Render.

## Deployment Topology

```text
Render Static Site (Frontend)
       │
       ▼ (HTTPS / REST API)
Render Web Service (FastAPI Backend)
       │
       ▼ (SQLAlchemy / psycopg2)
Render PostgreSQL Database
```

## Service Configurations

### 1. Frontend — Render Static Site
- **Repository**: NIYAMORA
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: URL of the deployed Render FastAPI Web Service (e.g. `https://niyamora-api.onrender.com`)

### 2. Backend — Render Web Service (FastAPI)
- **Repository**: NIYAMORA
- **Root Directory**: `.` (or `backend`)
- **Runtime**: Python 3.10+
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `DATABASE_URL`: Connection string to Render PostgreSQL
  - `SECRET_KEY`: Secure random string for JWT signing
  - `ENVIRONMENT`: `production`

### 3. Database — Render PostgreSQL
- Managed PostgreSQL instance configured and linked to the backend service via `DATABASE_URL`.

## Storage Note for Production

> [!IMPORTANT]
> Uploaded artwork files and generated inspection artifacts require persistent or object storage in production (e.g. AWS S3, Cloudflare R2, or attached persistent disks) as ephemeral container file systems are cleared upon restarts and redeployments.
