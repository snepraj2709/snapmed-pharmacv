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
