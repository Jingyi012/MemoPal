"""Fail-closed local target checks and credential-free import state."""
import hashlib
import ipaddress
import json
import os
import socket
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import urlsplit

from seed_content import NAMESPACE, ROOT


class SeedError(Exception):
    def __init__(self, message, rows=None):
        super().__init__(message)
        self.rows = rows or []


def local_url(value):
    try:
        parsed = urlsplit(value)
        host = parsed.hostname
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
    except ValueError:
        raise SeedError("Invalid target URL.") from None
    if (parsed.scheme not in ("http", "https") or not host or parsed.username is not None
            or parsed.password is not None or parsed.path not in ("", "/") or parsed.query or parsed.fragment):
        raise SeedError("Target must be a plain loopback API origin without credentials/path/query.")
    if host.lower() != "localhost":
        try:
            if not ipaddress.ip_address(host).is_loopback:
                raise ValueError()
        except ValueError:
            raise SeedError("Non-loopback targets are prohibited; there is no override.") from None
    try:
        addresses = {address[4][0] for address in socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)}
    except OSError:
        raise SeedError("Cannot resolve the local target.") from None
    if not addresses or any(not ipaddress.ip_address(address).is_loopback for address in addresses):
        raise SeedError("Every resolved target address must be loopback.")
    canonical_host = "[::1]" if host == "::1" else host.lower()
    return f"{parsed.scheme}://{canonical_host}:{port}", port


def verify_server_configuration(environment, command_line, executable):
    values = [environment.get(key) for key in ("ASPNETCORE_ENVIRONMENT", "DOTNET_ENVIRONMENT") if environment.get(key)]
    if not values or any(value not in ("Development", "Demo") for value in values) or len(set(values)) != 1:
        raise SeedError("Server process must explicitly use Development or Demo; Production/unknown/conflicting environments are refused.")
    for argument in command_line:
        lower = argument.lower()
        if (lower in ("--environment", "-e") or lower.startswith("--environment=")
                or "aspnetcore_environment" in lower or "dotnet_environment" in lower):
            raise SeedError("Server command-line environment overrides are not allowed by the demo importer.")
    names = [Path(executable).stem.lower()] + [Path(argument).stem.lower() for argument in command_line]
    if "memopal.api" not in names:
        raise SeedError("Target listener must be the local MemoPal.Api process; proxies/containers cannot be attested.")


class LocalTargetGuard:
    def __init__(self, origin):
        self.origin, self.port = local_url(origin)
        self.identity = None
        self.verify()

    def verify(self):
        import psutil
        try:
            listeners = [connection for connection in psutil.net_connections(kind="tcp")
                         if connection.status == psutil.CONN_LISTEN and connection.laddr.port == self.port]
            pids = {connection.pid for connection in listeners}
            if len(pids) != 1 or None in pids:
                raise SeedError("A single identifiable local API listener is required.")
            process = psutil.Process(next(iter(pids)))
            identity = (process.pid, process.create_time())
            if self.identity is not None and identity != self.identity:
                raise SeedError("Target API process changed; import stopped.")
            # Never log or persist process environment/command line: it may contain secrets.
            verify_server_configuration(process.environ(), process.cmdline(), process.exe())
            self.identity = identity
        except (psutil.Error, OSError):
            raise SeedError("Cannot verify API process configuration; import refused.") from None


def resource_title(seed, resource):
    return f"[demo:{seed['seedNamespace']}:{resource['slug']}] {resource['title']}"


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()


def default_state_path():
    base = Path(os.environ.get("LOCALAPPDATA", Path.home() / ".local" / "state"))
    return base / "MemoPal" / "education-seed" / (NAMESPACE + ".json")


def state_for(path, origin, user_id):
    path = Path(path).resolve()
    if path.is_relative_to(ROOT):
        raise SeedError("Runtime import state must be outside the repository.")
    if path.exists():
        try:
            state = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            raise SeedError("Import state is unreadable; refusing to guess ownership.") from None
        if (state.get("namespace"), state.get("origin"), state.get("userId")) != (NAMESPACE, origin, user_id):
            raise SeedError("Import state belongs to a different target, account or namespace.")
        if set(state) != {"namespace", "origin", "userId", "courses"}:
            raise SeedError("Unexpected state fields; credentials must never be stored in state.")
        return state
    return dict(namespace=NAMESPACE, origin=origin, userId=user_id, courses={})


def save_state(path, state):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".pending")
    temporary.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


@contextmanager
def state_lock(path):
    path = Path(path).resolve()
    if path.is_relative_to(ROOT):
        raise SeedError("Runtime import state must be outside the repository.")
    path.parent.mkdir(parents=True, exist_ok=True)
    lock_path = path.with_suffix(".lock")
    try:
        descriptor = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        raise SeedError("Another import owns this state lock. Do not run duplicate imports concurrently; inspect stale locks after a crash.") from None
    try:
        os.write(descriptor, str(os.getpid()).encode("ascii"))
        os.close(descriptor)
        descriptor = None
        yield
    finally:
        if descriptor is not None:
            os.close(descriptor)
        lock_path.unlink()


def decide_existing(record, observed, expected_title):
    if record is None:
        if any(row["title"] == expected_title for row in observed):
            raise SeedError("A matching title exists without a creation receipt; restore the local state instead of adopting or duplicating it.")
        return None
    matches = [row for row in observed if row["id"] == record.get("id")]
    if len(matches) != 1 or matches[0]["title"] != expected_title or record.get("title") != expected_title or record.get("createdByScript") is not True:
        raise SeedError("Recorded demo resource is missing/renamed/not script-owned; refusing to overwrite it.")
    return matches[0]


def cleanup_candidates(seed, state, observed_courses):
    """Scope preview only. No DELETE is issued: current API cannot delete courses."""
    if state.get("namespace") != seed["seedNamespace"]:
        raise SeedError("Cleanup namespace mismatch.")
    allowed = []
    for course in seed["courses"]:
        record = state["courses"].get(course["slug"])
        if record:
            observed = decide_existing(record, observed_courses, resource_title(seed, course))
            allowed.append(observed["id"])
    return allowed
