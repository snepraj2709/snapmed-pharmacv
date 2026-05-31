# SnapMed PharmaCV

Python FastAPI service for pharmacovigilance case review. It loads the initial case from `case_v1.json`, accepts follow-up payloads, annotates field-level merge changes, and stores reviewer queries in memory.

## Local Development

```bash
uv sync
uv run uvicorn backend.main:app --reload --port 8000
```

```bash
uv run pytest
```
