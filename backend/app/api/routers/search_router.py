from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.schemas.search import SearchQueryRequest, SearchQueryResponse, SearchIngestRequest
from app.services.search_service import search_service
from app.core.auth_models import User

router = APIRouter(
    prefix="/scraper/search",
    tags=["Scraper Search Discover"],
)

@router.post("", response_model=SearchQueryResponse)
async def perform_search(
    request: SearchQueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Melakukan pencarian berdasarkan keyword (Discover).
    """
    results = await search_service.execute_search(db, request)
    return SearchQueryResponse(query=request.query, results=results)

@router.post("/ingest")
async def ingest_search(
    request: SearchIngestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Menyimpan hasil pencarian yang dipilih langsung ke tabel raw_feedbacks.
    """
    return await search_service.ingest_search_results(db, request)
