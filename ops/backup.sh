#!/usr/bin/env bash
set -Eeuo pipefail

SERVICE_URL="${SERVICE_URL:-http://127.0.0.1:8000}"
BACKUP_DIR="${BACKUP_DIR:-backups}"

usage() {
  cat <<'USAGE'
Usage: ops/backup.sh

Environment:
  SERVICE_URL   Base service URL (default: http://127.0.0.1:8000)
  BACKUP_DIR    Backup output directory (default: backups)
USAGE
}

log() {
  printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*" >&2
}

die() {
  log "error: $*"
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is required"
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

require_command curl
require_command jq

mkdir -p "$BACKUP_DIR"
timestamp="$(date -u '+%Y%m%dT%H%M%SZ')"
backup_file="$BACKUP_DIR/cases-$timestamp.json"
tmp_file="$(mktemp "$BACKUP_DIR/.cases.XXXXXX")"
trap 'rm -f "$tmp_file"' EXIT

log "fetching cases from $SERVICE_URL"
curl -fsS "$SERVICE_URL/cases" |
  jq -e \
    --arg created_at "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" \
    --arg service_url "$SERVICE_URL" \
    'if (.cases | type) == "array"
     then {created_at: $created_at, service_url: $service_url, cases: .cases}
     else error("response does not contain a cases array")
     end' >"$tmp_file" ||
  die "backup fetch failed"

mv "$tmp_file" "$backup_file"
trap - EXIT

case_count="$(jq '.cases | length' "$backup_file")"
log "wrote $case_count case(s) to $backup_file"
printf '%s\n' "$backup_file"
