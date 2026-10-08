import os
from typing import List

class Settings:
    PROJECT_NAME: str = os.getenv("APP_NAME", "Singularity FastAPI Template")
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # CORS Origins allowed to talk to FastAPI
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()
