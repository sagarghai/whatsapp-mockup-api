#!/bin/bash

# WhatsApp Mockup API - cURL Examples
# Make sure the server is running: PORT=3001 npm start

echo "🚀 WhatsApp Mockup API Test Examples"
echo "===================================="

# Function to extract filename from JSON response and download video
download_video() {
  local response="$1"
  local example_name="$2"
  
  # Extract filename using grep and sed (works on macOS)
  local filename=$(echo "$response" | grep -o '"filename":"[^"]*"' | sed 's/"filename":"//' | sed 's/"//')
  
  if [ -n "$filename" ]; then
    echo "📥 Downloading video: $filename"
    curl -s -o "$example_name.mp4" "http://localhost:3001/video/$filename"
    echo "✅ Saved as: $example_name.mp4"
  else
    echo "❌ Failed to extract filename from response"
    echo "Response: $response"
  fi
  echo ""
}

# Example 1: Basic chat without images
echo "📱 Example 1: Basic astrology consultation chat"
response=$(curl -s -X POST http://localhost:3001/api/generate-mockup \
  -F 'messages=[
    {"role":"user","text":"Hello, I wanted to ask about my career prospects this year"},
    {"role":"astrologer","text":"Namaste! I would be happy to help you with your career reading. Can you please share your birth details?"},
    {"role":"user","text":"I was born on March 15, 1990 at 2:30 PM in Mumbai"},
    {"role":"astrologer","text":"Thank you! Based on your chart, Jupiter is in your 10th house of career this year - very auspicious! ✨"},
    {"role":"user","text":"That sounds wonderful! What does this mean for job opportunities?"},
    {"role":"astrologer","text":"This indicates significant growth and new opportunities. June to September looks particularly favorable for career advancement."}
  ]' \
  -F 'astrologerName=Guru Acharya')

download_video "$response" "example1-basic-consultation"

# Example 2: Short motivational chat
echo "📱 Example 2: Short motivational reading"
response=$(curl -s -X POST http://localhost:3001/api/generate-mockup \
  -F 'messages=[
    {"role":"user","text":"I am feeling very confused about my life direction"},
    {"role":"astrologer","text":"I understand your confusion. The planets are currently in transition, which often brings uncertainty."},
    {"role":"astrologer","text":"But remember - every period of confusion is followed by clarity. Your Saturn return is helping you build a stronger foundation."},
    {"role":"user","text":"Thank you for the reassurance 🙏"},
    {"role":"astrologer","text":"Trust the process. The universe has beautiful plans for you! ✨🌟"}
  ]' \
  -F 'astrologerName=Spiritual Guide Maya')

download_video "$response" "example2-motivational"

# Example 3: Relationship advice
echo "📱 Example 3: Relationship guidance chat"
response=$(curl -s -X POST http://localhost:3001/api/generate-mockup \
  -F 'messages=[
    {"role":"user","text":"Can you tell me about my love life this year?"},
    {"role":"astrologer","text":"Of course! Venus is beautifully placed in your 7th house of relationships."},
    {"role":"astrologer","text":"This suggests harmony and deep connections. If you are single, someone special may enter your life around October."},
    {"role":"user","text":"Really? That gives me so much hope!"},
    {"role":"astrologer","text":"Yes! Keep your heart open and trust in divine timing. Love will find its way to you. 💕"}
  ]' \
  -F 'astrologerName=Love Guru Priya')

download_video "$response" "example3-relationship"

# Example 4: Health consultation  
echo "📱 Example 4: Health and wellness guidance"
response=$(curl -s -X POST http://localhost:3001/api/generate-mockup \
  -F 'messages=[
    {"role":"user","text":"I have been having health issues lately. What do the stars say?"},
    {"role":"astrologer","text":"I see Mars is affecting your 6th house of health. This can create inflammation and energy imbalances."},
    {"role":"user","text":"What should I do to improve my health?"},
    {"role":"astrologer","text":"Focus on cooling foods, meditation, and avoid spicy foods during this transit. Also consider yoga or gentle exercise."},
    {"role":"astrologer","text":"Wearing a blue sapphire or carrying a moonstone can help balance these energies. 🔮"},
    {"role":"user","text":"Thank you! This is very helpful guidance."}
  ]' \
  -F 'astrologerName=Health Advisor Ravi')

download_video "$response" "example4-health"

# Example 5: Success story testimonial
echo "📱 Example 5: Success story testimonial"
response=$(curl -s -X POST http://localhost:3001/api/generate-mockup \
  -F 'messages=[
    {"role":"user","text":"I wanted to thank you! Your prediction about my job came true!"},
    {"role":"astrologer","text":"That is wonderful news! I am so happy for you. Which prediction was it?"},
    {"role":"user","text":"You said I would get a promotion in September, and it happened exactly then!"},
    {"role":"astrologer","text":"The stars never lie! Your hard work combined with favorable planetary alignments created this success."},
    {"role":"user","text":"I will definitely recommend you to my friends and family"},
    {"role":"astrologer","text":"Thank you for your trust and faith. May you continue to prosper and achieve all your dreams! 🌟🙏"}
  ]' \
  -F 'astrologerName=Master Astrologer Sharma')

download_video "$response" "example5-testimonial"

# Health check
echo "🔍 Server Health Check"
curl -X GET http://localhost:3001/health

echo ""
echo ""
echo "📁 Generated files:"
ls -la example*.mp4 2>/dev/null || echo "No MP4 files found - check if server is running and generation succeeded"
echo ""
echo "🎬 Open the generated MP4 files to view your WhatsApp mockup videos!"
echo "💡 Tip: You can add -F 'astrologerImage=@./path/to/image.jpg' to include profile pictures"
echo "🎵 Tip: You can add -F 'backgroundAudio=@./path/to/music.mp3' for background audio"
echo ""
echo "📋 List all videos on server:"
echo "curl http://localhost:3001/videos"