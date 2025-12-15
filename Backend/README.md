# Image Scraper API

A production-ready backend application for scraping and managing images from dynamic websites using FastAPI, Selenium, and MongoDB.

## Features

- Dynamic web scraping with Selenium WebDriver
- Asynchronous image downloading and processing
- MongoDB database integration
- RESTful API endpoints
- Background task management
- Static file serving
- Comprehensive error handling and logging
- CORS support for frontend integration
- Configurable scraping parameters

## Prerequisites

- Python 3.8+
- MongoDB
- Chrome or Firefox browser (for Selenium)
- ChromeDriver or GeckoDriver

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory with the following variables:
```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=image_scraper
SELENIUM_HEADLESS=true
SELENIUM_TIMEOUT=30

SELENIUM_SCROLL_DELAY=1.0
IMAGE_STORAGE_PATH=images
MAX_IMAGES_PER_SCRAPE=100
LOG_LEVEL=INFO
LOG_FILE=app.log
```

## Running the Application

1. Start MongoDB:
```bash
mongod
```

2. Run the FastAPI application:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the application is running, you can access:
- Swagger UI documentation: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

## API Endpoints

### POST /api/v1/scrape
Start a new scraping task.

Request body:
```json
{
    "query": "nature",
    "max_images": 50,
    "tags": ["landscape", "mountains"]
}
```

### GET /api/v1/images
Get paginated list of images with optional filters.

Query parameters:
- search: Filter by title/tags
- source: Filter by source URL
- date_from, date_to: Filter by date range
- sort_by: Sort field (default: scraped_at)
- sort_order: Sort direction (-1 for desc, 1 for asc)
- page: Page number (default: 1)
- limit: Items per page (default: 10)

### GET /api/v1/images/{image_id}
Get details of a specific image.

### GET /api/v1/stats
Get scraping statistics.

### GET /api/v1/scrape/{task_id}
Get status of a scraping task.

## Development

### Running Tests
```bash
pytest
```

### Code Style
The project follows PEP 8 guidelines. Use a linter like `flake8` to check code style:
```bash
flake8 app tests
```

## Production Deployment

For production deployment:

1. Set appropriate environment variables
2. Use a production-grade ASGI server like Gunicorn:
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```
3. Set up a reverse proxy (e.g., Nginx)
4. Configure proper logging and monitoring
5. Use a production MongoDB instance
6. Consider using Redis for task queue management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 