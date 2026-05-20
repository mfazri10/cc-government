"""
Service Layer: Auth & RBAC operations.
Sesuai backend-patterns.md Section 1B:
- Semua logika bisnis ada di sini.
- Agnostik terhadap HTTP.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth_models import Menu, Permission, Role, User, permission_role, role_user
from app.core.exceptions import DuplicateEntryException, NotFoundException, ValidationException
from app.core.security import hash_password, verify_password
from app.schemas.auth import (
    MenuCreate,
    MenuUpdate,
    PermissionCreate,
    RoleCreate,
    RoleUpdate,
    UserCreate,
    UserUpdate,
)


class AuthService:
    """Handles RBAC CRUD and permission checking."""

    # ── Users ──────────────────────────────────────────────────

    async def authenticate_user(self, db: AsyncSession, email: str, plain_password: str) -> User:
        """Verifikasi credentials email & password. Return User jika valid, raise exception jika tidak."""
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .where(User.email == email)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise ValidationException("Email atau password tidak terdaftar.")

        if not verify_password(plain_password, user.password):
            raise ValidationException("Email atau password tidak sesuai.")

        return user


    async def create_user(self, db: AsyncSession, data: UserCreate) -> User:
        """Buat user baru dan assign roles."""
        # Check duplicate email
        existing = await db.execute(
            select(User).where(User.email == data.email)
        )
        if existing.scalar_one_or_none():
            raise DuplicateEntryException(f"User dengan email '{data.email}' sudah terdaftar.")

        user = User(
            name=data.name,
            email=data.email,
            password=hash_password(data.password),
        )

        # Assign roles
        if data.role_ids:
            roles = await db.execute(
                select(Role).where(Role.id.in_(data.role_ids))
            )
            user.roles = list(roles.scalars().all())

        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    async def get_user_by_id(self, db: AsyncSession, user_id: int) -> User:
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundException("User", str(user_id))
        return user

    async def get_all_users(self, db: AsyncSession) -> list[User]:
        result = await db.execute(
            select(User).options(selectinload(User.roles)).order_by(User.id)
        )
        return list(result.scalars().all())

    async def update_user(self, db: AsyncSession, user_id: int, data: UserUpdate) -> User:
        user = await self.get_user_by_id(db, user_id)
        update_data = data.model_dump(exclude_unset=True, exclude={"role_ids"})
        for key, value in update_data.items():
            if key == "password" and value is not None:
                value = hash_password(value)
            setattr(user, key, value)

        # Update roles if provided
        if data.role_ids is not None:
            roles = await db.execute(
                select(Role).where(Role.id.in_(data.role_ids))
            )
            user.roles = list(roles.scalars().all())

        await db.commit()
        await db.refresh(user)
        return user

    async def delete_user(self, db: AsyncSession, user_id: int) -> None:
        user = await self.get_user_by_id(db, user_id)
        await db.delete(user)
        await db.commit()

    async def get_user_permissions(self, db: AsyncSession, user_id: int) -> list[str]:
        """Flatten all permissions from all roles of a user."""
        user = await self.get_user_by_id(db, user_id)
        permissions: set[str] = set()
        for role in user.roles:
            for perm in role.permissions:
                permissions.add(perm.name)
        return sorted(permissions)

    # ── Roles ──────────────────────────────────────────────────

    async def create_role(self, db: AsyncSession, data: RoleCreate) -> Role:
        existing = await db.execute(
            select(Role).where(Role.name == data.name)
        )
        if existing.scalar_one_or_none():
            raise DuplicateEntryException(f"Role '{data.name}' sudah ada.")

        role = Role(name=data.name, label=data.label)

        if data.permission_ids:
            perms = await db.execute(
                select(Permission).where(Permission.id.in_(data.permission_ids))
            )
            role.permissions = list(perms.scalars().all())

        db.add(role)
        await db.commit()
        await db.refresh(role)
        return role

    async def get_all_roles(self, db: AsyncSession) -> list[Role]:
        result = await db.execute(
            select(Role).options(selectinload(Role.permissions)).order_by(Role.id)
        )
        return list(result.scalars().all())

    async def get_role_by_id(self, db: AsyncSession, role_id: int) -> Role:
        result = await db.execute(
            select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id)
        )
        role = result.scalar_one_or_none()
        if not role:
            raise NotFoundException("Role", str(role_id))
        return role

    async def update_role(self, db: AsyncSession, role_id: int, data: RoleUpdate) -> Role:
        role = await self.get_role_by_id(db, role_id)
        update_data = data.model_dump(exclude_unset=True, exclude={"permission_ids"})
        for key, value in update_data.items():
            setattr(role, key, value)

        if data.permission_ids is not None:
            perms = await db.execute(
                select(Permission).where(Permission.id.in_(data.permission_ids))
            )
            role.permissions = list(perms.scalars().all())

        await db.commit()
        await db.refresh(role)
        return role

    async def delete_role(self, db: AsyncSession, role_id: int) -> None:
        role = await self.get_role_by_id(db, role_id)
        await db.delete(role)
        await db.commit()

    # ── Permissions ────────────────────────────────────────────

    async def create_permission(self, db: AsyncSession, data: PermissionCreate) -> Permission:
        existing = await db.execute(
            select(Permission).where(Permission.name == data.name)
        )
        if existing.scalar_one_or_none():
            raise DuplicateEntryException(f"Permission '{data.name}' sudah ada.")

        perm = Permission(**data.model_dump())
        db.add(perm)
        await db.commit()
        await db.refresh(perm)
        return perm

    async def get_all_permissions(self, db: AsyncSession) -> list[Permission]:
        result = await db.execute(
            select(Permission).order_by(Permission.name)
        )
        return list(result.scalars().all())

    async def delete_permission(self, db: AsyncSession, perm_id: int) -> None:
        result = await db.execute(
            select(Permission).where(Permission.id == perm_id)
        )
        perm = result.scalar_one_or_none()
        if not perm:
            raise NotFoundException("Permission", str(perm_id))
        await db.delete(perm)
        await db.commit()

    # ── Menus ──────────────────────────────────────────────────

    async def create_menu(self, db: AsyncSession, data: MenuCreate) -> Menu:
        menu = Menu(**data.model_dump())
        db.add(menu)
        await db.commit()
        await db.refresh(menu)
        return menu

    async def get_all_menus(self, db: AsyncSession) -> list[Menu]:
        """Get all top-level menus with children loaded."""
        result = await db.execute(
            select(Menu)
            .where(Menu.parent_id.is_(None))
            .options(selectinload(Menu.children))
            .order_by(Menu.order_no)
        )
        return list(result.scalars().all())

    async def update_menu(self, db: AsyncSession, menu_id: int, data: MenuUpdate) -> Menu:
        result = await db.execute(
            select(Menu).where(Menu.id == menu_id)
        )
        menu = result.scalar_one_or_none()
        if not menu:
            raise NotFoundException("Menu", str(menu_id))

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(menu, key, value)

        await db.commit()
        await db.refresh(menu)
        return menu

    async def delete_menu(self, db: AsyncSession, menu_id: int) -> None:
        result = await db.execute(
            select(Menu).where(Menu.id == menu_id)
        )
        menu = result.scalar_one_or_none()
        if not menu:
            raise NotFoundException("Menu", str(menu_id))
        await db.delete(menu)
        await db.commit()

    async def get_menus_for_user(self, db: AsyncSession, user_id: int) -> list[Menu]:
        """
        Get menus yang boleh diakses berdasarkan permission user.
        Hanya return menu yang terkait permission yang dimiliki user.
        """
        user_permissions = await self.get_user_permissions(db, user_id)

        result = await db.execute(
            select(Menu)
            .join(Permission, Permission.menu_id == Menu.id)
            .where(Permission.name.in_(user_permissions))
            .options(selectinload(Menu.children))
            .order_by(Menu.order_no)
            .distinct()
        )
        return list(result.scalars().all())


# Singleton instance
auth_service = AuthService()
