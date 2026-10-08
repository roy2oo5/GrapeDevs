# Singularity Backend (FastAPI)

This directory contains the Python FastAPI backend for the Singularity web template.

## Features
- **FastAPI Framework**: High performance async Python web API.
- **Auto OpenAPI/Swagger Docs**: Interactive docs generated automatically at `/docs`.
- **Pre-configured CORS**: Built-in CORS middleware setup for React frontend on port 5173.
- **Modular Design**: Separated routers (`/api/health`, `/api/items`), Pydantic schemas, and configuration.

## Getting Started

### 1. Create Virtual Environment
```bash
python -m venv venv
```
Activate on Windows:
```bash
.\venv\Scripts\activate
```
Activate on macOS/Linux:
```bash
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run FastAPI Development Server
```bash
python run.py
```
Or directly using Uvicorn:
```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Interactive Documentation
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
