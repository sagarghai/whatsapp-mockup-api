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

  // Generate WhatsApp-style notification sounds using tone generation
  async generateNotificationSounds() {
    const sendSoundPath = path.join(this.soundsDir, 'send.wav');
    const receiveSoundPath = path.join(this.soundsDir, 'receive.wav');

    // Generate send sound (higher pitch, quick)
    await this.generateTone(sendSoundPath, 800, 0.1, 0.3);
    
    // Generate receive sound (lower pitch, slightly longer)
    await this.generateTone(receiveSoundPath, 600, 0.15, 0.4);

    return {
      send: sendSoundPath,
      receive: receiveSoundPath
    };
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

  // Add sounds to video using FFmpeg
  async addSoundsToVideo(videoPath, outputPath, soundTimeline, backgroundAudio = null) {
    return new Promise(async (resolve, reject) => {
      try {
        // Generate notification sounds if they don't exist
        const sounds = await this.generateNotificationSounds();
        
        let filterComplex = '';
        let inputs = [`-i "${videoPath}"`];
        let mapInputs = ['0:v'];

        // Add sound files as inputs
        inputs.push(`-i "${sounds.send}"`);
        inputs.push(`-i "${sounds.receive}"`);

        // Create audio timeline
        let audioMix = '';
        soundTimeline.forEach((sound, index) => {
          const inputIndex = sound.sound === 'send' ? 1 : 2;
          const delay = sound.time;
          
          if (index === 0) {
            audioMix = `[${inputIndex}:a]adelay=${Math.floor(delay * 1000)}|${Math.floor(delay * 1000)}[a${index}]`;
          } else {
            audioMix += `;[${inputIndex}:a]adelay=${Math.floor(delay * 1000)}|${Math.floor(delay * 1000)}[a${index}]`;
          }
        });

        // Mix all notification sounds
        if (soundTimeline.length > 0) {
          const audioInputs = soundTimeline.map((_, i) => `[a${i}]`).join('');
          audioMix += `;${audioInputs}amix=inputs=${soundTimeline.length}:duration=longest[notifications]`;
        }

        // Add background audio if provided
        if (backgroundAudio && fs.existsSync(backgroundAudio)) {
          inputs.push(`-i "${backgroundAudio}"`);
          if (soundTimeline.length > 0) {
            audioMix += `;[notifications][${inputs.length - 1}:a]amix=inputs=2:weights=1 0.3[final]`;
            mapInputs.push('[final]');
          } else {
            audioMix += `;[${inputs.length - 1}:a]volume=0.3[final]`;
            mapInputs.push('[final]');
          }
        } else if (soundTimeline.length > 0) {
          mapInputs.push('[notifications]');
        }

        const command = [
          'ffmpeg',
          ...inputs,
          '-filter_complex', `"${audioMix}"`,
          '-map', mapInputs.join(' -map '),
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-shortest',
          `"${outputPath}"`
        ].join(' ');

        const { exec } = require('child_process');
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(outputPath);
          }
        });

      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = SoundManager;