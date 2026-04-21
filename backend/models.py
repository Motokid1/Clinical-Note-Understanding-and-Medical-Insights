from pydantic import BaseModel, Field
from typing import List, Optional


class IngestResponse(BaseModel):
    total_chunks_stored: int
    collection: str
    message: str
    user_id: str


class QueryRequest(BaseModel):
    user_id: str = Field(..., description="Unique identifier for the user")
    query: str = Field(..., description="Medical query")


class SourceChunk(BaseModel):
    text: str
    chunk_index: int
    page: Optional[int] = None
    source_type: str = "user_document"   # "user_document" | "knowledge_base"
    kb_title: Optional[str] = None
    kb_category: Optional[str] = None


class QueryResponse(BaseModel):
    answer: str
    user_id: str
    query: str
    sources: List[SourceChunk] = []
    context_used: bool


class HealthResponse(BaseModel):
    status: str
    message: str


class DeleteResponse(BaseModel):
    deleted_count: int
    user_id: str
    message: str
