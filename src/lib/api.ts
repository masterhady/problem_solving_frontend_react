export const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? "http://localhost:8000/api" : "https://web-production-495dc.up.railway.app/api");

export function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getCurrentUser(): any | null {
  try {
    const raw = localStorage.getItem("currentuser");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
