import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "clinical_rag_db")
MONGODB_COLLECTION_NAME = os.getenv("MONGODB_COLLECTION_NAME", "clinical_notes_mongo_collection")
MONGODB_VECTOR_INDEX_NAME = os.getenv("MONGODB_VECTOR_INDEX_NAME", "vector_index")

LLM_MODEL_NAME = "llama-3.3-70b-versatile"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIMENSION = 384

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
RETRIEVAL_TOP_K = 5
