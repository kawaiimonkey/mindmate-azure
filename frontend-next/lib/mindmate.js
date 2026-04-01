"use client";

const STORAGE_KEYS = {
  userId: "mindmate.userId",
  apiBaseUrl: "mindmate.apiBaseUrl"
};

const DEFAULT_PROD_API_BASE_URL =
  "https://func-mindmate-dev-fehce4g0hnfaahgf.canadacentral-01.azurewebsites.net/api";

export function normalizeApiBaseUrl(value) {
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

export function getDefaultApiBaseUrl() {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_PROD_API_BASE_URL;
  }

  const { protocol, hostname, port } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const currentPort = port || (protocol === "https:" ? "443" : "80");
    if (currentPort === "7071" || currentPort === "7072") {
      return `${protocol}//${hostname}:${currentPort}/api`;
    }

    return "http://localhost:7072/api";
  }

  return process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_PROD_API_BASE_URL;
}

export function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return getDefaultApiBaseUrl();
  }

  const saved = normalizeApiBaseUrl(localStorage.getItem(STORAGE_KEYS.apiBaseUrl));
  return saved || getDefaultApiBaseUrl();
}

export function setApiBaseUrl(url) {
  if (typeof window === "undefined") return;
  const normalized = normalizeApiBaseUrl(url);

  if (!normalized) {
    localStorage.removeItem(STORAGE_KEYS.apiBaseUrl);
    return;
  }

  localStorage.setItem(STORAGE_KEYS.apiBaseUrl, normalized);
}

export function ensureUserId() {
  if (typeof window === "undefined") return "server-user";

  let userId = localStorage.getItem(STORAGE_KEYS.userId);
  if (userId) return userId;

  userId = crypto?.randomUUID?.() || `user_${Date.now()}`;
  localStorage.setItem(STORAGE_KEYS.userId, userId);
  return userId;
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.userId);
}

export function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
