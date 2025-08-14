# WhatsApp Chat Mockup API

A Node.js API that generates realistic WhatsApp chat mockup videos with message animations, sound effects, and background audio.

## Features

- 📱 Realistic iPhone WhatsApp UI mockup
- 🎬 Message-by-message slideshow experience
- 🔊 Apple WhatsApp-style notification sounds
- 🎵 Background audio support
- 👤 Custom astrologer profile images
- 📝 JSON-based message configuration
- 🎥 MP4 video output

## Installation

```bash
cd whatsapp-mockup-api
npm install
```

## Usage

### Start the Server

```bash
npm start
```

The server will run on `http://localhost:3001` (or set PORT environment variable)

### API Endpoint

**POST** `/api/generate-mockup`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `messages` (required): JSON string containing chat messages
- `astrologerName` (optional): Name of the astrologer (default: "Astrologer")
- `astrologerImage` (optional): Profile image file for the astrologer
- `backgroundAudio` (optional): Background audio file (will be mixed at 30% volume)

### Message Format

```json
{
  "messages": [
    {
      "role": "user",
      "text": "Hello, I wanted to ask about my career prospects"
    },
    {
      "role": "astrologer",
      "text": "I'd be happy to help! Can you share your birth details?"
    }
  ]
}
```

### Example Request (cURL)

```bash
# Basic example - returns JSON with auto-generated filename
curl -X POST http://localhost:3001/api/generate-mockup \
  -F 'messages=[{"role":"user","text":"Hello"},{"role":"astrologer","text":"Hi there!"}]' \
  -F 'astrologerName=Guru Acharya' \
  -F 'astrologerImage=@./astrologer.jpg' \
  -F 'backgroundAudio=@./background.mp3'

# Response:
# {
#   "success": true,
#   "message": "Video generated successfully",
#   "filename": "whatsapp-mockup-2025-08-14T08-41-23-156Z-abc123.mp4",
#   "path": "output/whatsapp-mockup-2025-08-14T08-41-23-156Z-abc123.mp4",
#   "timestamp": "2025-08-14T08:41:23.156Z"
# }
```

### Download Generated Video

```bash
# Download by filename (from API response)
curl -O http://localhost:3001/video/whatsapp-mockup-2025-08-14T08-41-23-156Z-abc123.mp4

# Or list all generated videos
curl http://localhost:3001/videos
```

### Testing

Run the included test script:

```bash
node test-api.js
```

## Technical Details

### Dependencies
- **Express**: Web server framework
- **Canvas**: HTML5 Canvas API for Node.js (UI rendering)
- **FFmpeg**: Video processing and audio mixing
- **Multer**: File upload handling

### Video Specifications
- Resolution: 376x812 (Instagram-compatible iPhone dimensions)
- Frame Rate: 30 FPS
- Codec: H.264 Main Profile (QuickTime compatible)
- Format: MP4 with AAC audio
- Message Timing: 2 seconds between messages
- Typing Indicator: 1 second for astrologer messages
- Theme: WhatsApp Light Mode with iOS keyboard

### Sound Effects
- Send Sound: 800Hz tone, 0.1s duration
- Receive Sound: 600Hz tone, 0.15s duration
- Background Audio: Mixed at 30% volume

## File Structure

```
whatsapp-mockup-api/
├── server.js                 # Main server file
├── src/
│   ├── WhatsAppMockup.js     # Core mockup generator
│   └── SoundManager.js       # Audio processing
├── test/
│   └── sample-data.json      # Test data
├── test-api.js               # API test script
├── temp/                     # Temporary files (auto-created)
├── output/                   # Generated videos (auto-created)
└── assets/sounds/            # Generated sound effects (auto-created)
```

## Requirements

- Node.js 14+
- FFmpeg (automatically installed via ffmpeg-static)
- Canvas dependencies (may require system libraries on some platforms)

## API Endpoints

### POST `/api/generate-mockup`
Generates a WhatsApp mockup video and returns JSON with video details.

**Response:**
```json
{
  "success": true,
  "message": "Video generated successfully",
  "filename": "whatsapp-mockup-2025-08-14T08-41-23-156Z-abc123.mp4",
  "path": "output/whatsapp-mockup-2025-08-14T08-41-23-156Z-abc123.mp4",
  "timestamp": "2025-08-14T08:41:23.156Z"
}
```

### GET `/video/:filename`
Streams/downloads a specific generated video.

### GET `/videos`
Lists all generated videos with metadata.

### GET `/health`
Server health check endpoint.

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success - returns JSON with video details
- `400`: Bad Request - missing required parameters
- `500`: Server Error - video generation failed

## Performance Notes

- Video generation time depends on message count and length
- Large astrologer images are automatically resized
- Temporary files are cleaned up after video generation
- Background audio is automatically mixed and synchronized

## License

MIT License