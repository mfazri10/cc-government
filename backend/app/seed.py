"""
Database Seeder: Mengisi data awal (sources & target_entities).
Jalankan: python -m app.seed
"""

import asyncio

from sqlalchemy import select
from app.core.database import async_session_factory, engine
from app.core.models import Base, Source, TargetEntity


INITIAL_SOURCES = [
    {"name": "Google Maps", "type": "review"},
    {"name": "Twitter / X", "type": "social_media"},
    {"name": "Instagram", "type": "social_media"},
    {"name": "Facebook", "type": "social_media"},
    {"name": "Berita Lokal", "type": "news"},
    {"name": "SP4N-LAPOR", "type": "complaint"},
]

INITIAL_ENTITIES = [
    {
        "name": "RSUD Cibabat",
        "entity_type": "Fasilitas_Kesehatan",
        "keywords": ["rsud cibabat", "rs cibabat", "rumah sakit cibabat"],
    },
    {
        "name": "Disdukcapil Cimahi",
        "entity_type": "OPD",
        "keywords": ["disdukcapil", "dinas kependudukan", "ktp cimahi", "akta cimahi"],
    },
    {
        "name": "DPUPR Cimahi",
        "entity_type": "OPD",
        "keywords": ["dpupr", "dinas pekerjaan umum", "jalan rusak cimahi"],
    },
    {
        "name": "DLHK Cimahi",
        "entity_type": "OPD",
        "keywords": ["dlhk", "dinas lingkungan hidup", "sampah cimahi"],
    },
    {
        "name": "Dishub Cimahi",
        "entity_type": "OPD",
        "keywords": ["dishub", "dinas perhubungan", "macet cimahi", "lampu merah"],
    },
    {
        "name": "Puskesmas Cimahi Tengah",
        "entity_type": "Fasilitas_Kesehatan",
        "keywords": ["puskesmas cimahi tengah"],
    },
    {
        "name": "Puskesmas Cipageran",
        "entity_type": "Fasilitas_Kesehatan",
        "keywords": ["puskesmas cipageran"],
    },
    {
        "name": "Kecamatan Cimahi Selatan",
        "entity_type": "Fasilitas_Pemerintahan",
        "keywords": ["kecamatan cimahi selatan", "kantor kecamatan selatan"],
    },
]


async def seed():
    """Seed initial data."""
    # Create all tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        # Seed Sources
        for source_data in INITIAL_SOURCES:
            existing = await db.execute(
                select(Source).where(Source.name == source_data["name"])
            )
            if not existing.scalar_one_or_none():
                db.add(Source(**source_data))
                print(f"  ✅ Source: {source_data['name']}")

        # Seed Target Entities
        for entity_data in INITIAL_ENTITIES:
            existing = await db.execute(
                select(TargetEntity).where(TargetEntity.name == entity_data["name"])
            )
            if not existing.scalar_one_or_none():
                db.add(TargetEntity(**entity_data))
                print(f"  ✅ Entity: {entity_data['name']}")

        await db.commit()
        print("\n🎉 Seeding selesai!")


if __name__ == "__main__":
    print("🌱 Memulai database seeding...\n")
    asyncio.run(seed())
