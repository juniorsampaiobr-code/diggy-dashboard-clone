import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, paymentMethod, cardData } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, stores(*)")
      .eq("id", orderId)
      .single();

    if (orderError) throw orderError;

    const store = order.stores;
    const accessToken = store.mercado_pago_access_token;

    if (!accessToken) {
      throw new Error("Mercado Pago não configurado para esta loja");
    }

    let paymentResult;

    if (paymentMethod === "pix") {
      // Create PIX payment
      const pixPayment = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `${orderId}-pix-${Date.now()}`,
        },
        body: JSON.stringify({
          transaction_amount: order.total_amount,
          description: `Pedido #${order.id.substring(0, 8)}`,
          payment_method_id: "pix",
          payer: {
            email: `${order.customer_phone}@customer.com`,
            first_name: order.customer_name.split(" ")[0],
            last_name: order.customer_name.split(" ").slice(1).join(" ") || order.customer_name.split(" ")[0],
          },
        }),
      });

      const pixData = await pixPayment.json();
      
      console.log("PIX Payment Response:", JSON.stringify(pixData));

      if (!pixPayment.ok) {
        console.error("Mercado Pago Error:", pixData);
        throw new Error(pixData.message || "Erro ao criar pagamento PIX");
      }

      if (pixData.status === "pending" && pixData.point_of_interaction?.transaction_data) {
        paymentResult = {
          success: true,
          paymentId: pixData.id,
          pixCode: pixData.point_of_interaction.transaction_data.qr_code,
          pixQrCodeBase64: pixData.point_of_interaction.transaction_data.qr_code_base64,
        };

        // Update order with payment info
        await supabase
          .from("orders")
          .update({
            mercado_pago_payment_id: pixData.id,
            payment_status: "pending",
          })
          .eq("id", orderId);
      } else {
        console.error("Unexpected PIX status or missing data:", pixData);
        throw new Error(pixData.status_detail || "Erro ao criar pagamento PIX");
      }
    } else if (paymentMethod === "credit" || paymentMethod === "debit") {
      // Create card payment
      const cardPayment = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `${orderId}-card-${Date.now()}`,
        },
        body: JSON.stringify({
          transaction_amount: order.total_amount,
          token: cardData.token,
          description: `Pedido #${order.id.substring(0, 8)}`,
          installments: cardData.installments || 1,
          payment_method_id: cardData.payment_method_id,
          payer: {
            email: cardData.email,
            identification: {
              type: cardData.identification.type,
              number: cardData.identification.number,
            },
          },
        }),
      });

      const cardPaymentData = await cardPayment.json();

      if (cardPaymentData.status === "approved") {
        paymentResult = {
          success: true,
          paymentId: cardPaymentData.id,
          status: "approved",
        };

        // Update order with payment info
        await supabase
          .from("orders")
          .update({
            mercado_pago_payment_id: cardPaymentData.id,
            payment_status: "approved",
          })
          .eq("id", orderId);
      } else {
        throw new Error(cardPaymentData.status_detail || "Erro ao processar pagamento");
      }
    }

    return new Response(JSON.stringify(paymentResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao processar pagamento";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
