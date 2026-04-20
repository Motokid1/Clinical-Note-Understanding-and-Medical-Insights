import React from "react";

const TYPE_STYLES = {
  success: {
    border: "1px solid var(--teal-dim)",
    background: "rgba(13,148,136,0.12)",
    color: "var(--teal-bright)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  error: {
    border: "1px solid rgba(248,113,113,0.4)",
    background: "rgba(248,113,113,0.1)",
    color: "var(--red)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  info: {
    border: "1px solid var(--border)",
    background: "var(--bg-elevated)",
    color: "var(--text-secondary)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
};

const containerStyle = {
  position: "fixed",
  top: "5rem",
  right: "1.5rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  zIndex: 9999,
  pointerEvents: "none",
};

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div style={containerStyle}>
      {toasts.map((t) => {
        const ts = TYPE_STYLES[t.type] || TYPE_STYLES.info;
        return (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.65rem 1rem",
              borderRadius: "var(--radius)",
              border: ts.border,
              background: ts.background,
              color: ts.color,
              fontSize: "0.82rem",
              fontFamily: "var(--font-body)",
              boxShadow: "var(--shadow-card)",
              animation: "fade-in-up 0.25s ease both",
              pointerEvents: "auto",
              cursor: "pointer",
              maxWidth: "340px",
            }}
            onClick={() => onDismiss(t.id)}
          >
            {ts.icon}
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
