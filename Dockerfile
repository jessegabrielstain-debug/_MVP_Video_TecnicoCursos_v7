# Base image with Node.js 20 (LTS) on Debian Bullseye
FROM node:20-bullseye

# Install system dependencies
# - Python 3 & Pip (for edge-tts)
# - FFmpeg (for video processing)
# - Chrome dependencies (for Remotion/Puppeteer)
# - Fonts (Critical for video rendering text correctly)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    librandr2 \
    libgbm1 \
    libasound2 \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

# Install edge-tts globally via pip
# Using --break-system-packages because we are in a container
RUN pip3 install edge-tts --break-system-packages

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./

# Install root dependencies and clean cache
RUN npm install && npm cache clean --force

# Create directory for the Next.js app
WORKDIR /app/estudio_ia_videos

# Copy Next.js app package files
COPY estudio_ia_videos/package.json estudio_ia_videos/package-lock.json* ./

# Install Next.js app dependencies
# We use --legacy-peer-deps to avoid potential conflicts, similar to local dev
RUN npm install --legacy-peer-deps && npm cache clean --force

# Return to root to copy the rest of the project
WORKDIR /app

# Copy the rest of the source code
COPY . .

# Create directories for artifacts and set permissions
# 777 is used here to ensure the node user or any other user can write to these directories
RUN mkdir -p estudio_ia_videos/public/tts-audio \
    estudio_ia_videos/public/videos \
    logs \
    && chmod -R 777 estudio_ia_videos/public \
    && chmod -R 777 logs

# Set environment variables for Puppeteer/Remotion to find Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    EDGE_TTS_PATH=edge-tts

# Default command to run the worker
CMD ["node", "scripts/render-worker.js"]
