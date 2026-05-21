from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DataSourceBase(BaseModel):
    name: str
    source_id: int
    url: str
    target_entity_id: int
    status: str = "active"

class DataSourceCreate(DataSourceBase):
    pass

class DataSourceUpdate(BaseModel):
    name: Optional[str] = None
    source_id: Optional[int] = None
    url: Optional[str] = None
    target_entity_id: Optional[int] = None
    status: Optional[str] = None

class DataSourceResponse(DataSourceBase):
    id: int
    last_scraped_at: Optional[datetime] = None
    created_at: datetime
    
    # Extra fields dari relasi table (JOIN)
    source_name: str
    target_entity_name: str

    class Config:
        from_attributes = True


class SourceResponse(BaseModel):
    id: int
    name: str
    type: str

    class Config:
        from_attributes = True
