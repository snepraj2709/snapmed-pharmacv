from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field


FieldStatus = Literal["unchanged", "overridden", "new"]
CaseClassification = Literal["significant", "non-significant", "null"]
NonBlankString = Annotated[str, Field(min_length=1)]


class ExtractedField(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    value: Any
    confidence: float = Field(ge=0, le=1)
    source: str = Field(min_length=1)
    status: FieldStatus | None = None
    previous_value: Any | None = None
    not_in_followup: bool | None = None


class CaseRecord(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    case_id: str = Field(min_length=1)
    version: int = Field(ge=1)
    case_classification: CaseClassification
    extracted_at: datetime
    source_document: str = Field(min_length=1)
    sections: dict[str, dict[str, ExtractedField]] = Field(min_length=1)
    missing_fields: list[NonBlankString] = Field(default_factory=list)


class CaseListResponse(BaseModel):
    cases: list[CaseRecord]
