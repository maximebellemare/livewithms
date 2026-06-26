#!/usr/bin/env bash
set -euo pipefail

SUPABASE_URL_DEFAULT="${EXPO_PUBLIC_SUPABASE_URL:-https://tmvpabvztdekmfsgoazx.supabase.co}"
WEBHOOK_URL_DEFAULT="${SUPABASE_URL_DEFAULT%/}/functions/v1/revenuecat-webhook"

USER_ID=""
TRANSACTION_ID="test_affiliate_txn_001"
AMOUNT="29.99"
CURRENCY="USD"
PRODUCT_ID="premium_yearly"
WEBHOOK_URL="${REVENUECAT_WEBHOOK_URL:-$WEBHOOK_URL_DEFAULT}"
EXECUTE="false"

usage() {
  cat <<'EOF'
Usage:
  REVENUECAT_WEBHOOK_SECRET=your-secret \
  ./scripts/simulate_revenuecat_initial_purchase.sh \
    --user-id <supabase-user-id> \
    [--transaction-id test_affiliate_txn_001] \
    [--amount 29.99] \
    [--currency USD] \
    [--product-id premium_yearly] \
    [--webhook-url https://PROJECT.supabase.co/functions/v1/revenuecat-webhook] \
    [--execute]

By default this script prints the exact curl command and payload only.
Add --execute to actually send the webhook.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --user-id)
      USER_ID="${2:-}"
      shift 2
      ;;
    --transaction-id)
      TRANSACTION_ID="${2:-}"
      shift 2
      ;;
    --amount)
      AMOUNT="${2:-}"
      shift 2
      ;;
    --currency)
      CURRENCY="${2:-}"
      shift 2
      ;;
    --product-id)
      PRODUCT_ID="${2:-}"
      shift 2
      ;;
    --webhook-url)
      WEBHOOK_URL="${2:-}"
      shift 2
      ;;
    --execute)
      EXECUTE="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$USER_ID" ]]; then
  echo "Missing required --user-id" >&2
  usage
  exit 1
fi

if [[ -z "${REVENUECAT_WEBHOOK_SECRET:-}" ]]; then
  echo "Missing REVENUECAT_WEBHOOK_SECRET environment variable." >&2
  exit 1
fi

EVENT_TIME_MS="$(date +%s)000"
EXPIRATION_TIME_MS="$(( $(date +%s) * 1000 + 2592000000 ))"

read -r -d '' PAYLOAD <<EOF || true
{
  "api_version": "1.0",
  "event": {
    "type": "INITIAL_PURCHASE",
    "app_user_id": "${USER_ID}",
    "transaction_id": "${TRANSACTION_ID}",
    "store_transaction_id": "${TRANSACTION_ID}",
    "original_transaction_id": "${TRANSACTION_ID}",
    "product_id": "${PRODUCT_ID}",
    "price": ${AMOUNT},
    "price_in_purchased_currency": ${AMOUNT},
    "currency": "${CURRENCY}",
    "id": "${TRANSACTION_ID}",
    "expiration_at_ms": ${EXPIRATION_TIME_MS},
    "purchased_at_ms": ${EVENT_TIME_MS},
    "event_timestamp_ms": ${EVENT_TIME_MS}
  }
}
EOF

echo "Webhook URL:"
echo "  ${WEBHOOK_URL}"
echo
echo "Exact curl command:"
echo "curl -i -X POST \\"
echo "  '${WEBHOOK_URL}' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>' \\"
echo "  --data-raw '$(printf "%s" "$PAYLOAD")'"
echo
echo "Payload preview:"
printf '%s\n' "$PAYLOAD"

if [[ "$EXECUTE" != "true" ]]; then
  echo
  echo "Dry run only. Re-run with --execute to actually send the webhook."
  exit 0
fi

echo
echo "Sending test INITIAL_PURCHASE webhook..."

curl -i -X POST \
  "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${REVENUECAT_WEBHOOK_SECRET}" \
  --data-raw "$PAYLOAD"
