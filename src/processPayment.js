export default {
    async fetch(request, env, ctx) {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Only POST allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json" },
        });
      }
  
      let payload;
      try {
        payload = await request.json();
      } catch (err) {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
  
      const paymentData = payload?.paymentData;
      if (!paymentData) {
        return new Response(JSON.stringify({ error: "Missing paymentData" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
  
      // Ejemplo de variables secretas definidas en Cloudflare
      const SUPABASE_URL = env.SUPABASE_URL;
      const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  
      // Lógica para mapear e insertar/actualizar en Supabase...
      // (Código similar al que ya tienes, pero usando env en lugar de variables hardcodeadas)
  
      // ...
      // Supongamos que terminamos con algo como:
      return new Response(JSON.stringify({ success: true, msg: "Payment processed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  };
  