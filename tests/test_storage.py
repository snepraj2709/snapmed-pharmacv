import time
from concurrent.futures import ThreadPoolExecutor

from backend.models.cases import CaseRecord
from backend.services.merge import merge_cases
from backend.storage import InMemoryStorage


def test_update_case_serializes_concurrent_follow_ups(base_case: CaseRecord) -> None:
    storage = InMemoryStorage()
    storage.put_case(base_case)

    def apply_follow_up(outcome: str) -> int:
        follow_up = base_case.model_copy(deep=True)
        follow_up.sections["adverse_event"]["outcome"].value = outcome

        def update(current: CaseRecord) -> CaseRecord:
            time.sleep(0.01)
            return merge_cases(current, follow_up)

        updated = storage.update_case(base_case.case_id, update)
        assert updated is not None
        return updated.version

    with ThreadPoolExecutor(max_workers=2) as pool:
        versions = list(pool.map(apply_follow_up, ["Recovering", "Recovered with sequelae"]))

    latest = storage.get_case(base_case.case_id)

    assert sorted(versions) == [2, 3]
    assert latest is not None
    assert latest.version == 3
