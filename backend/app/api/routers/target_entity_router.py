"""
Router Layer: Target Entity (OPD / Fasilitas) endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.feedback import (
    TargetEntityCreate,
    TargetEntityResponse,
    TargetEntityUpdate,
)
from app.services.target_entity_service import target_entity_service

router = APIRouter(prefix="/target-entities", tags=["Target Entities"])


@router.post("/", response_model=TargetEntityResponse, status_code=201)
async def create_entity(
    req: TargetEntityCreate,
    db: AsyncSession = Depends(get_db),
):
    """Buat target entity baru (OPD, fasilitas, tokoh)."""
    entity = await target_entity_service.create(db, req)
    return entity


@router.get("/", response_model=list[TargetEntityResponse])
async def list_entities(
    db: AsyncSession = Depends(get_db),
):
    """Daftar seluruh target entity."""
    return await target_entity_service.get_all(db)


@router.get("/{entity_id}", response_model=TargetEntityResponse)
async def get_entity(
    entity_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Ambil detail satu target entity."""
    return await target_entity_service.get_by_id(db, entity_id)


@router.patch("/{entity_id}", response_model=TargetEntityResponse)
async def update_entity(
    entity_id: int,
    req: TargetEntityUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update sebagian data target entity."""
    return await target_entity_service.update(db, entity_id, req)


@router.delete("/{entity_id}", status_code=204)
async def delete_entity(
    entity_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Hapus target entity."""
    await target_entity_service.delete(db, entity_id)
