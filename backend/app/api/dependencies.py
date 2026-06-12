"""
FastAPI dependencies for authentication, authorization, and RBAC.
"""

from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token
from app.services.auth_service import auth_service
from app.core.auth_models import User

# HTTPBearer security scheme
security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency to validate JWT access token and return the current authenticated User.
    """
    if not credentials:
        raise UnauthorizedException("Token keamanan tidak ditemukan. Silakan login kembali.")

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise UnauthorizedException("Sesi Anda telah kedaluwarsa atau tidak valid. Silakan login kembali.")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException("Token keamanan tidak valid.")

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise UnauthorizedException("Token keamanan tidak valid.")

    # Get user details from the database
    # auth_service.get_user_by_id raises NotFoundException if user is not found,
    # which we can catch or map if needed.
    try:
        user = await auth_service.get_user_by_id(db, user_id)
        return user
    except Exception:
        raise UnauthorizedException("User tidak ditemukan atau sesi tidak valid.")
