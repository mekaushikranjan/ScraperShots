from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Depends
from typing import List, Optional
from datetime import datetime
from ..models import ImageResponse, ScrapeRequest, ScrapeResponse, StatsResponse
from ..database import db
from ..scraper.selenium_scraper import SeleniumScraper
import uuid
import logging
import asyncio

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory task storage (replace with Redis in production)
scraping_tasks = {}

# Task cleanup after 1 hour
TASK_CLEANUP_DELAY = 3600  # 1 hour in seconds

async def get_db():
    return db

async def cleanup_task(task_id: str):
    await asyncio.sleep(TASK_CLEANUP_DELAY)
    if task_id in scraping_tasks:
        del scraping_tasks[task_id]
        logger.info(f"Cleaned up task {task_id}")

@router.post("/scrape", response_model=ScrapeResponse)
async def start_scraping(
    request: ScrapeRequest,
    background_tasks: BackgroundTasks,
    db=Depends(get_db)
):
    task_id = str(uuid.uuid4())
    
    async def scrape_task():
        try:
            scraper = SeleniumScraper()
            images_data = await scraper.scrape_images(
                url=request.url,
                category=request.category,
                max_images=request.max_images
            )
            
            if not images_data:
                scraping_tasks[task_id] = {
                    "status": "failed",
                    "message": f"No images found for category '{request.category}'"
                }
                return
            
            # Save images to database
            saved_count = 0
            for image_data in images_data:
                try:
                    await db.create_image(image_data)
                    saved_count += 1
                except Exception as e:
                    logger.error(f"Error saving image: {str(e)}")
                    continue
            
            if saved_count > 0:
                scraping_tasks[task_id] = {
                    "status": "completed",
                    "message": f"Successfully downloaded {saved_count} images for category '{request.category}'"
                }
            else:
                scraping_tasks[task_id] = {
                    "status": "failed",
                    "message": "Failed to save any images"
                }
        except Exception as e:
            logger.error(f"Error in scrape task: {str(e)}")
            scraping_tasks[task_id] = {
                "status": "failed",
                "message": f"Error: {str(e)}"
            }
        finally:
            # Schedule task cleanup
            asyncio.create_task(cleanup_task(task_id))
    
    background_tasks.add_task(scrape_task)
    scraping_tasks[task_id] = {
        "status": "running",
        "message": f"Download started for category '{request.category}'"
    }
    
    return ScrapeResponse(
        task_id=task_id,
        status="running",
        message=f"Download task started for category '{request.category}'"
    )

@router.get("/images", response_model=List[ImageResponse])
async def get_images(
    search: Optional[str] = None,
    source: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort_by: str = Query("scraped_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order (asc, desc, 1, or -1)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=1000, description="Number of images per page (1-1000)"),
    category: Optional[str] = None,
    db=Depends(get_db)
):
    try:
        # Convert sort_by to match database field
        sort_mapping = {
            "newest": "scraped_at",
            "oldest": "scraped_at",
            "a-z": "title",
            "popular": "views",
            "downloads": "downloads"
        }
        db_sort_by = sort_mapping.get(sort_by, "scraped_at")
        
        # Convert sort_order to string format
        if sort_order in ["1", "-1"]:
            sort_order = "asc" if sort_order == "1" else "desc"
        elif sort_order.lower() not in ["asc", "desc"]:
            sort_order = "desc"  # Default to desc if invalid
        
        # Convert dates to ISO format if provided
        if date_from:
            try:
                date_from = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            except ValueError:
                logger.warning(f"Invalid date_from format: {date_from}")
                date_from = None
        if date_to:
            try:
                date_to = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            except ValueError:
                logger.warning(f"Invalid date_to format: {date_to}")
                date_to = None

        # Expanded valid_categories to include all main categories, subcategories, and related terms
        valid_categories = [
            "all", "editorial", "wallpapers", "3d", "nature", "architecture",
            "people", "film", "travel", "animals", "food", "technology",
            "business", "sports", "art", "fashion", "music", "education",
            "health", "automotive", "abstract", "other",
            # sports
            "football", "soccer", "basketball", "tennis", "golf", "baseball",
            "cricket", "rugby", "hockey", "volleyball", "swimming", "athletics",
            "boxing", "martial arts", "wrestling", "gymnastics", "cycling",
            "racing", "surfing", "skiing", "snowboarding", "skateboarding",
            "fitness", "exercise", "athletic", "game", "competition", "sport",
            # nature
            "landscape", "mountains", "forest", "ocean", "beach", "sunset",
            "wildlife", "flowers", "garden", "plants", "trees", "waterfall",
            "outdoors", "environment", "natural", "scenic",
            # technology
            "computer", "smartphone", "robot", "ai", "gadget", "electronics",
            "software", "hardware", "internet", "data", "cybersecurity",
            "digital", "innovation", "tech", "modern",
            # business
            "office", "meeting", "presentation", "startup", "entrepreneur",
            "corporate", "finance", "marketing", "team", "workplace",
            "professional", "work", "career", "industry",
            # art
            "painting", "sculpture", "drawing", "illustration", "digital art",
            "gallery", "museum", "exhibition", "artist", "creative",
            "design", "artistic", "visual",
            # fashion
            "clothing", "accessories", "runway", "model", "style", "designer",
            "fashion show", "outfit", "trend", "luxury", "apparel", "wear", "trendy",
            # music
            "concert", "band", "musician", "instrument", "performance",
            "studio", "recording", "sound", "dj", "festival", "audio", "melody", "rhythm", "song",
            # education
            "school", "university", "classroom", "student", "teacher",
            "learning", "study", "campus", "library", "research", "academic", "teaching", "knowledge", "training",
            # health
            "wellness", "medical", "doctor", "hospital", "healthcare", "yoga", "meditation", "nutrition",
            # automotive
            "car", "vehicle", "automobile", "transportation", "driving", "road", "highway", "motorcycle", "luxury car", "transport",
            # abstract
            "pattern", "texture", "background", "minimal", "geometric", "shape", "form", "color",
            # editorial
            "magazine", "cover", "story", "feature", "journalism", "press", "media", "publication", "article", "news",
            # film
            "movie", "cinema", "theater", "actor", "actress", "director", "scene", "set", "production", "hollywood",
            # 3d
            "3d-rendering", "3d-model", "3d-art", "animation", "cg", "computer-graphics", "virtual", "simulation", "3d-design",
            # architecture
            "building", "city", "urban", "interior", "house", "apartment", "structure", "construction",
            # people
            "portrait", "person", "human", "face", "lifestyle", "beauty", "family", "friends",
            # animals
            "pet", "dog", "cat", "bird", "mammal", "reptile", "fish", "insect", "zoo", "creature",
            # food
            "meal", "restaurant", "cooking", "recipe", "cuisine", "dessert", "breakfast", "lunch", "dinner", "snack", "dining",
            # travel
            "vacation", "tourism", "destination", "journey", "adventure", "explore", "trip", "holiday", "backpacking", "roadtrip",
        ]
        if category and category.lower() not in valid_categories:
            logger.warning(f"Invalid category: {category}")
            category = None

        skip = (page - 1) * limit
        images = await db.get_images(
            skip=skip,
            limit=limit,
            search=search,
            source=source,
            date_from=date_from,
            date_to=date_to,
            sort_by=db_sort_by,
            sort_order=sort_order.lower(),  # Ensure lowercase
            category=category.lower() if category else None
        )
        
        if not images and page > 1:
            # If no results on current page, try first page
            images = await db.get_images(
                skip=0,
                limit=limit,
                search=search,
                source=source,
                date_from=date_from,
                date_to=date_to,
                sort_by=db_sort_by,
                sort_order=sort_order.lower(),  # Ensure lowercase
                category=category.lower() if category else None
            )
            
        return images
    except Exception as e:
        logger.error(f"Error fetching images: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch images")

@router.get("/images/{image_id}", response_model=ImageResponse)
async def get_image(image_id: str, db=Depends(get_db)):
    try:
        image = await db.get_image(image_id)
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
        return image
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching image {image_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch image")

@router.get("/stats", response_model=StatsResponse)
async def get_stats(db=Depends(get_db)):
    try:
        stats = await db.get_stats()
        return StatsResponse(**stats)
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch stats")

@router.get("/scrape/{task_id}", response_model=ScrapeResponse)
async def get_scrape_status(task_id: str):
    if task_id not in scraping_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    task = scraping_tasks[task_id]
    return ScrapeResponse(
        task_id=task_id,
        status=task["status"],
        message=task["message"]
    ) 