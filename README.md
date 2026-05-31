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
