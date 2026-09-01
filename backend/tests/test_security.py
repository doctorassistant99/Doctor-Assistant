import pytest
from datetime import timedelta
from jose import jwt

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)


def test_password_hash_roundtrip():
    password = "securepassword123"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed)


def test_password_hash_is_random():
    password = "samepassword"
    hash1 = get_password_hash(password)
    hash2 = get_password_hash(password)
    assert hash1 != hash2


def test_verify_password_against_wrong_password():
    password = "correct-password"
    hashed = get_password_hash(password)
    assert not verify_password("wrong-password", hashed)


def test_create_access_token_contains_sub():
    token = create_access_token({"sub": "test-user-id"})
    payload = jwt.decode(token, "test-secret-key", algorithms=["HS256"])
    assert payload["sub"] == "test-user-id"
    assert "exp" in payload


def test_decode_access_token_returns_payload():
    token = create_access_token({"sub": "user-123", "role": "admin"})
    payload = decode_access_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "admin"


def test_decode_access_token_invalid_token():
    assert decode_access_token("invalid.token.here") is None


def test_decode_access_token_with_wrong_secret():
    from jose import jwt as jwt_lib
    token = jwt_lib.encode({"sub": "x"}, "different-secret", algorithm="HS256")
    assert decode_access_token(token) is None


def test_token_expiration():
    token = create_access_token({"sub": "x"}, expires_delta=timedelta(seconds=-10))
    assert decode_access_token(token) is None
