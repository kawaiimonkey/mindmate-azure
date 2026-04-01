const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:7072',
  'http://127.0.0.1:7072',
];

function getAllowedOrigins() {
  const configuredOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins])];
}

function getCorsHeaders(origin) {
  const allowedOrigins = getAllowedOrigins();
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function createCorsResponse(request, init = {}) {
  const origin = request.headers.get('origin') || '';
  const headers = {
    ...getCorsHeaders(origin),
    ...(init.headers || {}),
  };

  return {
    ...init,
    headers,
  };
}

module.exports = {
  createCorsResponse,
  getCorsHeaders,
};
