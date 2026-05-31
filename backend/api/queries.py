from fastapi import APIRouter, HTTPException, Query

from backend.models.queries import QueryCreate, QueryRecord
from backend.services.merge import field_path_exists, parse_field_path
from backend.storage import storage


router = APIRouter(prefix="/queries", tags=["queries"])


@router.post("", response_model=QueryRecord)
def create_query(payload: QueryCreate) -> QueryRecord:
    case = storage.get_case(payload.case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case {payload.case_id} not found")

    try:
        if not field_path_exists(case, payload.field_path):
            raise HTTPException(status_code=400, detail=f"Unknown fieldPath {payload.field_path}")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return storage.create_query(payload)


@router.get("", response_model=list[QueryRecord])
def list_queries(case_id: str = Query(alias="caseId")) -> list[QueryRecord]:
    if storage.get_case(case_id) is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return storage.list_queries(case_id)
