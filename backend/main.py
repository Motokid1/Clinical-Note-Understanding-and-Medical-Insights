import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import IngestResponse, QueryRequest, QueryResponse, HealthResponse, DeleteResponse
from ingestion import ingest_document
from retrieval import answer_query
from db import get_collection
from knowledge_base import seed_knowledge_base

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Startup: seed predefined knowledge base (idempotent)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[Startup] Seeding medical knowledge base...")
    try:
        result = seed_knowledge_base()
        logger.info(f"[Startup] KB seed result: {result}")
    except Exception as exc:
        logger.error(f"[Startup] KB seeding failed: {exc}")
    yield
    logger.info("[Shutdown] ClinicalRAG API shutting down.")


app = FastAPI(
    title="Clinical Note Understanding API",
    description=(
        "RAG-based medical insight extraction from clinical documents. "
        "Answers are grounded in uploaded notes AND a predefined medical knowledge base."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Clinical RAG API is running."}


# ---------------------------------------------------------------------------
# Ingestion
# ---------------------------------------------------------------------------
@app.post("/ingest", response_model=IngestResponse, tags=["Ingestion"])
async def ingest(
    user_id: str = Form(..., description="Unique user identifier"),
    file: UploadFile = File(..., description="PDF or TXT clinical document"),
):
    """
    Upload a clinical document. Processed entirely in-memory —
    nothing is written to disk.
    """
    allowed_types = {"application/pdf", "text/plain"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Only PDF and TXT are accepted.",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = ingest_document(user_id=user_id, file_bytes=file_bytes, filename=file.filename)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(exc)}")

    return result


# ---------------------------------------------------------------------------
# Query / RAG
# ---------------------------------------------------------------------------
@app.post("/query", response_model=QueryResponse, tags=["Query"])
def query(request: QueryRequest):
    """
    Submit a medical query. Context is retrieved from BOTH the user's
    uploaded documents and the predefined medical knowledge base.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")

    try:
        result = answer_query(user_id=request.user_id, query=request.query)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(exc)}")

    return result


# ---------------------------------------------------------------------------
# Admin: re-seed knowledge base
# ---------------------------------------------------------------------------
@app.post("/admin/reseed-knowledge-base", tags=["Admin"])
def reseed_knowledge_base():
    """
    Force re-seed the predefined medical knowledge base.
    Clears existing system entries and re-embeds from the JSON file.
    """
    try:
        result = seed_knowledge_base(force=True)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Re-seed failed: {str(exc)}")
    return result


# ---------------------------------------------------------------------------
# Knowledge base stats
# ---------------------------------------------------------------------------
@app.get("/knowledge-base/stats", tags=["Admin"])
def knowledge_base_stats():
    """Return how many entries are currently seeded in the knowledge base."""
    from knowledge_base import SYSTEM_USER_ID
    collection = get_collection()
    count = collection.count_documents({"user_id": SYSTEM_USER_ID})
    categories = collection.distinct("metadata.category", {"user_id": SYSTEM_USER_ID})
    return {
        "total_entries": count,
        "categories": categories,
        "user_id": SYSTEM_USER_ID,
    }


# ---------------------------------------------------------------------------
# User management
# ---------------------------------------------------------------------------
@app.delete("/users/{user_id}/documents", response_model=DeleteResponse, tags=["Management"])
def delete_user_documents(user_id: str):
    """Delete all stored chunks for a specific user."""
    collection = get_collection()
    result = collection.delete_many({"user_id": user_id})
    return {
        "deleted_count": result.deleted_count,
        "user_id": user_id,
        "message": f"Deleted {result.deleted_count} chunk(s) for user '{user_id}'.",
    }


@app.get("/users", tags=["Management"])
def list_users():
    """Return distinct user IDs that have stored documents (excludes system)."""
    from knowledge_base import SYSTEM_USER_ID
    collection = get_collection()
    user_ids = [u for u in collection.distinct("user_id") if u != SYSTEM_USER_ID]
    return {"users": user_ids, "count": len(user_ids)}
