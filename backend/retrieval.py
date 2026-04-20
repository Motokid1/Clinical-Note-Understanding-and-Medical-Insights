from typing import Dict, Any, List

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from db import get_vector_store, get_collection
from llm import get_llm
from config import RETRIEVAL_TOP_K

# ---------------------------------------------------------------------------
# Guardrailed prompt template
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are a medical information assistant. Your sole purpose is to help users \
understand the content of their uploaded clinical notes and medical documents.

STRICT RULES you must follow without exception:
1. Answer ONLY based on the provided context from the user's documents.
2. If the context does not contain enough information to answer, reply exactly: \
"I'm sorry, but I couldn't find relevant information in your uploaded documents to answer that question."
3. Do NOT provide diagnoses, treatment recommendations, or prescriptions.
4. Do NOT use any external medical knowledge beyond what is in the context.
5. Do NOT hallucinate or invent medical facts.
6. Always remind the user that this is informational only and not a substitute for professional medical advice.

Context from uploaded clinical documents:
{context}
"""

HUMAN_TEMPLATE = "Question: {question}"

REFUSAL_MESSAGE = (
    "I'm sorry, but I couldn't find relevant information in your uploaded documents "
    "to answer that question. Please ensure your clinical notes have been uploaded "
    "and try rephrasing your query."
)


def _format_docs(docs) -> str:
    return "\n\n---\n\n".join(doc.page_content for doc in docs)


def retrieve_for_user(user_id: str, query: str, top_k: int = RETRIEVAL_TOP_K) -> List:
    """Retrieve top-k relevant chunks for a specific user."""
    vector_store = get_vector_store()
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": top_k,
            "pre_filter": {"user_id": {"$eq": user_id}},
        },
    )
    return retriever.invoke(query)


def answer_query(user_id: str, query: str) -> Dict[str, Any]:
    """
    Full RAG pipeline with guardrails.
    Returns answer, sources, and metadata.
    """
    docs = retrieve_for_user(user_id, query)

    if not docs:
        return {
            "answer": REFUSAL_MESSAGE,
            "user_id": user_id,
            "query": query,
            "sources": [],
            "context_used": False,
        }

    context_text = _format_docs(docs)

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

    sources = []
    for doc in docs:
        meta = doc.metadata or {}
        sources.append({
            "text": doc.page_content[:300] + ("..." if len(doc.page_content) > 300 else ""),
            "chunk_index": meta.get("chunk_index", 0),
            "page": meta.get("page", None),
        })

    return {
        "answer": answer,
        "user_id": user_id,
        "query": query,
        "sources": sources,
        "context_used": True,
    }
