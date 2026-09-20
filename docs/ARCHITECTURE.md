# NIYAMORA Architecture

This document describes the high-level architecture and technology stack of NIYAMORA.

## Repository Layout (Monorepo)

```text
NIYAMORA/
├── frontend/          # React + Vite + TypeScript web application
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/           # FastAPI backend & compliance engine
│   ├── app/
│   ├── tests/
│   ├── requirements.txt
│   └── storage/
├── docs/              # Architectural and deployment documentation
├── .gitignore
└── README.md
```

## Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Bundler / Build**: Vite
- **Routing**: React Router
- **Icons & Styling**: Lucide React + Tailored Modern CSS Design System

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **ORM**: SQLAlchemy
- **Data Validation**: Pydantic v2
- **Testing**: pytest

### Database
- **Development**: SQLite (`sqlite:///./niyamora_dev.db`)
- **Production**: PostgreSQL

### Compliance Engine
- **Engine**: Deterministic versioned rule engine (`backend/app/rules/`)
- **Rule Sets**: Legal Metrology Packaged Commodities Rules (PCR 2011) & FSSAI (2020) packaging regulations

### Processing & Extraction
- **PDF Extraction**: PyMuPDF (`fitz`)
- **OCR Engine**: Tesseract OCR
- **Image Processing**: OpenCV (`cv2`) + Pillow (`PIL`)
