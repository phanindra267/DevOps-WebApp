#!/usr/bin/env python3
"""
Alias entry point for the Practical 02 local IAM demonstration.

All logic lives in totp_demo.py (stdlib only). This file exists so the
identity-focused command `python iam_local.py demo` works as a friendly
alternative to `python totp_demo.py demo`.
"""

from totp_demo import main

if __name__ == "__main__":
    raise SystemExit(main("iam_local.py"))
