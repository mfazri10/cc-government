"""
ORM Models untuk modul Auth & Permission (RBAC).
Diadopsi dari migration file Laravel di folder /migrations.

Skema akhir (setelah semua migration di-merge):
- users: id, name, email, password, timestamps
- roles: id, name (unique), label (nullable), timestamps
- permissions: id, name (unique), label (nullable), menu_id (FK→menus), timestamps
- role_user: composite PK (user_id, role_id) — pivot table
- permission_role: composite PK (permission_id, role_id) — pivot table
- menus: id, name, slug, route, icon, parent_id (self-ref), order_no, is_active, timestamps
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base


# ── Association Tables (Pivot / Many-to-Many) ──────────────────

role_user = Table(
    "role_user",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

permission_role = Table(
    "permission_role",
    Base.metadata,
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


# ── User Model ─────────────────────────────────────────────────

class User(Base):
    """
    Tabel users.
    Satu user bisa memiliki banyak role (many-to-many via role_user).
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    roles: Mapped[list["Role"]] = relationship(
        secondary=role_user, back_populates="users", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"


# ── Role Model ─────────────────────────────────────────────────

class Role(Base):
    """
    Tabel roles.
    Contoh: admin, operator, viewer.
    Satu role bisa memiliki banyak permission (many-to-many via permission_role).
    """

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    users: Mapped[list["User"]] = relationship(
        secondary=role_user, back_populates="roles", lazy="selectin"
    )
    permissions: Mapped[list["Permission"]] = relationship(
        secondary=permission_role, back_populates="roles", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name='{self.name}')>"


# ── Permission Model ──────────────────────────────────────────

class Permission(Base):
    """
    Tabel permissions.
    Contoh: feedback.create, feedback.read, analytics.view, user.manage.
    Terkait menu_id agar permission bisa diikat ke menu tertentu di sidebar.
    """

    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    menu_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("menus.id", ondelete="CASCADE"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    roles: Mapped[list["Role"]] = relationship(
        secondary=permission_role, back_populates="permissions", lazy="selectin"
    )
    menu: Mapped["Menu | None"] = relationship(back_populates="permissions")

    def __repr__(self) -> str:
        return f"<Permission(id={self.id}, name='{self.name}')>"


# ── Menu Model ─────────────────────────────────────────────────

class Menu(Base):
    """
    Tabel menus.
    Mendukung nested menu (parent_id self-referencing).
    Digunakan untuk mengatur navigasi sidebar sesuai permission user.
    """

    __tablename__ = "menus"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str | None] = mapped_column(String(255), nullable=True)
    route: Mapped[str | None] = mapped_column(String(255), nullable=True)
    icon: Mapped[str | None] = mapped_column(String(100), nullable=True)
    parent_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("menus.id", ondelete="CASCADE"), nullable=True
    )
    order_no: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    parent: Mapped["Menu | None"] = relationship(
        back_populates="children", remote_side=[id]
    )
    children: Mapped[list["Menu"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )
    permissions: Mapped[list["Permission"]] = relationship(back_populates="menu")

    def __repr__(self) -> str:
        return f"<Menu(id={self.id}, name='{self.name}')>"
