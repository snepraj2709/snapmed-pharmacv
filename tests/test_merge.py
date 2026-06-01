from backend.models.cases import CaseRecord, ExtractedField
from backend.services.merge import field_path_exists, merge_cases, normalize_field_path, parse_field_path


def test_merge_marks_same_values_unchanged_with_latest_metadata(base_case: CaseRecord) -> None:
    follow_up = base_case.model_copy(deep=True)
    follow_up.sections["patient"]["age"].confidence = 0.77
    follow_up.sections["patient"]["age"].source = "p.9 s1"

    merged = merge_cases(base_case, follow_up)

    field = merged.sections["patient"]["age"]
    assert field.value == "62"
    assert field.confidence == 0.77
    assert field.source == "p.9 s1"
    assert field.status == "unchanged"
    assert field.previous_value is None


def test_merge_marks_changed_values_overridden(base_case: CaseRecord) -> None:
    follow_up = base_case.model_copy(deep=True)
    follow_up.sections["adverse_event"]["outcome"].value = "Recovering"

    merged = merge_cases(base_case, follow_up)

    field = merged.sections["adverse_event"]["outcome"]
    assert field.value == "Recovering"
    assert field.status == "overridden"
    assert field.previous_value == "Recovered"


def test_merge_marks_new_fields_new(base_case: CaseRecord) -> None:
    follow_up = base_case.model_copy(deep=True)
    follow_up.sections["patient"]["height_cm"] = ExtractedField(
        value="170",
        confidence=0.84,
        source="p.2 s3",
    )

    merged = merge_cases(base_case, follow_up)

    field = merged.sections["patient"]["height_cm"]
    assert field.status == "new"
    assert field.value == "170"


def test_merge_marks_fields_in_new_sections_new(base_case: CaseRecord) -> None:
    follow_up = base_case.model_copy(deep=True)
    follow_up.sections["lab_results"] = {
        "ck": ExtractedField(value="310 U/L", confidence=0.76, source="p.6 s1")
    }

    merged = merge_cases(base_case, follow_up)

    field = merged.sections["lab_results"]["ck"]
    assert field.status == "new"
    assert field.value == "310 U/L"


def test_merge_preserves_absent_stored_fields(base_case: CaseRecord) -> None:
    follow_up = base_case.model_copy(deep=True)
    del follow_up.sections["patient"]["weight_kg"]

    merged = merge_cases(base_case, follow_up)

    field = merged.sections["patient"]["weight_kg"]
    assert field.value == "78"
    assert field.status == "unchanged"
    assert field.not_in_followup is True


def test_merge_preserves_absent_stored_sections(base_case: CaseRecord) -> None:
    follow_up = base_case.model_copy(deep=True)
    del follow_up.sections["reporter"]

    merged = merge_cases(base_case, follow_up)

    field = merged.sections["reporter"]["country"]
    assert field.value == "India"
    assert field.status == "unchanged"
    assert field.not_in_followup is True


def test_merge_surfaces_missing_fields(base_case: CaseRecord) -> None:
    follow_up = base_case.model_copy(deep=True)
    follow_up.missing_fields = ["reporter.phone", "patient.date_of_birth"]

    merged = merge_cases(base_case, follow_up)

    assert merged.missing_fields == ["reporter.phone", "patient.date_of_birth"]


def test_field_path_helpers(base_case: CaseRecord) -> None:
    assert parse_field_path("patient.age") == ("patient", "age")
    assert normalize_field_path(" patient . age ") == "patient.age"
    assert field_path_exists(base_case, "patient.age")
    assert not field_path_exists(base_case, "patient.unknown")
