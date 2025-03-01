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

    // Extraer data.id desde payload (p. ej. { query: { "data.id": "xxxx" } })
    const dataId = payload?.query?.["data.id"] || payload?.body?.data?.id || payload?.data?.id || payload?.id;
    if (!dataId) {
      return new Response(JSON.stringify({ error: "Payment ID not provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Llamar a la API de Mercado Pago usando la variable de entorno MP_ACCESS_TOKEN
    try {
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
        },
      });

      if (!mpResponse.ok) {
        const errText = await mpResponse.text();
        return new Response(JSON.stringify({ error: "Error fetching payment details", details: errText }), {
          status: mpResponse.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      const paymentData = await mpResponse.json();
      return new Response(JSON.stringify({ success: true, paymentData }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Error calling Mercado Pago API", details: err.toString() }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
