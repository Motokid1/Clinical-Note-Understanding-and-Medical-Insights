from functools import lru_cache
from pymongo import MongoClient
from langchain_mongodb import MongoDBAtlasVectorSearch
from config import (
    MONGODB_URI,
    MONGODB_DB_NAME,
    MONGODB_COLLECTION_NAME,
    MONGODB_VECTOR_INDEX_NAME,
)
from embeddings import get_embeddings


@lru_cache(maxsize=1)
def get_mongo_client() -> MongoClient:
    """Singleton MongoDB client."""
    return MongoClient(MONGODB_URI)


def get_collection():
    client = get_mongo_client()
    db = client[MONGODB_DB_NAME]
    return db[MONGODB_COLLECTION_NAME]


def get_vector_store() -> MongoDBAtlasVectorSearch:
    """Return a LangChain MongoDBAtlasVectorSearch instance."""
    collection = get_collection()
    return MongoDBAtlasVectorSearch(
        collection=collection,
        embedding=get_embeddings(),
        index_name=MONGODB_VECTOR_INDEX_NAME,
        text_key="text",
        embedding_key="embedding",
    )
