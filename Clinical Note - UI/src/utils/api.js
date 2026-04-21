import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

export async function checkHealth() {
  const { data } = await api.get("/health");
  return data;
}

export async function ingestDocument(userId, file, onUploadProgress) {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("file", file);

  const { data } = await api.post("/ingest", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return data;
}

export async function queryDocuments(userId, query) {
  const { data } = await api.post("/query", { user_id: userId, query });
  return data;
}

export async function deleteUserDocuments(userId) {
  const { data } = await api.delete(`/users/${userId}/documents`);
  return data;
}

export async function listUsers() {
  const { data } = await api.get("/users");
  return data;
}
