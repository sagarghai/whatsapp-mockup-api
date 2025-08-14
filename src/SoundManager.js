const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

class SoundManager {
  constructor() {
    this.soundsDir = 'assets/sounds';
    this.ensureSoundsDirectory();
  }

  ensureSoundsDirectory() {
    if (!fs.existsSync(this.soundsDir)) {
      fs.mkdirSync(this.soundsDir, { recursive: true });
    }
  }

  // Generate iOS WhatsApp-style notification sounds
  async generateNotificationSounds() {
    const sendSoundPath = path.join(this.soundsDir, 'send.wav');
    const receiveSoundPath = path.join(this.soundsDir, 'receive.wav');

    // Generate iOS WhatsApp send sound (swoosh-like, ascending pitch)
    await this.generateSendSound(sendSoundPath);
    
    // Generate iOS WhatsApp receive sound (gentle bell/pop)
    await this.generateReceiveSound(receiveSoundPath);

    return {
      send: sendSoundPath,
      receive: receiveSoundPath
    };
  }

  // Generate iOS WhatsApp send sound (swoosh effect with pitch sweep)
  async generateSendSound(outputPath) {
    return new Promise((resolve, reject) => {
      // Create a swoosh-like sound with frequency sweep
      ffmpeg()
        .input('sine=frequency=1000:duration=0.15')
        .inputFormat('lavfi')
        .audioFilters([
          // Apply pitch sweep from 1000Hz to 1400Hz
          'afade=t=in:ss=0:d=0.02',
          'afade=t=out:ss=0.13:d=0.02',
          'highpass=f=800',
          'lowpass=f=2000',
          'volume=0.4',
          // Add some reverb for swoosh effect
          'aecho=0.8:0.9:40:0.25'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  // Generate iOS WhatsApp receive sound (gentle pop/bell)
  async generateReceiveSound(outputPath) {
    return new Promise((resolve, reject) => {
      // Create a gentle bell-like pop sound
      ffmpeg()
        .input('sine=frequency=600:duration=0.2')
        .inputFormat('lavfi')
        .audioFilters([
          // Quick attack, gentle decay
          'afade=t=in:ss=0:d=0.005',
          'afade=t=out:ss=0.1:d=0.1',
          'highpass=f=400',
          'lowpass=f=1200',
          'volume=0.35',
          // Add subtle harmonics for bell-like quality
          'tremolo=f=5:d=0.3'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  async generateTone(outputPath, frequency, duration, volume) {
    return new Promise((resolve, reject) => {
      // Generate sine wave tone using FFmpeg
      ffmpeg()
        .input(`sine=frequency=${frequency}:duration=${duration}`)
        .inputFormat('lavfi')
        .audioFilters([
          `volume=${volume}`,
          'highpass=f=300',
          'lowpass=f=3000'
        ])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  // Create sound timeline for messages
  createSoundTimeline(messages, messageDelay, typingDelay) {
    const timeline = [];
    let currentTime = 1.0; // Start after 1 second

    messages.forEach((message, index) => {
      // Add typing delay for astrologer messages
      if (message.role === 'astrologer') {
        currentTime += typingDelay / 1000;
      }

      // Add message sound
      const soundType = message.role === 'user' ? 'send' : 'receive';
      timeline.push({
        time: currentTime,
        sound: soundType
      });

      // Add delay for next message
      currentTime += messageDelay / 1000;
    });

    return timeline;
  }

  // Add sounds to video using fluent-ffmpeg
  async addSoundsToVideo(videoPath, outputPath, soundTimeline, backgroundAudio = null) {
    return new Promise(async (resolve, reject) => {
      try {
        // Generate notification sounds if they don't exist
        const sounds = await this.generateNotificationSounds();
        console.log('Generated sounds:', sounds);
        
        // For now, let's use a simpler approach with fluent-ffmpeg
        // Just mix the notification sounds at their respective times
        if (soundTimeline.length === 0) {
          // No sounds to add, just copy the video
          return this.copyVideo(videoPath, outputPath, resolve, reject);
        }

        // Create a simple sound mix with first few sounds to test
        const command = ffmpeg(videoPath);
        
        // Add sound inputs
        command.input(sounds.send);
        command.input(sounds.receive);
        
        // Create a basic filter to add sounds at specific times
        const filters = [];
        soundTimeline.forEach((soundEvent, index) => {
          if (index < 3) { // Limit to first 3 sounds for testing
            const soundInput = soundEvent.sound === 'send' ? 1 : 2;
            const delay = Math.floor(soundEvent.time * 1000);
            filters.push(`[${soundInput}:a]adelay=${delay}|${delay}[sound${index}]`);
          }
        });
        
        // Mix the first few delayed sounds
        if (filters.length > 0) {
          const soundLabels = filters.map((_, i) => `[sound${i}]`).join('');
          filters.push(`${soundLabels}amix=inputs=${filters.length}:dropout_transition=0[soundmix]`);
          
          // Mix with original video audio
          filters.push(`[0:a][soundmix]amix=inputs=2:weights=0.7 0.8[final]`);
          
          command.complexFilter(filters);
          command.audioCodec('aac');
          command.outputOptions(['-map', '0:v', '-map', '[final]']);
        } else {
          command.audioCodec('copy');
        }
        
        command
          .videoCodec('copy')
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('Sound mixing command:', commandLine);
          })
          .on('stderr', (stderrLine) => {
            console.log('Sound mixing stderr:', stderrLine);
          })
          .on('end', () => {
            console.log('Sound mixing completed successfully');
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.error('Sound mixing error:', err);
            reject(err);
          })
          .run();

      } catch (error) {
        console.error('Error in addSoundsToVideo:', error);
        reject(error);
      }
    });
  }
  
  // Helper method to copy video without sound processing
  copyVideo(videoPath, outputPath, resolve, reject) {
    ffmpeg(videoPath)
      .videoCodec('copy')
      .audioCodec('copy')
      .output(outputPath)
      .on('end', () => {
        console.log('Video copied successfully (no sounds)');
        resolve(outputPath);
      })
      .on('error', reject)
      .run();
  }
}

module.exports = SoundManager;