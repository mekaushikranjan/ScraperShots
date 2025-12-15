from typing import Optional, List
from pydantic import BaseSettings, validator
import os
from pathlib import Path

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "ScraperShorts"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "scrapershorts"
    
    # Selenium
    SELENIUM_DRIVER_PATH: Optional[str] = None
    SELENIUM_HEADLESS: bool = True
    SELENIUM_TIMEOUT: int = 30
    SELENIUM_SCROLL_DELAY: float = 1.0
    
    # Image Storage
    IMAGE_STORAGE_PATH: str = "images"
    MAX_IMAGES_PER_SCRAPE: int = 100
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "app.log"
    
    @validator("IMAGE_STORAGE_PATH")
    def create_image_storage_path(cls, v):
        path = Path(v)
        path.mkdir(parents=True, exist_ok=True)
        return str(path.absolute())
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings() 