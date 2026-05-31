/**
 * supabase/functions/_shared/cors.ts
 * * CORS-Header, damit der Browser (andere Origin) die Function aufrufen darf.
 * * Reine Infrastruktur, frei von Geschäftslogik.
 */

export const corsHeaders = {
  // SECURITY TODO (vor Produktion): "*" durch die echte Frontend-Domain ersetzen,
  // z.B. "https://meine-app.vercel.app". Sonst darf jede Website die Function aufrufen.
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
};