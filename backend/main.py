from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from models import IngestResponse, QueryRequest, QueryResponse, HealthResponse, DeleteResponse
from ingestion import ingest_document
from retrieval import answer_query
from db import get_collection

app = FastAPI(
    title="Clinical Note Understanding API",
    description="RAG-based medical insight extraction from clinical documents.",
    version="1.0.0",
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
    Upload a clinical document for a given user.
    The file is processed entirely in-memory — nothing is written to disk.
    Text is extracted, chunked, embedded, and stored in MongoDB Atlas.
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
    Submit a medical query. The system retrieves relevant chunks from the
    user's uploaded documents and generates a context-grounded, safe response.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")

    try:
        result = answer_query(user_id=request.user_id, query=request.query)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(exc)}")

    return result


# ---------------------------------------------------------------------------
# Delete user data
# ---------------------------------------------------------------------------
@app.delete("/users/{user_id}/documents", response_model=DeleteResponse, tags=["Management"])
def delete_user_documents(user_id: str):
    """
    Delete all stored chunks for a specific user from MongoDB.
    """
    collection = get_collection()
    result = collection.delete_many({"user_id": user_id})
    return {
        "deleted_count": result.deleted_count,
        "user_id": user_id,
        "message": f"Deleted {result.deleted_count} chunk(s) for user '{user_id}'.",
    }


# ---------------------------------------------------------------------------
# List users (utility)
# ---------------------------------------------------------------------------
@app.get("/users", tags=["Management"])
def list_users():
    """Return distinct user IDs that have stored documents."""
    collection = get_collection()
    user_ids = collection.distinct("user_id")
    return {"users": user_ids, "count": len(user_ids)}
