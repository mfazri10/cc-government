"""
Router Layer: Auth & RBAC endpoints.
CRUD untuk Users, Roles, Permissions, dan Menus.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import (
    MenuCreate,
    MenuResponse,
    MenuTreeResponse,
    MenuUpdate,
    PermissionCreate,
    PermissionResponse,
    RoleCreate,
    RoleResponse,
    RoleUpdate,
    UserCreate,
    UserResponse,
    UserUpdate,
    UserWithPermissions,
    LoginRequest,
    LoginResponse,
)
from app.services.auth_service import auth_service

router = APIRouter(tags=["Auth & RBAC"])


# ── Authentication ─────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
async def login(
    req: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login user dan kembalikan detail data user beserta dummy token untuk sesi."""
    user = await auth_service.authenticate_user(db, req.email, req.password)
    token = f"demo-session-token-{user.id}-{user.email}"
    return LoginResponse(
        user=user,
        token=token,
        message="Login berhasil."
    )


# ── Users ──────────────────────────────────────────────────────

@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    req: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Buat user baru (dengan assign roles)."""
    return await auth_service.create_user(db, req)


@router.get("/users", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    """Daftar seluruh user beserta roles."""
    return await auth_service.get_all_users(db)


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Detail user beserta roles."""
    return await auth_service.get_user_by_id(db, user_id)


@router.get("/users/{user_id}/permissions", response_model=UserWithPermissions)
async def get_user_with_permissions(user_id: int, db: AsyncSession = Depends(get_db)):
    """Detail user + semua permissions (flattened dari semua roles)."""
    user = await auth_service.get_user_by_id(db, user_id)
    all_perms = await auth_service.get_user_permissions(db, user_id)
    return UserWithPermissions(
        id=user.id,
        name=user.name,
        email=user.email,
        created_at=user.created_at,
        roles=[],
        all_permissions=all_perms,
    )


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int, req: UserUpdate, db: AsyncSession = Depends(get_db),
):
    """Update data user (termasuk re-assign roles)."""
    return await auth_service.update_user(db, user_id, req)


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Hapus user."""
    await auth_service.delete_user(db, user_id)


# ── Roles ──────────────────────────────────────────────────────

@router.post("/roles", response_model=RoleResponse, status_code=201)
async def create_role(
    req: RoleCreate,
    db: AsyncSession = Depends(get_db),
):
    """Buat role baru (dengan assign permissions)."""
    return await auth_service.create_role(db, req)


@router.get("/roles", response_model=list[RoleResponse])
async def list_roles(db: AsyncSession = Depends(get_db)):
    """Daftar seluruh roles beserta permissions."""
    return await auth_service.get_all_roles(db)


@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(role_id: int, db: AsyncSession = Depends(get_db)):
    """Detail role beserta permissions."""
    return await auth_service.get_role_by_id(db, role_id)


@router.patch("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int, req: RoleUpdate, db: AsyncSession = Depends(get_db),
):
    """Update role (termasuk re-assign permissions)."""
    return await auth_service.update_role(db, role_id, req)


@router.delete("/roles/{role_id}", status_code=204)
async def delete_role(role_id: int, db: AsyncSession = Depends(get_db)):
    """Hapus role."""
    await auth_service.delete_role(db, role_id)


# ── Permissions ────────────────────────────────────────────────

@router.post("/permissions", response_model=PermissionResponse, status_code=201)
async def create_permission(
    req: PermissionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Buat permission baru."""
    return await auth_service.create_permission(db, req)


@router.get("/permissions", response_model=list[PermissionResponse])
async def list_permissions(db: AsyncSession = Depends(get_db)):
    """Daftar seluruh permissions."""
    return await auth_service.get_all_permissions(db)


@router.delete("/permissions/{perm_id}", status_code=204)
async def delete_permission(perm_id: int, db: AsyncSession = Depends(get_db)):
    """Hapus permission."""
    await auth_service.delete_permission(db, perm_id)


# ── Menus ──────────────────────────────────────────────────────

@router.post("/menus", response_model=MenuResponse, status_code=201)
async def create_menu(
    req: MenuCreate,
    db: AsyncSession = Depends(get_db),
):
    """Buat menu baru."""
    return await auth_service.create_menu(db, req)


@router.get("/menus", response_model=list[MenuTreeResponse])
async def list_menus(db: AsyncSession = Depends(get_db)):
    """Daftar menu tree (top-level dengan children)."""
    return await auth_service.get_all_menus(db)


@router.get("/menus/user/{user_id}", response_model=list[MenuTreeResponse])
async def get_menus_for_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Menu yang boleh diakses user berdasarkan permission-nya."""
    return await auth_service.get_menus_for_user(db, user_id)


@router.patch("/menus/{menu_id}", response_model=MenuResponse)
async def update_menu(
    menu_id: int, req: MenuUpdate, db: AsyncSession = Depends(get_db),
):
    """Update menu."""
    return await auth_service.update_menu(db, menu_id, req)


@router.delete("/menus/{menu_id}", status_code=204)
async def delete_menu(menu_id: int, db: AsyncSession = Depends(get_db)):
    """Hapus menu (beserta children-nya karena cascade)."""
    await auth_service.delete_menu(db, menu_id)
