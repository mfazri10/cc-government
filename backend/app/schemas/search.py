from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SearchQueryRequest(BaseModel):
    query: str
    sources: List[str]
    limit: int = 10

class SearchQueryResultItem(BaseModel):
    title: str
    url: str
    snippet: str
    source: str
    published_at: Optional[str] = None

class SearchQueryResponse(BaseModel):
    query: str
    results: List[SearchQueryResultItem]

class SearchIngestRequest(BaseModel):
    target_entity_id: Optional[int] = None
    items: List[SearchQueryResultItem]
