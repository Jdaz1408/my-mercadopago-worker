export default {
  async fetch(request, env, ctx) {
    console.log("[getPaymentDetails] Request received. Method:", request.method);
    
    if (request.method !== "POST") {
      console.log("[getPaymentDetails] Method not allowed.");
      return new Response(JSON.stringify({ error: "Only POST allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    let payload;
    try {
      payload = await request.json();
      console.log("[getPaymentDetails] Payload received:", JSON.stringify(payload));
    } catch (err) {
      console.error("[getPaymentDetails] Error parsing JSON:", err);
      return new Response(JSON.stringify({ error: "Invalid JSON", details: err.toString() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extraer Payment ID de distintas ubicaciones del payload
    const dataId = payload?.query?.["data.id"] || payload?.body?.data?.id || payload?.data?.id || payload?.id;
    console.log("[getPaymentDetails] Extracted Payment ID:", dataId);
    if (!dataId) {
      console.error("[getPaymentDetails] Payment ID not provided.");
      return new Response(JSON.stringify({ error: "Payment ID not provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Imprimir el token para depuración (ojo: solo para testing)
    console.log("[getPaymentDetails] MP_ACCESS_TOKEN from env:", env.MP_ACCESS_TOKEN);

    // Llamar a la API de Mercado Pago usando el secret MP_ACCESS_TOKEN desde env
    try {
      console.log("[getPaymentDetails] Calling Mercado Pago API for Payment ID:", dataId);
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${env.MP_ACCESS_TOKEN}`,
        },
      });

      console.log("[getPaymentDetails] Mercado Pago API response status:", mpResponse.status);

      if (!mpResponse.ok) {
        const errText = await mpResponse.text();
        console.error("[getPaymentDetails] Error fetching payment details:", errText);
        return new Response(JSON.stringify({ error: "Error fetching payment details", details: errText }), {
          status: mpResponse.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      const paymentData = await mpResponse.json();
      console.log("[getPaymentDetails] Payment data received:", JSON.stringify(paymentData));
      return new Response(JSON.stringify({ success: true, paymentData }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[getPaymentDetails] Exception calling Mercado Pago API:", err);
      return new Response(JSON.stringify({ error: "Error calling Mercado Pago API", details: err.toString() }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
