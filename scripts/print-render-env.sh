#!/usr/bin/env bash
# Run from repo root after filling artifacts/backend/.env
# Copies Aiven CA + env hints for Render dashboard (secrets stay local)

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/artifacts/backend/.env"
CA_FILE="$ROOT/artifacts/backend/certs/ca.pem"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

echo "=== Paste these in Render → tabletop-api → Environment ==="
echo ""
grep -E '^(DB_|EMAIL_|SECRET_KEY)' "$ENV_FILE" | grep -v PASSWORD || true
echo "DB_PASSWORD=<from your .env DB_PASSWORD line>"
echo ""
if [[ -f "$CA_FILE" ]]; then
  echo "DB_SSL_CA_PEM=<paste entire file below as ONE line or multiline in Render>"
  echo "--- ca.pem start ---"
  cat "$CA_FILE"
  echo "--- ca.pem end ---"
else
  echo "Missing $CA_FILE — download from Aiven console"
fi
echo ""
echo "Also set:"
echo "  ALLOWED_HOSTS=.onrender.com"
echo "  DEBUG=false"
echo "  CORS_ALLOWED_ORIGINS=https://YOUR-APP.vercel.app  (after Vercel deploy)"
