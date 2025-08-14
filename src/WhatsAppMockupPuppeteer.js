const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const SoundManager = require('./SoundManager');

ffmpeg.setFfmpegPath(ffmpegPath);

class WhatsAppMockupPuppeteer {
  constructor(options) {
    this.messages = options.messages || [];
    this.astrologerName = options.astrologerName || 'Astrologer';
    this.astrologerImage = options.astrologerImage;
    this.backgroundAudio = options.backgroundAudio;
    
    this.width = 376;
    this.height = 812;
    this.fps = 30;
    this.messageDelay = 2000;
    this.typingDelay = 1000;
    
    // Initialize sound manager
    this.soundManager = new SoundManager();
  }

  generateHTML(messages, showTyping = false, messageOpacity = 1) {
    const astrologerImageSrc = this.astrologerImage ? 
      `data:image/jpeg;base64,${fs.readFileSync(this.astrologerImage, 'base64')}` : 
      null;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WhatsApp Mockup</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                background: #efeae2;
                width: 376px;
                height: 812px;
                overflow: hidden;
                position: relative;
            }
            
            .header {
                background: #075e54;
                height: 100px;
                display: flex;
                align-items: center;
                padding: 0 20px;
                color: white;
                position: relative;
            }
            
            .back-arrow {
                font-size: 20px;
                margin-right: 20px;
            }
            
            .profile-pic {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #4a5568;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                overflow: hidden;
            }
            
            .profile-pic img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .profile-pic .initial {
                color: white;
                font-size: 14px;
                font-weight: bold;
            }
            
            .profile-info h3 {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 2px;
            }
            
            .profile-info .status {
                font-size: 12px;
                color: #8696a0;
            }
            
            .menu-dots {
                position: absolute;
                right: 20px;
                font-size: 20px;
            }
            
            .chat-area {
                background: #efeae2;
                height: 450px;
                padding: 20px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
            }
            
            .message {
                margin-bottom: 15px;
                display: flex;
                opacity: ${messageOpacity};
                transition: opacity 0.3s ease;
            }
            
            .message.user {
                justify-content: flex-end;
            }
            
            .message.astrologer {
                justify-content: flex-start;
            }
            
            .message-bubble {
                max-width: 250px;
                padding: 12px;
                border-radius: 18px;
                position: relative;
                word-wrap: break-word;
            }
            
            .message.user .message-bubble {
                background: #dcf8c6;
                color: #303030;
                border-bottom-right-radius: 4px;
            }
            
            .message.astrologer .message-bubble {
                background: #ffffff;
                color: #303030;
                border-bottom-left-radius: 4px;
            }
            
            .message-time {
                font-size: 10px;
                color: #667781;
                margin-top: 4px;
                text-align: right;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 4px;
            }
            
            .message.user .message-time::after {
                content: '✓✓';
                color: #4fc3f7;
                font-size: 10px;
            }
            
            .typing-indicator {
                display: flex;
                justify-content: flex-start;
                margin-bottom: 15px;
            }
            
            .typing-bubble {
                background: #ffffff;
                border-radius: 18px;
                border-bottom-left-radius: 4px;
                padding: 15px 20px;
                display: ${showTyping ? 'flex' : 'none'};
                align-items: center;
                gap: 4px;
            }
            
            .typing-dot {
                width: 6px;
                height: 6px;
                background: #667781;
                border-radius: 50%;
                animation: typing 1.4s infinite ease-in-out;
            }
            
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }
            
            @keyframes typing {
                0%, 60%, 100% { transform: scale(1); opacity: 0.4; }
                30% { transform: scale(1.2); opacity: 1; }
            }
            
            .input-area {
                background: #f0f0f0;
                height: 60px;
                display: flex;
                align-items: center;
                padding: 0 10px;
                gap: 10px;
            }
            
            .input-field {
                flex: 1;
                background: #ffffff;
                border: none;
                border-radius: 20px;
                padding: 12px 16px;
                color: #667781;
                font-size: 14px;
            }
            
            .send-button {
                width: 36px;
                height: 36px;
                background: #075e54;
                border: none;
                border-radius: 50%;
                color: white;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .keyboard {
                background: #d1d5db;
                height: 202px;
                padding: 8px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                border-top: 1px solid #9ca3af;
            }
            
            .keyboard-row {
                display: flex;
                gap: 4px;
                justify-content: center;
            }
            
            .key {
                background: #ffffff;
                border: 1px solid #9ca3af;
                border-radius: 4px;
                padding: 8px;
                font-size: 14px;
                font-weight: 500;
                color: #374151;
                min-width: 28px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }
            
            .key.wide {
                flex: 1;
                min-width: 120px;
            }
            
            .key.medium {
                min-width: 45px;
            }
            
            .spacer {
                flex: 1;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="back-arrow">‹</div>
            <div class="profile-pic">
                ${astrologerImageSrc ? 
                  `<img src="${astrologerImageSrc}" alt="Profile">` : 
                  `<div class="initial">${this.astrologerName[0].toUpperCase()}</div>`
                }
            </div>
            <div class="profile-info">
                <h3>${this.astrologerName}</h3>
                <div class="status">online</div>
            </div>
            <div class="menu-dots">⋮</div>
        </div>
        
        <div class="chat-area">
            <div class="spacer"></div>
            ${messages.map((message, index) => {
                const isLast = index === messages.length - 1;
                const opacity = isLast ? messageOpacity : 1;
                return `
                    <div class="message ${message.role}" style="opacity: ${opacity}">
                        <div class="message-bubble">
                            ${message.text}
                            <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>
                `;
            }).join('')}
            
            <div class="typing-indicator">
                <div class="typing-bubble">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
        
        <div class="input-area">
            <input type="text" class="input-field" placeholder="Type a message">
            <button class="send-button">➤</button>
        </div>
        
        <div class="keyboard">
            <div class="keyboard-row">
                <div class="key">Q</div>
                <div class="key">W</div>
                <div class="key">E</div>
                <div class="key">R</div>
                <div class="key">T</div>
                <div class="key">Y</div>
                <div class="key">U</div>
                <div class="key">I</div>
                <div class="key">O</div>
                <div class="key">P</div>
            </div>
            <div class="keyboard-row">
                <div class="key">A</div>
                <div class="key">S</div>
                <div class="key">D</div>
                <div class="key">F</div>
                <div class="key">G</div>
                <div class="key">H</div>
                <div class="key">J</div>
                <div class="key">K</div>
                <div class="key">L</div>
            </div>
            <div class="keyboard-row">
                <div class="key medium">⇧</div>
                <div class="key">Z</div>
                <div class="key">X</div>
                <div class="key">C</div>
                <div class="key">V</div>
                <div class="key">B</div>
                <div class="key">N</div>
                <div class="key">M</div>
                <div class="key medium">⌫</div>
            </div>
            <div class="keyboard-row">
                <div class="key medium">123</div>
                <div class="key medium">🌐</div>
                <div class="key wide">space</div>
                <div class="key medium">return</div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async generateVideo() {
    const outputId = uuidv4();
    const framesDir = `temp/frames-${outputId}`;
    const videoPath = `temp/video-${outputId}.mp4`;
    const outputPath = `output/mockup-${outputId}.mp4`;
    
    // Create frames directory
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    await this.generateFrames(framesDir);
    await this.createVideoFromFrames(framesDir, videoPath);
    await this.addSoundsToVideo(videoPath, outputPath);
    
    // Cleanup temporary files
    fs.rmSync(framesDir, { recursive: true, force: true });
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
    
    return outputPath;
  }

  async generateFrames(framesDir) {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: this.width, height: this.height });
    
    let frameCount = 0;
    const messages = [...this.messages];
    const displayedMessages = [];

    // Initial empty chat frames (1 second)
    const emptyHTML = this.generateHTML([], false, 1);
    await page.setContent(emptyHTML);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    for (let i = 0; i < this.fps; i++) {
      await page.screenshot({ 
        path: `${framesDir}/frame-${String(frameCount).padStart(6, '0')}.png`,
        type: 'png'
      });
      frameCount++;
    }

    // Generate frames for each message
    for (let msgIndex = 0; msgIndex < messages.length; msgIndex++) {
      const message = messages[msgIndex];
      
      // Show typing indicator if it's from astrologer
      if (message.role === 'astrologer') {
        const typingHTML = this.generateHTML(displayedMessages, true, 1);
        await page.setContent(typingHTML);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const typingFrames = Math.floor((this.typingDelay / 1000) * this.fps);
        for (let i = 0; i < typingFrames; i++) {
          await page.screenshot({ 
            path: `${framesDir}/frame-${String(frameCount).padStart(6, '0')}.png`,
            type: 'png'
          });
          frameCount++;
        }
      }

      // Add message to displayed messages
      displayedMessages.push(message);

      // Show message appears with animation
      const appearFrames = Math.floor(0.3 * this.fps);
      for (let i = 0; i < appearFrames; i++) {
        const opacity = i / appearFrames;
        const messageHTML = this.generateHTML(displayedMessages, false, opacity);
        await page.setContent(messageHTML);
        await new Promise(resolve => setTimeout(resolve, 50));
        
        await page.screenshot({ 
          path: `${framesDir}/frame-${String(frameCount).padStart(6, '0')}.png`,
          type: 'png'
        });
        frameCount++;
      }

      // Hold message for delay
      const messageHTML = this.generateHTML(displayedMessages, false, 1);
      await page.setContent(messageHTML);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const holdFrames = Math.floor((this.messageDelay / 1000) * this.fps);
      for (let i = 0; i < holdFrames; i++) {
        await page.screenshot({ 
          path: `${framesDir}/frame-${String(frameCount).padStart(6, '0')}.png`,
          type: 'png'
        });
        frameCount++;
      }
    }

    // Hold final frame for 2 seconds
    const finalFrames = Math.floor(2 * this.fps);
    for (let i = 0; i < finalFrames; i++) {
      await page.screenshot({ 
        path: `${framesDir}/frame-${String(frameCount).padStart(6, '0')}.png`,
        type: 'png'
      });
      frameCount++;
    }

    await browser.close();
  }

  async createVideoFromFrames(framesDir, outputPath) {
    return new Promise((resolve, reject) => {
      console.log(`Creating video from frames in ${framesDir}`);
      
      ffmpeg()
        .input(`${framesDir}/frame-%06d.png`)
        .inputOptions(['-framerate', this.fps.toString()])
        // Add silent audio track for QuickTime compatibility
        .input('anullsrc=channel_layout=stereo:sample_rate=44100')
        .inputOptions(['-f', 'lavfi'])
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-pix_fmt', 'yuv420p',
          '-profile:v', 'main',  // Use Main profile instead of High for better compatibility
          '-level', '3.1',       // Specify H.264 level
          '-crf', '23',
          '-movflags', '+faststart', // Optimize for web playback
          '-shortest',           // Match video length to shortest input
          '-ac', '2',            // Stereo audio
          '-ar', '44100',        // 44.1kHz sample rate
          '-b:a', '128k'         // Audio bitrate
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command: ' + commandLine);
        })
        .on('stderr', (stderrLine) => {
          console.log('FFmpeg stderr: ' + stderrLine);
        })
        .on('end', () => {
          console.log('Video creation completed successfully');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('FFmpeg error during video creation:', err);
          reject(err);
        })
        .run();
    });
  }

  async addSoundsToVideo(videoPath, outputPath) {
    try {
      console.log('Adding iOS WhatsApp-style sounds to video...');
      
      // Create sound timeline based on messages
      const soundTimeline = this.soundManager.createSoundTimeline(
        this.messages,
        this.messageDelay,
        this.typingDelay
      );
      
      console.log('Sound timeline created:', soundTimeline);
      
      // Use SoundManager to add sounds to video
      return await this.soundManager.addSoundsToVideo(
        videoPath,
        outputPath,
        soundTimeline,
        this.backgroundAudio
      );
      
    } catch (error) {
      console.error('Error adding sounds to video:', error);
      // Fall back to simple copy if sound processing fails
      console.log('Falling back to simple video copy...');
      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .videoCodec('copy')
          .audioCodec('copy')
          .output(outputPath)
          .on('end', () => {
            console.log('Video processing completed (fallback)');
            resolve(outputPath);
          })
          .on('error', reject)
          .run();
      });
    }
  }
}

module.exports = WhatsAppMockupPuppeteer;