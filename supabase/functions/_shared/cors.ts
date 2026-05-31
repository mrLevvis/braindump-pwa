/**
 * supabase/functions/_shared/cors.ts
 * * CORS-Header, damit der Browser (andere Origin) die Function aufrufen darf.
 * * Reine Infrastruktur, frei von Geschäftslogik.
 */


export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // TODO: später auf echte Domain einschränken
  "Access-Control-Allow-Headers": "authorization, content-type",
};