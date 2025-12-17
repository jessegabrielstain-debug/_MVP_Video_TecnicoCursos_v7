#!/bin/bash
# ============================================
# Production Deploy Script
# MVP Video TécnicoCursos v7
# ============================================
# Run as deploy user in /opt/mvp/_MVP_Video_TecnicoCursos_v7

set -e

REPO_URL="https://github.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7.git"
APP_DIR="/opt/mvp/_MVP_Video_TecnicoCursos_v7"
COMPOSE_FILE="docker-compose.prod.yml"

echo "🚀 Starting Production Deploy..."

# ============================================
# 1. Clone or Update Repository
# ============================================
if [ ! -d "$APP_DIR" ]; then
    echo "📥 Cloning repository..."
    cd /opt/mvp
    git clone "$REPO_URL"
    cd "$APP_DIR"
    git lfs pull
else
    echo "📥 Updating repository..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/main
    git lfs pull
fi

# ============================================
# 2. Create required directories
# ============================================
echo "📁 Creating required directories..."
mkdir -p redis nginx/ssl logs/nginx

# Create placeholder redis.conf if not exists
if [ ! -f redis/redis.conf ]; then
    echo "# Redis placeholder config" > redis/redis.conf
fi

# ============================================
# 3. Create docker-compose.override.yml
# ============================================
echo "📝 Creating docker-compose.override.yml..."
cat > docker-compose.override.yml <<'EOF'
services:
  nginx:
    volumes:
      - ./nginx/snippets:/etc/nginx/snippets:ro
EOF

# ============================================
# 4. Check for .env.production
# ============================================
if [ ! -f .env.production ]; then
    echo "⚠️  WARNING: .env.production not found!"
    echo "Please create .env.production with your environment variables."
    echo ""
    echo "Required variables:"
    echo "  NEXT_PUBLIC_SUPABASE_URL="
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY="
    echo "  SUPABASE_SERVICE_ROLE_KEY="
    echo "  DIRECT_DATABASE_URL="
    echo "  ELEVENLABS_API_KEY="
    echo "  HEYGEN_API_KEY="
    echo ""
    exit 1
fi

# ============================================
# 5. Update Nginx server_name (optional)
# ============================================
# By default, uses server_name _; for testing
if grep -q "tecnicocursos.com" nginx/conf.d/app.conf; then
    echo "📝 Updating nginx server_name for IP access..."
    sed -i 's/server_name tecnicocursos.com www.tecnicocursos.com;/server_name _;/' nginx/conf.d/app.conf
fi

# ============================================
# 6. Build and Start Containers
# ============================================
echo "🐳 Building and starting containers..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" up -d --build

# ============================================
# 7. Wait for services to be ready
# ============================================
echo "⏳ Waiting for services to start..."
sleep 30

# ============================================
# 8. Health Check
# ============================================
echo "🏥 Running health check..."
if curl -sf http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check failed. Checking logs..."
    docker compose -f "$COMPOSE_FILE" logs --tail=50 app
fi

# ============================================
# 9. Show status
# ============================================
echo ""
echo "📊 Container Status:"
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "✅ Deploy Complete!"
echo ""
echo "🌐 Access your app at: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP')"
echo ""
echo "Useful commands:"
echo "  View logs:   docker compose -f $COMPOSE_FILE logs -f"
echo "  Restart:     docker compose -f $COMPOSE_FILE restart"
echo "  Stop:        docker compose -f $COMPOSE_FILE down"
echo ""
