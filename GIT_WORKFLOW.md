# Git Workflow Guide for Recovery+

## 🚀 Quick Commands (Your New Best Friends)

### Daily Development Workflow
```bash
# Option 1: Quick save with auto-generated message
git sync

# Option 2: Quick save with your own message  
git quick "Fix navigation bug"

# Option 3: Just save locally (no push)
git save
```

### Alternative with Helper Functions
```bash
# Load helpers (run once per terminal session)
source git-helpers.sh

# Then use simple commands:
gsync                    # Save and push everything
gquick "Your message"    # Custom message + push
gsave                    # Save locally only
gstatus                  # See what's changed
ghistory                 # View recent commits
```

## 🔄 Going Back in Time (Rollbacks)

### Safe Rollback (Recommended)
```bash
# Go back 1 commit (creates backup first)
grollback 1

# Go back 3 commits (creates backup first)  
grollback 3
```

### Manual Rollbacks
```bash
# Undo last commit but keep changes
git undo

# Go back 2 commits completely
git rollback 2

# See commit history to pick exact point
git history
git reset --hard COMMIT_HASH
```

## 📊 Checking Status

```bash
# Quick status check
gstatus

# Detailed git status
git status

# See recent commits
git history

# See all changes since last commit
git diff
```

## 🔧 Your Custom Git Aliases

| Command | What it does |
|---------|-------------|
| `git save` | Add all + commit with timestamp |
| `git sync` | Save + push to GitHub |
| `git quick "msg"` | Custom message + push |
| `git undo` | Undo last commit (keep changes) |
| `git rollback N` | Go back N commits |
| `git history` | Show recent commit graph |

## 🎯 Recommended Daily Workflow

### Before Starting Work
```bash
git pull  # Get latest from GitHub
```

### During Development (Every 15-30 minutes)
```bash
git sync  # Auto-save everything
```

### End of Day
```bash
git quick "End of day - completed X feature"
```

### When Something Breaks
```bash
ghistory              # See recent commits
grollback 1           # Go back safely
# Or find specific commit:
git reset --hard HASH # Go to exact point
```

## 🛡️ Safety Features

1. **Automatic Backups**: `grollback` creates backup branches
2. **Everything Tracked**: All changes automatically saved
3. **Easy Recovery**: Multiple ways to go back
4. **GitHub Backup**: Code always synced to cloud

## 💡 Pro Tips

1. **Commit Often**: Every small change = easy rollbacks
2. **Use Descriptive Messages**: `git quick "Fix login validation"` 
3. **Check Status**: Use `gstatus` before big changes
4. **Create Branches**: For experimental features
   ```bash
   git checkout -b feature/new-idea
   git push -u origin feature/new-idea
   ```

## 🚨 Emergency Recovery

If you mess up badly:
```bash
# See all your commits (even "lost" ones)
git reflog

# Go back to any point you see
git reset --hard HEAD@{2}

# Or check your backup branches
git branch -a
git checkout backup-YYYYMMDD-HHMMSS
```

Your code is ALWAYS recoverable! 🎉
