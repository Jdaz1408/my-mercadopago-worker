export default {
  async fetch(request, env, ctx) {
    console.log("[webhookTest] Request received. Method:", request.method);

    // Asegurarse de que sea POST
    if (request.method !== "POST") {
      console.log("[webhookTest] Method not allowed.");
      return new Response(JSON.stringify({ error: "Only POST allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    let payload;
    try {
      payload = await request.json();
      console.log("[webhookTest] Payload received:", JSON.stringify(payload));
    } catch (err) {
      console.error("[webhookTest] Error parsing JSON:", err);
      return new Response(JSON.stringify({ error: "Invalid JSON", details: err.toString() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Aquí podrías agregar lógica adicional para procesar el webhook de test.
    // Por ahora, solo registramos la solicitud y respondemos con éxito.
    console.log("[webhookTest] Webhook processed successfully.");

    return new Response(JSON.stringify({ success: true, message: "Webhook test processed" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
