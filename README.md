# Singularity Full-Stack Template (ReactJS + FastAPI)

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-ReactJS%2019-61dafb.svg)
![Vite](https://img.shields.io/badge/Bundler-Vite-646cff.svg)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)
![Python](https://img.shields.io/badge/Python-3.11+-3776ab.svg)

A modern, high-performance full-stack starter template pre-configured with a **ReactJS** single-page web app and a **FastAPI** Python asynchronous backend server.

---

## 📁 Repository Structure

```
Singularity/
├── backend/                  # FastAPI Python backend
│   ├── app/                  # Application source
│   │   ├── core/             # Configuration & environment settings
│   │   ├── models/           # Pydantic data schemas
│   │   ├── routers/          # API endpoints (health, items CRUD)
│   │   └── main.py           # FastAPI application instance & CORS
│   ├── Dockerfile            # Backend Docker image setup
│   ├── requirements.txt      # Python dependencies
│   ├── run.py                # Uvicorn launcher script
│   └── README.md             # Backend setup guide
│
├── frontend/                 # ReactJS + Vite frontend
│   ├── src/
│   │   ├── components/       # UI components (Navbar, Hero, ApiTester)
│   │   ├── services/         # API fetch layer connected to FastAPI
│   │   ├── App.jsx           # Main React App layout
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Glassmorphism dark mode design system
│   ├── Dockerfile            # Frontend Docker image setup
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite dev server & proxy settings
│   └── README.md             # Frontend setup guide
│
├── machine_learning/         # Machine Learning module
│   ├── model_demo.py         # Sample inference script
│   ├── requirements.txt      # ML library dependencies
│   └── README.md             # ML integration guide
│
├── docker-compose.yml        # Docker composition setup
├── .gitignore                # Root git ignore rules
└── README.md                 # Project documentation
```

---

## 🚀 Quick Start Guide

### Option 1: Run Locally

#### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python run.py
```
- **Backend URL**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 2. Frontend (ReactJS)
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
- **Frontend URL**: [http://localhost:5173](http://localhost:5173)

---

### Option 2: Run with Docker Compose

```bash
docker-compose up --build
```
Access the application at `http://localhost:5173`.

---

## ⚡ API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root API status & doc link |
| `GET` | `/api/health` | System health check & uptime telemetry |
| `GET` | `/api/items` | Retrieve list of items |
| `POST` | `/api/items` | Create new item |
| `DELETE` | `/api/items/{id}` | Delete item by ID |

---

## 🎨 Frontend Design & Theme

The React app features a custom glassmorphism design system built with vanilla CSS design variables:
- Dark mode theme with glowing radial mesh gradients
- Google Fonts: `Outfit` (Headings), `Plus Jakarta Sans` (Body), `JetBrains Mono` (Code)
- Interactive API Telemetry explorer & live item state updates
- Responsive layout for desktop and mobile viewports

---

## 🤝 Contributing & License
Developed as part of the **Roy2oo5 / GrapeDevs** repository. Feel free to clone, customize, and extend!
