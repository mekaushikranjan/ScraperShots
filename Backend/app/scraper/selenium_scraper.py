import asyncio
import random
import logging
from typing import List, Dict, Optional, Set
from urllib.parse import urljoin, urlparse
import aiohttp
import aiofiles
import os
from datetime import datetime
import hashlib
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from ..config import settings
from ..models import ImageCreate, ImageResponse
from ..database import Database
from ..cloudflare_r2 import upload_image_bytes_to_r2

logger = logging.getLogger(__name__)

class SeleniumScraper:
    def __init__(self):
        self.db = Database()
        self.session = aiohttp.ClientSession()
        self.driver = None
        
        # List of popular image websites with their selectors
        self.image_websites = [
            {
                "url": "https://unsplash.com/s/photos/{category}",
                "img_selector": "img[src*='images.unsplash.com'], img[src*='photo']",
                "title_selector": "img[src*='images.unsplash.com'], img[src*='photo']",
                "tag_selector": "a[href*='/s/photos/'], a[href*='/tags/']"
            },
            {
                "url": "https://www.pexels.com/search/{category}/",
                "img_selector": "img[src*='pexels.com'], img[src*='photo']",
                "title_selector": "img[src*='pexels.com'], img[src*='photo']",
                "tag_selector": "a[href*='/search/'], a[href*='/tag/']"
            },
            {
                "url": "https://pixabay.com/images/search/{category}/",
                "img_selector": "img[src*='pixabay.com'], img[src*='photo']",
                "title_selector": "img[src*='pixabay.com'], img[src*='photo']",
                "tag_selector": "a[href*='/images/search/'], a[href*='/tags/']"
            },
            {
                "url": "https://www.freepik.com/search?format=search&query={category}",
                "img_selector": "img[src*='freepik.com'], img[src*='image']",
                "title_selector": "img[src*='freepik.com'], img[src*='image']",
                "tag_selector": "a[href*='/search/'], a[href*='/tag/']"
            },
            {
                "url": "https://www.rawpixel.com/search/{category}",
                "img_selector": "img[src*='rawpixel.com'], img[src*='image']",
                "title_selector": "img[src*='rawpixel.com'], img[src*='image']",
                "tag_selector": "a[href*='/search/'], a[href*='/tag/']"
            }
        ]

    def setup_driver(self):
        """Set up the Chrome WebDriver with headless options."""
        try:
            chrome_options = Options()
            chrome_options.add_argument("--headless=new")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--disable-software-rasterizer")
            chrome_options.add_argument("--disable-extensions")
            chrome_options.add_argument("--disable-notifications")
            chrome_options.add_argument("--disable-popup-blocking")
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_argument("--disable-web-security")
            chrome_options.add_argument("--allow-running-insecure-content")
            chrome_options.add_argument("--ignore-certificate-errors")
            chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            
            # Add experimental options
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option("useAutomationExtension", False)
            
            # Set page load strategy
            chrome_options.page_load_strategy = "eager"
            
            # Set up service with explicit port
            import socket
            def find_free_port():
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(('', 0))
                    return s.getsockname()[1]
            
            port = find_free_port()
            service = Service(port=port)
            service.keep_alive = True
            
            # Create driver with retry logic
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    self.driver = webdriver.Chrome(service=service, options=chrome_options)
                    self.driver.set_page_load_timeout(30)
                    self.driver.set_script_timeout(30)
                    
                    # Execute CDP commands to prevent detection
                    self.driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
                        "source": """
                            Object.defineProperty(navigator, 'webdriver', {
                                get: () => undefined
                            });
                            window.navigator.chrome = {
                                runtime: {}
                            };
                        """
                    })
                    
                    logger.info(f"Successfully initialized Chrome WebDriver on port {port}")
                    return
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    logger.warning(f"Failed to initialize WebDriver (attempt {attempt + 1}): {str(e)}")
                    asyncio.sleep(2)
            
        except Exception as e:
            logger.error(f"Error setting up Chrome WebDriver: {str(e)}")
            raise

    async def ensure_driver_connection(self):
        """Ensure WebDriver connection is active, reconnect if needed."""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Try a simple command to check connection
                self.driver.current_url
                return
            except Exception as e:
                if attempt == max_retries - 1:
                    logger.error(f"Failed to maintain WebDriver connection after {max_retries} attempts: {str(e)}")
                    raise
                logger.warning(f"WebDriver connection lost (attempt {attempt + 1}), attempting to reconnect...")
                if self.driver:
                    try:
                        self.driver.quit()
                    except:
                        pass
                asyncio.sleep(2)
                self.setup_driver()

    async def wait_for_element(self, selector: str, timeout: int = 10) -> bool:
        """Wait for an element to be present on the page."""
        try:
            await self.ensure_driver_connection()
            
            # First wait for page to be ready
            WebDriverWait(self.driver, timeout).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            
            # Then wait for the element
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            
            # Additional wait for images to load
            await asyncio.sleep(2)
            
            return True
        except Exception as e:
            logger.warning(f"Timeout waiting for element {selector}: {str(e)}")
            return False

    async def get_random_website(self, category: str) -> Dict:
        """Get a random website configuration for the given category."""
        website_config = random.choice(self.image_websites)
        website_config["url"] = website_config["url"].format(category=category.replace(" ", "-"))
        return website_config

    async def extract_image_data(self, img_element, website_config: Dict, category: str, source_url: str) -> Optional[Dict]:
        try:
            # Extract image URL
            image_url = img_element.get_attribute("src") or img_element.get_attribute("data-src")
            if not image_url:
                return None

            # Make URL absolute if it's relative
            if not image_url.startswith(('http://', 'https://')):
                image_url = urljoin(source_url, image_url)

            # Generate a unique ID for the image based on its URL
            image_id = hashlib.md5(image_url.encode()).hexdigest()

            # Extract title/alt text
            title = img_element.get_attribute("alt") or img_element.get_attribute("title") or "Untitled"
            
            # Add category to title if not present
            if category.lower() not in title.lower():
                title = f"{category} - {title}"

            # Get image dimensions
            width = img_element.get_attribute("width")
            height = img_element.get_attribute("height")

            # Parse dimensions
            def parse_dimension(dim):
                if not dim:
                    return 0
                try:
                    return int(str(dim).replace('px', ''))
                except (ValueError, AttributeError):
                    return 0

            width = parse_dimension(width)
            height = parse_dimension(height)

            # Skip small images (likely icons or UI elements)
            if width < 100 or height < 100:
                return None

            # Extract tags
            tags = [category]  # Add main category as first tag
            
            # Try to find parent elements with tags
            try:
                parent = img_element.find_element(By.XPATH, ".//ancestor::*[contains(@class, 'tag') or contains(@class, 'category') or contains(@class, 'label')]")
                tag_text = parent.text.strip()
                if tag_text and tag_text.lower() not in [t.lower() for t in tags]:
                    tags.append(tag_text)
            except:
                pass

            return {
                "id": image_id,
                "title": title,
                "image_url": image_url,
                "source_url": source_url,
                "tags": tags,
                "width": width,
                "height": height,
                "scraped_at": datetime.utcnow().isoformat(),
                "category": category
            }
        except Exception as e:
            logger.error(f"Error extracting image data: {str(e)}")
            return None

    async def download_image(self, image_url: str, title: str) -> Optional[bytes]:
        try:
            async with self.session.get(image_url) as response:
                if response.status == 200:
                    return await response.read()
        except Exception as e:
            logger.error(f"Error downloading image {image_url}: {str(e)}")
        return None

    async def scrape_images(self, category: str, max_images: int = 100, url: Optional[str] = None) -> List[ImageResponse]:
        try:
            self.setup_driver()
            saved_images = []
            processed_ids = set()  # Keep track of processed image IDs
            
            # Complete category mapping with all categories
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
            
            # Get search terms for the category
            category_info = category_mapping.get(category.lower(), {
                "subcategories": [category.lower()],
                "related": []
            })
            
            # Combine main category, subcategories, and related terms
            search_terms = [category.lower()] + category_info["subcategories"] + category_info["related"]
            search_terms = list(set(search_terms))  # Remove duplicates
            
            # Try each search term
            for search_term in search_terms:
                if len(saved_images) >= max_images:
                    break
                    
                # Try each website for this search term
                for website_config in self.image_websites:
                    if len(saved_images) >= max_images:
                        break
                        
                    try:
                        # Format URL with search term
                        search_url = website_config["url"].format(category=search_term.replace(" ", "-"))
                        logger.info(f"Scraping from {search_url} for term '{search_term}'")
                        
                        # Load page with retry
                        max_retries = 3
                        for retry in range(max_retries):
                            try:
                                await self.ensure_driver_connection()
                                self.driver.get(search_url)
                                
                                # Wait for page to load
                                if not await self.wait_for_element(website_config['img_selector']):
                                    if retry == max_retries - 1:
                                        raise Exception("Failed to find image elements")
                                    continue
                                
                                # Scroll to load more images
                                for _ in range(3):
                                    self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                                    await asyncio.sleep(2)
                                
                                # Find all image elements
                                img_elements = self.driver.find_elements(By.CSS_SELECTOR, website_config['img_selector'])
                                logger.info(f"Found {len(img_elements)} images on {search_url}")
                                
                                if not img_elements:
                                    if retry == max_retries - 1:
                                        raise Exception("No images found")
                                    continue
                                
                                break  # Successfully found images
                                
                            except Exception as e:
                                if retry == max_retries - 1:
                                    raise
                                logger.warning(f"Retry {retry + 1} for {search_url}: {str(e)}")
                                await asyncio.sleep(2)
                        
                        for img_element in img_elements:
                            if len(saved_images) >= max_images:
                                break
                                
                            try:
                                image_data = await self.extract_image_data(img_element, website_config, category, search_url)
                                if image_data and image_data["id"] not in processed_ids:
                                    processed_ids.add(image_data["id"])
                                    
                                    # Check if image already exists in database
                                    existing_image = await self.db.get_image_by_url(image_data["image_url"])
                                    if existing_image:
                                        logger.info(f"Image already exists: {image_data['title']}")
                                        continue
                                    
                                    # Download image
                                    image_bytes = await self.download_image(image_data["image_url"], image_data["title"])
                                    if image_bytes:
                                        # Generate a unique object name for R2
                                        import uuid
                                        object_name = f"{uuid.uuid4().hex}_{image_data['title'].replace(' ', '_')[:50]}.jpg"
                                        r2_url = await upload_image_bytes_to_r2(image_bytes, object_name)
                                        # Create ImageCreate object with R2 URL as image_url
                                        image_create = ImageCreate(
                                            title=image_data["title"],
                                            image_url=r2_url,  # Store only R2 URL as image_url
                                            source_url=image_data["image_url"],  # Store original as source_url
                                            tags=image_data["tags"],
                                            scraped_at=image_data["scraped_at"],
                                            category=category,
                                            r2_url=r2_url
                                        )
                                        # Save to database
                                        try:
                                            saved_image = await self.db.create_image(image_create)
                                            if saved_image:
                                                logger.info(f"Successfully saved image to database: {saved_image.title}")
                                                saved_images.append(saved_image)
                                            else:
                                                logger.warning(f"Failed to save image to database: {image_data['title']}")
                                        except Exception as db_error:
                                            logger.error(f"Database error while saving image: {str(db_error)}")
                            except Exception as e:
                                logger.error(f"Error processing image: {str(e)}")
                                continue
                                
                    except Exception as e:
                        logger.error(f"Error scraping from {website_config['url']}: {str(e)}")
                        continue

            logger.info(f"Successfully downloaded {len(saved_images)} images for category '{category}'")
            return saved_images

        except Exception as e:
            logger.error(f"Error during scraping: {str(e)}")
            return []
        finally:
            if self.driver:
                try:
                    self.driver.quit()
                except:
                    pass
            await self.session.close() 