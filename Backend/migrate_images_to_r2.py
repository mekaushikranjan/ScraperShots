import os
import asyncio
from app.cloudflare_r2 import upload_image_to_r2
from app.database import Database
from app.models import ImageCreate
from datetime import datetime
from urllib.parse import urljoin

IMAGES_DIR = os.path.join(os.path.dirname(__file__), 'images')

async def migrate_images():
    db = Database()
    await db.connect_to_database()
    migrated = 0
    skipped = 0
    for filename in os.listdir(IMAGES_DIR):
        if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        file_path = os.path.join(IMAGES_DIR, filename)
        # Use filename as title, remove extension
        title = os.path.splitext(filename)[0]
        # Use R2 object name as unique key
        object_name = filename
        # Upload to R2
        try:
            r2_url = upload_image_to_r2(file_path, object_name)
        except Exception as e:
            print(f"Failed to upload {filename} to R2: {e}")
            continue
        # Check if already in DB by r2_url
        existing = await db.images.find_one({"r2_url": r2_url})
        if existing:
            print(f"Already in DB: {filename}")
            skipped += 1
            continue
        # Compose minimal metadata
        image_create = ImageCreate(
            title=title,
            image_url=r2_url,  # Use R2 URL as image_url for legacy
            source_url=r2_url, # No original source, so use R2 URL
            tags=[],
            scraped_at=datetime.utcnow(),
            category=None,
            r2_url=r2_url
        )
        try:
            await db.create_image(image_create)
            print(f"Migrated: {filename}")
            migrated += 1
        except Exception as e:
            print(f"Failed to save {filename} to DB: {e}")
            continue
    print(f"Migration complete. Migrated: {migrated}, Skipped: {skipped}")
    await db.close_database_connection()

if __name__ == "__main__":
    asyncio.run(migrate_images()) 