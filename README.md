# BH-app

## Overview

This is a full-stack application with a React frontend and Node.js/Express backend, containerized with Docker and orchestrated with Docker Compose.

## Architecture

```
┌─────────────┐
│  Frontend   │ (React + Vite + Nginx)
│  :80        │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Backend    │ (Node.js + Express)
│  :5000      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Database   │ (PostgreSQL)
│  :5432      │
└─────────────┘
```

## Dockerization System

### Why Docker?

- **Consistency**: Same environment across development and production
- **Isolation**: Dependencies are containerized, no conflicts
- **Portability**: Runs anywhere Docker is installed
- **Scalability**: Easy to scale with Docker Compose or Kubernetes

### Docker Compose Services

#### 1. Backend (`bh-backend`)

**Dockerfile Features:**
- **Multi-stage build**: Smaller final image by separating build and runtime
- **Alpine Linux**: Lightweight base image (~50MB vs ~900MB for standard Node)
- **Production-only dependencies**: `npm ci --only=production` reduces attack surface
- **Non-root user**: Runs as `nodejs` user for security
- **Health check**: Monitors `/api/health` endpoint every 30s

**Configuration:**
```yaml
ports:
  - "5000:5000"
environment:
  - NODE_ENV=production
  - DATABASE_URL=postgresql://postgres:postgres@db:5432/bh_app
```

#### 2. Frontend (`bh-frontend`)

**Dockerfile Features:**
- **Multi-stage build**: Build with Node.js, serve with Nginx
- **Production build**: `npm run build` creates optimized static files
- **Nginx Alpine**: Lightweight web server (~10MB)
- **Static serving**: No Node.js runtime needed in production

**Nginx Configuration (`nginx.conf`):**
- **Gzip compression**: Reduces file sizes by 60-80%
- **Static caching**: Assets cached for 1 year for faster loads
- **SPA routing**: `try_files` handles client-side routing
- **Security headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection

**Configuration:**
```yaml
ports:
  - "80:80"
```

#### 3. Database (`bh-db`)

**Features:**
- **PostgreSQL 15 Alpine**: Lightweight database image
- **Persistent volume**: Data survives container restarts
- **Health check**: `pg_isready` ensures database is ready before backend starts

**Configuration:**
```yaml
ports:
  - "5432:5432"
volumes:
  - postgres_data:/var/lib/postgresql/data
```

## Nginx System

### Why Nginx for Frontend?

1. **Performance**: Serves static files 10x faster than Node.js
2. **Security**: No Node.js runtime exposed in production
3. **Compression**: Built-in gzip reduces bandwidth
4. **Caching**: Browser caching for static assets
5. **SSL-ready**: Easy to add HTTPS with Let's Encrypt

### Nginx Configuration Breakdown

```nginx
server {
    listen 80;                          # Listen on port 80
    root /usr/share/nginx/html;         # Serve from dist folder
    index index.html;                   # Default file

    # Gzip compression
    gzip on;                            # Enable gzip
    gzip_types text/css application/json;  # Compress these types

    location / {
        try_files $uri $uri/ /index.html;  # SPA routing
    }

    # Cache static assets for 1 year
    location ~* \.(js|css|png|jpg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
}
```

### Build Process

```
Stage 1 (Builder):
  Node.js → npm ci → npm run build → dist/

Stage 2 (Production):
  Nginx Alpine → Copy dist/ → Serve static files
```

## Getting Started

### Prerequisites

- Docker installed
- Docker Compose installed

### Running the Application

```bash
# Build and start all services
docker-compose up --build

# Or in detached mode
docker-compose up -d --build
```

### Access Points

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

### Stopping the Application

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

## Development vs Production

### Development (Local)

```bash
# Backend
cd server
npm install
npm run dev

# Frontend
cd client
npm install
npm run dev
```

### Production (Docker)

```bash
docker-compose up --build
```

## Docker Ignore Files

### `.dockerignore` Purpose

Excludes unnecessary files from Docker build context:
- `node_modules` - Rebuilt in container
- `.git` - Not needed in container
- `.env` - Use environment variables instead
- `*.log` - Log files not needed
- `dist` - Rebuilt in container

Benefits:
- Faster builds (smaller context)
- Smaller images
- Avoids caching issues

## Environment Variables

### Backend Environment Variables

Set in `docker-compose.yaml`:
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://postgres:postgres@db:5432/bh_app`

### Frontend Environment Variables

Set in `docker-compose.yaml`:
- `NODE_ENV=production`

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Rebuild without cache
docker-compose build --no-cache
```

### Database connection errors

```bash
# Check database health
docker-compose exec db pg_isready -U postgres

# Restart database
docker-compose restart db
```

### Port already in use

```bash
# Change ports in docker-compose.yaml
ports:
  - "5001:5000"  # Backend on 5001
  - "8080:80"    # Frontend on 8080
```

## Security Best Practices Implemented

1. **Non-root user**: Backend runs as non-root user
2. **Alpine images**: Smaller attack surface
3. **Production dependencies**: Only production packages installed
4. **Security headers**: Nginx adds security headers
5. **Health checks**: Container health monitoring
6. **Network isolation**: Services on dedicated network

## Performance Optimizations

1. **Multi-stage builds**: Smaller images
2. **Alpine Linux**: Smaller base images
3. **Gzip compression**: Reduced bandwidth
4. **Static caching**: Faster repeat visits
5. **Production-only deps**: Smaller attack surface

## Maintenance

### Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Database Backups

```bash
# Backup
docker-compose exec db pg_dump -U postgres bh_app > backup.sql

# Restore
docker-compose exec -T db psql -U postgres bh_app < backup.sql
```

## License

[Your License Here]