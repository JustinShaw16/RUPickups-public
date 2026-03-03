from __future__ import annotations

from functools import lru_cache
from typing import Any

import requests
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

bearer = HTTPBearer(auto_error=False)

@lru_cache(maxsize=1)
def _get_jwk_client() -> PyJWKClient:

    if not settings.SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL is not set")

    jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url)

def require_user_id(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
    if creds is None or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization: Bearer <token>",
        )

    token = creds.credentials

    try:
        jwk_client = _get_jwk_client()
        signing_key = jwk_client.get_signing_key_from_jwt(token).key

        issuer = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"

        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["ES256"],
            issuer=issuer,
            options={"verify_aud": False, "require": ["exp", "iat", "sub"]}
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidIssuerError:
        raise HTTPException(status_code=401, detail="Invalid token issuer")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid token audience")
    except jwt.PyJWKClientError:
        # couldn't fetch keys / kid not found
        raise HTTPException(status_code=401, detail="Invalid token signing key")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing 'sub' claim")

    return user_id