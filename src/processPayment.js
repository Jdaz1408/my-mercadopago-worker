export default {
  async fetch(request, env, ctx) {
    // Solo se permite POST
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Intentar parsear el JSON
    let payload;
    try {
      payload = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid JSON", details: err.toString() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Se espera que el payload tenga una propiedad "paymentData"
    const paymentData = payload?.paymentData;
    if (!paymentData) {
      return new Response(JSON.stringify({ error: "Missing paymentData" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Debug: imprimir metadata
    console.log("DEBUG: paymentData.metadata =", JSON.stringify(paymentData.metadata));

    // Extraer el user_id desde paymentData.metadata.auth_id
    const userId = paymentData.metadata && paymentData.metadata.auth_id ? paymentData.metadata.auth_id : null;
    console.log("DEBUG: userId extraído =", userId);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing user_id (auth_id) in payment metadata" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // (Opcional) Extraer el sub_id si existe
    const subscriptionId = paymentData.metadata && paymentData.metadata.sub_id ? paymentData.metadata.sub_id : null;

    // Mapear los campos del pago
    const amount = paymentData.transaction_amount;       // Ej.: 399960
    const currency = paymentData.currency_id || "USD";     // Ej.: "COP" o "USD"
    const status = paymentData.status;                     // Ej.: "approved"
    const paymentMethod = paymentData.payment_method_id || paymentData.payment_type_id || null;
    const paymentProviderReference = paymentData.id ? paymentData.id.toString() : null;
    const invoiceUrl = paymentData.transaction_details && paymentData.transaction_details.external_resource_url
      ? paymentData.transaction_details.external_resource_url
      : null;

    // Extraer el título del plan desde additional_info.items[0].title
    let rawTitle = null;
    if (
      paymentData.additional_info &&
      paymentData.additional_info.items &&
      paymentData.additional_info.items.length > 0
    ) {
      rawTitle = paymentData.additional_info.items[0].title;
    }
    console.log("DEBUG: rawTitle =", rawTitle);
    // Si el título comienza con "Plan " (ignorando mayúsculas), se elimina ese prefijo para obtener solo el nombre del plan
    let planName = rawTitle;
    if (planName && planName.toLowerCase().startsWith("plan ")) {
      planName = planName.substring(5).trim();
    }
    console.log("DEBUG: planName =", planName);

    // Construir el objeto de transacción para Supabase
    const transactionRecord = {
      user_id: userId,
      subscription_id: subscriptionId, // Puede ser null; se actualizará si es necesario en otro proceso o trigger
      amount: amount,
      currency: currency,
      status: status,
      payment_method: paymentMethod,
      payment_provider_reference: paymentProviderReference,
      invoice_url: invoiceUrl,
      metadata: paymentData,
      plan_name: planName,
    };
    console.log("DEBUG: transactionRecord =", JSON.stringify(transactionRecord));

    // Variables de Supabase (obtenidas de env)
    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    // Consultar si ya existe un registro para este pago en la tabla payment_transactions
    const queryUrl = `${SUPABASE_URL}/rest/v1/payment_transactions?payment_provider_reference=eq.${paymentProviderReference}`;
    let existingRecords;
    try {
      existingRecords = await fetch(queryUrl, {
        method: "GET",
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }).then(res => res.json());
    } catch (err) {
      console.error("Error fetching existing payment record for paymentProviderReference:", paymentProviderReference, err.toString());
      return new Response(JSON.stringify({ error: "Error fetching existing payment record", details: err.toString() }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let dbResponse;
    if (existingRecords.length > 0) {
      // Actualizar registro existente (PATCH)
      const updateUrl = `${SUPABASE_URL}/rest/v1/payment_transactions?payment_provider_reference=eq.${paymentProviderReference}`;
      try {
        dbResponse = await fetch(updateUrl, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Prefer": "return=representation",
          },
          body: JSON.stringify(transactionRecord),
        }).then(res => res.json());
      } catch (err) {
        console.error("Error updating payment record for paymentProviderReference:", paymentProviderReference, err.toString());
        return new Response(JSON.stringify({ error: "Error updating payment record", details: err.toString() }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // Insertar un nuevo registro (POST)
      const insertUrl = `${SUPABASE_URL}/rest/v1/payment_transactions`;
      try {
        dbResponse = await fetch(insertUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Prefer": "return=representation",
          },
          body: JSON.stringify(transactionRecord),
        }).then(res => res.json());
      } catch (err) {
        console.error("Error inserting payment record for paymentProviderReference:", paymentProviderReference, err.toString());
        return new Response(JSON.stringify({ error: "Error inserting payment record", details: err.toString() }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, dbResult: dbResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
