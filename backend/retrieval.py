"""
retrieval.py
------------
RAG query pipeline.

Context is assembled from TWO sources (in priority order):
  1. The user's own uploaded document chunks  (user_id = <actual user>)
  2. The predefined medical knowledge base     (user_id = SYSTEM_USER_ID)

Both sets of chunks are merged and injected into the guardrailed prompt
before being sent to the Groq LLM.
"""

from typing import Dict, Any, List

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from db import get_vector_store
from llm import get_llm
from config import RETRIEVAL_TOP_K
from knowledge_base import SYSTEM_USER_ID

# ---------------------------------------------------------------------------
# Guardrailed prompt
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are a medical information assistant. Your sole purpose is to help users \
understand the content of their uploaded clinical notes and medical documents, \
supplemented by a curated medical knowledge base.

STRICT RULES you must follow without exception:
1. Answer ONLY based on the provided context — this includes the user's uploaded documents \
and the predefined medical knowledge base excerpts shown below.
2. If the combined context does not contain enough information to answer, reply exactly: \
"I'm sorry, but I couldn't find relevant information in your documents or the medical knowledge base to answer that question."
3. Do NOT provide diagnoses, treatment recommendations, or prescriptions.
4. Do NOT use any knowledge beyond what is explicitly present in the context below.
5. Do NOT hallucinate or invent medical facts.
6. When the answer comes from the knowledge base, you may cite the category and title \
(e.g. "According to the medication reference for Paracetamol...").
7. Always remind the user that this is informational only and not a substitute \
for professional medical advice.

--- CONTEXT START ---
{context}
--- CONTEXT END ---
"""

HUMAN_TEMPLATE = "Question: {question}"

REFUSAL_MESSAGE = (
    "I'm sorry, but I couldn't find relevant information in your documents or the "
    "medical knowledge base to answer that question. Please ensure your clinical notes "
    "have been uploaded and try rephrasing your query."
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _retrieve_by_user(user_id: str, query: str, top_k: int) -> List:
    """Retrieve top-k chunks filtered to a specific user_id."""
    vector_store = get_vector_store()
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": top_k,
            "pre_filter": {"user_id": {"$eq": user_id}},
        },
    )
    return retriever.invoke(query)


def _format_docs(docs: List, label: str) -> str:
    return "\n\n".join(f"[{label}]\n{doc.page_content}" for doc in docs)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def answer_query(user_id: str, query: str) -> Dict[str, Any]:
    """
    Full RAG pipeline with merged context from:
      - user's uploaded document chunks
      - system medical knowledge base chunks
    """
    # 1. Retrieve from the user's own uploaded documents
    user_docs = _retrieve_by_user(user_id, query, top_k=RETRIEVAL_TOP_K)

    # 2. Retrieve from the predefined system knowledge base
    kb_docs = _retrieve_by_user(SYSTEM_USER_ID, query, top_k=RETRIEVAL_TOP_K)

    all_docs = user_docs + kb_docs

    if not all_docs:
        return {
            "answer": REFUSAL_MESSAGE,
            "user_id": user_id,
            "query": query,
            "sources": [],
            "context_used": False,
        }

    # 3. Build labelled merged context
    parts = []
    if user_docs:
        parts.append(_format_docs(user_docs, "User Document"))
    if kb_docs:
        parts.append(_format_docs(kb_docs, "Medical Knowledge Base"))
    context_text = "\n\n".join(parts)

    # 4. Guardrailed prompt + LLM chain
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", HUMAN_TEMPLATE),
    ])

    chain = (
        {"context": lambda _: context_text, "question": RunnablePassthrough()}
        | prompt
        | get_llm()
        | StrOutputParser()
    )

    answer = chain.invoke(query)

    # 5. Build structured sources for the frontend
    sources = []
    for doc in user_docs:
        meta = doc.metadata or {}
        sources.append({
            "text": doc.page_content[:300] + ("..." if len(doc.page_content) > 300 else ""),
            "chunk_index": meta.get("chunk_index", 0),
            "page": meta.get("page", None),
            "source_type": "user_document",
        })
    for doc in kb_docs:
        meta = doc.metadata or {}
        sources.append({
            "text": doc.page_content[:300] + ("..." if len(doc.page_content) > 300 else ""),
            "chunk_index": meta.get("chunk_index", 0),
            "page": None,
            "source_type": "knowledge_base",
            "kb_title": meta.get("title", ""),
            "kb_category": meta.get("category", ""),
        })

    return {
        "answer": answer,
        "user_id": user_id,
        "query": query,
        "sources": sources,
        "context_used": True,
    }
