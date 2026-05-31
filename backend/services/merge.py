from collections.abc import Iterable
from typing import Any

from backend.models.cases import CaseRecord, ExtractedField, FieldStatus


def merge_cases(stored: CaseRecord, follow_up: CaseRecord) -> CaseRecord:
    merged_sections: dict[str, dict[str, ExtractedField]] = {}

    for section_name in _ordered_union(stored.sections.keys(), follow_up.sections.keys()):
        stored_fields = stored.sections.get(section_name, {})
        follow_up_fields = follow_up.sections.get(section_name, {})
        merged_fields: dict[str, ExtractedField] = {}

        for field_name in _ordered_union(stored_fields.keys(), follow_up_fields.keys()):
            if field_name in stored_fields and field_name in follow_up_fields:
                previous = stored_fields[field_name]
                incoming = follow_up_fields[field_name]
                if incoming.value == previous.value:
                    merged_fields[field_name] = _annotated(incoming, "unchanged")
                else:
                    merged_fields[field_name] = _annotated(
                        incoming,
                        "overridden",
                        previous_value=previous.value,
                    )
            elif field_name in follow_up_fields:
                merged_fields[field_name] = _annotated(follow_up_fields[field_name], "new")
            else:
                merged_fields[field_name] = _annotated(
                    stored_fields[field_name],
                    "unchanged",
                    not_in_followup=True,
                )

        merged_sections[section_name] = merged_fields

    return CaseRecord(
        case_id=stored.case_id,
        version=stored.version + 1,
        case_classification=follow_up.case_classification,
        extracted_at=follow_up.extracted_at,
        source_document=follow_up.source_document,
        sections=merged_sections,
        missing_fields=list(follow_up.missing_fields),
    )


def field_path_exists(case: CaseRecord, field_path: str) -> bool:
    section_name, field_name = parse_field_path(field_path)
    return field_name in case.sections.get(section_name, {})


def parse_field_path(field_path: str) -> tuple[str, str]:
    parts = field_path.split(".")
    if len(parts) != 2 or any(part.strip() == "" for part in parts):
        raise ValueError("fieldPath must use '<section>.<field>' format")
    return parts[0], parts[1]


def _annotated(
    field: ExtractedField,
    status: FieldStatus,
    *,
    previous_value: Any | None = None,
    not_in_followup: bool = False,
) -> ExtractedField:
    field_copy = field.model_copy(deep=True)
    field_copy.status = status
    field_copy.previous_value = previous_value
    field_copy.not_in_followup = True if not_in_followup else None
    return field_copy


def _ordered_union(first: Iterable[str], second: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for item in [*first, *second]:
        if item not in seen:
            ordered.append(item)
            seen.add(item)
    return ordered
