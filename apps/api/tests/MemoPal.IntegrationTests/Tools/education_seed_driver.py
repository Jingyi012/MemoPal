"""Integration-test adapter only: bridge the importer core to an isolated TestServer proxy.

The public CLI has no environment-verification bypass. Here the .NET fixture owns
both the loopback proxy and its isolated TestServer, so only orchestration is under test.
"""
import json
import sys
import copy
from pathlib import Path

from seed_content import load_seed
from seed_import import ApiClient, run_seed
from seed_safety import SeedError


def snapshot(client, seed, state_path):
    state = json.loads(Path(state_path).read_text(encoding="utf-8"))
    rows = []
    for course in seed["courses"]:
        record = state["courses"][course["slug"]]
        objectives = client.request("GET", f"/v1/education/courses/{record['id']}/objectives")
        assert all(row["reviewStatus"] == "Unreviewed" and row["contentOrigin"] == "Original" for row in objectives)
        for objective in record["objectives"].values():
            rows.extend(client.request("GET", f"/v1/education/courses/{record['id']}/objectives/{objective['id']}/study-items"))
    return rows


def main():
    origin, state_path = sys.argv[1:3]
    client = ApiClient(origin, guard=lambda: None)
    user_id = client.authenticate()
    seed = load_seed()
    first = run_seed(client, seed, state_path, user_id)
    before = snapshot(client, seed, state_path)
    second = run_seed(client, seed, state_path, user_id)
    after = snapshot(client, seed, state_path)
    assert before == after, "No-op import changed stored item content/version/timestamps."
    assert len(after) == 54 and all(row["status"] == "Draft" for row in after)
    assert first["studyItems"]["created"] == 54
    assert second["resources"]["created"] == 0 and second["resources"]["updated"] == 0
    assert second["studyItems"] == {"created": 0, "updated": 0, "unchanged": 54}
    courses = client.request("GET", "/v1/education/courses")
    assert len(courses) == 2 and all(not row["isPublic"] for row in courses)
    state = json.loads(Path(state_path).read_text(encoding="utf-8"))
    chinese = state["courses"]["chinese"]
    assessments = client.request("GET", f"/v1/education/courses/{chinese['id']}/assessments")
    assert len(assessments) == 1 and assessments[0]["status"] == "draft"
    assert len(assessments[0]["questions"]) == 6
    assert all(row["objectiveId"] == chinese["objectives"]["characters-and-words"]["id"] for row in assessments[0]["questions"])
    seed = copy.deepcopy(seed)
    seed["courses"][0]["objectives"][0]["items"][0]["secondary"] = "演示更新：光线足，能够把东西看清。"
    updated = run_seed(client, seed, state_path, user_id)
    assert updated["studyItems"] == {"created": 0, "updated": 1, "unchanged": 53}
    assert {row["id"] for row in after} == {row["id"] for row in snapshot(client, seed, state_path)}
    third = run_seed(client, seed, state_path, user_id, publish=True)
    fourth = run_seed(client, seed, state_path, user_id, publish=True)
    assert third["published"] == 55 and fourth["published"] == 0
    assert all(not row["isPublic"] for row in client.request("GET", "/v1/education/courses"))
    assert all(row["status"] == "Published" for row in snapshot(client, seed, state_path))
    print(json.dumps({"first": first, "second": second, "updated": updated["studyItems"]["updated"], "published": third["published"], "repeatedPublish": fourth["published"]}))


if __name__ == "__main__":
    try:
        main()
    except SeedError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
    except Exception as error:
        # Never expose exception locals, raw author DTOs, passwords or tokens in test logs.
        print(f"Seed importer API integration failed ({type(error).__name__}); no credential or author response was logged.", file=sys.stderr)
        raise SystemExit(1)
