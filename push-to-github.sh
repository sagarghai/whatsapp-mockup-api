#!/bin/bash

echo "🚀 Pushing to GitHub..."
echo "You may be prompted for your GitHub username and password/token"
echo ""

# Push to GitHub
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🔗 Repository: https://github.com/sagarghai/whatsapp-mockup-api"
else
    echo "❌ Push failed. You may need to:"
    echo "1. Set up GitHub CLI: gh auth login"
    echo "2. Or configure git credentials"
    echo "3. Or use a personal access token"
fi