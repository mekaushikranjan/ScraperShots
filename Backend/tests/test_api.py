import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from app.main import app
from app.database import db
import mongomock

client = TestClient(app)

@pytest.fixture
def mock_db():
    db.client = mongomock.MongoClient()
    db.db = db.client.db
    return db

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Image Scraper API"}

def test_start_scraping():
    response = client.post(
        "/api/v1/scrape",
        json={
            "query": "test",
            "max_images": 10,
            "tags": ["test"]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "task_id" in data
    assert data["status"] == "running"

def test_get_images_empty(mock_db):
    response = client.get("/api/v1/images")
    assert response.status_code == 200
    assert response.json() == []

def test_get_stats_empty(mock_db):
    response = client.get("/api/v1/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_images"] == 0
    assert data["top_tags"] == []
    assert data["source_breakdown"] == []

def test_get_nonexistent_image():
    response = client.get("/api/v1/images/nonexistent")
    assert response.status_code == 404
    assert response.json()["detail"] == "Image not found"

def test_get_nonexistent_task():
    response = client.get("/api/v1/scrape/nonexistent")
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found" 