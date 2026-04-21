import React from "react";

const styles = {
  header: {
    borderBottom: "1px solid var(--border-subtle)",
    padding: "0 2rem",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "var(--bg-panel)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(12px)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: "8px",
    background: "linear-gradient(135deg, var(--teal-mid), var(--teal-dim))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 16px rgba(45,212,191,0.3)",
  },
  logoSvg: {
    color: "#0b0f0e",
  },
  brandName: {
    fontFamily: "var(--font-display)",
    fontSize: "1.25rem",
    color: "var(--text-primary)",
    letterSpacing: "-0.01em",
  },
  brandSub: {
    fontSize: "0.7rem",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginLeft: "0.1rem",
  },
  badge: {
    background: "var(--teal-glow-sm)",
    border: "1px solid var(--teal-dim)",
    color: "var(--teal-bright)",
    padding: "0.2rem 0.65rem",
    borderRadius: "20px",
    fontSize: "0.7rem",
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.05em",
  },
  statusDot: {
    display: "inline-block",
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "var(--teal-bright)",
    marginRight: "0.4rem",
    animation: "pulse-ring 2s infinite",
  },
};

export default function Header({ apiStatus }) {
  return (
    <header style={styles.header}>
      <div style={styles.brand}>
        <div style={styles.logoMark}>
          <svg style={styles.logoSvg} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <div>
          <div style={styles.brandName}>ClinicalRAG</div>
          <div style={styles.brandSub}>Medical Insight Engine</div>
        </div>
      </div>
      <div style={styles.badge}>
        <span style={styles.statusDot} />
        {apiStatus === "ok" ? "API Connected" : apiStatus === "checking" ? "Connecting..." : "API Offline"}
      </div>
    </header>
  );
}
