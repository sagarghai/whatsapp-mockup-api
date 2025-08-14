# WhatsApp Chat Mockup API - Usage Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
Server runs on `http://localhost:3001` (or set PORT environment variable)

### 3. Create a Chat Video

**Endpoint:** `POST /api/generate-mockup`

**Example cURL Request (Basic):**
```bash
curl -X POST http://localhost:3001/api/generate-mockup \
  -F 'messages=[
    {"role":"user","text":"Hello, I wanted to ask about my career prospects this year"},
    {"role":"astrologer","text":"Namaste! I would be happy to help you with your career reading. Can you please share your birth details?"},
    {"role":"user","text":"I was born on March 15, 1990 at 2:30 PM in Mumbai"},
    {"role":"astrologer","text":"Thank you for the details. Based on your birth chart, Jupiter is transiting through your 10th house of career this year! ✨"}
  ]' \
  -F 'astrologerName=Guru Acharya'

# Response:
# {
#   "success": true,
#   "message": "Video generated successfully",
#   "filename": "whatsapp-mockup-2025-08-14T08-41-23-156Z-abc123.mp4",
#   "path": "output/whatsapp-mockup-2025-08-14T08-41-23-156Z-abc123.mp4",
#   "timestamp": "2025-08-14T08:41:23.156Z"
# }
```

**Download the Generated Video:**
```bash
# Use the filename from the API response
curl -O http://localhost:3001/video/whatsapp-mockup-2025-08-14T08-41-23-156Z-abc123.mp4
```

**With Astrologer Image:**
```bash
curl -X POST http://localhost:3001/api/generate-mockup \
  -F 'messages=[{"role":"user","text":"Hello"},{"role":"astrologer","text":"Namaste! How can I help you today?"}]' \
  -F 'astrologerName=Guru Acharya' \
  -F 'astrologerImage=@/path/to/astrologer-photo.jpg'
```

**With Background Audio:**
```bash
curl -X POST http://localhost:3001/api/generate-mockup \
  -F 'messages=[{"role":"user","text":"Thank you for the reading!"},{"role":"astrologer","text":"You are most welcome! Blessings! 🙏"}]' \
  -F 'astrologerName=Guru Acharya' \
  -F 'backgroundAudio=@/path/to/peaceful-music.mp3'
```

## Message Format

Messages should be provided as a JSON array with the following structure:

```json
[
  {
    "role": "user",
    "text": "Your message text here"
  },
  {
    "role": "astrologer", 
    "text": "Astrologer response here"
  }
]
```

### Message Roles
- **`user`**: Messages from the user (appears on right side, green bubble)
- **`astrologer`**: Messages from astrologer (appears on left side, grey bubble, shows typing indicator first)

## API Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `messages` | JSON string | ✅ Yes | Array of message objects |
| `astrologerName` | string | ❌ Optional | Name of astrologer (default: "Astrologer") |
| `astrologerImage` | file | ❌ Optional | Profile image for astrologer (JPG/PNG) |
| `backgroundAudio` | file | ❌ Optional | Background audio file (MP3/WAV) |

## Video Specifications

- **Resolution**: 376x812 pixels (Instagram-compatible iPhone dimensions)
- **Frame Rate**: 30 FPS
- **Format**: MP4 (H.264 Main Profile, QuickTime compatible)
- **Audio**: AAC stereo with silent track for compatibility
- **Duration**: Dynamic based on message count (2 seconds per message + animations)
- **Theme**: WhatsApp Light Mode with iOS keyboard
- **Filenames**: Auto-generated with timestamp and random suffix

## Features Demonstrated

### 1. Realistic WhatsApp UI
- Accurate iPhone WhatsApp interface
- Light mode styling (Instagram-friendly)
- iOS keyboard display at bottom
- Profile picture support
- Online status indicator

### 2. Message Animation
- Typing indicators for astrologer messages
- Message appear animations
- Proper timing between messages
- Smooth transitions

### 3. Sound Effects
- Send notification sound (higher pitch)
- Receive notification sound (lower pitch)
- Background audio mixing at 30% volume
- Synchronized audio timeline

### 4. Professional Styling
- Message bubbles with proper colors
- Timestamps on each message
- Read receipts (✓✓) for user messages
- Responsive text wrapping

## Real-World Example

Here's a complete astrology consultation example:

```json
{
  "astrologerName": "Guru Acharya",
  "messages": [
    {
      "role": "user",
      "text": "Hello, I wanted to ask about my career prospects this year"
    },
    {
      "role": "astrologer", 
      "text": "Namaste! I'd be happy to help you with your career reading. Can you please share your birth details - date, time, and place of birth?"
    },
    {
      "role": "user",
      "text": "I was born on March 15, 1990 at 2:30 PM in Mumbai"
    },
    {
      "role": "astrologer",
      "text": "Thank you for the details. Based on your birth chart, I can see that Jupiter is transiting through your 10th house of career this year, which is very auspicious! ✨"
    },
    {
      "role": "astrologer",
      "text": "This indicates significant growth and new opportunities in your professional life. The period between June and September looks particularly favorable for career advancement."
    },
    {
      "role": "user", 
      "text": "That's wonderful to hear! Should I consider changing jobs this year?"
    },
    {
      "role": "astrologer",
      "text": "The stars suggest that mid-July to August would be an excellent time for job transitions. Mars in your 2nd house will boost your confidence during interviews."
    },
    {
      "role": "user",
      "text": "Thank you so much for this guidance! This gives me a lot of clarity."
    },
    {
      "role": "astrologer",
      "text": "You're most welcome! May the cosmic energies guide you toward success and prosperity. Feel free to reach out if you need any further guidance. Blessings! 🙏"
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **Server not starting**: Check if port 3001 is available (or set PORT environment variable)
2. **Video generation fails**: Ensure FFmpeg is properly installed via ffmpeg-static
3. **Image upload errors**: Check file size and format (max 10MB, JPG/PNG only)
4. **Video playback issues**: Videos are optimized for QuickTime and web browsers
5. **Audio issues**: All videos include silent AAC track for compatibility

### File Size Limits
- Astrologer images: Max 10MB
- Background audio: Max 50MB
- Generated videos: Typically 5-20MB depending on length

## Performance Notes

- Video generation time: ~30-60 seconds for 10 messages
- Memory usage: ~200MB peak during generation
- Concurrent requests: Limited to prevent server overload
- Temporary files: Automatically cleaned up after generation

## Integration Examples

### JavaScript/Node.js
```javascript
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

const formData = new FormData();
formData.append('messages', JSON.stringify([
  {"role": "user", "text": "Hello!"},
  {"role": "astrologer", "text": "Namaste!"}
]));
formData.append('astrologerName', 'Guru Acharya');

// Generate video
const response = await axios.post('http://localhost:3001/api/generate-mockup', formData, {
  headers: formData.getHeaders()
});

// Get the auto-generated filename
const { filename } = response.data;
console.log('Video generated:', filename);

// Download the video
const videoResponse = await axios.get(`http://localhost:3001/video/${filename}`, {
  responseType: 'stream'
});

const writer = fs.createWriteStream(filename);
videoResponse.data.pipe(writer);
```

### Python
```python
import requests
import json

# Generate video
files = {
    'messages': (None, '[{"role":"user","text":"Hello!"}]'),
    'astrologerName': (None, 'Guru Acharya')
}

response = requests.post(
    'http://localhost:3001/api/generate-mockup', 
    files=files
)

# Get the auto-generated filename
result = response.json()
filename = result['filename']
print(f"Video generated: {filename}")

# Download the video
video_response = requests.get(f'http://localhost:3001/video/{filename}')

with open(filename, 'wb') as f:
    f.write(video_response.content)
```

## Business Use Cases

1. **Astrology Consultations**: Create testimonial videos from real client conversations
2. **Marketing Content**: Generate engaging WhatsApp-style promotional videos  
3. **Training Materials**: Show proper consultation conversation flows
4. **Social Media**: Create shareable content demonstrating service quality
5. **Client Presentations**: Professional way to showcase consultation examples

## Security & Privacy

- No messages are stored permanently
- Temporary files are cleaned up immediately
- No external API calls are made
- All processing happens locally on your server