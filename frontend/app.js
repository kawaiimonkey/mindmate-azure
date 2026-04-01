const MINDMATE_STORAGE_KEYS = {
  userId: 'mindmate.userId',
  apiBaseUrl: 'mindmate.apiBaseUrl',
};

const DEFAULT_PROD_API_BASE_URL = 'https://func-mindmate-dev-fehce4g0hnfaahgf.canadacentral-01.azurewebsites.net/api';
const RUNTIME_API_BASE_URL = normalizeApiBaseUrl(
  window.MINDMATE_API_BASE_URL ||
  document.querySelector('meta[name="mindmate-api-base-url"]')?.content ||
  ''
);

function normalizeApiBaseUrl(value) {
  if (!value) return '';
  return value.replace(/\/+$/, '');
}

function getDefaultApiBaseUrl() {
  const { protocol, hostname, port } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const currentPort = port || (protocol === 'https:' ? '443' : '80');
    if (currentPort === '7071' || currentPort === '7072') {
      return `${protocol}//${hostname}:${currentPort}/api`;
    }

    return 'http://localhost:7072/api';
  }

  if (hostname.endsWith('.azurewebsites.net')) {
    return DEFAULT_PROD_API_BASE_URL;
  }

  return DEFAULT_PROD_API_BASE_URL;
}

function getApiBaseUrl() {
  const saved = normalizeApiBaseUrl(localStorage.getItem(MINDMATE_STORAGE_KEYS.apiBaseUrl));
  return saved || RUNTIME_API_BASE_URL || getDefaultApiBaseUrl();
}

function setApiBaseUrl(url) {
  const normalized = normalizeApiBaseUrl(url);

  if (!normalized) {
    localStorage.removeItem(MINDMATE_STORAGE_KEYS.apiBaseUrl);
    return;
  }

  localStorage.setItem(MINDMATE_STORAGE_KEYS.apiBaseUrl, normalized);
}

function ensureUserId() {
  let userId = localStorage.getItem(MINDMATE_STORAGE_KEYS.userId);
  if (userId) return userId;

  userId = self.crypto?.randomUUID?.() || `user_${Date.now()}`;
  localStorage.setItem(MINDMATE_STORAGE_KEYS.userId, userId);
  return userId;
}

function clearSession() {
  localStorage.removeItem(MINDMATE_STORAGE_KEYS.userId);
}

window.MindMateApp = {
  clearSession,
  ensureUserId,
  getApiBaseUrl,
  setApiBaseUrl,
};
