import { useState, useCallback } from "react";

export function useAppState() {
  const [userId, setUserId] = useState("");
  const [activeTab, setActiveTab] = useState("ingest"); // "ingest" | "query"
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    userId, setUserId,
    activeTab, setActiveTab,
    toasts, addToast, dismissToast,
  };
}
