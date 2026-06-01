from fastapi import APIRouter, HTTPException, Query

from backend.models.queries import QueryCreate, QueryRecord
from backend.services.merge import field_path_exists, normalize_field_path
from backend.storage import storage


router = APIRouter(prefix="/queries", tags=["queries"])


@router.post("", response_model=QueryRecord)
def create_query(payload: QueryCreate) -> QueryRecord:
    case = storage.get_case(payload.case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case {payload.case_id} not found")

    try:
        normalized_field_path = normalize_field_path(payload.field_path)
        if not field_path_exists(case, normalized_field_path):
            raise HTTPException(status_code=400, detail=f"Unknown fieldPath {normalized_field_path}")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    payload = payload.model_copy(update={"field_path": normalized_field_path})
    return storage.create_query(payload)


@router.get("", response_model=list[QueryRecord])
def list_queries(case_id: str = Query(alias="caseId")) -> list[QueryRecord]:
    normalized_case_id = case_id.strip()
    if normalized_case_id == "":
        raise HTTPException(status_code=400, detail="caseId must not be blank")

    if storage.get_case(normalized_case_id) is None:
        raise HTTPException(status_code=404, detail=f"Case {normalized_case_id} not found")
    return storage.list_queries(normalized_case_id)
