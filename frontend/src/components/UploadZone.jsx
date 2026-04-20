import React, { useRef, useState, useCallback } from "react";

const styles = {
  zone: (isDragging, hasFile) => ({
    border: `2px dashed ${isDragging ? "var(--teal-bright)" : hasFile ? "var(--teal-dim)" : "var(--border)"}`,
    borderRadius: "var(--radius-lg)",
    padding: "2.5rem 2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    background: isDragging
      ? "var(--teal-glow)"
      : hasFile
      ? "var(--teal-glow-sm)"
      : "var(--bg-card)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "center",
    userSelect: "none",
  }),
  iconWrap: (hasFile) => ({
    width: 52,
    height: 52,
    borderRadius: "12px",
    background: hasFile ? "var(--teal-glow)" : "var(--bg-elevated)",
    border: `1px solid ${hasFile ? "var(--teal-dim)" : "var(--border)"}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: hasFile ? "var(--teal-bright)" : "var(--text-muted)",
    transition: "all 0.2s",
  }),
  title: {
    fontSize: "0.95rem",
    fontWeight: "500",
    color: "var(--text-primary)",
  },
  sub: {
    fontSize: "0.78rem",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },
  fileName: {
    fontSize: "0.82rem",
    color: "var(--teal-bright)",
    fontFamily: "var(--font-mono)",
    background: "var(--teal-glow-sm)",
    padding: "0.25rem 0.75rem",
    borderRadius: "20px",
    border: "1px solid var(--teal-dim)",
    maxWidth: "260px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: "0.2rem",
    display: "flex",
    alignItems: "center",
    borderRadius: "4px",
    transition: "color 0.15s",
  },
  fileRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
};

export default function UploadZone({ file, setFile }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) setFile(dropped);
    },
    [setFile]
  );

  const handleChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  return (
    <div
      style={styles.zone(isDragging, !!file)}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        style={{ display: "none" }}
        onChange={handleChange}
      />

      <div style={styles.iconWrap(!!file)}>
        {file ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <polyline points="9 15 11 17 15 13" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        )}
      </div>

      {file ? (
        <>
          <div style={styles.fileRow}>
            <span style={styles.fileName}>{file.name}</span>
            <button
              style={styles.clearBtn}
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              title="Remove file"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <span style={styles.sub}>
            {(file.size / 1024).toFixed(1)} KB · {file.type || "text/plain"}
          </span>
        </>
      ) : (
        <>
          <div style={styles.title}>Drop your clinical document here</div>
          <div style={styles.sub}>PDF or TXT · click to browse</div>
        </>
      )}
    </div>
  );
}
