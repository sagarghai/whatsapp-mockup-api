# Growth Tools Backend

Backend API for Growth Tools - AI-powered content generation platform with WhatsApp mockups and slideshow generation.

## Features

### 🎬 WhatsApp Mockup Generator
- Generate realistic WhatsApp chat mockup videos
- Custom astrologer profiles and conversations  
- Background audio and image support
- Automated video export

### 🖼️ AI Slideshow Generator
- Create slideshow videos from text prompts
- AI-powered image generation using Replicate FLUX Schnell
- Optional background audio support
- Synchronous and asynchronous generation modes
- Cost-effective at ~$0.003 per image

## API Endpoints

### WhatsApp Mockup API
- `POST /api/generate-mockup` - Generate WhatsApp chat mockup video

### AI Slideshow API  
- `GET /api/slideshow/docs` - API documentation
- `POST /api/slideshow/generate` - Synchronous slideshow generation
- `POST /api/slideshow/generate-async` - Asynchronous slideshow generation
- `GET /api/slideshow/job/:jobId` - Check job status or download video
- `GET /api/slideshow/jobs` - List all jobs (debug)

### System
- `GET /health` - Health check for both services
- `GET /videos` - List generated videos
- `GET /video/:filename` - Download specific video

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Replicate API** - AI image generation
- **FFmpeg** - Video processing
- **Puppeteer** - WhatsApp mockup rendering
- **Canvas** - Image manipulation
- **Multer** - File upload handling

## Setup

1. **Clone and Install**
   ```bash
   git clone <repository>
   cd growth-tools-backend
   npm install
   ```

2. **Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API tokens
   ```

   Required variables:
   ```env
   REPLICATE_API_TOKEN=your_replicate_token_here
   PORT=3000
   ```

3. **Start Server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## API Usage Examples

### Generate Slideshow (Sync)
```bash
curl -X POST http://localhost:3000/api/slideshow/generate \
  -H 'Content-Type: application/json' \
  -d '{"slides":["sunset over mountains","peaceful lake","forest path"]}' \
  --output slideshow.mp4
```

### Generate Slideshow (Async)
```bash
# Start generation
curl -X POST http://localhost:3000/api/slideshow/generate-async \
  -H 'Content-Type: application/json' \
  -d '{"slides":["sunset over mountains","peaceful lake"]}'

# Check status (returns job info or video file when ready)
curl -X GET http://localhost:3000/api/slideshow/job/{jobId}
```

### Generate WhatsApp Mockup
```bash
curl -X POST http://localhost:3000/api/generate-mockup \
  -F 'messages=[{"sender":"user","text":"Hello!"},{"sender":"astrologer","text":"Hi there!"}]' \
  -F 'astrologerName=Mystic Maya'
```

## Dependencies

### Core
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `multer` - File upload middleware

### AI & Media Processing  
- `replicate` - AI image generation API
- `fluent-ffmpeg` - Video processing
- `ffmpeg-static` - Static FFmpeg binary
- `puppeteer` - Headless browser for mockups
- `canvas` - Server-side image manipulation

### Utilities
- `fs-extra` - Enhanced file system operations
- `uuid` - Unique ID generation
- `axios` - HTTP client
- `form-data` - Form data handling

## File Structure

```
src/
├── WhatsAppMockup.js           # WhatsApp mockup logic
├── WhatsAppMockupPuppeteer.js  # Puppeteer-based rendering
└── SoundManager.js             # Audio handling

assets/sounds/                  # Audio assets
temp/                          # Temporary files
output/                        # Generated videos
```

## Cost Estimation

### Slideshow Generation
- ~$0.003 per image (FLUX Schnell model)
- 5-slide video = ~$0.015
- 10-slide video = ~$0.03

Very cost-effective for high-quality AI-generated content!

## Deployment

1. **Environment Setup**
   - Ensure all environment variables are configured
   - Install FFmpeg on production server

2. **Process Management**
   - Use PM2 or similar for production
   - Set up proper logging and monitoring

3. **Scaling Considerations**
   - File cleanup runs automatically (10min for temp, 1hr for videos)
   - Consider Redis for job storage in multi-instance setup
   - Monitor Replicate API usage and limits

## Contributing

1. Follow existing code patterns
2. Add proper error handling
3. Update API documentation
4. Test both sync and async endpoints