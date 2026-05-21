from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.core.auth_models import User
from app.schemas.data_source import DataSourceCreate, DataSourceUpdate, DataSourceResponse, SourceResponse
from app.services.data_source_service import data_source_service

router = APIRouter(
    prefix="/data-sources",
    tags=["Data Sources Management"],
)

@router.get("", response_model=List[DataSourceResponse])
async def get_data_sources(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await data_source_service.get_all(db)

@router.post("", response_model=DataSourceResponse)
async def create_data_source(
    request: DataSourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await data_source_service.create(db, request)

@router.put("/{id}", response_model=DataSourceResponse)
async def update_data_source(
    id: int,
    request: DataSourceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await data_source_service.update(db, id, request)

@router.delete("/{id}")
async def delete_data_source(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await data_source_service.delete(db, id)

@router.post("/{id}/scrape")
async def trigger_scrape(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await data_source_service.trigger_manual_scrape(db, id)

@router.get("/platforms", response_model=List[SourceResponse])
async def get_platforms(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await data_source_service.get_all_platforms(db)
