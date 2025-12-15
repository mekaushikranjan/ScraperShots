from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings
from .models import ImageCreate, ImageInDB, ImageResponse
from typing import List, Optional, Dict, Any, Set
from datetime import datetime
from bson import ObjectId
import logging
from pymongo.errors import DuplicateKeyError, OperationFailure

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.images = self.db.images
            logger.info("Database connection initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize database connection: {str(e)}")
            raise

    async def connect_to_database(self):
        """Initialize database connection and create indexes"""
        try:
            # Create unique index on image_url
            await self.images.create_index("image_url", unique=True)
            # Create text index for search
            await self.images.create_index([
                ("title", "text"),
                ("tags", "text"),
                ("category", "text")
            ])
            # Create index for sorting
            await self.images.create_index([("created_at", -1)])
            await self.images.create_index([("scraped_at", -1)])
            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.error(f"Failed to create database indexes: {str(e)}")
            raise

    async def close_database_connection(self):
        """Close database connection"""
        try:
            if self.client:
                self.client.close()
                logger.info("Database connection closed successfully")
        except Exception as e:
            logger.error(f"Failed to close database connection: {str(e)}")

    async def create_image(self, image: ImageCreate) -> Optional[ImageResponse]:
        """Create a new image in the database"""
        try:
            # Check if image already exists
            existing = await self.images.find_one({"image_url": image.image_url})
            if existing:
                logger.info(f"Image already exists: {image.image_url}")
                existing["_id"] = str(existing["_id"])
                return ImageResponse(**existing)

            # Create new image document
            image_dict = image.dict()
            image_dict["created_at"] = datetime.utcnow()
            image_dict["updated_at"] = datetime.utcnow()
            try:
                result = await self.images.insert_one(image_dict)
                if result.inserted_id:
                    # Convert ObjectId to string before creating response
                    image_dict["_id"] = str(result.inserted_id)
                    logger.info(f"New image created: {image_dict['_id']}")
                    return ImageResponse(**image_dict)
            except DuplicateKeyError:
                logger.warning(f"Duplicate image URL detected: {image.image_url}")
                # Try to get the existing image
                existing = await self.images.find_one({"image_url": image.image_url})
                if existing:
                    existing["_id"] = str(existing["_id"])
                    return ImageResponse(**existing)
            return None
        except Exception as e:
            logger.error(f"Error creating image: {str(e)}")
            return None

    async def get_image(self, image_id: str) -> Optional[ImageResponse]:
        """Get a single image by ID"""
        try:
            if not ObjectId.is_valid(image_id):
                logger.warning(f"Invalid image ID format: {image_id}")
                return None

            image = await self.images.find_one({"_id": ObjectId(image_id)})
            if image:
                # Convert ObjectId to string before creating response
                image["_id"] = str(image["_id"])
                return ImageResponse(**image)
            logger.warning(f"Image not found: {image_id}")
            return None
        except Exception as e:
            logger.error(f"Error getting image: {str(e)}")
            return None

    async def get_images(
        self,
        search: Optional[str] = None,
        source: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
        category: Optional[str] = None,
        skip: Optional[int] = None
    ) -> List[ImageResponse]:
        """Get images from the database with filters"""
        try:
            # Build query
            query = {}
            
            if search:
                query["$or"] = [
                    {"title": {"$regex": search, "$options": "i"}},
                    {"tags": {"$regex": search, "$options": "i"}},
                    {"category": {"$regex": search, "$options": "i"}}
                ]
            
            if source:
                query["source_url"] = {"$regex": source, "$options": "i"}
            
            if date_from or date_to:
                date_query = {}
                if date_from:
                    date_query["$gte"] = date_from
                if date_to:
                    date_query["$lte"] = date_to
                query["scraped_at"] = date_query
            
            if category and category != "all":
                # Define category mappings with subcategories
                category_mapping = {
                    "sports": {
                        "subcategories": [
                            "football", "soccer", "basketball", "tennis", "golf", "baseball",
                            "cricket", "rugby", "hockey", "volleyball", "swimming", "athletics",
                            "boxing", "martial arts", "wrestling", "gymnastics", "cycling",
                            "racing", "surfing", "skiing", "snowboarding", "skateboarding"
                        ],
                        "related": ["fitness", "exercise", "athletic", "game", "competition", "sport"]
                    },
                    "nature": {
                        "subcategories": [
                            "landscape", "mountains", "forest", "ocean", "beach", "sunset",
                            "wildlife", "flowers", "garden", "plants", "trees", "waterfall"
                        ],
                        "related": ["outdoors", "environment", "natural", "scenic"]
                    },
                    "technology": {
                        "subcategories": [
                            "computer", "smartphone", "robot", "ai", "gadget", "electronics",
                            "software", "hardware", "internet", "data", "cybersecurity"
                        ],
                        "related": ["digital", "innovation", "tech", "modern"]
                    },
                    "business": {
                        "subcategories": [
                            "office", "meeting", "presentation", "startup", "entrepreneur",
                            "corporate", "finance", "marketing", "team", "workplace"
                        ],
                        "related": ["professional", "work", "career", "industry"]
                    },
                    "art": {
                        "subcategories": [
                            "painting", "sculpture", "drawing", "illustration", "digital art",
                            "gallery", "museum", "exhibition", "artist", "creative"
                        ],
                        "related": ["creative", "design", "artistic", "visual"]
                    },
                    "fashion": {
                        "subcategories": [
                            "clothing", "accessories", "runway", "model", "style", "designer",
                            "fashion show", "outfit", "trend", "luxury"
                        ],
                        "related": ["style", "apparel", "wear", "trendy"]
                    },
                    "music": {
                        "subcategories": [
                            "concert", "band", "musician", "instrument", "performance",
                            "studio", "recording", "sound", "dj", "festival"
                        ],
                        "related": ["audio", "melody", "rhythm", "song"]
                    },
                    "education": {
                        "subcategories": [
                            "school", "university", "classroom", "student", "teacher",
                            "learning", "study", "campus", "library", "research"
                        ],
                        "related": ["academic", "teaching", "knowledge", "training"]
                    },
                    "health": {
                        "subcategories": [
                            "fitness", "wellness", "medical", "doctor", "hospital",
                            "healthcare", "exercise", "yoga", "meditation", "nutrition"
                        ],
                        "related": ["medical", "wellness", "fitness", "healthcare"]
                    },
                    "automotive": {
                        "subcategories": [
                            "car", "vehicle", "automobile", "transportation", "driving",
                            "road", "highway", "racing", "motorcycle", "luxury car"
                        ],
                        "related": ["transport", "vehicle", "automobile", "driving"]
                    },
                    "abstract": {
                        "subcategories": [
                            "pattern", "texture", "background", "minimal", "geometric",
                            "shape", "form", "color", "design", "artistic"
                        ],
                        "related": ["artistic", "design", "pattern", "texture"]
                    },
                    "editorial": {
                        "subcategories": [
                            "magazine", "cover", "story", "feature", "journalism",
                            "press", "media", "publication", "article", "news"
                        ],
                        "related": ["media", "press", "publication", "story"]
                    },
                    "film": {
                        "subcategories": [
                            "movie", "cinema", "theater", "actor", "actress", "director",
                            "scene", "set", "production", "hollywood"
                        ],
                        "related": ["cinema", "movie", "theater", "production"]
                    },
                    "3d": {
                        "subcategories": [
                            "3d-rendering", "3d-model", "3d-art", "digital-art", "animation",
                            "cg", "computer-graphics", "virtual", "simulation", "3d-design"
                        ],
                        "related": ["digital", "virtual", "computer", "simulation"]
                    },
                    "architecture": {
                        "subcategories": [
                            "building", "city", "urban", "interior", "design", "modern",
                            "house", "apartment", "structure", "construction"
                        ],
                        "related": ["building", "design", "structure", "construction"]
                    },
                    "people": {
                        "subcategories": [
                            "portrait", "person", "human", "face", "lifestyle", "fashion",
                            "beauty", "model", "family", "friends"
                        ],
                        "related": ["human", "person", "portrait", "people"]
                    },
                    "animals": {
                        "subcategories": [
                            "pet", "dog", "cat", "wildlife", "bird", "mammal", "reptile",
                            "fish", "insect", "zoo"
                        ],
                        "related": ["wildlife", "pet", "animal", "creature"]
                    },
                    "food": {
                        "subcategories": [
                            "meal", "restaurant", "cooking", "recipe", "cuisine", "dessert",
                            "breakfast", "lunch", "dinner", "snack"
                        ],
                        "related": ["cuisine", "meal", "cooking", "dining"]
                    },
                    "travel": {
                        "subcategories": [
                            "vacation", "tourism", "destination", "journey", "adventure",
                            "explore", "trip", "holiday", "backpacking", "roadtrip"
                        ],
                        "related": ["tourism", "journey", "adventure", "exploration"]
                    }
                }
                
                # Get category mapping
                category_info = category_mapping.get(category.lower(), {
                    "subcategories": [category.lower()],
                    "related": []
                })
                
                # Build category query - strict filtering for all categories
                if category.lower() == "other":
                    # Only match exact 'other' category
                    category_query = {"category": {"$regex": "^other$", "$options": "i"}}
                else:
                    # Strict filtering for all categories - only match exact category and subcategories
                    category_query = {
                        "$or": [
                            # Match exact category
                            {"category": {"$regex": f"^{category.lower()}$", "$options": "i"}},
                            # Match subcategories
                            {"category": {"$in": [sub.lower() for sub in category_info["subcategories"]]}}
                        ]
                    }
                
                # Add category query to main query
                query["$and"] = [category_query]

            # Build sort
            sort_direction = -1 if sort_order.lower() == "desc" else 1
            sort = [(sort_by, sort_direction)]

            # Calculate skip value
            skip_value = skip if skip is not None else (page - 1) * limit

            # Use aggregation pipeline to deduplicate by _id before pagination
            pipeline = [
                {"$match": query},
                {"$group": {"_id": "$_id", "doc": {"$first": "$$ROOT"}}},
                {"$replaceRoot": {"newRoot": "$doc"}},
                {"$sort": {sort_by: sort_direction}},
                {"$skip": skip_value},
                {"$limit": limit}
            ]
            images = await self.images.aggregate(pipeline).to_list(length=limit)
            
            # Convert ObjectId to string for all images and create ImageResponse objects
            return [ImageResponse(**{**image, "_id": str(image["_id"])}) for image in images]
        except Exception as e:
            logger.error(f"Error getting images: {str(e)}")
            return []

    async def get_stats(self) -> Dict[str, Any]:
        """Get image statistics"""
        try:
            total_images = await self.images.count_documents({})
            
            # Get top tags
            pipeline = [
                {"$unwind": "$tags"},
                {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 10}
            ]
            top_tags = await self.images.aggregate(pipeline).to_list(length=10)
            
            # Get source breakdown
            pipeline = [
                {"$group": {"_id": "$source_url", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            source_breakdown = await self.images.aggregate(pipeline).to_list(length=None)
            
            # Get category distribution
            pipeline = [
                {"$group": {"_id": "$category", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            category_breakdown = await self.images.aggregate(pipeline).to_list(length=None)
            
            return {
                "total_images": total_images,
                "top_tags": top_tags,
                "source_breakdown": source_breakdown,
                "category_breakdown": category_breakdown
            }
        except Exception as e:
            logger.error(f"Error getting stats: {str(e)}")
            return {
                "total_images": 0,
                "top_tags": [],
                "source_breakdown": [],
                "category_breakdown": []
            }

    async def get_image_by_url(self, image_url: str) -> Optional[ImageResponse]:
        """Get an image by its URL."""
        try:
            image = await self.images.find_one({"image_url": image_url})
            if image:
                return ImageResponse(**image)
            return None
        except Exception as e:
            logger.error(f"Error getting image by URL: {str(e)}")
            return None

db = Database() 