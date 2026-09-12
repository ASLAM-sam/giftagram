/**
 * Giftagram API — Cloudflare Workers Entry Point
 * 
 * Connected to:
 * - Cloudflare D1 (Database)
 * - Cloudflare R2 (Product & Reference Photos)
 * - Razorpay (Payment Processing)
 */

export interface Env {
  DB: any; // D1Database
  IMAGES_BUCKET: any; // R2Bucket
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  FRONTEND_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // CORS Headers for Cloudflare Pages frontend
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Orders Endpoint
    if (url.pathname === "/api/orders" && request.method === "POST") {
      try {
        const body = await request.json() as any;
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const orderId = `GFT-${new Date().getFullYear()}-${randomSuffix}`;
        const depositRequired = Math.round(body.subtotal * 0.5 * 100) / 100;

        // In production: INSERT INTO orders ... (env.DB)
        return new Response(
          JSON.stringify({
            success: true,
            orderId,
            depositRequired,
            balanceDue: body.subtotal - depositRequired,
            message: "Order initiated. Ready for Razorpay deposit payment.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Razorpay Create Order Endpoint
    if (url.pathname === "/api/payments/razorpay/create-order" && request.method === "POST") {
      const body = await request.json() as any;
      return new Response(
        JSON.stringify({
          success: true,
          razorpayOrderId: `order_${Math.random().toString(36).substring(2, 12)}`,
          amountPaise: Math.round(body.depositAmount * 100),
          currency: "INR",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Route not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
