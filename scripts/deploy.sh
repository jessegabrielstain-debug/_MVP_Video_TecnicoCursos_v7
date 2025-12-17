#!/bin/bash

# 🚀 Production Deployment Script
# MVP Vídeos TécnicoCursos - Deploy Automation

set -euo pipefail

# ===========================================
# Configuration
# ===========================================

PROJECT_NAME="mvp-videos-tecnico-cursos"
DOCKER_REGISTRY="registry.digitalocean.com/tecnicocursos"
VERSION="${VERSION:-$(date +%Y%m%d_%H%M%S)}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ===========================================
# Utility Functions
# ===========================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# ===========================================
# Pre-deployment Checks
# ===========================================

check_requirements() {
    log "Checking deployment requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed or not in PATH"
    fi
    
    # Check environment file
    if [[ ! -f ".env.${ENVIRONMENT}" ]]; then
        error "Environment file .env.${ENVIRONMENT} not found"
    fi
    
    # Check if logged into registry
    if ! docker info | grep -q "Username:"; then
        warning "Not logged into Docker registry. Login may be required."
    fi
    
    success "All requirements satisfied"
}

# ===========================================
# Build & Test Phase
# ===========================================

run_tests() {
    log "Running test suite..."
    
    # Install dependencies if needed
    if [[ ! -d "estudio_ia_videos/node_modules" ]]; then
        log "Installing dependencies..."
        cd estudio_ia_videos && npm ci && cd ..
    fi
    
    # Run tests
    log "Executing tests..."
    cd estudio_ia_videos
    
    # Unit tests
    npm run test -- --coverage --passWithNoTests
    
    # Type checking
    npm run type-check
    
    # Linting
    npm run lint
    
    # Security audit (non-blocking)
    npm audit --audit-level moderate || warning "Security vulnerabilities detected"
    
    cd ..
    success "All tests passed"
}

build_images() {
    log "Building Docker images..."
    
    # Build main application
    log "Building main application image..."
    docker build \
        -f Dockerfile.production \
        -t "${DOCKER_REGISTRY}/app:${VERSION}" \
        -t "${DOCKER_REGISTRY}/app:latest" \
        --build-arg NODE_ENV=production \
        --build-arg BUILD_VERSION="${VERSION}" \
        .
    
    # Build worker
    log "Building worker image..."
    docker build \
        -f Dockerfile.worker \
        -t "${DOCKER_REGISTRY}/worker:${VERSION}" \
        -t "${DOCKER_REGISTRY}/worker:latest" \
        --build-arg NODE_ENV=production \
        .
    
    success "Images built successfully"
}

# ===========================================
# Security & Vulnerability Scanning
# ===========================================

scan_images() {
    log "Scanning images for vulnerabilities..."
    
    # Install trivy if not available
    if ! command -v trivy &> /dev/null; then
        log "Installing Trivy security scanner..."
        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
    fi
    
    # Scan main app image
    log "Scanning app image..."
    trivy image --exit-code 1 --severity HIGH,CRITICAL "${DOCKER_REGISTRY}/app:${VERSION}" || {
        warning "High/Critical vulnerabilities found in app image"
        read -p "Continue deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled due to security concerns"
        fi
    }
    
    # Scan worker image
    log "Scanning worker image..."
    trivy image --exit-code 1 --severity HIGH,CRITICAL "${DOCKER_REGISTRY}/worker:${VERSION}" || {
        warning "High/Critical vulnerabilities found in worker image"
        read -p "Continue deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled due to security concerns"
        fi
    }
    
    success "Security scan completed"
}

# ===========================================
# Registry Operations
# ===========================================

push_images() {
    log "Pushing images to registry..."
    
    # Push app image
    docker push "${DOCKER_REGISTRY}/app:${VERSION}"
    docker push "${DOCKER_REGISTRY}/app:latest"
    
    # Push worker image
    docker push "${DOCKER_REGISTRY}/worker:${VERSION}"
    docker push "${DOCKER_REGISTRY}/worker:latest"
    
    success "Images pushed to registry"
}

# ===========================================
# Database Migrations
# ===========================================

run_migrations() {
    log "Running database migrations..."
    
    # Copy environment file
    cp ".env.${ENVIRONMENT}" .env
    
    # Run setup script to ensure schema is up to date
    log "Executing database setup..."
    npm run setup:supabase
    
    # Run any pending migrations
    if [[ -f "scripts/run-migrations.js" ]]; then
        log "Running custom migrations..."
        node scripts/run-migrations.js
    fi
    
    success "Database migrations completed"
}

# ===========================================
# Deployment Phase
# ===========================================

deploy_services() {
    log "Deploying services..."
    
    # Create deployment directory
    DEPLOY_DIR="/opt/mvp-videos"
    sudo mkdir -p "${DEPLOY_DIR}"
    
    # Copy configuration files
    sudo cp docker-compose.prod.yml "${DEPLOY_DIR}/"
    sudo cp -r nginx "${DEPLOY_DIR}/"
    sudo cp ".env.${ENVIRONMENT}" "${DEPLOY_DIR}/.env"
    
    # Update version in environment
    sudo sed -i "s/IMAGE_VERSION=.*/IMAGE_VERSION=${VERSION}/g" "${DEPLOY_DIR}/.env"
    
    cd "${DEPLOY_DIR}"
    
    # Pull latest images
    log "Pulling latest images..."
    sudo docker-compose -f docker-compose.prod.yml pull
    
    # Stop existing services gracefully
    log "Stopping existing services..."
    sudo docker-compose -f docker-compose.prod.yml down --remove-orphans
    
    # Start services
    log "Starting services..."
    sudo docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_service_health
    
    success "Services deployed successfully"
}

# ===========================================
# Health Checks
# ===========================================

check_service_health() {
    log "Checking service health..."
    
    # Check main app
    for i in {1..30}; do
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            success "Main application is healthy"
            break
        fi
        if [[ $i -eq 30 ]]; then
            error "Main application failed health check"
        fi
        sleep 2
    done
    
    # Check Redis
    if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | grep -q PONG; then
        success "Redis is healthy"
    else
        error "Redis health check failed"
    fi
    
    # Check worker
    if docker-compose -f docker-compose.prod.yml ps worker | grep -q "Up"; then
        success "Worker is running"
    else
        error "Worker health check failed"
    fi
}

# ===========================================
# Cleanup
# ===========================================

cleanup() {
    log "Cleaning up old images..."
    
    # Remove old images (keep last 3 versions)
    docker images "${DOCKER_REGISTRY}/app" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
        tail -n +4 | head -n -3 | awk '{print $1}' | xargs -r docker rmi
    
    docker images "${DOCKER_REGISTRY}/worker" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
        tail -n +4 | head -n -3 | awk '{print $1}' | xargs -r docker rmi
    
    # Clean up unused volumes
    docker volume prune -f
    
    success "Cleanup completed"
}

# ===========================================
# Main Deployment Flow
# ===========================================

main() {
    log "Starting deployment process for ${PROJECT_NAME} v${VERSION}"
    log "Environment: ${ENVIRONMENT}"
    
    # Pre-deployment
    check_requirements
    
    # Build & Test
    run_tests
    build_images
    scan_images
    
    # Registry operations
    push_images
    
    # Database operations
    run_migrations
    
    # Deploy
    deploy_services
    
    # Cleanup
    cleanup
    
    success "🚀 Deployment completed successfully!"
    log "Application URL: https://tecnicocursos.com"
    log "Version: ${VERSION}"
    log "Logs: docker-compose -f ${DEPLOY_DIR}/docker-compose.prod.yml logs -f"
}

# ===========================================
# Script Execution
# ===========================================

# Help message
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --environment, -e    Target environment (default: production)"
    echo "  --version, -v        Version tag (default: timestamp)"
    echo "  --skip-tests         Skip test execution"
    echo "  --skip-scan          Skip security scanning"
    echo "  --help, -h           Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  VERSION              Override version tag"
    echo "  ENVIRONMENT          Override target environment"
    echo ""
    echo "Examples:"
    echo "  $0                   # Deploy with defaults"
    echo "  $0 -e staging        # Deploy to staging"
    echo "  $0 -v 1.2.3          # Deploy specific version"
    exit 0
fi

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-scan)
            SKIP_SCAN=true
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Execute main deployment
main