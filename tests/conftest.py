import json
from pathlib import Path

import pytest

from backend.models.cases import CaseRecord


@pytest.fixture
def base_case() -> CaseRecord:
    payload = json.loads(Path("case_v1.json").read_text(encoding="utf-8"))
    return CaseRecord.model_validate(payload)
