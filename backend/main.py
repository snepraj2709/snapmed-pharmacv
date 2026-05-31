from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from backend.api import cases, health, queries
from backend.services.bootstrap import load_bootstrap_case
from backend.storage import storage


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    load_bootstrap_case(storage)
    yield


app = FastAPI(title="SnapMed PharmaCV API", lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: object, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": exc.errors()})


app.include_router(health.router)
app.include_router(cases.router)
app.include_router(queries.router)
