#!/bin/bash
# ============================================
# VPS Initial Setup Script
# MVP Video TécnicoCursos v7
# ============================================
# Run as root on a fresh Ubuntu VPS

set -e

echo "🚀 Starting VPS Initial Setup..."

# ============================================
# 1. System Update
# ============================================
echo "📦 Updating system packages..."
apt update && apt -y upgrade

# ============================================
# 2. Install Essential Packages
# ============================================
echo "📦 Installing essential packages..."
apt -y install \
    git \
    git-lfs \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    ufw \
    htop \
    nano \
    unzip

# ============================================
# 3. Install Docker (if not present)
# ============================================
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt -y install docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
else
    echo "✅ Docker already installed"
fi

# ============================================
# 4. Configure Firewall
# ============================================
echo "🔥 Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ============================================
# 5. Configure Swap (recommended for KVM2)
# ============================================
if [ ! -f /swapfile ]; then
    echo "💾 Creating swap file..."
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
    echo "✅ Swap already configured"
fi

# ============================================
# 6. Create deploy user
# ============================================
if ! id -u deploy &>/dev/null; then
    echo "👤 Creating deploy user..."
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    usermod -aG docker deploy
    
    # Allow sudo without password for deploy
    echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
    chmod 0440 /etc/sudoers.d/deploy
else
    echo "✅ User deploy already exists"
    usermod -aG docker deploy
fi

# ============================================
# 7. Setup SSH Keys
# ============================================
echo "🔑 Setting up SSH keys..."

# Create .ssh directories
mkdir -p /root/.ssh /home/deploy/.ssh
chmod 700 /root/.ssh /home/deploy/.ssh

# Add your public key here (replace with actual key)
PUBLIC_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIERShdX1jb8/YM8V9yv0VjyODX2xeaT7jVcXeZ6R7uTt servidor@Server"

echo "$PUBLIC_KEY" >> /root/.ssh/authorized_keys
echo "$PUBLIC_KEY" >> /home/deploy/.ssh/authorized_keys

chmod 600 /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# ============================================
# 8. Secure SSH Configuration
# ============================================
echo "🔒 Securing SSH..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

sed -i 's/^#\?\s*PasswordAuthentication\s\+.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?\s*PubkeyAuthentication\s\+.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^#\?\s*PermitRootLogin\s\+.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config

systemctl reload sshd

# ============================================
# 9. Initialize Git LFS
# ============================================
echo "📁 Initializing Git LFS..."
git lfs install

# ============================================
# 10. Create app directory
# ============================================
echo "📂 Creating application directory..."
mkdir -p /opt/mvp
chown deploy:deploy /opt/mvp

# ============================================
# Done
# ============================================
echo ""
echo "✅ VPS Initial Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Test SSH: ssh deploy@$(curl -s ifconfig.me)"
echo "  2. Clone repo: cd /opt/mvp && git clone https://github.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7.git"
echo "  3. Create .env.production"
echo "  4. Run: docker compose -f docker-compose.prod.yml up -d --build"
echo ""
