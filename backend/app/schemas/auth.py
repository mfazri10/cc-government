"""
Pydantic Schemas untuk modul Auth & RBAC.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ── Menu Schemas ───────────────────────────────────────────────

class MenuBase(BaseModel):
    name: str = Field(..., max_length=255)
    slug: str | None = None
    route: str | None = None
    icon: str | None = None
    parent_id: int | None = None
    order_no: int = 0
    is_active: bool = True


class MenuCreate(MenuBase):
    pass


class MenuUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    route: str | None = None
    icon: str | None = None
    parent_id: int | None = None
    order_no: int | None = None
    is_active: bool | None = None


class MenuResponse(MenuBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MenuTreeResponse(MenuResponse):
    """Menu dengan children (untuk sidebar navigation)."""
    children: list["MenuTreeResponse"] = []


# ── Permission Schemas ─────────────────────────────────────────

class PermissionBase(BaseModel):
    name: str = Field(..., max_length=100, examples=["feedback.create"])
    label: str | None = Field(None, max_length=255, examples=["Buat Feedback"])
    menu_id: int | None = None


class PermissionCreate(PermissionBase):
    pass


class PermissionResponse(PermissionBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Role Schemas ───────────────────────────────────────────────

class RoleBase(BaseModel):
    name: str = Field(..., max_length=100, examples=["admin"])
    label: str | None = Field(None, max_length=255, examples=["Administrator"])


class RoleCreate(RoleBase):
    permission_ids: list[int] = Field(default_factory=list, description="ID permissions yang di-assign ke role ini")


class RoleUpdate(BaseModel):
    name: str | None = None
    label: str | None = None
    permission_ids: list[int] | None = None


class RoleResponse(RoleBase):
    id: int
    created_at: datetime
    permissions: list[PermissionResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ── User Schemas ───────────────────────────────────────────────

class UserBase(BaseModel):
    name: str = Field(..., max_length=255)
    email: str = Field(..., max_length=255)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role_ids: list[int] = Field(default_factory=list, description="ID roles yang di-assign ke user ini")


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    password: str | None = None
    role_ids: list[int] | None = None


class UserResponse(UserBase):
    id: int
    created_at: datetime
    roles: list[RoleResponse] = []

    model_config = ConfigDict(from_attributes=True)


class UserWithPermissions(UserResponse):
    """User + all flattened permissions (untuk token / middleware)."""
    all_permissions: list[str] = []


class LoginRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(...)


class LoginResponse(BaseModel):
    user: UserResponse
    token: str
    message: str

