#!/bin/bash
# ============================================
# Complete Deploy Script - Tudo em Um
# MVP Video TécnicoCursos v7
# ============================================
# Execute como root no VPS: bash <(curl -fsSL ...)

set -e

REPO_URL="https://github.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7.git"
APP_DIR="/opt/mvp/_MVP_Video_TecnicoCursos_v7"
PUBLIC_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIERShdX1jb8/YM8V9yv0VjyODX2xeaT7jVcXeZ6R7uTt servidor@Server"

echo "🚀 ============================================"
echo "🚀 MVP Video TécnicoCursos v7 - Deploy Completo"
echo "🚀 ============================================"
echo ""

# ============================================
# PARTE 1: Setup Inicial do Sistema
# ============================================
echo "📦 PARTE 1/5: Atualizando sistema..."
apt update -qq && apt -y upgrade -qq

echo "📦 Instalando pacotes essenciais..."
apt -y install -qq \
    git \
    git-lfs \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    ufw \
    htop \
    nano \
    unzip \
    > /dev/null 2>&1

# ============================================
# PARTE 2: Instalar Docker
# ============================================
if ! command -v docker &> /dev/null; then
    echo "🐳 PARTE 2/5: Instalando Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg > /dev/null 2>&1
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update -qq
    apt -y install -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin > /dev/null 2>&1
    systemctl enable docker > /dev/null 2>&1
    systemctl start docker
    echo "✅ Docker instalado"
else
    echo "✅ Docker já instalado"
fi

# ============================================
# PARTE 3: Configurar Firewall e Swap
# ============================================
echo "🔥 PARTE 3/5: Configurando firewall..."
ufw allow OpenSSH > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1

if [ ! -f /swapfile ]; then
    echo "💾 Criando swap (4GB)..."
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile > /dev/null 2>&1
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ============================================
# PARTE 4: Criar usuário deploy e SSH
# ============================================
echo "👤 PARTE 4/5: Configurando usuário deploy..."
if ! id -u deploy &>/dev/null; then
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    usermod -aG docker deploy
    echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
    chmod 0440 /etc/sudoers.d/deploy
fi

mkdir -p /root/.ssh /home/deploy/.ssh
chmod 700 /root/.ssh /home/deploy/.ssh

if ! grep -q "$PUBLIC_KEY" /root/.ssh/authorized_keys 2>/dev/null; then
    echo "$PUBLIC_KEY" >> /root/.ssh/authorized_keys
fi
if ! grep -q "$PUBLIC_KEY" /home/deploy/.ssh/authorized_keys 2>/dev/null; then
    echo "$PUBLIC_KEY" >> /home/deploy/.ssh/authorized_keys
fi

chmod 600 /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys 2>/dev/null || true
chown -R deploy:deploy /home/deploy/.ssh

# Configurar SSH (não desabilitar root ainda, só depois)
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sed -i 's/^#\?\s*PubkeyAuthentication\s\+.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
systemctl reload sshd > /dev/null 2>&1

# Git LFS
git lfs install > /dev/null 2>&1 || true

# Criar diretório app
mkdir -p /opt/mvp
chown deploy:deploy /opt/mvp

# ============================================
# PARTE 5: Clonar Repo e Deploy
# ============================================
echo "📥 PARTE 5/5: Clonando repositório..."
if [ ! -d "$APP_DIR" ]; then
    cd /opt/mvp
    sudo -u deploy git clone "$REPO_URL" > /dev/null 2>&1
    cd "$APP_DIR"
    sudo -u deploy git lfs pull > /dev/null 2>&1
else
    cd "$APP_DIR"
    sudo -u deploy git fetch origin > /dev/null 2>&1
    sudo -u deploy git reset --hard origin/main > /dev/null 2>&1
    sudo -u deploy git lfs pull > /dev/null 2>&1
fi

# Criar diretórios necessários
cd "$APP_DIR"
mkdir -p redis nginx/ssl logs/nginx

# Criar redis.conf se não existir
if [ ! -f redis/redis.conf ]; then
    cat > redis/redis.conf <<'REDISEOF'
# Redis Configuration
bind 0.0.0.0
protected-mode no
port 6379
save 60 1000
appendonly yes
appendfsync everysec
maxmemory 512mb
maxmemory-policy allkeys-lru
loglevel notice
REDISEOF
fi

# Criar docker-compose.override.yml
cat > docker-compose.override.yml <<'EOF'
services:
  nginx:
    volumes:
      - ./nginx/snippets:/etc/nginx/snippets:ro
EOF

# Ajustar nginx server_name para IP (aceitar qualquer domínio)
if [ -f nginx/conf.d/app.conf ]; then
    if grep -q "tecnicocursos.com" nginx/conf.d/app.conf 2>/dev/null; then
        echo "📝 Ajustando nginx server_name para aceitar qualquer domínio..."
        sed -i 's/server_name tecnicocursos.com www.tecnicocursos.com;/server_name _;/' nginx/conf.d/app.conf
        echo "✅ Nginx configurado para aceitar qualquer domínio/IP"
    fi
fi

# Verificar .env.production
if [ ! -f .env.production ]; then
    echo ""
    echo "⚠️  ATENÇÃO: .env.production não encontrado!"
    echo ""
    echo "Criando arquivo .env.production com template..."
    cat > .env.production <<'ENVEOF'
# ============================================
# Production Environment Variables
# ============================================
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DIRECT_DATABASE_URL=
ELEVENLABS_API_KEY=
HEYGEN_API_KEY=
REDIS_URL=redis://redis:6379
LOG_LEVEL=info
NODE_ENV=production
ENVEOF
    chown deploy:deploy .env.production
    echo ""
    echo "📝 Por favor, edite .env.production com suas variáveis:"
    echo "   nano .env.production"
    echo ""
    echo "Depois execute novamente este script ou:"
    echo "   cd $APP_DIR"
    echo "   docker compose -f docker-compose.prod.yml up -d --build"
    echo ""
    exit 0
fi

# Build e start containers
echo "🐳 Construindo e iniciando containers..."
cd "$APP_DIR"
chown -R deploy:deploy .

# Parar containers antigos se existirem
sudo -u deploy docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Build e start
sudo -u deploy docker compose -f docker-compose.prod.yml up -d --build

echo "⏳ Aguardando serviços iniciarem (30s)..."
sleep 30

# Health check
echo "🏥 Verificando saúde dos serviços..."
if curl -sf http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ Health check passou!"
else
    echo "⚠️  Health check falhou. Verificando logs..."
    sudo -u deploy docker compose -f docker-compose.prod.yml logs --tail=30 app || true
fi

# Status final
echo ""
echo "📊 Status dos containers:"
sudo -u deploy docker compose -f docker-compose.prod.yml ps

echo ""
echo "✅ ============================================"
echo "✅ Deploy Completo!"
echo "✅ ============================================"
echo ""
VPS_IP=$(curl -s ifconfig.me 2>/dev/null || echo "168.231.90.64")
echo "🌐 Acesse: http://$VPS_IP"
echo ""
echo "📋 Comandos úteis:"
echo "   Ver logs:    cd $APP_DIR && docker compose -f docker-compose.prod.yml logs -f"
echo "   Reiniciar:   cd $APP_DIR && docker compose -f docker-compose.prod.yml restart"
echo "   Parar:       cd $APP_DIR && docker compose -f docker-compose.prod.yml down"
echo ""
