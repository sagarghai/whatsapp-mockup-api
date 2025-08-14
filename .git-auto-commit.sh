#!/bin/bash

# Auto-commit and push script for WhatsApp Mockup API
# Generated with Claude Code

COMMIT_MESSAGE="$1"
if [ -z "$COMMIT_MESSAGE" ]; then
    COMMIT_MESSAGE="Auto-update: $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo "🔄 Auto-committing changes..."

# Add all changes
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
    exit 0
fi

# Commit with message
git commit -m "$COMMIT_MESSAGE

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
if git push origin main; then
    echo "✅ Successfully committed and pushed to GitHub!"
    echo "🔗 View at: https://github.com/sagarghai/whatsapp-mockup-api"
else
    echo "❌ Failed to push to GitHub"
    exit 1
fi