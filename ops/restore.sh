#!/usr/bin/env bash
set -Eeuo pipefail

SERVICE_URL="${SERVICE_URL:-http://127.0.0.1:8000}"
DRY_RUN=0
BACKUP_FILE=""

usage() {
  cat <<'USAGE'
Usage: ops/restore.sh [--dry-run] <backup-file>

Environment:
  SERVICE_URL   Base service URL (default: http://127.0.0.1:8000)
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

while (($#)); do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    -*)
      usage >&2
      exit 2
      ;;
    *)
      if [[ -n "$BACKUP_FILE" ]]; then
        usage >&2
        exit 2
      fi
      BACKUP_FILE="$1"
      shift
      ;;
  esac
done

[[ -n "$BACKUP_FILE" ]] || { usage >&2; exit 2; }
[[ -r "$BACKUP_FILE" ]] || die "cannot read backup file: $BACKUP_FILE"
BACKUP_DIR="$(cd -- "$(dirname -- "$BACKUP_FILE")" && pwd)"
BACKUP_FILE="$BACKUP_DIR/$(basename -- "$BACKUP_FILE")"

require_command curl
require_command jq

jq -e '(.cases | type) == "array"' "$BACKUP_FILE" >/dev/null ||
  die "backup file must contain a cases array"
jq -e 'all(.cases[]; (.case_id | type == "string" and length > 0))' "$BACKUP_FILE" >/dev/null ||
  die "each case in the backup must contain a non-empty case_id"

case_count="$(jq '.cases | length' "$BACKUP_FILE")"
log "found $case_count case(s) in $BACKUP_FILE"

while IFS= read -r case_json; do
  case_id="$(printf '%s\n' "$case_json" | jq -er '.case_id')"
  [[ -n "$case_id" ]] || die "case is missing case_id"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "dry-run: would restore $case_id"
    continue
  fi

  log "restoring $case_id"
  printf '%s\n' "$case_json" |
    curl -fsS -X POST "$SERVICE_URL/cases" \
      -H 'Content-Type: application/json' \
      --data-binary @- >/dev/null ||
    die "failed to restore $case_id"
done < <(jq -c '.cases[]' "$BACKUP_FILE")

if [[ "$DRY_RUN" -eq 1 ]]; then
  log "dry-run complete"
else
  log "restore complete"
fi
