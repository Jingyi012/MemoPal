import copy
import csv
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from seed_content import (NAMESPACE, TONE_MARKS, csv_text, load_seed, objectives,
                          pinyin_diagnostics, validate_document, DATA_FILE, ROOT)
from seed_safety import (SeedError, cleanup_candidates, decide_existing, local_url,
                         resource_title, save_state, state_for, state_lock, verify_server_configuration)
from seed_import import main


class TargetSafetyTests(unittest.TestCase):
    def test_only_plain_loopback_origins_are_accepted(self):
        for target in ("http://127.0.0.1:5080", "http://localhost:5080", "https://[::1]:5081"):
            self.assertTrue(local_url(target)[0])
        for target in ("https://example.com", "http://localhost.example.com", "http://0.0.0.0:5080",
                       "http://192.168.1.2", "http://127.0.0.1.example.com", "file:///local",
                       "http://user@localhost", "http://localhost/path", "http://localhost?target=prod",
                       "http://localhost/#fragment", "http://localhost:99999"):
            with self.subTest(target=target), self.assertRaises(SeedError):
                local_url(target)

    def test_localhost_resolving_to_a_non_loopback_address_is_refused(self):
        with patch("socket.getaddrinfo", return_value=[(2, 1, 6, "", ("10.1.2.3", 5080))]):
            with self.assertRaises(SeedError):
                local_url("http://localhost:5080")

    def test_production_unknown_conflicting_or_overridden_server_environments_are_refused(self):
        for environment in ({}, {"DOTNET_ENVIRONMENT": "Production"}, {"ASPNETCORE_ENVIRONMENT": "Staging"},
                            {"DOTNET_ENVIRONMENT": "Production", "ASPNETCORE_ENVIRONMENT": "Development"},
                            {"DOTNET_ENVIRONMENT": "Demo", "ASPNETCORE_ENVIRONMENT": "Development"}):
            with self.subTest(environment=environment), self.assertRaises(SeedError):
                verify_server_configuration(environment, ["MemoPal.Api.dll"], "dotnet.exe")
        for command in (["MemoPal.Api.dll", "--environment", "Production"], ["MemoPal.Api.dll", "--environment=Demo"]):
            with self.assertRaises(SeedError):
                verify_server_configuration({"DOTNET_ENVIRONMENT": "Development"}, command, "dotnet.exe")

    def test_only_an_identifiable_development_or_demo_api_process_is_accepted(self):
        for environment in ("Development", "Demo"):
            verify_server_configuration({"DOTNET_ENVIRONMENT": environment}, ["MemoPal.Api.dll"], "dotnet.exe")
        with self.assertRaises(SeedError):
            verify_server_configuration({"DOTNET_ENVIRONMENT": "Development"}, ["proxy.exe"], "proxy.exe")

    def test_cleanup_fails_before_authentication_or_any_network_request(self):
        with patch("sys.argv", ["seed_import.py", "--cleanup"]), patch("seed_import.LocalTargetGuard") as guard:
            self.assertEqual(1, main())
            guard.assert_not_called()


class StateScopeTests(unittest.TestCase):
    def test_repeat_run_uses_creation_receipt_and_never_adopts_a_title_collision(self):
        observed = [{"id": "mine", "title": "marker"}, {"id": "other", "title": "real course"}]
        record = {"id": "mine", "title": "marker", "createdByScript": True}
        self.assertEqual("mine", decide_existing(record, observed, "marker")["id"])
        with self.assertRaises(SeedError):
            decide_existing(None, observed, "marker")
        with self.assertRaises(SeedError):
            decide_existing(dict(record, createdByScript=False), observed, "marker")
        with self.assertRaises(SeedError):
            decide_existing(record, observed, "renamed")

    def test_state_is_credential_free_outside_repo_and_bound_to_target_and_account(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "state.json"
            state = state_for(path, "http://localhost:5080", "demo-author-id")
            save_state(path, state)
            self.assertEqual(state, state_for(path, "http://localhost:5080", "demo-author-id"))
            self.assertEqual({"namespace", "origin", "userId", "courses"}, set(json.loads(path.read_text())))
            for origin, user in (("http://localhost:5081", "demo-author-id"), ("http://localhost:5080", "other")):
                with self.assertRaises(SeedError):
                    state_for(path, origin, user)
        with self.assertRaises(SeedError):
            state_for(ROOT / "state.json", "http://localhost:5080", "demo-author-id")

    def test_a_second_import_cannot_write_the_same_manifest_concurrently(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "state.json"
            with state_lock(path):
                with self.assertRaises(SeedError):
                    with state_lock(path):
                        self.fail("Second importer acquired the first importer's lock.")
            self.assertFalse(path.with_suffix(".lock").exists())

    def test_cleanup_scope_requires_matching_script_receipts_and_ignores_other_courses(self):
        seed = load_seed()
        course = seed["courses"][0]
        title = resource_title(seed, course)
        state = dict(namespace=NAMESPACE, courses={course["slug"]: dict(id="created", title=title, createdByScript=True)})
        observed = [dict(id="created", title=title), dict(id="untouched", title="teacher authored")]
        self.assertEqual(["created"], cleanup_candidates(seed, state, observed))
        with self.assertRaises(SeedError):
            cleanup_candidates(seed, dict(state, namespace="other"), observed)
        with self.assertRaises(SeedError):
            cleanup_candidates(seed, state, [dict(id="created", title="teacher renamed")])


class SeedContentTests(unittest.TestCase):
    def test_pack_policy_stable_keys_and_all_original_unreviewed_flags(self):
        seed = load_seed()
        self.assertEqual([], validate_document(seed))
        rows = [row for _, objective in objectives(seed) for row in objective["items"]]
        self.assertEqual(54, len(rows))
        self.assertEqual(12, sum(row["entryType"] == "character" for row in rows))
        self.assertEqual(24, sum(row["entryType"] == "word" for row in rows))
        for character in [row["primary"] for row in rows if row["entryType"] == "character"]:
            self.assertEqual(2, sum(row.get("parentCharacter") == character and row["entryType"] == "word" for row in rows))
        for row in rows:
            self.assertEqual("Original", row["contentOrigin"])
            self.assertEqual("Unreviewed", row["reviewStatus"])
            if row["kind"] == "LanguageItem":
                self.assertTrue(set(row["phonetic"]) & TONE_MARKS)

    def test_pinyin_comparison_reports_mismatches_without_overwriting_supplied_content(self):
        seed = load_seed()
        seed["courses"][0]["objectives"][0]["items"][0]["phonetic"] = "mǐng"
        diagnostics, polyphones = pinyin_diagnostics(seed)
        mismatch = [d for d in diagnostics if d["mismatch"]]
        self.assertEqual(1, len(mismatch))
        self.assertEqual("mǐng", mismatch[0]["row"]["phonetic"])
        self.assertEqual("míng", mismatch[0]["computed"])
        self.assertIn("语", polyphones)
        self.assertIn("yǔ", polyphones["语"]["readings"])
        self.assertIn("yù", polyphones["语"]["readings"])

    def test_policy_rejects_review_promotion_duplicate_keys_and_contact_data(self):
        for field, value in (("reviewStatus", "TeacherReviewed"), ("secondary", "https://example.test"),
                             ("extra", "person@example.test"), ("hint", "123456789")):
            seed = copy.deepcopy(load_seed())
            seed["courses"][0]["objectives"][0]["items"][0][field] = value
            self.assertTrue(validate_document(seed))
        seed = load_seed()
        rows = seed["courses"][0]["objectives"][0]["items"]
        rows[1]["key"] = rows[0]["key"]
        self.assertTrue(validate_document(seed))

    def test_csv_is_the_admin_canonical_format_and_matches_the_reviewed_master(self):
        for _, objective in objectives(load_seed()):
            with self.subTest(objective=objective["slug"]):
                parsed = list(csv.DictReader(io.StringIO(csv_text(objective))))
                self.assertEqual(len(objective["items"]), len(parsed))
                self.assertEqual(objective["items"][0]["primary"], parsed[0]["primary"])
                self.assertEqual(objective["items"][0]["key"], parsed[0]["key"])
                self.assertIn("phonetic", parsed[0])
                self.assertIn("extra", parsed[0])
                self.assertEqual(csv_text(objective), (DATA_FILE.parent / (objective["slug"] + ".csv")).read_bytes().decode("utf-8-sig"))
                for master, exported in zip(objective["items"], parsed):
                    for field in ("primary", "secondary", "phonetic", "extra", "hint"):
                        self.assertEqual(master.get(field) or "", exported[field])


if __name__ == "__main__":
    unittest.main()
