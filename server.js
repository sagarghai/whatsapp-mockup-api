const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const WhatsAppMockup = require('./src/WhatsAppMockupPuppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const upload = multer({ dest: 'temp/' });

app.post('/api/generate-mockup', upload.fields([
  { name: 'astrologerImage', maxCount: 1 },
  { name: 'backgroundAudio', maxCount: 1 }
]), async (req, res) => {
  try {
    const { messages, astrologerName } = req.body;
    
    if (!messages) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    const parsedMessages = JSON.parse(messages);
    const astrologerImage = req.files.astrologerImage ? req.files.astrologerImage[0].path : null;
    const backgroundAudio = req.files.backgroundAudio ? req.files.backgroundAudio[0].path : null;

    const mockup = new WhatsAppMockup({
      messages: parsedMessages,
      astrologerName: astrologerName || 'Astrologer',
      astrologerImage,
      backgroundAudio
    });

    const videoPath = await mockup.generateVideo();
    
    // Generate random filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const finalVideoName = `whatsapp-mockup-${timestamp}-${randomSuffix}.mp4`;
    const finalVideoPath = `output/${finalVideoName}`;
    
    // Move video to final location with new name
    fs.renameSync(videoPath, finalVideoPath);
    
    // Cleanup temporary files
    if (astrologerImage) fs.unlinkSync(astrologerImage);
    if (backgroundAudio) fs.unlinkSync(backgroundAudio);
    
    // Return success response with video info
    res.json({
      success: true,
      message: 'Video generated successfully',
      filename: finalVideoName,
      path: finalVideoPath,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating mockup:', error);
    res.status(500).json({ error: 'Failed to generate mockup video' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'WhatsApp Mockup API is running' });
});

// Serve generated videos
app.get('/video/:filename', (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(__dirname, 'output', filename);
  
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Video not found' });
  }
  
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  
  const videoStream = fs.createReadStream(videoPath);
  videoStream.pipe(res);
});

// List all generated videos
app.get('/videos', (req, res) => {
  const outputDir = path.join(__dirname, 'output');
  
  if (!fs.existsSync(outputDir)) {
    return res.json({ videos: [] });
  }
  
  const videos = fs.readdirSync(outputDir)
    .filter(file => file.endsWith('.mp4'))
    .map(file => {
      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        size: stats.size,
        created: stats.birthtime,
        url: `/video/${file}`
      };
    })
    .sort((a, b) => new Date(b.created) - new Date(a.created));
  
  res.json({ videos });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Create necessary directories
  ['temp', 'output', 'assets/sounds'].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
});