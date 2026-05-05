// Dummy payment processor — simulates a successful credit purchase or withdrawal
// without integrating with a real payment gateway.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const action: "deposit" | "withdraw" = body.action ?? "deposit";
    const credits = parseInt(body.credits);
    if (!credits || credits <= 0) {
      return new Response(JSON.stringify({ error: "Invalid credits" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 800));

    const { data: wallet, error: wErr } = await admin
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (wErr || !wallet) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let newBalance = wallet.balance ?? 0;
    let lifetimeEarnings = wallet.lifetime_earnings ?? 0;
    let lifetimeSpent = wallet.lifetime_spent ?? 0;
    let txType = "deposit";
    let txAmount = credits;
    let description = `Dummy payment — purchased ${credits} credits`;

    if (action === "deposit") {
      newBalance += credits;
      lifetimeEarnings += credits;
    } else {
      if (credits > newBalance) {
        return new Response(JSON.stringify({ error: "Insufficient balance" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      newBalance -= credits;
      lifetimeSpent += credits;
      txType = "withdrawal";
      txAmount = -credits;
      description = `Dummy withdrawal — ${credits} credits`;
    }

    const { error: updErr } = await admin
      .from("wallets")
      .update({
        balance: newBalance,
        lifetime_earnings: lifetimeEarnings,
        lifetime_spent: lifetimeSpent,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (updErr) throw updErr;

    await admin.from("transactions").insert({
      user_id: userId,
      amount: txAmount,
      type: txType,
      description,
      balance_after: newBalance,
    });

    return new Response(
      JSON.stringify({ success: true, balance: newBalance, credits }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
