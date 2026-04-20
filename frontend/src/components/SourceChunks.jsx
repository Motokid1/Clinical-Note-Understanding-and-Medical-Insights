import React, { useState } from "react";

const styles = {
  wrap: {
    marginTop: "1.25rem",
  },
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.72rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    padding: "0.25rem 0",
    transition: "color 0.15s",
  },
  list: {
    marginTop: "0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  chunk: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius)",
    padding: "0.75rem 1rem",
  },
  chunkMeta: {
    display: "flex",
    gap: "0.75rem",
    marginBottom: "0.4rem",
  },
  badge: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.68rem",
    color: "var(--teal-bright)",
    background: "var(--teal-glow-sm)",
    border: "1px solid var(--teal-dim)",
    padding: "0.1rem 0.5rem",
    borderRadius: "20px",
  },
  text: {
    fontSize: "0.78rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    fontFamily: "var(--font-mono)",
  },
};

export default function SourceChunks({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources || sources.length === 0) return null;

  return (
    <div style={styles.wrap}>
      <button style={styles.toggle} onClick={() => setOpen((o) => !o)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {sources.length} source chunk{sources.length > 1 ? "s" : ""} retrieved
      </button>

      {open && (
        <div style={styles.list}>
          {sources.map((src, i) => (
            <div key={i} style={styles.chunk}>
              <div style={styles.chunkMeta}>
                <span style={styles.badge}>chunk #{src.chunk_index}</span>
                {src.page != null && (
                  <span style={{ ...styles.badge, color: "var(--text-muted)", background: "transparent", border: "1px solid var(--border)" }}>
                    page {src.page}
                  </span>
                )}
              </div>
              <p style={styles.text}>{src.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
