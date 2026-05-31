# SnapMed PharmaCV

Python FastAPI service for pharmacovigilance case review. It loads the initial case from `case_v1.json`, accepts follow-up payloads, annotates field-level merge changes, and stores reviewer queries in memory.

## Local Development

Requirements:

- Python 3.12
- uv

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

The script reads all latest cases from `GET /cases`, validates the response with `jq`, writes `backups/cases-<timestamp>.json`, logs progress to stderr with UTC timestamps, and prints the backup path to stdout.

### Restore Data

Preview a restore without changing the service:

```bash
./ops/restore.sh --dry-run backups/cases-<timestamp>.json
```

Restore cases:

```bash
./ops/restore.sh backups/cases-<timestamp>.json
```

Restore uses `PUT /cases/{caseId}`, so rerunning the same backup is idempotent.

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
make restore-dry-run BACKUP=backups/cases-<timestamp>.json
make restore BACKUP=backups/cases-<timestamp>.json
make logs
make stop
make clean
```
