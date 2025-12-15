from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class ImageBase(BaseModel):
    title: str
    image_url: HttpUrl
    source_url: HttpUrl
    tags: List[str] = []
    local_path: Optional[str] = None
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    category: Optional[str] = None
    r2_url: Optional[str] = None

class ImageCreate(ImageBase):
    pass

class ImageInDB(ImageBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True
        arbitrary_types_allowed = True

class ImageResponse(ImageBase):
    id: str = Field(alias="_id")

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

class ScrapeRequest(BaseModel):
    category: str
    max_images: int = 100
    url: Optional[str] = None
    tags: Optional[List[str]] = None

class ScrapeResponse(BaseModel):
    task_id: str
    status: str
    message: str

class StatsResponse(BaseModel):
    total_images: int
    top_tags: List[dict]
    source_breakdown: List[dict]
    last_scraped: Optional[datetime] = None 