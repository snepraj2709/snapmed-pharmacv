# SnapMed PharmaCV

Python FastAPI service and TypeScript React frontend for pharmacovigilance case review. The backend loads the initial case from `case_v1.json`, accepts follow-up payloads, annotates field-level merge changes, and stores reviewer queries in memory. The frontend consumes the API through a typed service layer and presents a compact reviewer workflow for case diffs.

## Local Development

Requirements:

- Python 3.12
- uv
- Node.js 20+ and npm, for the frontend

Install dependencies:

```bash
uv sync
```

Run the API:

```bash
uv run uvicorn backend.main:app --reload --port 8000
```

Run tests:

```bash
uv run pytest
```

## Frontend

The `frontend/` folder contains a Vite, React, TypeScript, Tailwind CSS, and shadcn/ui application. It defaults to `http://localhost:8000` for API calls and can be pointed at another backend with `VITE_API_BASE_URL`.

Install frontend dependencies:

```bash
cd frontend
npm install
```

Run the frontend:

```bash
npm run dev
```

The Vite app listens on `http://localhost:5173`.

Build and type-check the frontend:

```bash
npm run build
```

Optional API override:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

### Frontend Architecture

- API boundary: `frontend/src/api/` exposes a `CaseReviewApi` interface, an HTTP implementation, typed request/response models, and a fetch client.
- Environment config: `frontend/src/config/env.ts` normalizes `VITE_API_BASE_URL`.
- Domain formatting: `frontend/src/features/case-review/domain.ts` flattens sections, groups fields, formats values, labels statuses, and applies sort/filter controls.
- State management: React Query handles API reads/mutations; local review controls are isolated in `useReviewControls`.
- Fallback data: if the API is unavailable, the page renders a merged local review using `case_v2_followup_payload.json` so the UI can still be reviewed.

### Case Review UI

The case review page uses the brand colors from `Build_Plan.md`: navy `#0C1A36`, brand blue `#0077B6`, and accent teal `#00C2E0`.

- The header shows case metadata, classification selection, and summary counts.
- Fields are grouped by section in a single information panel instead of separate row cards.
- Each field row uses a `20 / 50 / 30` desktop distribution: field name, value/change details, then status/confidence/actions.
- Overridden rows receive a subtle `#0077B6` background tint and show current versus previous values inline.
- Source references are shown at the bottom-right of each row with an icon.
- Section rows use subtle dividers, avoiding heavy borders between individual fields.
- The conflicts-only filter narrows the review to overridden fields and expands relevant sections.
- The case classification selector only exposes `Significant` and `Non-significant`; null values display as an empty placeholder until selected.

## Merge Behavior

Follow-up payloads are merged field by field against the latest stored case:

- Same `value`: mark the field as `status: "unchanged"` and keep the follow-up confidence/source.
- Different `value`: mark the field as `status: "overridden"` and include `previous_value`.
- New field: add it with `status: "new"`.
- Stored field omitted from the follow-up: preserve the stored value, mark it as `status: "unchanged"`, and add `not_in_followup: true`.

Omitted stored fields are preserved because an AI follow-up extraction can miss data that still belongs in the case. Dropping those fields would make the latest case less complete and can hide information a reviewer had already seen.

The top-level `missing_fields` array from the latest follow-up is surfaced unchanged in the merged response.

## API Examples

Health check:

```bash
curl -s http://localhost:8000/health | jq
```

Fetch the latest case:

```bash
curl -s http://localhost:8000/cases/PV-2026-0451 | jq
```

Submit a follow-up and receive diff annotations:

```bash
curl -s -X POST http://localhost:8000/cases/PV-2026-0451/follow-ups \
  -H 'Content-Type: application/json' \
  -d '{
    "case_id": "PV-2026-0451",
    "version": 2,
    "case_classification": "significant",
    "extracted_at": "2026-04-09T09:14:00Z",
    "source_document": "followup_report_PV-2026-0451.pdf",
    "missing_fields": ["reporter.phone"],
    "sections": {
      "patient": {
        "initials": { "value": "M.K.", "confidence": 0.98, "source": "p.2 s1" },
        "age": { "value": "63", "confidence": 0.92, "source": "p.2 s1" },
        "sex": { "value": "Male", "confidence": 0.99, "source": "p.2 s1" }
      },
      "suspect_drug": {
        "drug_name": { "value": "Atorvastatin", "confidence": 0.97, "source": "p.3 s3" },
        "dose": { "value": "20 mg", "confidence": 0.93, "source": "p.3 s3" },
        "route": { "value": "Oral", "confidence": 0.96, "source": "p.3 s3" },
        "indication": { "value": "Hypercholesterolemia", "confidence": 0.88, "source": "p.3 s4" }
      },
      "adverse_event": {
        "event_term": { "value": "Myalgia", "confidence": 0.94, "source": "p.4 s1" },
        "onset_date": { "value": "2026-03-14", "confidence": 0.78, "source": "p.4 s2" },
        "outcome": { "value": "Recovering", "confidence": 0.82, "source": "p.5 s1" },
        "seriousness": { "value": "Serious", "confidence": 0.83, "source": "p.5 s1" }
      },
      "reporter": {
        "qualification": { "value": "Physician", "confidence": 0.95, "source": "p.1 s1" },
        "country": { "value": "India", "confidence": 0.99, "source": "p.1 s1" }
      }
    }
  }' | jq
```

Create a reviewer query:

```bash
curl -s -X POST http://localhost:8000/queries \
  -H 'Content-Type: application/json' \
  -d '{
    "caseId": "PV-2026-0451",
    "fieldPath": "adverse_event.onset_date",
    "question": "Please confirm the onset date from the follow-up document."
  }' | jq
```

List reviewer queries for a case:

```bash
curl -s 'http://localhost:8000/queries?caseId=PV-2026-0451' | jq
```

## Operations

### Build And Start

Build the container image:

```bash
./ops/run.sh build
```

Start the service:

```bash
./ops/run.sh start
```

The API listens on `http://localhost:8000`. The Compose service has a healthcheck that calls `/health` from inside the container.

### Verify Health

Check liveness:

```bash
curl -fsS http://localhost:8000/health
```

Check the bootstrap case:

```bash
curl -fsS http://localhost:8000/cases/PV-2026-0451 | jq '.case_id, .version'
```

### Back Up Data

Create a timestamped backup under `backups/`:

```bash
./ops/backup.sh
```

The script reads all latest cases from `GET /cases`, validates the response with `jq`, writes `backups/cases-<timestamp>-<pid>.json`, logs progress to stderr with UTC timestamps, and prints the backup path to stdout. By default it writes to this repository's `backups/` directory even when called from cron or another working directory.

### Restore Data

Preview a restore without changing the service:

```bash
./ops/restore.sh --dry-run backups/cases-<timestamp>-<pid>.json
```

Restore cases:

```bash
./ops/restore.sh backups/cases-<timestamp>-<pid>.json
```

Restore posts each case to `POST /cases`, which upserts by `case_id`, so rerunning the same backup is idempotent.

### Debug Failed Startup

Check whether Docker is reachable:

```bash
docker info
```

Check container status and health:

```bash
docker compose ps
docker compose logs --tail=100 api
```

If port `8000` is already in use, stop the other process or change the published port in `docker-compose.yml`. If the app starts but fails immediately, confirm `case_v1.json` exists in the image context and that the image was rebuilt after code changes.

### Debug Failed Requests

Check these first:

- `/health` returns `{"status":"ok"}`.
- The requested case ID exists in `GET /cases`.
- Follow-up payload `case_id` matches the path case ID.
- Query `fieldPath` uses `<section>.<field>`, for example `adverse_event.onset_date`.
- Container logs show the request and any validation error details.

### Common Commands

```bash
make build
make start
make test
make backup
make restore-dry-run BACKUP=backups/cases-<timestamp>-<pid>.json
make restore BACKUP=backups/cases-<timestamp>-<pid>.json
make logs
make stop
make clean
```
