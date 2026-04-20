import React, { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import UserIdBar from "./components/UserIdBar.jsx";
import TabNav from "./components/TabNav.jsx";
import ToastContainer from "./components/Toast.jsx";
import IngestPage from "./pages/IngestPage.jsx";
import QueryPage from "./pages/QueryPage.jsx";
import { useAppState } from "./hooks/useAppState.js";
import { checkHealth } from "./utils/api.js";

export default function App() {
  const { userId, setUserId, activeTab, setActiveTab, toasts, addToast, dismissToast } =
    useAppState();
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    checkHealth()
      .then(() => setApiStatus("ok"))
      .catch(() => setApiStatus("error"));
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Subtle background grid */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.35,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: "-200px",
          right: "-100px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
        <Header apiStatus={apiStatus} />
        <UserIdBar userId={userId} setUserId={setUserId} />
        <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

        <main style={{ flex: 1, overflow: "auto" }}>
          {activeTab === "ingest" ? (
            <IngestPage userId={userId} addToast={addToast} />
          ) : (
            <QueryPage userId={userId} addToast={addToast} />
          )}
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
