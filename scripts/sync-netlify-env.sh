#!/usr/bin/env bash
# Push environment variables to Netlify so the site always matches your config.
#
# Local use:   NETLIFY_AUTH_TOKEN=... NETLIFY_SITE_ID=... bun run env:sync
#              (values are read from your shell, or from .env.local / .env if present)
# CI use:      .github/workflows/netlify-env-sync.yml passes the values from GitHub Secrets.
#
# The list of variables comes from .env.example, so adding a variable there is all it takes.
set -euo pipefail
cd "$(dirname "$0")/.."

: "${NETLIFY_AUTH_TOKEN:?Set NETLIFY_AUTH_TOKEN (Netlify > User settings > Applications > Personal access tokens)}"
: "${NETLIFY_SITE_ID:?Set NETLIFY_SITE_ID (Netlify > Site configuration > Site ID)}"

# Load local values without overriding anything already set in the shell.
for f in .env.local .env; do
  [ -f "$f" ] || continue
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^[A-Z_][A-Z0-9_]*$ ]] || continue
    if [ -z "${!key-}" ]; then export "$key=${value%$'\r'}"; fi
  done < <(grep -E '^[A-Z_][A-Z0-9_]*=' "$f")
done

# Variables that must never be readable in the Netlify UI or exposed to the client.
SECRETS=" SUPABASE_SERVICE_ROLE_KEY AI_API_KEY LOVABLE_API_KEY "

synced=0; skipped=()
while IFS= read -r key; do
  value="${!key-}"
  if [ -z "$value" ]; then skipped+=("$key"); continue; fi
  flags=()
  if [[ "$SECRETS" == *" $key "* ]]; then flags+=(--secret); fi
  npx --yes netlify-cli env:set "$key" "$value" --site "$NETLIFY_SITE_ID" ${flags[@]+"${flags[@]}"} >/dev/null
  echo "synced  $key"
  synced=$((synced + 1))
done < <(grep -oE '^[A-Z_][A-Z0-9_]*' .env.example)

echo "Done: $synced synced."
if [ "${#skipped[@]}" -gt 0 ]; then echo "Skipped (no value): ${skipped[*]}"; fi
