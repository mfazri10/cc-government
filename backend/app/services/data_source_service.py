from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.core.models import DataSource, Source, TargetEntity
from app.core.exceptions import NotFoundException
from app.schemas.data_source import DataSourceCreate, DataSourceUpdate, DataSourceResponse

class DataSourceService:
    """Service untuk CRUD pada tabel data_sources."""

    async def get_all(self, db: AsyncSession) -> list[DataSourceResponse]:
        result = await db.execute(
            select(DataSource).options(
                joinedload(DataSource.source),
                joinedload(DataSource.target_entity)
            ).order_by(DataSource.created_at.desc())
        )
        data_sources = result.scalars().all()
        
        # Mapping to response
        response = []
        for ds in data_sources:
            response.append(
                DataSourceResponse(
                    id=ds.id,
                    name=ds.name,
                    source_id=ds.source_id,
                    url=ds.url,
                    target_entity_id=ds.target_entity_id,
                    status=ds.status,
                    last_scraped_at=ds.last_scraped_at,
                    created_at=ds.created_at,
                    source_name=ds.source.name if ds.source else "Unknown",
                    target_entity_name=ds.target_entity.name if ds.target_entity else "Unknown",
                )
            )
        return response

    async def create(self, db: AsyncSession, data: DataSourceCreate) -> DataSourceResponse:
        # Validasi Source & Entity
        source = await db.execute(select(Source).where(Source.id == data.source_id))
        if not source.scalar_one_or_none():
            raise NotFoundException("Source", str(data.source_id))

        entity = await db.execute(select(TargetEntity).where(TargetEntity.id == data.target_entity_id))
        if not entity.scalar_one_or_none():
            raise NotFoundException("TargetEntity", str(data.target_entity_id))

        new_ds = DataSource(**data.model_dump())
        db.add(new_ds)
        await db.commit()
        await db.refresh(new_ds)
        
        # Load relationships for response
        await db.refresh(new_ds, ['source', 'target_entity'])
        
        return DataSourceResponse(
            **new_ds.__dict__,
            source_name=new_ds.source.name,
            target_entity_name=new_ds.target_entity.name
        )

    async def update(self, db: AsyncSession, id: int, data: DataSourceUpdate) -> DataSourceResponse:
        result = await db.execute(
            select(DataSource).options(
                joinedload(DataSource.source),
                joinedload(DataSource.target_entity)
            ).where(DataSource.id == id)
        )
        ds = result.scalar_one_or_none()
        if not ds:
            raise NotFoundException("DataSource", str(id))

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(ds, key, value)

        await db.commit()
        await db.refresh(ds)
        
        return DataSourceResponse(
            **ds.__dict__,
            source_name=ds.source.name,
            target_entity_name=ds.target_entity.name
        )

    async def delete(self, db: AsyncSession, id: int) -> bool:
        result = await db.execute(select(DataSource).where(DataSource.id == id))
        ds = result.scalar_one_or_none()
        if not ds:
            raise NotFoundException("DataSource", str(id))

        await db.delete(ds)
        await db.commit()
        return True

    async def trigger_manual_scrape(self, db: AsyncSession, id: int) -> dict:
        result = await db.execute(select(DataSource).where(DataSource.id == id))
        ds = result.scalar_one_or_none()
        if not ds:
            raise NotFoundException("DataSource", str(id))
            
        from app.inngest_fns.client import inngest_client
        import inngest
        
        # Trigger Inngest event asinkron
        await inngest_client.send(
            inngest.Event(
                name="datasource/sync.requested",
                data={"datasource_id": ds.id},
            )
        )
        
        return {"message": "Scrape triggered successfully", "status": ds.status}

    async def execute_sync_flow(self, db: AsyncSession, id: int) -> dict:
        """
        Melakukan crawling dan ingesti data source secara asinkron (dipanggil oleh Inngest worker).
        """
        result = await db.execute(select(DataSource).where(DataSource.id == id))
        ds = result.scalar_one_or_none()
        if not ds:
            raise NotFoundException("DataSource", str(id))

        try:
            # 1. Buat scrape job baru via scraper_service
            from app.schemas.scraper import ScrapeRequest
            from app.services.scraper_service import scraper_service
            from app.services.ingest_service import ingest_service
            from app.schemas.ingest import IngestFromScrapeRequest

            scrape_req = ScrapeRequest(
                url=ds.url,
                formats=["markdown"]
            )
            
            # Buat job dengan status PENDING
            job = await scraper_service.create_job(db, scrape_req)
            
            # Jalankan scraping (mengunduh HTML, mengkonversi ke markdown)
            job = await scraper_service.process_scrape(db, job.id)

            if job.status == "FAILED":
                ds.status = "error"
                await db.commit()
                return {"status": "failed", "error": job.error_message}

            # 2. Ingest ulasan/komentar mentah ke raw_feedbacks
            ingest_req = IngestFromScrapeRequest(
                job_id=job.id,
                source_id=ds.source_id,
                target_entity_id=ds.target_entity_id,
                auto_analyze=True
            )
            
            ingest_result = await ingest_service.ingest_from_scrape(db, ingest_req)
            
            # 3. Update status sukses & last_scraped_at
            from datetime import datetime, timezone
            ds.status = "active"
            ds.last_scraped_at = datetime.now(timezone.utc)
            await db.commit()

            return {
                "status": "success",
                "feedbacks_created": ingest_result.feedbacks_created,
                "feedbacks_skipped": ingest_result.feedbacks_skipped
            }

        except Exception as e:
            ds.status = "error"
            await db.commit()
            return {"status": "failed", "error": str(e)}

    async def get_all_platforms(self, db: AsyncSession) -> list[Source]:
        """Mengambil semua platform/sumber data (sources) yang tersedia."""
        result = await db.execute(select(Source).order_by(Source.name.asc()))
        return list(result.scalars().all())

data_source_service = DataSourceService()
