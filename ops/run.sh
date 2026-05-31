#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-snapmed-pharmacv}"
COMPOSE=(docker compose -p "$PROJECT_NAME")

usage() {
  cat <<'USAGE'
Usage: ops/run.sh <command>

Commands:
  build     Build the Docker image
  start     Start the service with Docker Compose
  stop      Stop the Docker Compose service
  test      Run the Python test suite with uv
  logs      Follow service logs
  clean     Stop the service and remove Compose-created resources
  --help    Show this help text
USAGE
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_docker() {
  command -v docker >/dev/null 2>&1 || die "Docker CLI is not installed"
  docker info >/dev/null 2>&1 || die "Docker is not running or is not reachable"
}

require_uv() {
  command -v uv >/dev/null 2>&1 || die "uv is not installed"
}

command_name="${1:-}"

case "$command_name" in
  build)
    require_docker
    "${COMPOSE[@]}" build
    ;;
  start)
    require_docker
    "${COMPOSE[@]}" up -d
    ;;
  stop)
    require_docker
    "${COMPOSE[@]}" down
    ;;
  test)
    require_uv
    uv run pytest
    ;;
  logs)
    require_docker
    "${COMPOSE[@]}" logs -f api
    ;;
  clean)
    require_docker
    "${COMPOSE[@]}" down --volumes --remove-orphans
    ;;
  --help|-h|help)
    usage
    ;;
  "")
    usage
    exit 2
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
