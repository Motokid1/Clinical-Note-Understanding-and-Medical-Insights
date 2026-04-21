import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import SourceChunks from "../components/SourceChunks.jsx";
import { queryDocuments } from "../utils/api.js";

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 160px)",
    maxWidth: "780px",
    margin: "0 auto",
    padding: "1.5rem 2rem",
    gap: "1rem",
    animation: "fade-in-up 0.3s ease both",
  },
  heading: {
    fontFamily: "var(--font-display)",
    fontSize: "1.7rem",
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
    flexShrink: 0,
  },
  subheading: {
    fontSize: "0.82rem",
    color: "var(--text-muted)",
    marginTop: "0.2rem",
    flexShrink: 0,
  },
  chatArea: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    paddingRight: "0.25rem",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    color: "var(--text-muted)",
    textAlign: "center",
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: "14px",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: "1rem",
    fontFamily: "var(--font-display)",
    color: "var(--text-secondary)",
  },
  emptySub: {
    fontSize: "0.78rem",
    color: "var(--text-muted)",
    lineHeight: 1.6,
    maxWidth: "320px",
  },
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
    justifyContent: "center",
    marginTop: "0.5rem",
  },
  suggestion: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "0.35rem 0.85rem",
    fontSize: "0.75rem",
    color: "var(--text-secondary)",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    transition: "border-color 0.15s, color 0.15s",
  },
  msgUser: {
    alignSelf: "flex-end",
    background: "var(--teal-glow)",
    border: "1px solid var(--teal-dim)",
    borderRadius: "var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)",
    padding: "0.75rem 1.1rem",
    maxWidth: "70%",
    fontSize: "0.88rem",
    color: "var(--text-primary)",
    animation: "fade-in-up 0.2s ease both",
  },
  msgAssistant: {
    alignSelf: "flex-start",
    background: "var(--bg-card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "4px var(--radius-lg) var(--radius-lg) var(--radius-lg)",
    padding: "1rem 1.25rem",
    maxWidth: "85%",
    animation: "fade-in-up 0.25s ease both",
  },
  msgMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.6rem",
  },
  assistantLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.68rem",
    color: "var(--teal-bright)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  noContext: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.68rem",
    color: "var(--amber)",
    background: "var(--amber-dim)",
    padding: "0.15rem 0.5rem",
    borderRadius: "20px",
    border: "1px solid rgba(245,158,11,0.3)",
  },
  answerText: {
    fontSize: "0.88rem",
    color: "var(--text-primary)",
    lineHeight: 1.75,
  },
  thinkingDots: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    padding: "0.6rem 0",
  },
  dot: (i) => ({
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "var(--teal-dim)",
    animation: `blink 1.2s ${i * 0.2}s infinite`,
  }),
  inputArea: {
    flexShrink: 0,
    display: "flex",
    gap: "0.75rem",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "0.75rem 1rem",
    transition: "border-color 0.2s",
  },
  textarea: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "0.9rem",
    resize: "none",
    lineHeight: 1.5,
    minHeight: "24px",
    maxHeight: "120px",
  },
  sendBtn: (canSend) => ({
    flexShrink: 0,
    width: 40,
    height: 40,
    borderRadius: "10px",
    border: "none",
    background: canSend
      ? "linear-gradient(135deg, var(--teal-mid), var(--teal-dim))"
      : "var(--bg-elevated)",
    color: canSend ? "#0b0f0e" : "var(--text-muted)",
    cursor: canSend ? "pointer" : "not-allowed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    transition: "opacity 0.2s",
    boxShadow: canSend ? "0 0 12px rgba(45,212,191,0.25)" : "none",
  }),
  safetyNote: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.7rem",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    justifyContent: "center",
  },
};

const SUGGESTIONS = [
  "Summarise the key findings",
  "What medications are mentioned?",
  "List all diagnoses noted",
  "What were the vital signs?",
];

export default function QueryPage({ userId, addToast }) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendQuery = async (queryText) => {
    const q = (queryText || inputVal).trim();
    if (!q || !userId || loading) return;
    if (!userId) { addToast("Please enter a User ID first.", "error"); return; }

    setInputVal("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      const data = await queryDocuments(userId, q);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          sources: data.sources,
          contextUsed: data.context_used,
        },
      ]);
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Query failed.";
      addToast(msg, "error");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "An error occurred while processing your query.", sources: [], contextUsed: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const canSend = !!inputVal.trim() && !!userId && !loading;

  return (
    <div style={styles.page}>
      <div>
        <h1 style={styles.heading}>Query Clinical Notes</h1>
        <p style={styles.subheading}>
          Ask questions about your uploaded documents. Answers are grounded strictly in your clinical data.
        </p>
      </div>

      <div style={styles.chatArea}>
        {messages.length === 0 && !loading ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div style={styles.emptyTitle}>Ask your clinical notes anything</div>
            <p style={styles.emptySub}>
              Upload a document first, then ask questions about medications, diagnoses, symptoms, or any information within your notes.
            </p>
            <div style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  style={styles.suggestion}
                  onClick={() => sendQuery(s)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--teal-dim)";
                    e.currentTarget.style.color = "var(--teal-bright)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <div key={i} style={styles.msgUser}>{msg.text}</div>
              ) : (
                <div key={i} style={styles.msgAssistant}>
                  <div style={styles.msgMeta}>
                    <span style={styles.assistantLabel}>ClinicalRAG</span>
                    {!msg.contextUsed && (
                      <span style={styles.noContext}>no context found</span>
                    )}
                  </div>
                  <div style={styles.answerText}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  <SourceChunks sources={msg.sources} />
                </div>
              )
            )}
            {loading && (
              <div style={styles.msgAssistant}>
                <div style={styles.msgMeta}>
                  <span style={styles.assistantLabel}>ClinicalRAG</span>
                </div>
                <div style={styles.thinkingDots}>
                  {[0, 1, 2].map((i) => <span key={i} style={styles.dot(i)} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      <div
        style={styles.inputArea}
        onFocus={(e) => e.currentTarget.style.borderColor = "var(--teal-dim)"}
        onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
      >
        <textarea
          ref={textareaRef}
          style={styles.textarea}
          placeholder={userId ? "Ask about your clinical notes… (Enter to send)" : "Set a User ID above first…"}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); autoResize(e); }}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={!userId}
        />
        <button style={styles.sendBtn(canSend)} onClick={() => sendQuery()} disabled={!canSend}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <div style={styles.safetyNote}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Informational only · Not a substitute for professional medical advice · Responses grounded in your documents
      </div>
    </div>
  );
}
