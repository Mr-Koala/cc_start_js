#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_ENTRY="$SCRIPT_DIR/bin/cc-start.js"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is required but not found in PATH." >&2
  exit 1
fi

if [[ ! -f "$NODE_ENTRY" ]]; then
  echo "Error: missing Node entry: $NODE_ENTRY" >&2
  exit 1
fi

exec node "$NODE_ENTRY" "$@"
