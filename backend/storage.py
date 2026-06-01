from datetime import UTC, datetime
from threading import RLock
from typing import Callable

from backend.models.cases import CaseRecord
from backend.models.queries import QueryCreate, QueryRecord


class InMemoryStorage:
    def __init__(self) -> None:
        self._lock = RLock()
        self._cases: dict[str, CaseRecord] = {}
        self._queries: dict[str, list[QueryRecord]] = {}
        self._query_sequence = 0

    def reset(self) -> None:
        with self._lock:
            self._cases.clear()
            self._queries.clear()
            self._query_sequence = 0

    def put_case(self, case: CaseRecord) -> CaseRecord:
        case_copy = case.model_copy(deep=True)
        with self._lock:
            self._cases[case_copy.case_id] = case_copy
            self._queries.setdefault(case_copy.case_id, [])
            return case_copy.model_copy(deep=True)

    def get_case(self, case_id: str) -> CaseRecord | None:
        with self._lock:
            case = self._cases.get(case_id)
            if case is None:
                return None
            return case.model_copy(deep=True)

    def list_cases(self) -> list[CaseRecord]:
        with self._lock:
            return [
                case.model_copy(deep=True)
                for case in sorted(self._cases.values(), key=lambda item: item.case_id)
            ]

    def update_case(
        self,
        case_id: str,
        update: Callable[[CaseRecord], CaseRecord],
    ) -> CaseRecord | None:
        with self._lock:
            current = self._cases.get(case_id)
            if current is None:
                return None

            updated = update(current.model_copy(deep=True))
            updated_copy = updated.model_copy(deep=True)
            self._cases[updated_copy.case_id] = updated_copy
            self._queries.setdefault(updated_copy.case_id, [])
            return updated_copy.model_copy(deep=True)

    def create_query(self, payload: QueryCreate) -> QueryRecord:
        with self._lock:
            self._query_sequence += 1
            query = QueryRecord(
                id=f"qry_{self._query_sequence:06d}",
                caseId=payload.case_id,
                fieldPath=payload.field_path,
                question=payload.question,
                createdAt=datetime.now(UTC),
            )
            self._queries.setdefault(payload.case_id, []).append(query)
            return query.model_copy(deep=True)

    def list_queries(self, case_id: str) -> list[QueryRecord]:
        with self._lock:
            return [query.model_copy(deep=True) for query in self._queries.get(case_id, [])]


storage = InMemoryStorage()
