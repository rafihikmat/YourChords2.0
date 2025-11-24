
// DEPRECATED: Functionality moved to client-side.
// This file is kept as a placeholder to prevent deployment errors if linked.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async () => {
  return new Response(JSON.stringify({ message: "Deprecated" }), {
    headers: { "Content-Type": "application/json" },
  });
});
