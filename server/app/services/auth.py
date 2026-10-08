import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt

from app.core.config import get_settings


_HASH_N = 2**14
_HASH_R = 8
_HASH_P = 1
_HASH_LENGTH = 64


def hash_terminal_access_key(access_key: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        access_key.encode("utf-8"),
        salt=salt,
        n=_HASH_N,
        r=_HASH_R,
        p=_HASH_P,
        dklen=_HASH_LENGTH,
    )
    return f"scrypt${_HASH_N}${_HASH_R}${_HASH_P}${salt.hex()}${digest.hex()}"


def verify_terminal_access_key(access_key: str, encoded_hash: str) -> bool:
    try:
        algorithm, n, r, p, salt_hex, digest_hex = encoded_hash.split("$", 5)
        if algorithm != "scrypt":
            return False
        expected = bytes.fromhex(digest_hex)
        actual = hashlib.scrypt(
            access_key.encode("utf-8"),
            salt=bytes.fromhex(salt_hex),
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(expected),
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def _token_signing_key() -> str:
    settings = get_settings()
    secret = settings.AUTH_TOKEN_SECRET or settings.SUPABASE_SECRET_KEY
    if len(secret) < 32:
        raise RuntimeError("Set AUTH_TOKEN_SECRET to a random value of at least 32 characters")
    return hmac.new(secret.encode("utf-8"), b"pulsegrid-hospital-admin-access-token-v1", hashlib.sha256).hexdigest()


def create_access_token(administrator_id: UUID, hospital_id: UUID) -> tuple[str, datetime]:
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.AUTH_TOKEN_TTL_MINUTES)
    token = jwt.encode(
        {
            "sub": str(administrator_id),
            "hospital_id": str(hospital_id),
            "role": "Hospital Administrator",
            "iss": "pulsegrid-api",
            "exp": expires_at,
        },
        _token_signing_key(),
        algorithm="HS256",
    )
    return token, expires_at


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        _token_signing_key(),
        algorithms=["HS256"],
        issuer="pulsegrid-api",
        options={"require": ["sub", "hospital_id", "role", "exp", "iss"]},
    )


def create_dummy_password_hash() -> str:
    return hash_terminal_access_key(secrets.token_urlsafe(32))