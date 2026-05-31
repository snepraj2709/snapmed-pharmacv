from datetime import UTC, datetime

from backend.models.cases import CaseRecord
from backend.models.queries import QueryCreate, QueryRecord


class InMemoryStorage:
    def __init__(self) -> None:
        self._cases: dict[str, CaseRecord] = {}
        self._queries: dict[str, list[QueryRecord]] = {}
        self._query_sequence = 0

    def reset(self) -> None:
        self._cases.clear()
        self._queries.clear()
        self._query_sequence = 0

    def put_case(self, case: CaseRecord) -> CaseRecord:
        case_copy = case.model_copy(deep=True)
        self._cases[case_copy.case_id] = case_copy
        self._queries.setdefault(case_copy.case_id, [])
        return case_copy.model_copy(deep=True)

    def get_case(self, case_id: str) -> CaseRecord | None:
        case = self._cases.get(case_id)
        if case is None:
            return None
        return case.model_copy(deep=True)

    def list_cases(self) -> list[CaseRecord]:
        return [
            case.model_copy(deep=True)
            for case in sorted(self._cases.values(), key=lambda item: item.case_id)
        ]

    def create_query(self, payload: QueryCreate) -> QueryRecord:
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
        return [query.model_copy(deep=True) for query in self._queries.get(case_id, [])]


storage = InMemoryStorage()
