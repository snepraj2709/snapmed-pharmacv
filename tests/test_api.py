import pytest
from fastapi.testclient import TestClient

from backend.main import app


def test_get_bootstrap_case() -> None:
    with TestClient(app) as client:
        response = client.get("/cases/PV-2026-0451")

    assert response.status_code == 200
    body = response.json()
    assert body["case_id"] == "PV-2026-0451"
    assert body["version"] == 1
    assert body["sections"]["patient"]["age"]["value"] == "62"


def test_follow_up_merges_and_stores_latest_case() -> None:
    with TestClient(app) as client:
        payload = client.get("/cases/PV-2026-0451").json()
        payload["version"] = 2
        payload["source_document"] = "followup_report_PV-2026-0451.pdf"
        payload["extracted_at"] = "2026-04-09T09:14:00Z"
        payload["missing_fields"] = ["reporter.phone"]
        payload["sections"]["patient"]["age"]["value"] = "63"
        del payload["sections"]["patient"]["weight_kg"]
        payload["sections"]["patient"]["height_cm"] = {
            "value": "170",
            "confidence": 0.82,
            "source": "p.2 s2",
        }

        merge_response = client.post("/cases/PV-2026-0451/follow-ups", json=payload)
        latest_response = client.get("/cases/PV-2026-0451")

    assert merge_response.status_code == 200
    merged = merge_response.json()
    patient = merged["sections"]["patient"]
    assert merged["version"] == 2
    assert merged["missing_fields"] == ["reporter.phone"]
    assert patient["age"]["status"] == "overridden"
    assert patient["age"]["previous_value"] == "62"
    assert patient["weight_kg"]["not_in_followup"] is True
    assert patient["height_cm"]["status"] == "new"
    assert latest_response.json() == merged


def test_queries_can_be_created_and_listed() -> None:
    with TestClient(app) as client:
        create_response = client.post(
            "/queries",
            json={
                "caseId": "PV-2026-0451",
                "fieldPath": "adverse_event.onset_date",
                "question": "Please confirm the onset date.",
            },
        )
        list_response = client.get("/queries?caseId=PV-2026-0451")

    assert create_response.status_code == 200
    created = create_response.json()
    assert created["id"] == "qry_000001"
    assert created["caseId"] == "PV-2026-0451"
    assert list_response.status_code == 200
    assert list_response.json() == [created]


def test_list_queries_rejects_blank_case_id_and_strips_valid_case_id() -> None:
    with TestClient(app) as client:
        blank_case_id = client.get("/queries", params={"caseId": "   "})
        spaced_case_id = client.get("/queries", params={"caseId": " PV-2026-0451 "})

    assert blank_case_id.status_code == 400
    assert spaced_case_id.status_code == 200


def test_query_rejects_blank_question_and_normalizes_field_path() -> None:
    with TestClient(app) as client:
        blank_question = client.post(
            "/queries",
            json={
                "caseId": "PV-2026-0451",
                "fieldPath": "adverse_event.onset_date",
                "question": "   ",
            },
        )
        spaced_field_path = client.post(
            "/queries",
            json={
                "caseId": "PV-2026-0451",
                "fieldPath": " adverse_event . onset_date ",
                "question": " Please confirm the onset date. ",
            },
        )

    assert blank_question.status_code == 400
    assert spaced_field_path.status_code == 200
    assert spaced_field_path.json()["fieldPath"] == "adverse_event.onset_date"
    assert spaced_field_path.json()["question"] == "Please confirm the onset date."


def test_cases_can_be_listed_and_restored_idempotently() -> None:
    with TestClient(app) as client:
        list_response = client.get("/cases")
        case = list_response.json()["cases"][0]
        case["case_classification"] = "significant"

        first_restore = client.post("/cases", json=case)
        second_restore = client.post("/cases", json=case)
        latest = client.get("/cases/PV-2026-0451")

    assert list_response.status_code == 200
    assert list_response.json()["cases"][0]["case_id"] == "PV-2026-0451"
    assert first_restore.status_code == 200
    assert second_restore.status_code == 200
    assert latest.json()["case_classification"] == "significant"


def test_case_payload_rejects_blank_missing_fields() -> None:
    with TestClient(app) as client:
        valid_case = client.get("/cases/PV-2026-0451").json()
        valid_case["missing_fields"] = [" reporter.phone "]
        valid_response = client.post("/cases", json=valid_case)

        invalid_case = client.get("/cases/PV-2026-0451").json()
        invalid_case["missing_fields"] = ["   "]
        invalid_response = client.post("/cases", json=invalid_case)

    assert valid_response.status_code == 200
    assert valid_response.json()["missing_fields"] == ["reporter.phone"]
    assert invalid_response.status_code == 400


def test_restore_rejects_mismatched_case_id() -> None:
    with TestClient(app) as client:
        case = client.get("/cases/PV-2026-0451").json()
        response = client.put("/cases/OTHER", json=case)

    assert response.status_code == 400


def test_follow_up_rejects_mismatched_case_id_and_invalid_field_values() -> None:
    with TestClient(app) as client:
        mismatched = client.get("/cases/PV-2026-0451").json()
        mismatched["case_id"] = "OTHER"
        mismatch_response = client.post("/cases/PV-2026-0451/follow-ups", json=mismatched)

        invalid_confidence = client.get("/cases/PV-2026-0451").json()
        invalid_confidence["sections"]["patient"]["age"]["confidence"] = 1.5
        invalid_response = client.post("/cases/PV-2026-0451/follow-ups", json=invalid_confidence)

    assert mismatch_response.status_code == 400
    assert invalid_response.status_code == 400


def test_unknown_case_returns_404() -> None:
    with TestClient(app) as client:
        response = client.get("/cases/UNKNOWN")

    assert response.status_code == 404


def test_invalid_payload_and_unknown_field_path_return_400() -> None:
    with TestClient(app) as client:
        invalid_payload = client.post("/queries", json={"caseId": "", "fieldPath": "", "question": ""})
        unknown_field = client.post(
            "/queries",
            json={
                "caseId": "PV-2026-0451",
                "fieldPath": "patient.unknown",
                "question": "Can you verify this?",
            },
        )
        malformed_field_path = client.post(
            "/queries",
            json={
                "caseId": "PV-2026-0451",
                "fieldPath": "patient",
                "question": "Can you verify this?",
            },
        )

    assert invalid_payload.status_code == 400
    assert unknown_field.status_code == 400
    assert malformed_field_path.status_code == 400


@pytest.mark.parametrize(
    "origin",
    [
        "http://localhost:5173",
        "http://127.0.0.1:3001",
        "http://0.0.0.0:4173",
        "http://[::1]:5173",
    ],
)
def test_local_development_cors_preflight_is_allowed(origin: str) -> None:
    with TestClient(app) as client:
        response = client.options(
            "/cases/PV-2026-0451",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "*"
    assert "GET" in response.headers["access-control-allow-methods"]


def test_local_development_cors_get_is_allowed() -> None:
    with TestClient(app) as client:
        response = client.get("/cases", headers={"Origin": "http://127.0.0.1:3001"})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "*"


def test_wildcard_cors_allows_any_origin_for_now() -> None:
    with TestClient(app) as client:
        response = client.options(
            "/cases/PV-2026-0451",
            headers={
                "Origin": "http://example.test",
                "Access-Control-Request-Method": "GET",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "*"
