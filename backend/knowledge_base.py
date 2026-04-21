"""
knowledge_base.py
-----------------
Loads the predefined medical JSON knowledge base into MongoDB Atlas
at application startup (idempotent — skips entries already present).

All entries are stored under user_id = SYSTEM_USER_ID so they are
retrievable alongside a real user's uploaded document chunks.
"""

import json
import logging
from datetime import datetime
from pathlib import Path

from embeddings import get_embeddings
from db import get_collection
from config import MONGODB_COLLECTION_NAME

logger = logging.getLogger(__name__)

SYSTEM_USER_ID = "system_knowledge_base"
KB_FILE = Path(__file__).parent / "medical_knowledge_base.json"


def _load_json() -> list[dict]:
    with open(KB_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def is_seeded() -> bool:
    """Check whether the knowledge base has already been seeded."""
    collection = get_collection()
    return collection.count_documents({"user_id": SYSTEM_USER_ID}, limit=1) > 0


def seed_knowledge_base(force: bool = False) -> dict:
    """
    Embed and insert every entry from medical_knowledge_base.json.

    Parameters
    ----------
    force : bool
        If True, re-seed even if records already exist.

    Returns
    -------
    dict  Summary with total_inserted and skipped counts.
    """
    if is_seeded() and not force:
        logger.info("[KB] Knowledge base already seeded — skipping.")
        return {"total_inserted": 0, "skipped": True, "message": "Already seeded"}

    entries = _load_json()
    embedding_model = get_embeddings()
    collection = get_collection()
    timestamp_prefix = datetime.utcnow().strftime("%Y%m%d%H%M%S")

    # If forcing re-seed, wipe existing system docs first
    if force:
        collection.delete_many({"user_id": SYSTEM_USER_ID})
        logger.info("[KB] Cleared existing system knowledge base entries.")

    documents = []
    for idx, entry in enumerate(entries):
        # Build the text that will be embedded and retrieved
        text = (
            f"[{entry.get('category', 'General')}] "
            f"{entry.get('title', '')}: "
            f"{entry.get('content', '')}"
        )
        vector = embedding_model.embed_query(text)

        doc = {
            "chunk_id": f"kb_{timestamp_prefix}_{idx}",
            "text": text,
            "embedding": vector,
            "user_id": SYSTEM_USER_ID,
            "metadata": {
                "source": "system_knowledge_base",
                "kb_id": entry.get("id", f"kb_{idx}"),
                "category": entry.get("category", "General"),
                "title": entry.get("title", ""),
                "chunk_index": idx,
                "total_chunks": len(entries),
                "timestamp": datetime.utcnow().isoformat(),
                "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
            },
        }
        documents.append(doc)

    if documents:
        collection.insert_many(documents)

    logger.info(f"[KB] Seeded {len(documents)} knowledge base entries into '{MONGODB_COLLECTION_NAME}'.")
    return {
        "total_inserted": len(documents),
        "skipped": False,
        "message": f"Seeded {len(documents)} medical knowledge base entries.",
    }
