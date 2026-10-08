# Machine Learning Module

This directory is reserved for training pipelines, model artifacts, datasets, and inference modules that integrate directly with the FastAPI backend.

## Structure
- `model_demo.py`: Sample inference baseline classifier script.
- `requirements.txt`: Common ML libraries (`numpy`, `pandas`, `scikit-learn`).

## Integration with FastAPI
To serve ML predictions from your FastAPI backend:
1. Import model inference functions inside `backend/app/routers/`
2. Add a new endpoint (e.g. `POST /api/predict`) in `backend/app/routers/`
