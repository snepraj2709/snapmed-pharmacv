from fastapi import APIRouter, HTTPException

from backend.models.cases import CaseListResponse, CaseRecord
from backend.services.merge import merge_cases
from backend.storage import storage


router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("", response_model=CaseListResponse, response_model_exclude_none=True)
def list_cases() -> CaseListResponse:
    return CaseListResponse(cases=storage.list_cases())


@router.post("", response_model=CaseRecord, response_model_exclude_none=True)
def restore_case_from_backup(payload: CaseRecord) -> CaseRecord:
    return storage.put_case(payload)


@router.get("/{case_id}", response_model=CaseRecord, response_model_exclude_none=True)
def get_case(case_id: str) -> CaseRecord:
    case = storage.get_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return case


@router.put("/{case_id}", response_model=CaseRecord, response_model_exclude_none=True)
def restore_case(case_id: str, payload: CaseRecord) -> CaseRecord:
    if payload.case_id != case_id:
        raise HTTPException(status_code=400, detail="Path caseId must match payload case_id")
    return storage.put_case(payload)


@router.post("/{case_id}/follow-ups", response_model=CaseRecord, response_model_exclude_none=True)
def create_follow_up(case_id: str, payload: CaseRecord) -> CaseRecord:
    if payload.case_id != case_id:
        raise HTTPException(status_code=400, detail="Path caseId must match payload case_id")

    stored = storage.get_case(case_id)
    if stored is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    merged = merge_cases(stored, payload)
    return storage.put_case(merged)
