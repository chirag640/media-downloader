# Use lightweight Python 3.12 image
FROM python:3.12-slim

# Install system dependencies (ffmpeg is required for yt-dlp audio extraction)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency definition
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt waitress

# Copy application files
COPY . .

# Create downloads directory
RUN mkdir -p downloads

# Environment configuration
ENV PORT=5000
EXPOSE 5000

# Run Waitress production server
CMD ["python", "-m", "waitress", "--port=5000", "app:app"]
