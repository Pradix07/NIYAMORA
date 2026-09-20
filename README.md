# NIYAMORA

**Pre-print Packaging Statutory Compliance Verification Platform**

NIYAMORA automates the verification of packaging artworks against Indian packaging standards (Legal Metrology PCR 2011 and FSSAI 2020) using deterministic versioned rule evaluation, computer vision, and OCR.

---

## Project Structure

```text
NIYAMORA/
├── frontend/          # React 19 + TypeScript + Vite web application
├── backend/           # FastAPI backend + deterministic compliance engine
├── docs/              # Architectural and deployment documentation
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
├── .gitignore
└── README.md
```

---

## Quick Start

### Backend

```bash
# Create and activate virtual environment (optional)
# python -m venv .venv
# .venv\Scripts\activate  (Windows) or source .venv/bin/activate (macOS/Linux)

# Install dependencies
pip install -r backend/requirements.txt

# Run backend server
uvicorn backend.app.main:app --reload --port 8000

# Run backend tests
python -m pytest -q backend/tests
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build

# Run typecheck
npm run typecheck

# Run linter
npm run lint
```

---

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
