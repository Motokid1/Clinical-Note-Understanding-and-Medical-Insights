import io
from datetime import datetime
from typing import List, Dict, Any

from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter

from config import CHUNK_SIZE, CHUNK_OVERLAP, MONGODB_COLLECTION_NAME
from embeddings import get_embeddings
from db import get_collection


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from PDF bytes without writing to disk."""
    reader = PdfReader(io.BytesIO(file_bytes))
    pages_text = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages_text.append(text.strip())
    return "\n\n".join(pages_text)


def extract_text_from_txt(file_bytes: bytes) -> str:
    """Decode plain text bytes."""
    return file_bytes.decode("utf-8", errors="ignore")


def split_text(text: str) -> List[str]:
    """Split text into semantically meaningful chunks."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_text(text)


def embed_and_store(user_id: str, chunks: List[str]) -> Dict[str, Any]:
    """
    Embed each chunk and persist to MongoDB Atlas.
    Returns summary dict matching the API contract.
    """
    embedding_model = get_embeddings()
    collection = get_collection()
    timestamp_prefix = datetime.utcnow().strftime("%Y%m%d%H%M%S")

    documents = []
    for idx, chunk_text in enumerate(chunks):
        vector = embedding_model.embed_query(chunk_text)
        doc = {
            "chunk_id": f"chunk_{timestamp_prefix}_{idx}",
            "text": chunk_text,
            "embedding": vector,
            "user_id": user_id,
            "metadata": {
                "chunk_index": idx,
                "total_chunks": len(chunks),
                "timestamp": datetime.utcnow().isoformat(),
                "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
            },
        }
        documents.append(doc)

    if documents:
        collection.insert_many(documents)

    return {
        "total_chunks_stored": len(documents),
        "collection": MONGODB_COLLECTION_NAME,
        "message": "Embedding has been created",
        "user_id": user_id,
    }


def ingest_document(user_id: str, file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Full ingestion pipeline:
      1. Extract text (in-memory)
      2. Chunk text
      3. Embed & store in MongoDB
    """
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        text = extract_text_from_pdf(file_bytes)
    else:
        text = extract_text_from_txt(file_bytes)

    if not text.strip():
        raise ValueError("No extractable text found in the uploaded document.")

    chunks = split_text(text)
    return embed_and_store(user_id, chunks)
