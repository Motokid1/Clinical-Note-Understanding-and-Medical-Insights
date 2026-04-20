import React from "react";

const styles = {
  bar: {
    background: "var(--bg-panel)",
    borderBottom: "1px solid var(--border-subtle)",
    padding: "0.85rem 2rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  label: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.72rem",
    color: "var(--text-muted)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  inputWrap: {
    position: "relative",
    flex: 1,
    maxWidth: "380px",
  },
  icon: {
    position: "absolute",
    left: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-muted)",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "0.5rem 0.75rem 0.5rem 2.2rem",
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.85rem",
    outline: "none",
    transition: "border-color 0.2s",
  },
  hint: {
    fontSize: "0.72rem",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },
};

export default function UserIdBar({ userId, setUserId }) {
  return (
    <div style={styles.bar}>
      <span style={styles.label}>User ID</span>
      <div style={styles.inputWrap}>
        <svg style={styles.icon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
        <input
          style={styles.input}
          placeholder="e.g. patient_001 or universal"
          value={userId}
          onChange={(e) => setUserId(e.target.value.trim())}
          onFocus={(e) => (e.target.style.borderColor = "var(--teal-dim)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>
      <span style={styles.hint}>
        {userId ? `session: ${userId}` : "required for all operations"}
      </span>
    </div>
  );
}
