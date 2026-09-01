from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1 import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Doctor Assistant API",
    description="Production-ready Doctor Management SaaS API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get(settings.API_V1_PREFIX)
async def api_root():
    return {"status": "ok", "service": "Doctor Assistant API", "version": "v1"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}
