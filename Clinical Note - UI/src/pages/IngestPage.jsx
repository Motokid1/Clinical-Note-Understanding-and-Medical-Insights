import React, { useState } from "react";
import UploadZone from "../components/UploadZone.jsx";
import { ingestDocument } from "../utils/api.js";

const styles = {
  page: {
    padding: "2rem",
    maxWidth: "680px",
    margin: "0 auto",
    animation: "fade-in-up 0.3s ease both",
  },
  heading: {
    fontFamily: "var(--font-display)",
    fontSize: "1.7rem",
    color: "var(--text-primary)",
    marginBottom: "0.35rem",
    letterSpacing: "-0.02em",
  },
  subheading: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    marginBottom: "2rem",
    lineHeight: 1.6,
  },
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-lg)",
    padding: "1.75rem",
    boxShadow: "var(--shadow-card)",
  },
  progressWrap: {
    marginTop: "1.25rem",
  },
  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.4rem",
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },
  progressBar: {
    height: "4px",
    background: "var(--bg-elevated)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressFill: (pct) => ({
    height: "100%",
    width: `${pct}%`,
    background: "linear-gradient(90deg, var(--teal-dim), var(--teal-bright))",
    borderRadius: "2px",
    transition: "width 0.3s ease",
    boxShadow: "0 0 8px rgba(45,212,191,0.4)",
  }),
  btn: (disabled) => ({
    marginTop: "1.25rem",
    width: "100%",
    padding: "0.8rem",
    borderRadius: "var(--radius)",
    border: "none",
    background: disabled
      ? "var(--bg-elevated)"
      : "linear-gradient(135deg, var(--teal-mid), var(--teal-dim))",
    color: disabled ? "var(--text-muted)" : "#0b0f0e",
    fontFamily: "var(--font-body)",
    fontWeight: "500",
    fontSize: "0.9rem",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "opacity 0.2s, transform 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    boxShadow: disabled ? "none" : "var(--shadow-glow)",
  }),
  spinner: {
    width: 16,
    height: 16,
    border: "2px solid rgba(11,15,14,0.3)",
    borderTopColor: "#0b0f0e",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  resultCard: {
    marginTop: "1.5rem",
    background: "rgba(13,148,136,0.08)",
    border: "1px solid var(--teal-dim)",
    borderRadius: "var(--radius-lg)",
    padding: "1.25rem 1.5rem",
    animation: "fade-in-up 0.3s ease both",
  },
  resultTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.72rem",
    color: "var(--teal-bright)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  statRow: {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
  },
  statVal: {
    fontSize: "1.4rem",
    fontFamily: "var(--font-display)",
    color: "var(--teal-bright)",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "0.7rem",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  infoBox: {
    marginTop: "1.5rem",
    padding: "1rem 1.25rem",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius)",
    fontSize: "0.78rem",
    color: "var(--text-muted)",
    lineHeight: 1.7,
    display: "flex",
    gap: "0.75rem",
    alignItems: "flex-start",
  },
};

export default function IngestPage({ userId, addToast }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const canSubmit = !!userId && !!file && !loading;

  const handleIngest = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setProgress(0);
    setResult(null);

    try {
      const data = await ingestDocument(userId, file, (evt) => {
        if (evt.total) {
          setProgress(Math.round((evt.loaded / evt.total) * 80));
        }
      });
      setProgress(100);
      setResult(data);
      addToast(`${data.total_chunks_stored} chunks stored successfully.`, "success");
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Ingestion failed.";
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Upload Clinical Notes</h1>
      <p style={styles.subheading}>
        Upload a PDF or plain-text clinical document. The file is processed entirely
        in-memory — nothing is persisted to disk. Extracted text is chunked,
        embedded, and stored in the vector database for retrieval.
      </p>

      <div style={styles.card}>
        <UploadZone file={file} setFile={setFile} />

        {loading && (
          <div style={styles.progressWrap}>
            <div style={styles.progressLabel}>
              <span>Processing…</span>
              <span>{progress}%</span>
            </div>
            <div style={styles.progressBar}>
              <div style={styles.progressFill(progress)} />
            </div>
          </div>
        )}

        <button
          style={styles.btn(!canSubmit)}
          disabled={!canSubmit}
          onClick={handleIngest}
          onMouseEnter={(e) => { if (canSubmit) e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          {loading ? (
            <>
              <div style={styles.spinner} />
              Ingesting document…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Ingest Document
            </>
          )}
        </button>
      </div>

      {result && (
        <div style={styles.resultCard}>
          <div style={styles.resultTitle}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Ingestion Complete
          </div>
          <div style={styles.statRow}>
            <div style={styles.stat}>
              <span style={styles.statVal}>{result.total_chunks_stored}</span>
              <span style={styles.statLabel}>Chunks Stored</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statVal} title={result.collection} style={{ ...styles.statVal, fontSize: "0.9rem", paddingTop: "0.2rem" }}>
                {result.collection}
              </span>
              <span style={styles.statLabel}>Collection</span>
            </div>
          </div>
        </div>
      )}

      <div style={styles.infoBox}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "0.1rem", color: "var(--text-accent)" }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>
          Files are never written to disk. All processing occurs in-memory for
          security and compliance. Raw files are discarded after chunking. Only
          embeddings and text chunks are persisted to the vector store, scoped
          to your User ID.
        </span>
      </div>
    </div>
  );
}
