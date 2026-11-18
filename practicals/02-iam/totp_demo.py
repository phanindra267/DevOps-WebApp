#!/usr/bin/env python3
"""
Practical 02 - Local IAM / MFA / RBAC demonstration (100% offline, stdlib only).

AWS concept            -> local equivalent in this script
---------------------     ---------------------------------------
IAM user               -> principal record in practicals/02-iam/data/iam_store.json
IAM group -> role      -> group["roles"] (roles a principal may assume / is assigned)
IAM policy             -> list of permission strings in ROLE_POLICIES
MFA (TOTP)             -> RFC 6238 TOTP via hmac + sha1 + base32 (no pip packages)
STS AssumeRole         -> switch_role() with MFA verification
CloudTrail             -> evidence/iam/audit_log.json

No network calls, no AWS SDK, no credentials, no third-party packages.
"""

from __future__ import annotations

import argparse
import base64
import fnmatch
import hashlib
import hmac
import json
import secrets
import struct
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Paths (resolved relative to the repository root, never absolute-hardcoded)
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "practicals" / "02-iam" / "data"
STORE_PATH = DATA_DIR / "iam_store.json"
EVIDENCE_DIR = REPO_ROOT / "evidence" / "iam"
AUDIT_PATH = EVIDENCE_DIR / "audit_log.json"

# ---------------------------------------------------------------------------
# TOTP parameters (RFC 6238 default: SHA1, 30-second step, 6 digits)
# ---------------------------------------------------------------------------
STEP_SECONDS = 30
DIGITS = 6
VERIFY_WINDOW = 1  # accept codes from +/- 1 time step (clock skew tolerance)

# ---------------------------------------------------------------------------
# Policy -> permission map (the "IAM policy" local equivalent)
# ---------------------------------------------------------------------------
ROLE_POLICIES: dict[str, list[str]] = {
    "viewer": ["read:*"],
    "deployer": ["read:*", "deploy:*", "pipeline:trigger"],
    "admin": ["*"],
}

DEFAULT_GROUPS: dict[str, dict[str, Any]] = {
    "developers": {"roles": ["viewer"]},
    "ops": {"roles": ["deployer"]},
    "platform-admins": {"roles": ["admin"]},
}

DEFAULT_USERS: dict[str, dict[str, Any]] = {
    "alice": {"role": "viewer", "groups": ["developers", "ops"]},
    "bob": {"role": "deployer", "groups": ["ops"]},
    "carol": {"role": "admin", "groups": ["platform-admins"]},
}


# ===========================================================================
# TOTP (RFC 6238) - Python standard library only
# ===========================================================================
def b32_encode(raw: bytes) -> str:
    """Base32-encode bytes into an authenticator-friendly secret (no padding)."""
    return base64.b32encode(raw).decode("ascii").rstrip("=")


def b32_decode(secret: str) -> bytes:
    """Decode a base32 secret, tolerating lower case and missing padding."""
    cleaned = secret.strip().upper().replace(" ", "").replace("-", "")
    cleaned += "=" * ((8 - len(cleaned) % 8) % 8)
    return base64.b32decode(cleaned, casefold=True)


def new_secret(num_bytes: int = 20) -> str:
    """Generate a cryptographically random base32 TOTP secret."""
    return b32_encode(secrets.token_bytes(num_bytes))


def totp_at(secret: str, counter: int) -> str:
    """Compute the 6-digit TOTP code for a given 30-second counter."""
    key = b32_decode(secret)
    message = struct.pack(">Q", counter)
    digest = hmac.new(key, message, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    binary = struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF
    return str(binary % (10**DIGITS)).zfill(DIGITS)


def current_counter() -> int:
    return int(time.time()) // STEP_SECONDS


def totp_now(secret: str) -> str:
    return totp_at(secret, current_counter())


def verify_totp(
    secret: str, code: str, window: int = VERIFY_WINDOW
) -> tuple[bool, int | None]:
    """Verify a code, accepting counters within +/- window steps.

    Returns (accepted, delta) where delta is the matching step offset or None.
    """
    code = str(code).strip()
    if len(code) != DIGITS or not code.isdigit():
        return False, None
    target = current_counter()
    for delta in range(-window, window + 1):
        candidate = totp_at(secret, target + delta)
        if hmac.compare_digest(candidate, code):
            return True, delta
    return False, None


def provisioning_uri(secret: str, label: str, issuer: str = "LocalIAMDemo") -> str:
    """otpauth:// URI usable by offline authenticator apps (informational)."""
    from urllib.parse import quote

    return (
        f"otpauth://totp/{quote(issuer)}:{quote(label)}"
        f"?secret={secret}&issuer={quote(issuer)}"
        f"&algorithm=SHA1&digits={DIGITS}&period={STEP_SECONDS}"
    )


# ===========================================================================
# Local IAM store
# ===========================================================================
def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class LocalIAM:
    """Tiny local IAM engine: principals, groups, roles, MFA, audit."""

    def __init__(self, path: Path = STORE_PATH, audit_path: Path = AUDIT_PATH) -> None:
        self.path = path
        self.audit_path = audit_path
        self.audit_entries: list[dict[str, Any]] = []
        self.store: dict[str, Any] = {}
        self.load()

    # -- persistence ---------------------------------------------------------
    def load(self) -> None:
        if self.path.exists():
            with self.path.open("r", encoding="utf-8") as handle:
                self.store = json.load(handle)
            self.audit_entries = list(self.store.get("audit", []))
        else:
            self.reset()

    def reset(self) -> None:
        self.store = {
            "version": 1,
            "created_at": utc_now(),
            "users": {},
            "groups": {},
            "roles": dict(ROLE_POLICIES),
            "audit": [],
        }
        self.audit_entries = []
        self.save()

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.store["audit"] = self.audit_entries
        with self.path.open("w", encoding="utf-8") as handle:
            json.dump(self.store, handle, indent=2, sort_keys=True)
            handle.write("\n")

    def write_audit_log(self) -> None:
        self.audit_path.parent.mkdir(parents=True, exist_ok=True)
        with self.audit_path.open("w", encoding="utf-8") as handle:
            json.dump(self.audit_entries, handle, indent=2)
            handle.write("\n")

    def audit(
        self,
        action: str,
        principal: str,
        decision: str,
        detail: str = "",
        mfa_verified: bool = False,
        assumed_role: str | None = None,
    ) -> None:
        entry = {
            "timestamp": utc_now(),
            "principal": principal,
            "action": action,
            "decision": decision,
            "mfa_verified": mfa_verified,
            "assumed_role": assumed_role,
            "detail": detail,
        }
        self.audit_entries.append(entry)
        self.save()
        self.write_audit_log()

    # -- principals, groups, roles -------------------------------------------
    def seed(self) -> None:
        self.reset()
        self.store["groups"] = json.loads(json.dumps(DEFAULT_GROUPS))
        for name, spec in DEFAULT_USERS.items():
            self.store["users"][name] = {
                "role": spec["role"],
                "groups": list(spec["groups"]),
                "mfa": {"enrolled": False, "secret": None},
                "assumed_role": None,
            }
        self.save()
        self.audit("iam:seed", "system", "ALLOWED", "seeded local users/groups/roles")

    def create_user(
        self, username: str, role: str = "viewer", groups: list[str] | None = None
    ) -> dict[str, Any]:
        if username in self.store["users"]:
            raise ValueError(f"principal '{username}' already exists")
        user = {
            "role": role,
            "groups": list(groups or []),
            "mfa": {"enrolled": False, "secret": None},
            "assumed_role": None,
        }
        self.store["users"][username] = user
        self.save()
        self.audit(
            "iam:createuser",
            "system",
            "ALLOWED",
            f"created {username} role={role} groups={user['groups']}",
        )
        return user

    def assign_role(self, username: str, role: str) -> None:
        user = self._user(username)
        user["role"] = role
        self.save()
        self.audit("iam:assignrole", "system", "ALLOWED", f"{username} -> {role}")

    def add_to_group(self, username: str, group: str) -> None:
        user = self._user(username)
        if group not in self.store["groups"]:
            raise ValueError(f"unknown group '{group}'")
        if group not in user["groups"]:
            user["groups"].append(group)
        self.save()
        self.audit("iam:addusertogroup", "system", "ALLOWED", f"{username} -> {group}")

    def _user(self, username: str) -> dict[str, Any]:
        try:
            return self.store["users"][username]
        except KeyError:
            raise ValueError(f"unknown principal '{username}'") from None

    def enroll_mfa(self, username: str) -> str:
        user = self._user(username)
        secret = new_secret()
        user["mfa"] = {"enrolled": True, "secret": secret}
        self.save()
        self.audit(
            "iam:enrollmfa",
            username,
            "ALLOWED",
            f"enrolled TOTP secret for {username}",
            mfa_verified=True,
        )
        return secret

    # -- least privilege / permissions ---------------------------------------
    def session_role(self, username: str) -> str:
        user = self._user(username)
        return user.get("assumed_role") or user["role"]

    def effective_permissions(self, username: str) -> list[str]:
        role = self.session_role(username)
        return list(self.store["roles"].get(role, []))

    @staticmethod
    def _permission_matches(action: str, permission: str) -> bool:
        if permission == "*":
            return True
        if permission.endswith(":*") and action.startswith(permission[:-1]):
            return True
        return fnmatch.fnmatchcase(action, permission)

    def check_permission(self, username: str, action: str, log: bool = True) -> bool:
        user = self._user(username)
        perms = self.effective_permissions(username)
        allowed = any(self._permission_matches(action, p) for p in perms)
        role = self.session_role(username)
        decision = "ALLOWED" if allowed else "DENIED"
        if log:
            self.audit(
                action,
                username,
                decision,
                f"role={role} permissions={perms}",
                assumed_role=user.get("assumed_role"),
            )
        return allowed

    def switch_role(self, username: str, role: str, code: str | None = None) -> tuple[bool, str]:
        """STS AssumeRole equivalent: MFA-gated temporary role switch.

        A principal may only assume roles offered by one of its groups
        (the local equivalent of an IAM role trust policy).
        """
        user = self._user(username)
        assumable = {
            r
            for group in user["groups"]
            for r in self.store["groups"].get(group, {}).get("roles", [])
        }
        if role not in assumable and role != user["role"]:
            self.audit(
                "sts:assumerole",
                username,
                "DENIED",
                f"role {role} not assumable via groups {user['groups']}",
            )
            return False, "role not assumable from group memberships"

        secret = user.get("mfa", {}).get("secret")
        if not secret:
            self.audit("sts:assumerole", username, "DENIED", "MFA not enrolled")
            return False, "MFA not enrolled"

        if code is None:  # convenience for the automated demo transcript
            code = totp_now(secret)
        verified, delta = verify_totp(secret, code)
        if not verified:
            self.audit(
                "sts:assumerole",
                username,
                "DENIED",
                f"invalid MFA code {code}",
                mfa_verified=False,
            )
            return False, f"invalid or expired MFA code {code}"

        user["assumed_role"] = None if role == user["role"] else role
        self.save()
        self.audit(
            "sts:assumerole",
            username,
            "ALLOWED",
            f"assumed {role} (TOTP step delta={delta})",
            mfa_verified=True,
            assumed_role=user["assumed_role"],
        )
        return True, f"assumed {role} with MFA (step delta={delta})"


# ===========================================================================
# Transcript helpers
# ===========================================================================
def heading(text: str) -> None:
    print(f"\n{'=' * 68}\n{text}\n{'=' * 68}")


def step(num: int, text: str) -> None:
    print(f"[{num}] {text}")


def decision_line(actor: str, action: str, allowed: bool, role: str) -> None:
    verdict = "ALLOWED" if allowed else "DENIED"
    marker = "+" if allowed else "-"
    print(f"    {marker} {actor:<7} role={role:<9} {action:<18} -> {verdict}")


def run_demo() -> None:
    iam = LocalIAM()
    iam.seed()

    heading("PRACTICAL 02 - LOCAL IAM / MFA / RBAC DEMO (NO AWS, NO CLOUD CALLS)")
    print(f"Store : {iam.path}")
    print(f"Audit : {iam.audit_path}")
    print(f"TOTP  : RFC 6238 / HMAC-SHA1 / base32 / 6 digits / 30s step / +/-1 window")

    step(0, "Reset local IAM store and seed groups/roles")
    print(f"    Roles : {', '.join(f'{k}={v}' for k, v in iam.store['roles'].items())}")
    for group, spec in iam.store["groups"].items():
        print(f"    Group : {group:<16} roles={spec['roles']}")

    step(1, "Create local principals (AWS IAM user -> local principal)")
    for name, spec in iam.store["users"].items():
        print(f"    User  : {name:<7} role={spec['role']:<9} groups={spec['groups']}")

    step(2, "Role assignment + group membership")
    iam.create_user("dave", role="viewer", groups=["developers"])
    iam.add_to_group("dave", "ops")
    iam.assign_role("dave", "viewer")
    dave = iam.store["users"]["dave"]
    print(f"    User  : dave    role={dave['role']} groups={dave['groups']}")
    print("    'ops' group grants the assumable 'deployer' role (STS trust analogue).")

    step(3, "Enroll MFA (AWS MFA -> local TOTP) and generate a 6-digit code")
    secret = iam.enroll_mfa("alice")
    code_now = totp_now(secret)
    code_prev = totp_at(secret, current_counter() - 1)
    print(f"    alice secret (base32) : {secret}")
    print(f"    otpauth URI           : {provisioning_uri(secret, 'alice')}")
    print(f"    current TOTP code     : {code_now}  (counter={current_counter()})")

    step(4, "Verify TOTP codes with +/-1 step window")
    code_next = totp_at(secret, current_counter() + 1)
    bogus = "000000" if code_now != "000000" else "999999"
    ok0, delta0 = verify_totp(secret, code_now)
    okprev, deltaprev = verify_totp(secret, code_prev)
    oknext, deltanext = verify_totp(secret, code_next)
    okbad, deltabad = verify_totp(secret, bogus)
    print(f"    current code      {code_now} -> accepted={ok0} step_delta={delta0}")
    print(f"    previous-step code {code_prev} -> accepted={okprev} step_delta={deltaprev}")
    print(f"    next-step code     {code_next} -> accepted={oknext} step_delta={deltanext} (window=+/-1)")
    print(f"    bogus code         {bogus} -> accepted={okbad} step_delta={deltabad}")

    step(5, "Least-privilege permission checks (policy -> permission map)")
    check_cases = [
        ("alice", "deploy:prod"),
        ("alice", "read:project"),
        ("bob", "deploy:prod"),
        ("bob", "iam:createuser"),
        ("carol", "deploy:prod"),
        ("carol", "iam:createuser"),
    ]
    for user, action in check_cases:
        allowed = iam.check_permission(user, action)
        decision_line(user, action, allowed, iam.session_role(user))
    print("    NOTE: viewer denied deploy; admin allowed; deployer blocked from IAM writes.")

    step(6, "Role switch with MFA (AWS STS AssumeRole -> local switch_role)")
    alice_before = iam.check_permission("alice", "deploy:prod", log=False)
    print(f"    alice before switch : deploy:prod -> {'ALLOWED' if alice_before else 'DENIED'}")
    ok, msg = iam.switch_role("alice", "deployer", code=totp_now(secret))
    print(f"    assume deployer with valid MFA -> ok={ok} ({msg})")
    alice_after = iam.check_permission("alice", "deploy:prod")
    decision_line("alice", "deploy:prod", alice_after, iam.session_role("alice"))
    wrong_code = "000000" if code_now != "000000" else "999999"
    trust_ok, trust_msg = iam.switch_role("alice", "admin", code=totp_now(secret))
    print(f"    assume admin (no group grants it) -> ok={trust_ok} ({trust_msg}) [trust boundary]")
    bad_ok, bad_msg = iam.switch_role("alice", "deployer", code=wrong_code)
    print(f"    assume deployer with bad MFA {wrong_code} -> ok={bad_ok} ({bad_msg}) [intentional denied case]")
    echo_ok = iam.check_permission("alice", "deploy:prod", log=False)
    print(f"    alice session role after failed switches : {iam.session_role('alice')} (deploy allowed={echo_ok})")

    step(7, "Audit log (CloudTrail analogue)")
    iam.write_audit_log()
    denied = sum(1 for e in iam.audit_entries if e["decision"] == "DENIED")
    print(f"    Wrote {len(iam.audit_entries)} events to {iam.audit_path}")
    print(f"    DENIED events: {denied} (permission / trust boundaries + bad MFA are real local denials)")

    heading("DEMO COMPLETE - all allow/deny decisions above are real local enforcement")
    print("No AWS calls were made. No credentials or third-party packages were used.")


# ===========================================================================
# CLI
# ===========================================================================
def build_parser(prog: str | None = None) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog=prog,
        description="Local-only IAM / MFA / RBAC demo (Python stdlib only)",
    )
    parser.add_argument(
        "command",
        nargs="?",
        default="demo",
        choices=["demo", "init", "enroll", "code", "verify", "switch", "check", "show"],
        help="command to run (default: demo)",
    )
    parser.add_argument("args", nargs="*", help="command arguments")
    return parser


def main(prog: str | None = None) -> int:
    parser = build_parser(prog)
    ns = parser.parse_args()
    cmd, args = ns.command, ns.args
    iam = LocalIAM()

    try:
        if cmd == "demo":
            run_demo()

        elif cmd == "init":
            iam.seed()
            print(f"Seeded local IAM store at {iam.path}")

        elif cmd == "enroll":
            username = args[0]
            secret = iam.enroll_mfa(username)
            print(f"secret : {secret}")
            print(f"code   : {totp_now(secret)}")
            print(f"uri    : {provisioning_uri(secret, username)}")

        elif cmd == "code":
            username = args[0]
            secret = iam._user(username)["mfa"]["secret"]
            if not secret:
                raise ValueError(f"{username} has no MFA secret; run 'enroll' first")
            print(totp_now(secret))

        elif cmd == "verify":
            username, code = args[0], args[1]
            secret = iam._user(username)["mfa"]["secret"]
            if not secret:
                raise ValueError(f"{username} has no MFA secret; run 'enroll' first")
            ok, delta = verify_totp(secret, code)
            print(f"accepted={ok} step_delta={delta}")
            iam.audit(
                "mfa:verify",
                username,
                "ALLOWED" if ok else "DENIED",
                f"code verification delta={delta}",
                mfa_verified=ok,
            )

        elif cmd == "switch":
            username, role = args[0], args[1]
            code = args[2] if len(args) > 2 else None
            if code is None:
                secret = iam._user(username).get("mfa", {}).get("secret")
                code = totp_now(secret) if secret else "000000"
            ok, msg = iam.switch_role(username, role, code=code)
            print(f"assume role ok={ok} :: {msg}")

        elif cmd == "check":
            username, action = args[0], args[1]
            allowed = iam.check_permission(username, action)
            print(f"{username} role={iam.session_role(username)} {action} -> "
                  f"{'ALLOWED' if allowed else 'DENIED'}")

        elif cmd == "show":
            print(json.dumps(iam.store, indent=2, sort_keys=True))
            return 0

    except (IndexError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        print(f"usage: {prog or 'totp_demo.py'} <demo|init|enroll USER|code USER|"
              f"verify USER CODE|switch USER ROLE [CODE]|check USER ACTION|show>",
              file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main("totp_demo.py"))
