FROM node:22-bookworm

WORKDIR /app

# Install Python, FFmpeg and system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       python3 \
       python3-pip \
       ffmpeg \
       ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for Docker layer caching
COPY package.json package-lock.json ./

# Install Node dependencies
RUN npm ci

# Copy application
COPY . .

# Ensure the bundled downloader is executable in the Linux image.
RUN chmod 755 /app/bin/yt-dlp

# Install yt-dlp Python dependency for TikTok browser impersonation
RUN python3 -m pip install \
    --break-system-packages \
    --no-cache-dir \
    -r bin/requirements.txt

# Build React/Vite frontend
RUN npm run build

# Railway provides PORT automatically
ENV NODE_ENV=production
ENV PYTHON=python3

EXPOSE 3000

# Start Express + React server
CMD ["npm", "start"]