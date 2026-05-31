import json
from pathlib import Path

from backend.models.cases import CaseRecord
from backend.storage import InMemoryStorage


BOOTSTRAP_CASE_ID = "PV-2026-0451"
CASE_FILE = Path(__file__).resolve().parents[2] / "case_v1.json"


def load_bootstrap_case(case_storage: InMemoryStorage, case_file: Path = CASE_FILE) -> None:
    payload = json.loads(case_file.read_text(encoding="utf-8"))
    case = CaseRecord.model_validate(payload)
    if case.case_id != BOOTSTRAP_CASE_ID:
        raise RuntimeError(f"Expected bootstrap case {BOOTSTRAP_CASE_ID}, got {case.case_id}")

    case_storage.reset()
    case_storage.put_case(case)
