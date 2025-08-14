const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const WhatsAppMockup = require('./src/WhatsAppMockupPuppeteer');
const Replicate = require('replicate');
const ffmpeg = require('fluent-ffmpeg');
const fs_extra = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const upload = multer({ dest: 'temp/' });

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// In-memory job storage for async slideshow generation
const slideshowJobs = new Map();

// Utility functions for slideshow generation
const cleanup = (files) => {
  files.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
};

const setCleanupTimer = (files, delay = 10 * 60 * 1000) => {
  setTimeout(() => cleanup(files), delay);
};

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

// Slideshow Generator API Endpoints

// API Documentation endpoint
app.get('/api/slideshow/docs', (req, res) => {
  res.json({
    name: "AI Slideshow Generator API",
    version: "1.0.0",
    description: "Generate slideshow videos from text prompts using AI image generation",
    endpoints: {
      "POST /api/slideshow/generate": {
        description: "Generate a slideshow video from text prompts",
        parameters: {
          slides: "Array of text prompts for each slide",
          audio: "Optional audio file (multipart/form-data)"
        },
        response: "Binary video file (MP4)"
      },
      "POST /api/slideshow/generate-async": {
        description: "Generate slideshow asynchronously, returns job ID",
        parameters: {
          slides: "Array of text prompts for each slide",
          audio: "Optional audio file (multipart/form-data)"
        },
        response: {
          jobId: "string",
          status: "pending"
        }
      },
      "GET /api/slideshow/job/:jobId": {
        description: "Check job status or download completed video",
        response: "Job status or binary video file"
      }
    },
    examples: {
      "curl_generate": "curl -X POST http://localhost:3000/api/slideshow/generate -H 'Content-Type: application/json' -d '{\"slides\":[\"sunset over mountains\",\"peaceful lake\"]}' --output slideshow.mp4",
      "curl_async": "curl -X POST http://localhost:3000/api/slideshow/generate-async -H 'Content-Type: application/json' -d '{\"slides\":[\"sunset over mountains\",\"peaceful lake\"]}'"
    }
  });
});

// Synchronous slideshow generation endpoint
app.post('/api/slideshow/generate', upload.single('audio'), async (req, res) => {
  const sessionId = uuidv4();
  const tempFiles = [];
  
  try {
    console.log('Slideshow API: Starting slideshow generation...');
    
    let slides = [];
    
    // Handle both JSON and form data
    if (req.body.slides) {
      slides = Array.isArray(req.body.slides) ? req.body.slides : [req.body.slides];
    } else {
      // Legacy support for individual slide fields
      for (let i = 1; i <= 10; i++) {
        const slide = req.body[`slide${i}`];
        if (slide) slides.push(slide);
      }
    }
    
    if (slides.length === 0) {
      return res.status(400).json({ 
        error: 'No slide prompts provided',
        expected: 'Array of text prompts in "slides" field'
      });
    }
    
    if (slides.length > 10) {
      return res.status(400).json({ 
        error: 'Too many slides',
        max: 10,
        provided: slides.length
      });
    }
    
    console.log(`Slideshow API: Generating ${slides.length} images...`);
    
    const imagePromises = slides.map(async (prompt, index) => {
      try {
        console.log(`Slideshow API: Generating image ${index + 1}: ${prompt}`);
        
        const output = await replicate.run(
          "black-forest-labs/flux-schnell",
          {
            input: {
              prompt: prompt,
              go_fast: true,
              megapixels: "1",
              num_outputs: 1,
              aspect_ratio: "16:9",
              output_format: "jpg",
              output_quality: 80
            }
          }
        );
        
        const imageUrl = Array.isArray(output) ? output[0] : output;
        
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();
        
        const imagePath = path.join('temp', `${sessionId}_image_${index}.jpg`);
        await fs_extra.writeFile(imagePath, buffer);
        tempFiles.push(imagePath);
        
        console.log(`Slideshow API: Image ${index + 1} saved to ${imagePath}`);
        return imagePath;
        
      } catch (error) {
        console.error(`Slideshow API: Error generating image ${index + 1}:`, error);
        throw new Error(`Failed to generate image ${index + 1}: ${error.message}`);
      }
    });
    
    const imagePaths = await Promise.all(imagePromises);
    console.log('Slideshow API: All images generated successfully');
    
    const outputPath = path.join('output', `slideshow_${sessionId}.mp4`);
    tempFiles.push(outputPath);
    
    console.log('Slideshow API: Creating video slideshow...');
    
    await new Promise((resolve, reject) => {
      let ffmpegCommand = ffmpeg();
      
      imagePaths.forEach((imagePath) => {
        ffmpegCommand = ffmpegCommand.input(imagePath);
      });
      
      if (req.file) {
        const audioPath = req.file.path;
        tempFiles.push(audioPath);
        ffmpegCommand = ffmpegCommand.input(audioPath);
      }
      
      const slideDuration = req.file ? null : 3;
      
      let filterComplex = imagePaths.map((_, index) => {
        return `[${index}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=30[v${index}]`;
      }).join(';');
      
      if (!req.file) {
        filterComplex += ';' + imagePaths.map((_, index) => {
          return `[v${index}]tpad=stop_mode=clone:stop_duration=${slideDuration}[vpad${index}]`;
        }).join(';');
        
        const concatInputs = imagePaths.map((_, index) => `[vpad${index}]`).join('');
        filterComplex += `;${concatInputs}concat=n=${imagePaths.length}:v=1[outv]`;
      } else {
        const concatInputs = imagePaths.map((_, index) => `[v${index}]`).join('');
        filterComplex += `;${concatInputs}concat=n=${imagePaths.length}:v=1[outv]`;
      }
      
      ffmpegCommand
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[outv]',
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-pix_fmt', 'yuv420p'
        ]);
      
      if (req.file) {
        ffmpegCommand.outputOptions([
          `-map`, `${imagePaths.length}:a`,
          '-c:a', 'aac',
          '-b:a', '128k',
          '-shortest'
        ]);
      }
      
      ffmpegCommand
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('Slideshow API: FFmpeg started:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Slideshow API: Processing: ' + progress.percent + '% done');
        })
        .on('end', () => {
          console.log('Slideshow API: Video created successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('Slideshow API: FFmpeg error:', err);
          reject(err);
        })
        .run();
    });
    
    const videoBuffer = await fs_extra.readFile(outputPath);
    
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="slideshow_${sessionId}.mp4"`);
    res.setHeader('X-Generation-Time', Date.now());
    res.setHeader('X-Slide-Count', slides.length.toString());
    res.send(videoBuffer);
    
    setCleanupTimer(tempFiles);
    console.log('Slideshow API: Slideshow generation completed successfully');
    
  } catch (error) {
    console.error('Slideshow API: Error in slideshow generation:', error);
    cleanup(tempFiles);
    res.status(500).json({ 
      error: 'Failed to generate slideshow', 
      details: error.message,
      sessionId: sessionId
    });
  }
});

// Asynchronous slideshow generation endpoint
app.post('/api/slideshow/generate-async', upload.single('audio'), async (req, res) => {
  const jobId = uuidv4();
  
  let slides = [];
  
  if (req.body.slides) {
    slides = Array.isArray(req.body.slides) ? req.body.slides : [req.body.slides];
  } else {
    for (let i = 1; i <= 10; i++) {
      const slide = req.body[`slide${i}`];
      if (slide) slides.push(slide);
    }
  }
  
  if (slides.length === 0) {
    return res.status(400).json({ 
      error: 'No slide prompts provided',
      expected: 'Array of text prompts in "slides" field'
    });
  }
  
  if (slides.length > 10) {
    return res.status(400).json({ 
      error: 'Too many slides',
      max: 10,
      provided: slides.length
    });
  }
  
  // Store job info
  slideshowJobs.set(jobId, {
    status: 'pending',
    slides: slides,
    audioFile: req.file,
    createdAt: new Date(),
    progress: 0
  });
  
  // Start generation in background
  generateSlideshowAsync(jobId, slides, req.file);
  
  res.json({
    jobId: jobId,
    status: 'pending',
    message: 'Slideshow generation started',
    estimatedTime: `${slides.length * 2}-${slides.length * 4} seconds`,
    checkUrl: `/api/slideshow/job/${jobId}`
  });
});

// Job status/download endpoint
app.get('/api/slideshow/job/:jobId', async (req, res) => {
  const jobId = req.params.jobId;
  const job = slideshowJobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  if (job.status === 'completed' && job.videoPath) {
    try {
      const videoBuffer = await fs_extra.readFile(job.videoPath);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="slideshow_${jobId}.mp4"`);
      res.send(videoBuffer);
    } catch (error) {
      res.status(500).json({ error: 'Video file not found' });
    }
  } else {
    res.json({
      jobId: jobId,
      status: job.status,
      progress: job.progress,
      message: job.message,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      error: job.error
    });
  }
});

// Async slideshow generation function
async function generateSlideshowAsync(jobId, slides, audioFile) {
  const sessionId = uuidv4();
  const tempFiles = [];
  
  try {
    const job = slideshowJobs.get(jobId);
    job.status = 'generating_images';
    job.progress = 10;
    
    console.log(`Slideshow Async: Starting slideshow generation for job ${jobId}...`);
    
    const imagePromises = slides.map(async (prompt, index) => {
      try {
        console.log(`Slideshow Async: Generating image ${index + 1}: ${prompt}`);
        
        const output = await replicate.run(
          "black-forest-labs/flux-schnell",
          {
            input: {
              prompt: prompt,
              go_fast: true,
              megapixels: "1",
              num_outputs: 1,
              aspect_ratio: "16:9",
              output_format: "jpg",
              output_quality: 80
            }
          }
        );
        
        const imageUrl = Array.isArray(output) ? output[0] : output;
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();
        
        const imagePath = path.join('temp', `${sessionId}_image_${index}.jpg`);
        await fs_extra.writeFile(imagePath, buffer);
        tempFiles.push(imagePath);
        
        job.progress = 10 + ((index + 1) / slides.length) * 60;
        
        return imagePath;
        
      } catch (error) {
        throw new Error(`Failed to generate image ${index + 1}: ${error.message}`);
      }
    });
    
    const imagePaths = await Promise.all(imagePromises);
    
    job.status = 'creating_video';
    job.progress = 75;
    
    const outputPath = path.join('output', `slideshow_${sessionId}.mp4`);
    tempFiles.push(outputPath);
    
    await new Promise((resolve, reject) => {
      let ffmpegCommand = ffmpeg();
      
      imagePaths.forEach((imagePath) => {
        ffmpegCommand = ffmpegCommand.input(imagePath);
      });
      
      if (audioFile) {
        tempFiles.push(audioFile.path);
        ffmpegCommand = ffmpegCommand.input(audioFile.path);
      }
      
      const slideDuration = audioFile ? null : 3;
      
      let filterComplex = imagePaths.map((_, index) => {
        return `[${index}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS,fps=30[v${index}]`;
      }).join(';');
      
      if (!audioFile) {
        filterComplex += ';' + imagePaths.map((_, index) => {
          return `[v${index}]tpad=stop_mode=clone:stop_duration=${slideDuration}[vpad${index}]`;
        }).join(';');
        
        const concatInputs = imagePaths.map((_, index) => `[vpad${index}]`).join('');
        filterComplex += `;${concatInputs}concat=n=${imagePaths.length}:v=1[outv]`;
      } else {
        const concatInputs = imagePaths.map((_, index) => `[v${index}]`).join('');
        filterComplex += `;${concatInputs}concat=n=${imagePaths.length}:v=1[outv]`;
      }
      
      ffmpegCommand
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[outv]',
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-pix_fmt', 'yuv420p'
        ]);
      
      if (audioFile) {
        ffmpegCommand.outputOptions([
          `-map`, `${imagePaths.length}:a`,
          '-c:a', 'aac',
          '-b:a', '128k',
          '-shortest'
        ]);
      }
      
      ffmpegCommand
        .output(outputPath)
        .on('progress', (progress) => {
          job.progress = 75 + (progress.percent || 0) * 0.25;
        })
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    
    job.status = 'completed';
    job.progress = 100;
    job.videoPath = outputPath;
    job.completedAt = new Date();
    job.message = 'Slideshow generated successfully';
    
    // Clean up temp files but keep the video
    setCleanupTimer(tempFiles.filter(f => f !== outputPath));
    // Clean up the video after 1 hour
    setCleanupTimer([outputPath], 60 * 60 * 1000);
    
    console.log(`Slideshow Async: Slideshow generation completed for job ${jobId}`);
    
  } catch (error) {
    console.error(`Slideshow Async: Error in job ${jobId}:`, error);
    const job = slideshowJobs.get(jobId);
    job.status = 'failed';
    job.error = error.message;
    job.completedAt = new Date();
    cleanup(tempFiles);
  }
}

// List all slideshow jobs (for debugging)
app.get('/api/slideshow/jobs', (req, res) => {
  const jobList = Array.from(slideshowJobs.entries()).map(([id, job]) => ({
    jobId: id,
    status: job.status,
    progress: job.progress,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    slideCount: job.slides.length
  }));
  
  res.json({ jobs: jobList });
});

// Combined health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'WhatsApp Mockup + Slideshow Generator API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      whatsapp_mockup: 'active',
      slideshow_generator: 'active'
    },
    slideshow_jobs: {
      total: slideshowJobs.size,
      pending: Array.from(slideshowJobs.values()).filter(j => j.status === 'pending').length,
      processing: Array.from(slideshowJobs.values()).filter(j => j.status === 'generating_images' || j.status === 'creating_video').length,
      completed: Array.from(slideshowJobs.values()).filter(j => j.status === 'completed').length,
      failed: Array.from(slideshowJobs.values()).filter(j => j.status === 'failed').length
    }
  });
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