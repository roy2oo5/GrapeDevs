import uvicorn
import os

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Starting Singularity FastAPI server on http://{host}:{port}")
    print(f"📖 Swagger documentation available at http://{host}:{port}/docs")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
