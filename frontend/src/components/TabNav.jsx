import React from "react";

const TABS = [
  {
    id: "ingest",
    label: "Upload Document",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    id: "query",
    label: "Query Notes",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
];

const styles = {
  nav: {
    display: "flex",
    gap: "0.25rem",
    padding: "1rem 2rem 0",
    borderBottom: "1px solid var(--border-subtle)",
    background: "var(--bg-panel)",
  },
  tab: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.65rem 1.25rem",
    borderRadius: "var(--radius) var(--radius) 0 0",
    border: "1px solid transparent",
    borderBottom: "none",
    background: active ? "var(--bg-card)" : "transparent",
    color: active ? "var(--teal-bright)" : "var(--text-muted)",
    fontFamily: "var(--font-body)",
    fontSize: "0.875rem",
    fontWeight: active ? "500" : "300",
    cursor: "pointer",
    transition: "all 0.18s ease",
    borderColor: active ? "var(--border)" : "transparent",
    position: "relative",
    bottom: "-1px",
  }),
  activeBar: {
    position: "absolute",
    bottom: 0,
    left: "1rem",
    right: "1rem",
    height: "2px",
    background: "var(--teal-bright)",
    borderRadius: "1px",
  },
};

export default function TabNav({ activeTab, setActiveTab }) {
  return (
    <nav style={styles.nav}>
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            style={styles.tab(active)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
            {active && <div style={styles.activeBar} />}
          </button>
        );
      })}
    </nav>
  );
}
