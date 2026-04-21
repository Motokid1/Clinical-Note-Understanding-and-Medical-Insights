import React, { useState } from "react";

const styles = {
  wrap: { marginTop: "1.25rem" },
  toggle: {
    display: "flex", alignItems: "center", gap: "0.5rem",
    background: "none", border: "none", color: "var(--text-muted)",
    fontFamily: "var(--font-mono)", fontSize: "0.72rem",
    letterSpacing: "0.08em", textTransform: "uppercase",
    cursor: "pointer", padding: "0.25rem 0", transition: "color 0.15s",
  },
  list: { marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" },
  chunk: (isKB) => ({
    background: isKB ? "rgba(245,158,11,0.05)" : "var(--bg-elevated)",
    border: `1px solid ${isKB ? "rgba(245,158,11,0.2)" : "var(--border-subtle)"}`,
    borderRadius: "var(--radius)", padding: "0.75rem 1rem",
  }),
  chunkMeta: { display: "flex", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap", alignItems: "center" },
  badge: (isKB) => ({
    fontFamily: "var(--font-mono)", fontSize: "0.68rem",
    color: isKB ? "var(--amber)" : "var(--teal-bright)",
    background: isKB ? "var(--amber-dim)" : "var(--teal-glow-sm)",
    border: `1px solid ${isKB ? "rgba(245,158,11,0.3)" : "var(--teal-dim)"}`,
    padding: "0.1rem 0.5rem", borderRadius: "20px",
  }),
  badgeMuted: {
    fontFamily: "var(--font-mono)", fontSize: "0.68rem",
    color: "var(--text-muted)", background: "transparent",
    border: "1px solid var(--border)", padding: "0.1rem 0.5rem", borderRadius: "20px",
  },
  text: {
    fontSize: "0.78rem", color: "var(--text-secondary)",
    lineHeight: 1.6, fontFamily: "var(--font-mono)",
  },
};

export default function SourceChunks({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources || sources.length === 0) return null;

  const userCount = sources.filter((s) => s.source_type === "user_document").length;
  const kbCount = sources.filter((s) => s.source_type === "knowledge_base").length;

  return (
    <div style={styles.wrap}>
      <button style={styles.toggle} onClick={() => setOpen((o) => !o)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {sources.length} source{sources.length > 1 ? "s" : ""} retrieved
        {userCount > 0 && <span style={{ color: "var(--teal-bright)" }}>· {userCount} doc</span>}
        {kbCount > 0 && <span style={{ color: "var(--amber)" }}>· {kbCount} KB</span>}
      </button>

      {open && (
        <div style={styles.list}>
          {sources.map((src, i) => {
            const isKB = src.source_type === "knowledge_base";
            return (
              <div key={i} style={styles.chunk(isKB)}>
                <div style={styles.chunkMeta}>
                  <span style={styles.badge(isKB)}>
                    {isKB ? "Knowledge Base" : "Your Document"}
                  </span>
                  {isKB && src.kb_category && (
                    <span style={styles.badgeMuted}>{src.kb_category}</span>
                  )}
                  {isKB && src.kb_title && (
                    <span style={{ ...styles.badgeMuted, color: "var(--text-secondary)" }}>
                      {src.kb_title}
                    </span>
                  )}
                  {!isKB && (
                    <span style={styles.badgeMuted}>chunk #{src.chunk_index}</span>
                  )}
                  {src.page != null && (
                    <span style={styles.badgeMuted}>page {src.page}</span>
                  )}
                </div>
                <p style={styles.text}>{src.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
