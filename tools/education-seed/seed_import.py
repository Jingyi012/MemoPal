"""Local-only API importer. No database access, registration, public-course or force option."""
import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from seed_content import REPORT_FILE, api_items, load_seed, validate_document, write_assets
from seed_safety import (LocalTargetGuard, SeedError, decide_existing, default_state_path,
                         digest, local_url, resource_title, save_state, state_for, state_lock)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise SeedError("HTTP redirects are prohibited for credentialed demo requests.")


class ApiClient:
    def __init__(self, origin, guard):
        self.origin, _ = local_url(origin)
        self.guard = guard
        self.token = None
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())

    def request(self, method, route, payload=None, content_type="application/json"):
        self.guard()
        if not route.startswith("/") or route.startswith("//"):
            raise SeedError("Invalid API route.")
        data = payload if isinstance(payload, bytes) else None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers = {"Content-Type": content_type}
        if self.token:
            headers["Authorization"] = "Bearer " + self.token
        request = urllib.request.Request(self.origin + route, data=data, headers=headers, method=method)
        try:
            with self.opener.open(request, timeout=45) as response:
                result = json.load(response)
        except urllib.error.HTTPError as error:
            # Never echo server response bodies: author assessment DTOs contain answer fields.
            raise SeedError(f"API refused {method} {route} (HTTP {error.code}).") from None
        except (urllib.error.URLError, OSError, ValueError):
            raise SeedError(f"API transport/response failure for {method} {route}.") from None
        if result.get("success") is not True:
            raise SeedError(f"API rejected {method} {route}.")
        return result.get("data")

    def authenticate(self):
        token = os.environ.get("MEMOPAL_DEMO_TOKEN")
        if token:
            self.token = token
        else:
            email = os.environ.get("MEMOPAL_DEMO_EMAIL")
            password = os.environ.get("MEMOPAL_DEMO_PASSWORD")
            if not email or not password:
                raise SeedError("Set MEMOPAL_DEMO_TOKEN or both MEMOPAL_DEMO_EMAIL and MEMOPAL_DEMO_PASSWORD at runtime. No default account exists.")
            response = self.request("POST", "/auth/login", dict(email=email, password=password))
            self.token = response["token"]
        user = self.request("GET", "/auth/me")
        # /auth/me does not expose Role. Only inspect the same JWT after that API has
        # authenticated it, and bind its subject to the returned account. Never log it.
        try:
            encoded = self.token.split(".")[1]
            claims = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        except (ValueError, IndexError, TypeError):
            raise SeedError("Unsupported server token format.") from None
        role = claims.get("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", claims.get("role"))
        if role != "User" or claims.get("sub") != user["id"]:
            raise SeedError("Use a normally registered ordinary demo author, not a platform Admin account.")
        return user["id"]


META_FIELDS = ("memoryContentType", "languageCode", "gradeCode", "curriculumCode", "subjectCode", "contentOrigin", "reviewStatus")
QUESTION_DEFAULTS = dict(fillMode=None, maxScore=1, options=[], correctOptionId=None,
                         correctBooleanAnswer=None, allowedTextAnswers=[], trimTextAnswers=False,
                         ignoreCase=False, allowedNumericAnswers=[], numericTolerance=0,
                         correctOptionIds=[], correctSequenceIds=[], matchingPairs=[],
                         gradingRubric=None, explanation=None)


def question_body(source, objective_id, question_id=None):
    return dict(QUESTION_DEFAULTS, **{field: source[field] for field in QUESTION_DEFAULTS if field in source},
                id=question_id, prompt=source["prompt"], type=source["type"], objectiveId=objective_id)


def projected_questions(questions):
    return [dict((field, question.get(field, default)) for field, default in
                 dict(QUESTION_DEFAULTS, id=None, prompt=None, type=None, objectiveId=None).items())
            for question in questions]


def stored_items(rows):
    fields = ["stableKey", "position", "kind", "primary", "secondary", "phonetic", "extra", "hint", "mediaRef", "languageCode"]
    return sorted([{field: row.get(field) for field in fields} for row in rows], key=lambda row: row["stableKey"])


def check_plan(result, objective_slug):
    if result.get("canImport"):
        return
    rows = [{"objective": objective_slug, "row": row["row"], "field": row["field"], "reasonCode": row["reasonCode"]}
            for row in result.get("errors", [])]
    raise SeedError("Study item preflight/commit failed; see row reason codes.", rows=rows)


def run_seed(client, seed, state_path, user_id, publish=False):
    """Shared orchestrator used by CLI and the real API test-server integration test."""
    state = state_for(state_path, client.origin, user_id)
    totals = {"resources": dict(created=0, updated=0, unchanged=0),
              "studyItems": dict(created=0, updated=0, unchanged=0), "published": 0, "errors": []}
    client.progress = totals
    courses = client.request("GET", "/v1/education/courses")
    for course in seed["courses"]:
        title = resource_title(seed, course)
        receipt = state["courses"].get(course["slug"])
        current = decide_existing(receipt, courses, title)
        if current is None:
            current = client.request("POST", "/v1/education/courses", {"title": title})
            receipt = dict(id=current["id"], title=title, createdByScript=True, objectives={}, assessments={})
            state["courses"][course["slug"]] = receipt
            save_state(state_path, state)
            totals["resources"]["created"] += 1
        else:
            totals["resources"]["unchanged"] += 1
        if current.get("isPublic"):
            raise SeedError("A recorded course has been made public. This importer cannot publish or edit public courses.")
        course_route = f"/v1/education/courses/{current['id']}"
        current_objectives = client.request("GET", course_route + "/objectives")
        objective_ids = {}
        for objective in course["objectives"]:
            title = resource_title(seed, objective)
            record = receipt["objectives"].get(objective["slug"])
            actual = decide_existing(record, current_objectives, title)
            if actual is None:
                actual = client.request("POST", course_route + "/objectives", {"title": title})
                record = dict(id=actual["id"], title=title, createdByScript=True)
                receipt["objectives"][objective["slug"]] = record
                save_state(state_path, state)
                totals["resources"]["created"] += 1
            else:
                totals["resources"]["unchanged"] += 1
            objective_ids[objective["slug"]] = actual["id"]
            route = course_route + f"/objectives/{actual['id']}"
            metadata = {key: objective.get(key) for key in META_FIELDS}
            actual_metadata = {key: actual.get(key) for key in META_FIELDS}
            if actual_metadata != metadata:
                if record.get("metadataHash") and digest(actual_metadata) != record["metadataHash"]:
                    raise SeedError("Objective metadata changed outside this importer; review it manually.")
                actual = client.request("PUT", route + "/study-metadata", metadata)
                totals["resources"]["updated"] += 1
            record["metadataHash"] = digest(metadata)
            existing = client.request("GET", route + "/study-items")
            expected = api_items(objective)
            if (record.get("itemsHash") and digest(stored_items(existing)) != record["itemsHash"]
                    and stored_items(existing) != stored_items(expected)):
                raise SeedError("Study content changed outside this importer; no overwrite was attempted.")
            preview = client.request("POST", route + "/study-items/import/json?dryRun=true", expected)
            check_plan(preview, objective["slug"])
            result = client.request("POST", route + "/study-items/import/json", expected)
            check_plan(result, objective["slug"])
            for key in ("created", "updated", "unchanged"):
                totals["studyItems"][key] += result[key]
            record["itemsHash"] = digest(stored_items(expected))
            save_state(state_path, state)
            if publish:
                for row in client.request("GET", route + "/study-items"):
                    if row["stableKey"] in {item["stableKey"] for item in expected} and row["status"].lower() == "draft":
                        client.request("POST", route + f"/study-items/{row['id']}/publish", {"notConfidentialExamContent": False})
                        totals["published"] += 1

        assessments = client.request("GET", course_route + "/assessments")
        for assessment in course.get("assessments", []):
            title = resource_title(seed, assessment)
            record = receipt["assessments"].get(assessment["slug"])
            actual = decide_existing(record, assessments, title)
            if actual is None:
                actual = client.request("POST", course_route + "/assessments", {"title": title})
                record = dict(id=actual["id"], title=title, createdByScript=True, questionIds={})
                receipt["assessments"][assessment["slug"]] = record
                save_state(state_path, state)
                totals["resources"]["created"] += 1
            else:
                totals["resources"]["unchanged"] += 1
            if actual.get("isPublicPractice"):
                raise SeedError("An assessment was changed to public practice; importer stopped.")
            expected = [question_body(q, objective_ids[q["objectiveSlug"]], record["questionIds"].get(q["key"]))
                        for q in assessment["questions"]]
            current_questions = projected_questions(actual["questions"])
            desired_questions = projected_questions(expected)
            if current_questions != desired_questions:
                if record.get("contentHash") and digest(current_questions) != record["contentHash"]:
                    raise SeedError("Assessment changed outside this importer; no overwrite was attempted.")
                if actual["status"].lower() != "draft":
                    raise SeedError("Published assessment differs from the seed and is immutable; review it manually.")
                actual = client.request("PUT", f"/v1/education/assessments/{actual['id']}",
                                        dict(expectedVersion=actual["version"], title=title, questions=expected))
                record["questionIds"] = {source["key"]: target["id"] for source, target in zip(assessment["questions"], actual["questions"])}
                totals["resources"]["updated"] += 1
            record["contentHash"] = digest(projected_questions(actual["questions"]))
            save_state(state_path, state)
            if publish and actual["status"].lower() == "draft":
                client.request("POST", f"/v1/education/assessments/{actual['id']}/publish",
                               dict(expectedVersion=actual["version"], isPublicPractice=False))
                totals["published"] += 1
    return totals


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://localhost:5080")
    parser.add_argument("--state", type=Path, default=default_state_path())
    parser.add_argument("--validate", action="store_true", help="Generate CSV/review report and validate content offline; no API calls.")
    parser.add_argument("--publish", action="store_true", help="Explicitly publish items/assessment inside private demo courses.")
    parser.add_argument("--cleanup", action="store_true", help="Fails closed: existing API has no course-delete route.")
    args = parser.parse_args()
    client = None
    summary = {"report": str(REPORT_FILE)}
    empty_progress = {"resources": dict(created=0, updated=0, unchanged=0),
                      "studyItems": dict(created=0, updated=0, unchanged=0), "published": 0}
    try:
        if args.cleanup:
            raise SeedError("CleanupUnavailable: existing API cannot delete courses. Zero DELETE requests were sent. No direct database fallback exists.")
        seed = load_seed()
        summary = write_assets(seed)
        errors = validate_document(seed)
        if errors:
            print(json.dumps(dict(summary, errors=errors), ensure_ascii=False))
            return 1
        if args.validate:
            print(json.dumps(dict(summary, apiDryRun="not run (offline validation)"), ensure_ascii=False))
            return 0
        guard = LocalTargetGuard(args.url)
        client = ApiClient(guard.origin, guard.verify)
        user_id = client.authenticate()
        with state_lock(args.state):
            result = run_seed(client, seed, args.state, user_id, args.publish)
        print(json.dumps(dict(summary, **result), ensure_ascii=False))
        return 0
    except SeedError as error:
        progress = getattr(client, "progress", empty_progress)
        print(json.dumps({**summary, **progress, "error": str(error), "errors": error.rows}, ensure_ascii=False), file=sys.stderr)
        return 1
    except (KeyError, OSError, ValueError, ImportError, TypeError):
        # Do not emit tracebacks/locals that might include credentials or author DTOs.
        print(json.dumps({**summary, **getattr(client, "progress", empty_progress),
                          "error": "Seed/configuration/state/dependency error; import stopped."}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    raise SystemExit(main())
