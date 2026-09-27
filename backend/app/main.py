from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings
from app.api import documents, tenders, bids, self_check, auth, bidders, clarifications, notifications
import logging

app = FastAPI(title="GemOne API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    try:
        pass
    except Exception as e:
        logging.error(f"Migration failed: {e}")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(tenders.router, prefix="/api/v1/tenders", tags=["tenders"])
app.include_router(bids.router, prefix="/api/v1/bids", tags=["bids"])
app.include_router(bidders.router, prefix="/api/v1/bidders", tags=["bidders"])
app.include_router(self_check.router, prefix="/api/v1/self-check", tags=["self-check"])
app.include_router(clarifications.router, prefix="/api/v1/clarifications", tags=["clarifications"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    err_msg = traceback.format_exc()
    print(f"GLOBAL ERROR: {err_msg}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": err_msg},
        headers={"Access-Control-Allow-Origin": "*"}
    )
