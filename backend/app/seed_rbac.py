"""
RBAC Seeder: Mengisi data awal roles, permissions, menus, dan admin user.
Jalankan: python -m app.seed_rbac
"""

import asyncio

from sqlalchemy import select

from app.core.auth_models import Menu, Permission, Role, User
from app.core.database import async_session_factory, engine
from app.core.models import Base


# ── Data Awal ──────────────────────────────────────────────────

INITIAL_MENUS = [
    {"name": "Dashboard", "slug": "dashboard", "route": "/dashboard", "icon": "LayoutDashboard", "order_no": 1},
    {"name": "Sentimen Warga", "slug": "sentimen", "route": "/dashboard/sentimen", "icon": "MessageSquare", "order_no": 2},
    {"name": "Pengaduan", "slug": "pengaduan", "route": "/dashboard/pengaduan", "icon": "AlertTriangle", "order_no": 3},
    {"name": "Target Entities", "slug": "target-entities", "route": "/dashboard/target-entities", "icon": "Building2", "order_no": 4},
    {"name": "Manajemen User", "slug": "users", "route": "/dashboard/users", "icon": "Users", "order_no": 10},
    {"name": "Manajemen Role", "slug": "roles", "route": "/dashboard/roles", "icon": "Shield", "order_no": 11},
    {"name": "Manajemen Menu", "slug": "menus", "route": "/dashboard/menus", "icon": "Menu", "order_no": 12},
]

# Permission format: "resource.action"
INITIAL_PERMISSIONS = [
    # Dashboard
    {"name": "dashboard.view", "label": "Lihat Dashboard"},
    # Sentimen
    {"name": "sentimen.view", "label": "Lihat Sentimen"},
    {"name": "sentimen.manage", "label": "Kelola Sentimen"},
    # Feedback
    {"name": "feedback.view", "label": "Lihat Feedback"},
    {"name": "feedback.create", "label": "Buat Feedback"},
    {"name": "feedback.delete", "label": "Hapus Feedback"},
    # Target Entity
    {"name": "entity.view", "label": "Lihat Target Entity"},
    {"name": "entity.create", "label": "Buat Target Entity"},
    {"name": "entity.update", "label": "Update Target Entity"},
    {"name": "entity.delete", "label": "Hapus Target Entity"},
    # Pengaduan
    {"name": "pengaduan.view", "label": "Lihat Pengaduan"},
    {"name": "pengaduan.manage", "label": "Kelola Pengaduan"},
    # User Management
    {"name": "user.view", "label": "Lihat User"},
    {"name": "user.create", "label": "Buat User"},
    {"name": "user.update", "label": "Update User"},
    {"name": "user.delete", "label": "Hapus User"},
    # Role Management
    {"name": "role.view", "label": "Lihat Role"},
    {"name": "role.create", "label": "Buat Role"},
    {"name": "role.update", "label": "Update Role"},
    {"name": "role.delete", "label": "Hapus Role"},
    # Menu Management
    {"name": "menu.view", "label": "Lihat Menu"},
    {"name": "menu.manage", "label": "Kelola Menu"},
    # Analytics
    {"name": "analytics.view", "label": "Lihat Analytics"},
    {"name": "analytics.export", "label": "Export Analytics"},
    # Scraping
    {"name": "scrape.trigger", "label": "Trigger Scraping"},
]

INITIAL_ROLES = [
    {
        "name": "super_admin",
        "label": "Super Administrator",
        "permissions": "*",  # Semua permission
    },
    {
        "name": "admin",
        "label": "Administrator",
        "permissions": [
            "dashboard.view", "sentimen.view", "sentimen.manage",
            "feedback.view", "feedback.create", "feedback.delete",
            "entity.view", "entity.create", "entity.update", "entity.delete",
            "pengaduan.view", "pengaduan.manage",
            "user.view", "user.create", "user.update",
            "role.view",
            "analytics.view", "analytics.export",
            "scrape.trigger",
        ],
    },
    {
        "name": "operator",
        "label": "Operator OPD",
        "permissions": [
            "dashboard.view", "sentimen.view",
            "feedback.view", "feedback.create",
            "entity.view",
            "pengaduan.view", "pengaduan.manage",
            "analytics.view",
        ],
    },
    {
        "name": "viewer",
        "label": "Viewer / Pimpinan",
        "permissions": [
            "dashboard.view", "sentimen.view",
            "feedback.view",
            "entity.view",
            "pengaduan.view",
            "analytics.view", "analytics.export",
        ],
    },
]

ADMIN_USER = {
    "name": "Super Admin",
    "email": "admin@govmind.local",
    "password": "admin123",  # TODO: Hash in production
}


# ── Seeder Functions ───────────────────────────────────────────

async def seed_rbac():
    """Seed RBAC data: menus → permissions → roles → admin user."""

    # Ensure all tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        # 1. Seed Menus
        print("📋 Seeding menus...")
        menu_map: dict[str, int] = {}
        for menu_data in INITIAL_MENUS:
            existing = await db.execute(
                select(Menu).where(Menu.slug == menu_data["slug"])
            )
            menu = existing.scalar_one_or_none()
            if not menu:
                menu = Menu(**menu_data)
                db.add(menu)
                await db.flush()
                print(f"  ✅ Menu: {menu_data['name']}")
            menu_map[menu_data["slug"]] = menu.id

        # 2. Seed Permissions (link to menus where applicable)
        print("\n🔑 Seeding permissions...")
        menu_permission_map = {
            "dashboard.view": "dashboard",
            "sentimen.view": "sentimen",
            "sentimen.manage": "sentimen",
            "pengaduan.view": "pengaduan",
            "pengaduan.manage": "pengaduan",
            "entity.view": "target-entities",
            "entity.create": "target-entities",
            "entity.update": "target-entities",
            "entity.delete": "target-entities",
            "user.view": "users",
            "user.create": "users",
            "user.update": "users",
            "user.delete": "users",
            "role.view": "roles",
            "role.create": "roles",
            "role.update": "roles",
            "role.delete": "roles",
            "menu.view": "menus",
            "menu.manage": "menus",
        }

        perm_map: dict[str, Permission] = {}
        for perm_data in INITIAL_PERMISSIONS:
            existing = await db.execute(
                select(Permission).where(Permission.name == perm_data["name"])
            )
            perm = existing.scalar_one_or_none()
            if not perm:
                perm_dict = {**perm_data}
                slug = menu_permission_map.get(perm_data["name"])
                if slug and slug in menu_map:
                    perm_dict["menu_id"] = menu_map[slug]
                perm = Permission(**perm_dict)
                db.add(perm)
                await db.flush()
                print(f"  ✅ Permission: {perm_data['name']} ({perm_data['label']})")
            perm_map[perm_data["name"]] = perm

        # 3. Seed Roles (with permissions)
        print("\n🛡️ Seeding roles...")
        role_map: dict[str, Role] = {}
        for role_data in INITIAL_ROLES:
            existing = await db.execute(
                select(Role).where(Role.name == role_data["name"])
            )
            role = existing.scalar_one_or_none()
            if not role:
                role = Role(name=role_data["name"], label=role_data["label"])
                db.add(role)
                await db.flush()

                # Assign permissions
                if role_data["permissions"] == "*":
                    role.permissions = list(perm_map.values())
                else:
                    role.permissions = [
                        perm_map[p] for p in role_data["permissions"] if p in perm_map
                    ]

                print(f"  ✅ Role: {role_data['name']} ({len(role.permissions)} permissions)")
            role_map[role_data["name"]] = role

        # 4. Seed Admin User
        print("\n👤 Seeding admin user...")
        existing_user = await db.execute(
            select(User).where(User.email == ADMIN_USER["email"])
        )
        if not existing_user.scalar_one_or_none():
            admin = User(**ADMIN_USER)
            admin.roles = [role_map["super_admin"]]
            db.add(admin)
            print(f"  ✅ User: {ADMIN_USER['email']} (role: super_admin)")
        else:
            print(f"  ⏭️ User {ADMIN_USER['email']} sudah ada, skip.")

        await db.commit()
        print("\n🎉 RBAC seeding selesai!")


if __name__ == "__main__":
    print("🌱 Memulai RBAC seeding...\n")
    asyncio.run(seed_rbac())
