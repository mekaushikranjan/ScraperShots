from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from ..models import ImageResponse

class BaseScraper(ABC):
    """Base class for all image scrapers"""
    
    def __init__(self):
        """Initialize the base scraper"""
        pass

    @abstractmethod
    def get_images(self, query: str, per_page: int = 30) -> List[ImageResponse]:
        """Get images from the source
        
        Args:
            query (str): Search query
            per_page (int, optional): Number of images per page. Defaults to 30.
            
        Returns:
            List[ImageResponse]: List of images
        """
        pass

    @abstractmethod
    def _determine_category(self, data: Dict) -> str:
        """Determine the category of an image based on its metadata
        
        Args:
            data (Dict): Image metadata
            
        Returns:
            str: Category name
        """
        pass 