from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QueryCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid", str_strip_whitespace=True)

    case_id: str = Field(alias="caseId", min_length=1)
    field_path: str = Field(alias="fieldPath", min_length=1)
    question: str = Field(min_length=1)


class QueryRecord(QueryCreate):
    id: str
    created_at: datetime = Field(alias="createdAt")
