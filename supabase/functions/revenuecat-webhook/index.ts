import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REVENUECAT_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "";
const COMMISSIONABLE_EVENTS = new Set(["INITIAL_PURCHASE", "RENEWAL"]);

type RevenueCatEvent = {
  app_user_id?: string;
  currency?: string | null;
  expiration_at_ms?: number | string | null;
  id?: string;
  original_transaction_id?: string | null;
  price?: number | string | null;
  price_in_purchased_currency?: number | string | null;
  product_id?: string | null;
  store_transaction_id?: string | null;
  transaction_id?: string | null;
  type?: string;
};

const toFiniteNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
};

const getTransactionId = (event: RevenueCatEvent) =>
  event.transaction_id ??
  event.store_transaction_id ??
  event.original_transaction_id ??
  event.id ??
  null;

const getRevenueAmount = (event: RevenueCatEvent) =>
  toFiniteNumber(event.price_in_purchased_currency) ?? toFiniteNumber(event.price);

serve(async (req) => {
  // Verify authorization (fail-closed: reject if secret is missing or mismatched)
  const authHeader = req.headers.get("Authorization");
  if (!REVENUECAT_WEBHOOK_SECRET || authHeader !== REVENUECAT_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json();
  const event = payload.event as RevenueCatEvent | undefined;

  if (!event) {
    return new Response("No event", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const appUserId = event.app_user_id;
  const eventType = event.type ?? "UNKNOWN";
  const expiresAt = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;

  console.log(`[revenuecat-webhook] event=${eventType} user=${appUserId} expires=${expiresAt}`);

  const premiumEvents = [
    "INITIAL_PURCHASE",
    "RENEWAL",
    "PRODUCT_CHANGE",
    "UNCANCELLATION",
    "SUBSCRIPTION_EXTENDED",
    "TEMPORARY_ENTITLEMENT_GRANT",
  ];

  const revokeEvents = [
    "EXPIRATION",
    "BILLING_ISSUE",
  ];

  if (premiumEvents.includes(eventType)) {
    await supabase
      .from("profiles")
      .update({
        is_premium: true,
        premium_until: expiresAt,
      })
      .eq("user_id", appUserId);
  } else if (revokeEvents.includes(eventType)) {
    await supabase
      .from("profiles")
      .update({
        is_premium: false,
        premium_until: expiresAt,
      })
      .eq("user_id", appUserId);
  }

  if (appUserId && COMMISSIONABLE_EVENTS.has(eventType)) {
    try {
      const transactionId = getTransactionId(event);
      const amount = getRevenueAmount(event);
      const currency = typeof event.currency === "string" ? event.currency.toUpperCase() : null;

      console.log("[revenuecat-webhook] commission check", {
        eventType,
        appUserId,
        transactionId,
        amount,
        currency,
        productId: event.product_id ?? null,
      });

      if (!transactionId) {
        console.log("[revenuecat-webhook] commission skipped: missing transaction id", {
          eventType,
          appUserId,
        });
      } else if (amount === null) {
        console.log("[revenuecat-webhook] commission skipped: missing amount", {
          eventType,
          appUserId,
          transactionId,
        });
      } else {
        const { data: existingCommission, error: existingCommissionError } = await supabase
          .from("commissions")
          .select("id")
          .eq("revenuecat_transaction_id", transactionId)
          .maybeSingle();

        if (existingCommissionError) {
          console.error("[revenuecat-webhook] commission duplicate check failed", {
            eventType,
            appUserId,
            transactionId,
            error: existingCommissionError,
          });
        } else if (existingCommission) {
          console.log("[revenuecat-webhook] commission skipped: duplicate transaction", {
            eventType,
            appUserId,
            transactionId,
          });
        } else {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("affiliate_id")
            .eq("user_id", appUserId)
            .maybeSingle();

          if (profileError) {
            console.error("[revenuecat-webhook] affiliate profile lookup failed", {
              eventType,
              appUserId,
              transactionId,
              error: profileError,
            });
          } else if (!profile?.affiliate_id) {
            console.log("[revenuecat-webhook] commission skipped: user has no affiliate", {
              eventType,
              appUserId,
              transactionId,
            });
          } else {
            const { data: affiliate, error: affiliateError } = await supabase
              .from("affiliates")
              .select("commission_percent")
              .eq("id", profile.affiliate_id)
              .maybeSingle();

            if (affiliateError) {
              console.error("[revenuecat-webhook] affiliate lookup failed", {
                eventType,
                appUserId,
                transactionId,
                affiliateId: profile.affiliate_id,
                error: affiliateError,
              });
            } else {
              const commissionPercent = toFiniteNumber(affiliate?.commission_percent);

              if (commissionPercent === null) {
                console.log("[revenuecat-webhook] commission skipped: missing commission percent", {
                  eventType,
                  appUserId,
                  transactionId,
                  affiliateId: profile.affiliate_id,
                });
              } else {
                const commissionAmount = Number(((amount * commissionPercent) / 100).toFixed(2));
                const commissionPayload = {
                  affiliate_id: profile.affiliate_id,
                  user_id: appUserId,
                  revenuecat_transaction_id: transactionId,
                  amount,
                  commission: commissionAmount,
                  currency,
                  status: "pending",
                };

                const { data: insertedCommission, error: insertCommissionError } = await supabase
                  .from("commissions")
                  .insert(commissionPayload)
                  .select("id")
                  .maybeSingle();

                if (insertCommissionError) {
                  console.error("[revenuecat-webhook] commission insert failed", {
                    eventType,
                    appUserId,
                    transactionId,
                    affiliateId: profile.affiliate_id,
                    payload: commissionPayload,
                    error: insertCommissionError,
                  });
                } else {
                  console.log("[revenuecat-webhook] commission created", {
                    eventType,
                    appUserId,
                    transactionId,
                    affiliateId: profile.affiliate_id,
                    commissionId: insertedCommission?.id ?? null,
                    amount,
                    commission: commissionAmount,
                    currency,
                  });
                }
              }
            }
          }
        }
      }
    } catch (commissionError) {
      console.error("[revenuecat-webhook] commission handling failed", {
        eventType,
        appUserId,
        error: commissionError,
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
