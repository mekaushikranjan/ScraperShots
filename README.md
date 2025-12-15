# ScraperShorts

A full-stack application for scraping, managing, and displaying images from dynamic websites. Built with FastAPI backend, Next.js frontend, MongoDB database, and Cloudflare R2 storage.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Features](#features)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Project Overview

ScraperShorts is a comprehensive web scraping and image management platform designed to:

- Dynamically scrape images from websites using Selenium WebDriver
- Store and manage scraped images efficiently in MongoDB
- Upload images to Cloudflare R2 for CDN delivery
- Provide a RESTful API for image operations
- Display images in an interactive Next.js frontend with advanced filtering and search capabilities
- Support user authentication and personalized galleries
- Generate statistics and analytics about scraped content

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI 0.104.1
- **Server:** Uvicorn 0.24.0
- **Web Scraping:** Selenium 4.15.2
- **Database:** MongoDB with Motor 3.3.2 (async driver)
- **Validation:** Pydantic 2.4.2
- **Cloud Storage:** Cloudflare R2
- **Authentication:** Python-Jose with JWT, Passlib with Bcrypt
- **HTTP Client:** HTTPX 0.25.1
- **Logging:** Loguru 0.7.2
- **Testing:** Pytest 7.4.3, Pytest-asyncio, Pytest-cov

### Frontend
- **Framework:** Next.js 15.2.4
- **UI Library:** React 19
- **Styling:** Tailwind CSS
- **Component Library:** Radix UI
- **Type Safety:** TypeScript
- **State Management:** React Context API
- **Form Handling:** React Hook Form
- **Icons:** Lucide React
- **Theme Management:** Next-themes

### Infrastructure
- **Database:** MongoDB
- **Object Storage:** Cloudflare R2
- **Web Server:** FastAPI/Uvicorn

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│        ┌──────────────────────────────────────────┐         │
│        │  - Image Gallery with filtering          │         │
│        │  - User Authentication                    │         │
│        │  - Search & Navigation                    │         │
│        │  - Theme Support                          │         │
│        └──────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                          │
                    HTTP API (REST)
                          │
┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                         │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │  API Routes     │  │   Scraper Engine                 │  │
│  │  - Images CRUD  │  │  - Selenium WebDriver            │  │
│  │  - Auth         │  │  - BeautifulSoup parsing         │  │
│  │  - Stats        │  │  - Dynamic page handling         │  │
│  │  - Search       │  │  - Image download & processing   │  │
│  └─────────────────┘  └──────────────────────────────────┘  │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │  Cloud Storage  │  │   Database Layer                 │  │
│  │  - Cloudflare R2│  │  - MongoDB connection            │  │
│  │  - Upload/Sync  │  │  - Async queries                 │  │
│  └─────────────────┘  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                                   │
    ┌────▼──────┐                  ┌────────▼────┐
    │ Cloudflare│                  │  MongoDB    │
    │    R2     │                  │             │
    └───────────┘                  └─────────────┘
```

## 📂 Project Structure

```
ScraperShorts/
├── Backend/                          # FastAPI backend application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app initialization
│   │   ├── config.py                # Configuration & settings
│   │   ├── database.py              # MongoDB connection & queries
│   │   ├── models.py                # Pydantic data models
│   │   ├── cloudflare_r2.py        # R2 storage integration
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py            # API endpoint definitions
│   │   └── scraper/
│   │       ├── __init__.py
│   │       ├── base_scraper.py      # Abstract base scraper class
│   │       └── selenium_scraper.py  # Selenium implementation
│   ├── tests/
│   │   └── test_api.py              # API unit tests
│   ├── images/                      # Local image storage
│   ├── migrate_images_to_r2.py      # Migration script
│   ├── delete_all_r2_images.py      # Cleanup script
│   ├── requirements.txt             # Python dependencies
│   └── README.md                    # Backend documentation
│
└── Frontend/                         # Next.js frontend application
    ├── app/
    │   ├── layout.tsx               # Root layout
    │   ├── page.tsx                 # Home page
    │   ├── loading.tsx              # Loading state
    │   ├── globals.css              # Global styles
    │   └── scrape/
    │       └── page.tsx             # Scraping interface
    ├── components/
    │   ├── category-nav.tsx         # Category navigation
    │   ├── filter-dropdown.tsx       # Filter controls
    │   ├── image-card.tsx           # Image display card
    │   ├── image-gallery.tsx        # Gallery grid
    │   ├── image-modal.tsx          # Image details modal
    │   ├── login-modal.tsx          # Login form
    │   ├── signup-modal.tsx         # Registration form
    │   ├── search-bar.tsx           # Search interface
    │   ├── sidebar.tsx              # Navigation sidebar
    │   ├── stats-panel.tsx          # Statistics display
    │   ├── theme-toggle.tsx         # Dark/light mode
    │   ├── gallery-context.tsx      # Global state management
    │   └── ui/                      # Shadcn/ui components
    ├── hooks/
    │   ├── useImages.ts             # Custom hook for image operations
    │   ├── useScraper.ts            # Custom hook for scraping
    │   ├── use-media-query.ts       # Responsive design
    │   ├── use-mobile.tsx           # Mobile detection
    │   └── use-toast.ts             # Toast notifications
    ├── lib/
    │   ├── api-config.ts            # API configuration
    │   ├── api-service.ts           # API client wrapper
    │   └── utils.ts                 # Utility functions
    ├── public/                      # Static assets
    ├── styles/                      # Additional stylesheets
    ├── package.json                 # NPM dependencies
    ├── next.config.mjs              # Next.js configuration
    ├── tailwind.config.ts           # Tailwind CSS config
    ├── tsconfig.json                # TypeScript configuration
    └── components.json              # Shadcn/ui config
```

## 📦 Prerequisites

### System Requirements
- **Node.js:** 18.x or higher
- **Python:** 3.8 or higher
- **MongoDB:** 4.x or higher
- **Browser:** Chrome or Firefox (for Selenium)
- **Cloudflare Account:** For R2 storage (optional)

### Environment Variables
Before running the application, ensure you have:
- MongoDB URI
- Cloudflare R2 credentials (if using cloud storage)
- CORS origins configuration
- API configuration details

## 🚀 Installation & Setup

### Clone the Repository

```bash
git clone <repository-url>
cd ScraperShorts
```

## 🔧 Backend Setup

### 1. Create Virtual Environment

```bash
cd Backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Create `.env` File

Create a `.env` file in the `Backend/` directory:

```env
# Application
APP_NAME=ScraperShorts
DEBUG=False
ENVIRONMENT=development
API_V1_STR=/api/v1

# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=scrapershorts

# Selenium
SELENIUM_HEADLESS=true
SELENIUM_TIMEOUT=30
SELENIUM_SCROLL_DELAY=1.0
SELENIUM_DRIVER_PATH=/path/to/chromedriver  # Optional

# Image Storage
IMAGE_STORAGE_PATH=images
MAX_IMAGES_PER_SCRAPE=100

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=scrapershorts
R2_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]

# Logging
LOG_LEVEL=INFO
LOG_FILE=app.log
```

### 4. Install WebDriver

Download the appropriate webdriver:
- **Chrome:** [ChromeDriver](https://chromedriver.chromium.org/)
- **Firefox:** [GeckoDriver](https://github.com/mozilla/geckodriver)

### 5. Start MongoDB

```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use your local MongoDB installation
```

### 6. Run Backend Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd Frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create `.env.local` File

Create a `.env.local` file in the `Frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_IMAGE_BASE_URL=http://localhost:8000/images
```

### 4. Run Development Server

```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
npm start
```

## ⚙️ Configuration

### Backend Configuration (`Backend/app/config.py`)

| Setting | Default | Description |
|---------|---------|-------------|
| `APP_NAME` | ScraperShorts | Application name |
| `DEBUG` | False | Debug mode toggle |
| `ENVIRONMENT` | development | Environment (development/production) |
| `MONGODB_URL` | mongodb://localhost:27017 | MongoDB connection string |
| `MONGODB_DB_NAME` | scrapershorts | Database name |
| `SELENIUM_HEADLESS` | True | Run browser headless |
| `SELENIUM_TIMEOUT` | 30 | Timeout for page loads (seconds) |
| `SELENIUM_SCROLL_DELAY` | 1.0 | Delay between scroll actions |
| `MAX_IMAGES_PER_SCRAPE` | 100 | Maximum images per scrape task |
| `CORS_ORIGINS` | ["http://localhost:3000"] | Allowed origins |

### Frontend Configuration

Environment variables in `Frontend/.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_IMAGE_BASE_URL` | Image storage base URL |

## 📡 API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Main Endpoints

#### Image Management

**GET** `/images`
- Retrieve all images with filtering and pagination
- Query Parameters:
  - `skip`: Offset (default: 0)
  - `limit`: Items per page (default: 10)
  - `category`: Filter by category
  - `tags`: Filter by tags (comma-separated)
  - `search`: Full-text search

**GET** `/images/{image_id}`
- Get single image details

**POST** `/images`
- Create image manually
- Body: `ImageCreate` schema

**PUT** `/images/{image_id}`
- Update image metadata

**DELETE** `/images/{image_id}`
- Delete image

#### Scraping

**POST** `/scrape`
- Start background scraping task
- Body:
  ```json
  {
    "category": "nature",
    "max_images": 50,
    "url": "https://example.com",
    "tags": ["landscape", "outdoor"]
  }
  ```
- Response:
  ```json
  {
    "task_id": "uuid",
    "status": "processing",
    "message": "Scraping started"
  }
  ```

**GET** `/scrape/status/{task_id}`
- Get scraping task status

#### Statistics

**GET** `/stats`
- Get overall statistics
- Returns:
  ```json
  {
    "total_images": 1000,
    "top_tags": [{"tag": "nature", "count": 250}],
    "source_breakdown": [{"source": "site.com", "count": 500}],
    "last_scraped": "2024-01-15T10:30:00"
  }
  ```

#### Search

**GET** `/search`
- Full-text search across images
- Query Parameters:
  - `q`: Search query
  - `limit`: Results limit

#### Cloud Storage

**POST** `/upload-to-r2/{image_id}`
- Upload image to Cloudflare R2

**GET** `/r2-url/{image_id}`
- Get R2 CDN URL for image

## 🎨 Features

### Backend Features
- ✅ Dynamic web scraping with Selenium
- ✅ Asynchronous image downloading
- ✅ MongoDB integration with async driver
- ✅ RESTful API with comprehensive endpoints
- ✅ Background task management
- ✅ JWT authentication (prepared)
- ✅ Image processing and optimization
- ✅ Cloudflare R2 integration
- ✅ Comprehensive error handling
- ✅ Structured logging with loguru
- ✅ CORS support
- ✅ Data validation with Pydantic

### Frontend Features
- ✅ Responsive image gallery
- ✅ Advanced filtering (category, tags)
- ✅ Full-text search
- ✅ Dark/Light theme support
- ✅ Image modal with detailed view
- ✅ Mobile-responsive design
- ✅ User authentication UI
- ✅ Statistics dashboard
- ✅ Manual scraping interface
- ✅ Toast notifications
- ✅ Loading states
- ✅ Accessibility support (Radix UI)

## 📊 Database Schema

### Images Collection

```javascript
{
  _id: ObjectId,
  title: String,
  image_url: String,
  source_url: String,
  local_path: String,
  r2_url: String,           // Cloudflare R2 URL
  category: String,
  tags: [String],
  scraped_at: DateTime,
  created_at: DateTime,
  updated_at: DateTime,
  metadata: {
    width: Number,
    height: Number,
    size: Number,
    format: String
  }
}
```

### Indexes
```javascript
// Recommended indexes for performance
db.images.createIndex({ category: 1 })
db.images.createIndex({ tags: 1 })
db.images.createIndex({ scraped_at: -1 })
db.images.createIndex({ title: "text", tags: "text" })
```

## 🚢 Deployment

### Docker Deployment (Recommended)

#### Backend Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY public ./public

CMD ["npm", "start"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./Backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongodb:27017
      - ENVIRONMENT=production
    depends_on:
      - mongodb

  frontend:
    build: ./Frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000/api/v1

volumes:
  mongodb_data:
```

### Cloud Deployment

#### Vercel (Frontend)
1. Push code to GitHub
2. Import project on Vercel
3. Set environment variables
4. Deploy

#### Heroku/Railway (Backend)
1. Create Procfile:
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
2. Deploy using platform CLI

## 🔨 Development

### Local Development Environment

1. **Install additional dev tools:**
   ```bash
   pip install black flake8 isort
   npm install --save-dev prettier eslint
   ```

2. **Code formatting:**
   ```bash
   # Backend
   black Backend/
   isort Backend/
   
   # Frontend
   npm run lint
   prettier --write Frontend/
   ```

3. **Run with hot-reload:**
   ```bash
   # Backend
   uvicorn app.main:app --reload
   
   # Frontend
   npm run dev
   ```

### Project Setup for Contributors

```bash
# Clone repo
git clone <repo-url>
cd ScraperShorts

# Backend setup
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend setup
cd ../Frontend
npm install

# Create env files
# .env in Backend/ with MongoDB and Cloudflare credentials
# .env.local in Frontend/ with API URLs
```

## 🧪 Testing

### Backend Tests

```bash
cd Backend
pytest tests/ -v                    # Run all tests
pytest tests/test_api.py -v        # Run specific test file
pytest tests/ --cov                # With coverage report
pytest tests/ --cov --cov-report=html  # HTML coverage report
```

### Frontend Tests

```bash
cd Frontend
npm test                    # Run tests
npm run test:coverage      # With coverage
```

### Running Tests with Coverage

```bash
# Backend
pytest --cov=app --cov-report=html tests/

# Frontend (if configured)
npm test -- --coverage
```

## 📝 Maintenance Scripts

### Migrate Images to Cloudflare R2

```bash
python Backend/migrate_images_to_r2.py
```

Uploads all local images to Cloudflare R2 and updates database with R2 URLs.

### Delete All R2 Images

```bash
python Backend/delete_all_r2_images.py
```

⚠️ **Warning:** This permanently deletes all images from R2 bucket.

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```
Solution: Ensure MongoDB is running and MONGODB_URL is correct
docker run -d -p 27017:27017 mongo:latest
```

**Selenium WebDriver Issues**
```
Solution: Download correct chromedriver for your OS
export SELENIUM_DRIVER_PATH=/path/to/chromedriver
```

**CORS Errors in Frontend**
```
Solution: Add frontend URL to CORS_ORIGINS in .env
CORS_ORIGINS=["http://localhost:3000"]
```

**R2 Upload Failures**
```
Solution: Verify R2 credentials and bucket name
Check Cloudflare dashboard for correct credentials
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Selenium Documentation](https://selenium.dev/documentation/)
- [Cloudflare R2 Guide](https://developers.cloudflare.com/r2/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Support

For support, email support@scrapershorts.com or open an issue on GitHub.

## 🎯 Roadmap

- [ ] Advanced authentication (OAuth, social login)
- [ ] Real-time scraping progress via WebSocket
- [ ] Image recognition and auto-tagging
- [ ] Batch processing and scheduling
- [ ] Advanced analytics dashboard
- [ ] API rate limiting and quotas
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Scraper plugins system
- [ ] Performance optimization

---

**Last Updated:** December 2024  
**Version:** 1.0.0
