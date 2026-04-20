from functools import lru_cache
from langchain_groq import ChatGroq
from config import GROQ_API_KEY, LLM_MODEL_NAME


@lru_cache(maxsize=1)
def get_llm() -> ChatGroq:
    """Singleton Groq LLM instance."""
    return ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name=LLM_MODEL_NAME,
        temperature=0.1,
        max_tokens=1024,
    )
