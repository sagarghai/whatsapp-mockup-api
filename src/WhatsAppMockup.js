const { createCanvas, loadImage, registerFont } = require('canvas');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const SoundManager = require('./SoundManager');

ffmpeg.setFfmpegPath(ffmpegPath);

class WhatsAppMockup {
  constructor(options) {
    this.messages = options.messages || [];
    this.astrologerName = options.astrologerName || 'Astrologer';
    this.astrologerImage = options.astrologerImage;
    this.backgroundAudio = options.backgroundAudio;
    
    this.width = 376; // iPhone width (adjusted to be divisible by 2)
    this.height = 812; // iPhone height
    this.fps = 30;
    this.messageDelay = 2000; // 2 seconds between messages
    this.typingDelay = 1000; // 1 second typing indicator
    
    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');
    this.soundManager = new SoundManager();
    
    this.colors = {
      background: '#0a1014',
      chatBackground: '#111b21',
      userMessage: '#005c4b',
      astrologerMessage: '#1f2937',
      text: '#ffffff',
      timestamp: '#8696a0',
      header: '#202c33'
    };
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

    // Load astrologer image if provided
    let astrologerImg = null;
    if (this.astrologerImage && fs.existsSync(this.astrologerImage)) {
      astrologerImg = await loadImage(this.astrologerImage);
    }

    // Generate video frames
    await this.generateFrames(framesDir, astrologerImg);
    
    // Create video without sound first
    await this.createVideoFromFrames(framesDir, videoPath);
    
    // Create sound timeline
    const soundTimeline = this.soundManager.createSoundTimeline(
      this.messages, 
      this.messageDelay, 
      this.typingDelay
    );
    
    // Add sounds to video
    await this.soundManager.addSoundsToVideo(
      videoPath, 
      outputPath, 
      soundTimeline, 
      this.backgroundAudio
    );
    
    // Cleanup temporary files
    fs.rmSync(framesDir, { recursive: true, force: true });
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
    
    return outputPath;
  }

  async generateFrames(framesDir, astrologerImg) {
    let frameCount = 0;
    const messages = [...this.messages];
    const displayedMessages = [];

    // Initial empty chat frames (1 second)
    for (let i = 0; i < this.fps; i++) {
      this.drawFrame(displayedMessages, astrologerImg, false);
      await this.saveFrame(`${framesDir}/frame-${String(frameCount).padStart(6, '0')}.png`);
      frameCount++;
    }

    // Generate frames for each message
    for (let msgIndex = 0; msgIndex < messages.length; msgIndex++) {
      const message = messages[msgIndex];
      
      // Show typing indicator if it's from astrologer
      if (message.role === 'astrologer') {
        const typingFrames = Math.floor((this.typingDelay / 1000) * this.fps);
        for (let i = 0; i < typingFrames; i++) {
          this.drawFrame(displayedMessages, astrologerImg, true);
          await this.saveFrame(`${framesDir}/frame-${String(frameCount).padStart(6, '0')}.png`);
          frameCount++;
        }
      }

      // Add message to displayed messages
      displayedMessages.push(message);

      // Show message appears with animation
      const appearFrames = Math.floor(0.3 * this.fps); // 0.3 second animation
      for (let i = 0; i < appearFrames; i++) {
        const opacity = i / appearFrames;
        this.drawFrame(displayedMessages, astrologerImg, false, opacity);
        await this.saveFrame(`${framesDir}/frame-${String(frameCount).padStart(6, '0')}.png`);
        frameCount++;
      }

      // Hold message for delay
      const holdFrames = Math.floor((this.messageDelay / 1000) * this.fps);
      for (let i = 0; i < holdFrames; i++) {
        this.drawFrame(displayedMessages, astrologerImg, false);
        await this.saveFrame(`${framesDir}/frame-${String(frameCount).padStart(6, '0')}.png`);
        frameCount++;
      }
    }

    // Hold final frame for 2 seconds
    const finalFrames = Math.floor(2 * this.fps);
    for (let i = 0; i < finalFrames; i++) {
      this.drawFrame(displayedMessages, astrologerImg, false);
      await this.saveFrame(`${framesDir}/frame-${String(frameCount).padStart(6, '0')}.png`);
      frameCount++;
    }
  }

  drawFrame(messages, astrologerImg, showTyping = false, messageOpacity = 1) {
    // Clear canvas
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw header
    this.drawHeader(astrologerImg);

    // Draw messages
    let yOffset = 120; // Start below header
    const maxY = this.height - 80; // Leave space for input area

    // Calculate total height needed for all messages
    const messageHeights = messages.map(msg => this.calculateMessageHeight(msg));
    const totalHeight = messageHeights.reduce((sum, height) => sum + height + 15, 0);

    // If messages exceed screen, scroll up
    if (yOffset + totalHeight > maxY) {
      yOffset = maxY - totalHeight;
    }

    messages.forEach((message, index) => {
      const isLast = index === messages.length - 1;
      const opacity = isLast ? messageOpacity : 1;
      yOffset = this.drawMessage(message, yOffset, opacity);
      yOffset += 15; // Gap between messages
    });

    // Draw typing indicator
    if (showTyping) {
      this.drawTypingIndicator(yOffset);
    }

    // Draw input area
    this.drawInputArea();
  }

  drawHeader(astrologerImg) {
    // Header background
    this.ctx.fillStyle = this.colors.header;
    this.ctx.fillRect(0, 0, this.width, 100);

    // Back arrow
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = '20px Arial';
    this.ctx.fillText('‹', 20, 55);

    // Astrologer profile picture
    if (astrologerImg) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(60, 50, 20, 0, Math.PI * 2);
      this.ctx.clip();
      this.ctx.drawImage(astrologerImg, 40, 30, 40, 40);
      this.ctx.restore();
    } else {
      this.ctx.fillStyle = '#4a5568';
      this.ctx.beginPath();
      this.ctx.arc(60, 50, 20, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = this.colors.text;
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.astrologerName[0].toUpperCase(), 60, 55);
    }

    // Astrologer name
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(this.astrologerName, 90, 45);

    // Online status
    this.ctx.fillStyle = this.colors.timestamp;
    this.ctx.font = '12px Arial';
    this.ctx.fillText('online', 90, 62);

    // Menu dots
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('⋮', this.width - 20, 55);
  }

  calculateMessageHeight(message) {
    const maxWidth = 250;
    this.ctx.font = '14px Arial';
    const lines = this.wrapText(message.text, maxWidth);
    return lines.length * 20 + 30; // Line height + padding
  }

  drawMessage(message, yOffset, opacity = 1) {
    const isUser = message.role === 'user';
    const maxWidth = 250;
    const padding = 12;
    const borderRadius = 18;

    this.ctx.font = '14px Arial';
    const lines = this.wrapText(message.text, maxWidth);
    const messageHeight = lines.length * 20 + 30;
    const messageWidth = Math.max(100, Math.min(maxWidth, this.getTextWidth(message.text) + padding * 2));

    const x = isUser ? this.width - messageWidth - 20 : 20;
    const y = yOffset;

    // Set opacity
    this.ctx.globalAlpha = opacity;

    // Message bubble
    this.ctx.fillStyle = isUser ? this.colors.userMessage : this.colors.astrologerMessage;
    this.roundRect(x, y, messageWidth, messageHeight, borderRadius);
    this.ctx.fill();

    // Message text
    this.ctx.fillStyle = this.colors.text;
    this.ctx.textAlign = 'left';
    lines.forEach((line, index) => {
      this.ctx.fillText(line, x + padding, y + 25 + index * 20);
    });

    // Timestamp
    this.ctx.fillStyle = this.colors.timestamp;
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'right';
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.ctx.fillText(timestamp, x + messageWidth - padding, y + messageHeight - 8);

    // Message status (for user messages)
    if (isUser) {
      this.ctx.fillStyle = this.colors.timestamp;
      this.ctx.fillText('✓✓', x + messageWidth - 35, y + messageHeight - 8);
    }

    // Reset opacity
    this.ctx.globalAlpha = 1;

    return y + messageHeight;
  }

  drawTypingIndicator(yOffset) {
    const x = 20;
    const y = yOffset;
    const width = 60;
    const height = 40;

    this.ctx.fillStyle = this.colors.astrologerMessage;
    this.roundRect(x, y, width, height, 18);
    this.ctx.fill();

    // Typing dots animation
    this.ctx.fillStyle = this.colors.timestamp;
    for (let i = 0; i < 3; i++) {
      this.ctx.beginPath();
      this.ctx.arc(x + 15 + i * 12, y + 20, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawInputArea() {
    const y = this.height - 60;
    
    // Input background
    this.ctx.fillStyle = this.colors.header;
    this.ctx.fillRect(0, y, this.width, 60);

    // Input field
    this.ctx.fillStyle = this.colors.chatBackground;
    this.roundRect(10, y + 10, this.width - 60, 40, 20);
    this.ctx.fill();

    // Placeholder text
    this.ctx.fillStyle = this.colors.timestamp;
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Type a message', 25, y + 33);

    // Send button
    this.ctx.fillStyle = this.colors.userMessage;
    this.ctx.beginPath();
    this.ctx.arc(this.width - 25, y + 30, 18, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('➤', this.width - 25, y + 35);
  }

  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = this.ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  getTextWidth(text) {
    return this.ctx.measureText(text).width;
  }

  roundRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  async saveFrame(filepath) {
    const buffer = this.canvas.toBuffer('image/png');
    fs.writeFileSync(filepath, buffer);
  }

  async createVideoFromFrames(framesDir, outputPath) {
    return new Promise((resolve, reject) => {
      let command = ffmpeg()
        .input(`${framesDir}/frame-%06d.png`)
        .inputOptions(['-framerate', this.fps.toString()])
        .videoCodec('libx264')
        .outputOptions([
          '-pix_fmt', 'yuv420p',
          '-crf', '23'
        ]);

      // Add background audio if provided
      if (this.backgroundAudio && fs.existsSync(this.backgroundAudio)) {
        command = command.input(this.backgroundAudio);
        command = command.outputOptions([
          '-shortest',
          '-filter_complex', '[1:a]volume=0.3[bg];[bg]apad[audio]',
          '-map', '0:v',
          '-map', '[audio]'
        ]);
      }

      command
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }
}

module.exports = WhatsAppMockup;