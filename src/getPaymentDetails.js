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
      console.log("[getPaymentDetails] Payload received:", JSON.stringify(payload, null, 2));
    } catch (err) {
      console.error("[getPaymentDetails] Error parsing JSON:", err);
      return new Response(JSON.stringify({ error: "Invalid JSON", details: err.toString() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extraer Payment ID de múltiples ubicaciones
    const dataId =
      payload?.query?.["data.id"] ||
      payload?.body?.data?.id ||
      payload?.data?.id ||
      payload?.id;
    console.log("[getPaymentDetails] Extracted Payment ID:", dataId);

    if (!dataId) {
      console.error("[getPaymentDetails] Payment ID not provided.");
      return new Response(JSON.stringify({ error: "Payment ID not provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Imprimir el token para depuración (solo para testing, recuerda eliminarlo en producción)
    console.log("[getPaymentDetails] MP_ACCESS_TOKEN from env:", env.MP_ACCESS_TOKEN);

    try {
      console.log("[getPaymentDetails] Calling Mercado Pago API for Payment ID:", dataId);
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${env.MP_ACCESS_TOKEN}`,
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
          // Puedes agregar "Origin": "https://mercadopago.com" si es necesario
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
      console.log("[getPaymentDetails] Payment data received:", JSON.stringify(paymentData, null, 2));
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
