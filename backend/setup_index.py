"""
Run this script ONCE to create the MongoDB Atlas Vector Search index.

Prerequisites:
  - Your MongoDB Atlas cluster must be M10+ (free tier does NOT support vector search)
  - You must have a database user with readWrite access
  - Set your .env variables before running

Usage:
    python setup_index.py
"""

from dotenv import load_dotenv
load_dotenv()

from pymongo import MongoClient
from config import (
    MONGODB_URI,
    MONGODB_DB_NAME,
    MONGODB_COLLECTION_NAME,
    MONGODB_VECTOR_INDEX_NAME,
    EMBEDDING_DIMENSION,
)

INDEX_DEFINITION = {
    "mappings": {
        "dynamic": True,
        "fields": {
            "embedding": {
                "type": "knnVector",
                "dimensions": EMBEDDING_DIMENSION,
                "similarity": "cosine",
            },
            "user_id": {
                "type": "token",
            },
        },
    }
}


def main():
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DB_NAME]
    collection = db[MONGODB_COLLECTION_NAME]

    # Check if index already exists
    existing = list(collection.list_search_indexes())
    existing_names = [idx.get("name") for idx in existing]

    if MONGODB_VECTOR_INDEX_NAME in existing_names:
        print(f"[INFO] Vector index '{MONGODB_VECTOR_INDEX_NAME}' already exists. Skipping.")
    else:
        collection.create_search_index(
            {
                "name": MONGODB_VECTOR_INDEX_NAME,
                "definition": INDEX_DEFINITION,
            }
        )
        print(f"[OK] Vector search index '{MONGODB_VECTOR_INDEX_NAME}' created successfully.")
        print("[INFO] It may take a few minutes for the index to become active in Atlas.")

    client.close()


if __name__ == "__main__":
    main()
