const ALLOWED_ORIGINS = [
  'https://braindump-pwa.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

const ALLOW_HEADERS = 'authorization, content-type, apikey, x-client-info';

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': ALLOW_HEADERS,
    'Vary': 'Origin',
  };
}
