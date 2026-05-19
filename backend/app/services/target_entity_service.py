"""
Service Layer: Target Entity (OPD / Fasilitas) operations.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import TargetEntityNotFoundException
from app.core.models import TargetEntity
from app.schemas.feedback import TargetEntityCreate, TargetEntityUpdate


class TargetEntityService:
    """Handles CRUD for target entities (OPD, fasilitas publik, tokoh)."""

    async def create(
        self, db: AsyncSession, data: TargetEntityCreate
    ) -> TargetEntity:
        entity = TargetEntity(**data.model_dump())
        db.add(entity)
        await db.commit()
        await db.refresh(entity)
        return entity

    async def get_all(self, db: AsyncSession) -> list[TargetEntity]:
        result = await db.execute(
            select(TargetEntity).order_by(TargetEntity.name)
        )
        return list(result.scalars().all())

    async def get_by_id(self, db: AsyncSession, entity_id: int) -> TargetEntity:
        result = await db.execute(
            select(TargetEntity).where(TargetEntity.id == entity_id)
        )
        entity = result.scalar_one_or_none()
        if not entity:
            raise TargetEntityNotFoundException(str(entity_id))
        return entity

    async def update(
        self, db: AsyncSession, entity_id: int, data: TargetEntityUpdate
    ) -> TargetEntity:
        entity = await self.get_by_id(db, entity_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(entity, key, value)
        await db.commit()
        await db.refresh(entity)
        return entity

    async def delete(self, db: AsyncSession, entity_id: int) -> None:
        entity = await self.get_by_id(db, entity_id)
        await db.delete(entity)
        await db.commit()


# Singleton instance
target_entity_service = TargetEntityService()
