#!/bin/bash

# Git Workflow Helpers for Recovery+ Project
# Usage: source git-helpers.sh

# Quick save current work
gsave() {
    echo "💾 Saving current work..."
    git add -A
    git commit -m "Save progress: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "✅ Work saved locally"
}

# Sync to GitHub 
gsync() {
    echo "🔄 Syncing to GitHub..."
    git add -A
    git commit -m "Sync: $(date '+%Y-%m-%d %H:%M:%S')"
    git push
    echo "✅ Synced to GitHub"
}

# Quick commit with custom message
gquick() {
    local message="${1:-Quick save: $(date '+%Y-%m-%d %H:%M:%S')}"
    echo "🚀 Quick commit: $message"
    git add -A
    git commit -m "$message"
    git push
    echo "✅ Committed and pushed"
}

# Show recent history
ghistory() {
    echo "📚 Recent commit history:"
    git log --oneline --graph --decorate -10
}

# Safe rollback (creates backup branch first)
grollback() {
    local steps="${1:-1}"
    echo "⚠️  Creating backup branch before rollback..."
    git branch "backup-$(date '+%Y%m%d-%H%M%S')"
    echo "🔄 Rolling back $steps commit(s)..."
    git reset --hard "HEAD~$steps"
    echo "✅ Rolled back. Backup branch created."
}

# Show what's changed
gstatus() {
    echo "📊 Current status:"
    git status --short
    echo ""
    echo "📚 Recent commits:"
    git log --oneline -5
}

# Notification versions with visual feedback
gsync-notify() {
    echo "🔄 Syncing to GitHub..."
    git add -A
    git commit -m "Sync: $(date '+%Y-%m-%d %H:%M:%S')"
    if git push; then
        echo "✅ Successfully synced to GitHub! 🚀"
    else
        echo "❌ Sync failed! Check your connection."
    fi
}

gquick-notify() {
    local message="${1:-Quick save: $(date '+%Y-%m-%d %H:%M:%S')}"
    echo "🚀 Quick commit: $message"
    git add -A
    git commit -m "$message"
    if git push; then
        echo "✅ Committed and pushed successfully! 🎉"
    else
        echo "❌ Commit/push failed! Check your connection."
    fi
}

echo "🔧 Git helpers loaded!"
echo "Available commands: gsave, gsync, gquick, ghistory, grollback, gstatus"
echo "📢 Notification versions: gsync-notify, gquick-notify"
