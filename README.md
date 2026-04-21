# ClinicalRAG — Medical Insight Extraction

A production-grade **Retrieval-Augmented Generation (RAG)** system for ingesting clinical notes and answering medical queries grounded strictly in your uploaded documents.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  React + Vite Frontend (port 5173)                              │
│   ├── Upload Tab  →  POST /ingest  (multipart/form-data)        │
│   └── Query Tab   →  POST /query   (JSON)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼────────────────────────────────────────┐
│  FastAPI Backend (port 8000)                                     │
│                                                                  │
│  Ingestion Pipeline                                              │
│   PDF/TXT → PyPDF → Text Splitter → Embeddings → MongoDB Atlas  │
│                                                                  │
│  Knowledge Base Pipeline (Startup)                               │
│   JSON KB → Embeddings → MongoDB Atlas (SYSTEM_USER_ID scope)   │
│                                                                  │
│  Query Pipeline                                                  │
│   User Query → Embed Query                                       │
│        ↓                                                         │
│   Retrieve from:                                                 │
│     1. User Documents                                            │
│     2. Knowledge Base                                            │
│        ↓                                                         │
│   Merge Context → Guardrailed Prompt → Groq LLM → JSON Response  │
└─────────────────────────────────────────────────────────────────┘
```

🧠 Key Concept: Dual-Source Retrieval

Unlike traditional RAG, this system retrieves from two sources simultaneously:

Source Scope Purpose
User Documents user_id = actual user Personalized clinical data
Knowledge Base user_id = system_knowledge_base General medical reference

👉 Both are merged into a single context before LLM processing
👉 Implemented in retrieval pipeline
**Stack:**

- **Backend:** Python · FastAPI · LangChain Core · PyPDF
- **LLM:** Groq (`llama-3.3-70b-versatile`)
- **Embeddings:** `sentence-transformers/all-MiniLM-L6-v2` (384-dim)
- **Vector DB:** MongoDB Atlas Vector Search
- **Frontend:** React 18 · Vite

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB Atlas cluster (M10+ for Vector Search)
- Groq API key — [https://console.groq.com](https://console.groq.com)

---

## Backend Setup

```bash
cd backend

# 1. Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Create MongoDB Atlas vector search index (run once)
python setup_index.py

# 5. Start the API server
uvicorn main:app --reload --port 8000
```

### Environment Variables (`backend/.env`)

| Variable                    | Description                                                  |
| --------------------------- | ------------------------------------------------------------ |
| `GROQ_API_KEY`              | Your Groq API key                                            |
| `MONGODB_URI`               | MongoDB Atlas connection string                              |
| `MONGODB_DB_NAME`           | Database name (default: `clinical_rag_db`)                   |
| `MONGODB_COLLECTION_NAME`   | Collection name (default: `clinical_notes_mongo_collection`) |
| `MONGODB_VECTOR_INDEX_NAME` | Atlas vector index name (default: `vector_index`)            |

---

## Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit VITE_API_URL if your backend runs on a different port

# 3. Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## API Reference

### `GET /health`

Returns API status.

### `POST /ingest`

Upload a clinical document.

**Form Data:**

- `user_id` (string) — unique user identifier
- `file` (file) — PDF or TXT document

**Response:**

```json
{
  "total_chunks_stored": 12,
  "collection": "clinical_notes_mongo_collection",
  "message": "Embedding has been created",
  "user_id": "patient_001"
}
```

### `POST /query`

Query the user's uploaded documents.

**Body:**

```json
{
  "user_id": "patient_001",
  "query": "What medications were prescribed?"
}
```

**Response:**

```json
{
  "answer": "Based on the uploaded clinical notes...",
  "user_id": "patient_001",
  "query": "What medications were prescribed?",
  "sources": [{ "text": "...", "chunk_index": 3, "page": 1 }],
  "context_used": true
}
```

### `DELETE /users/{user_id}/documents`

Delete all stored chunks for a user.

### `GET /users`

List all users with stored documents.

---

## Safety & Guardrails

- **No diagnosis or treatment advice** — LLM is explicitly instructed not to provide clinical decisions
- **Context-bound responses** — answers are grounded only in the uploaded documents
- **Refusal policy** — if no relevant context is found, a safe refusal message is returned
- **In-memory processing** — uploaded files are never persisted to disk
- **User-scoped data** — retrieval is filtered by `user_id` so users only see their own documents

---

## MongoDB Atlas Vector Index

The index is created automatically via `setup_index.py`. It uses:

- **Dimensions:** 384 (matching `all-MiniLM-L6-v2`)
- **Similarity:** cosine
- **Pre-filter field:** `user_id` (token type) for user-scoped retrieval
