import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from app.core.config import settings

ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return settings.get_jwt_secret_key()

def hash_password(password: str) -> str:
    """
    Cryptographically secure password hashing using PBKDF2-HMAC-SHA256 with 100,000 iterations.
    Returns formatted string: pbkdf2_sha256$iterations$salt_hex$hash_hex
    """
    salt = secrets.token_hex(16)
    iterations = 100000
    derived = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        iterations
    )
    return f"pbkdf2_sha256${iterations}${salt}${derived.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against stored hash using constant-time comparison.
    """
    if not hashed_password or not plain_password:
        return False
    try:
        parts = hashed_password.split("$")
        if len(parts) == 4 and parts[0] == "pbkdf2_sha256":
            iterations = int(parts[1])
            salt = parts[2]
            stored_hash = parts[3]
            derived = hashlib.pbkdf2_hmac(
                'sha256',
                plain_password.encode('utf-8'),
                salt.encode('utf-8'),
                iterations
            )
            return secrets.compare_digest(derived.hex(), stored_hash)
        elif hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            return pwd_context.verify(plain_password, hashed_password)
        return False
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a signed JWT access token. Fails closed in production if secret is unconfigured.
    """
    secret_key = get_jwt_secret()
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now_utc})
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a JWT access token.
    """
    try:
        secret_key = get_jwt_secret()
        payload = jwt.decode(token, secret_key, algorithms=[ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None
