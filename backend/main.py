from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from api.router import router

app = FastAPI(title="Doclytics API")

# CORS: In production, set ALLOWED_ORIGINS env var to your Vercel frontend URL
# e.g. "https://doclytics.vercel.app,https://your-custom-domain.com"
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_str == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [o.strip() for o in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring services."""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
