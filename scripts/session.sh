#!/usr/bin/env bash
# scripts/session.sh — LLM agent session lifecycle automation.
#
# Usage:
#   ./scripts/session.sh start   # Print latest context (worklog top + NEXT.md + git status)
#   ./scripts/session.sh end     # Generate worklog entry draft from git log, commit, push
#   ./scripts/session.sh push    # Just push current commits to origin
#
# This script keeps WORKLOG.md and NEXT.md in sync with git history.
# A new LLM agent runs `start` to get oriented; runs `end` before closing
# a session to capture decisions + push to GitHub.

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

WORKLOG="WORKLOG.md"
NEXT="NEXT.md"
DATE=$(date +%Y-%m-%d)

case "${1:-help}" in

  start)
    echo "════════════════════════════════════════════════════════════════"
    echo "  SESSION START — $(date '+%Y-%m-%d %H:%M %Z')"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "─── LATEST WORKLOG ENTRY (most recent context) ───"
    echo ""
    # Print from the first "## " line to the next "---" separator
    awk '/^## /{found=1} found{print} found&&/^---$/{exit}' "$WORKLOG" | head -40
    echo ""
    echo "─── NEXT.md (what to do) ───"
    echo ""
    cat "$NEXT"
    echo ""
    echo "─── GIT STATUS ───"
    git status --short
    echo ""
    echo "─── RECENT COMMITS ───"
    git log --oneline -5
    echo ""
    echo "─── REMOTE SYNC ───"
    LOCAL=$(git rev-parse main 2>/dev/null || echo "?")
    REMOTE=$(git rev-parse origin/main 2>/dev/null || echo "?")
    if [ "$LOCAL" = "$REMOTE" ]; then
      echo "✓ In sync with origin/main"
    else
      AHEAD=$(git rev-list --count origin/main..main 2>/dev/null || echo "?")
      BEHIND=$(git rev-list --count main..origin/main 2>/dev/null || echo "?")
      echo "⚠ Diverged: local $AHEAD ahead, $BEHIND behind origin/main"
      echo "  Run: ./scripts/session.sh push   (or git pull --rebase first if behind)"
    fi
    echo ""
    echo "─── CODEBASE-MEMORY-MCP INDEX STATUS ───"
    if command -v npx &>/dev/null && [ -f node_modules/codebase-memory-mcp/bin.js ]; then
      CHANGES=$(npx codebase-memory-mcp cli detect_changes '{"project": "home-z-justlovejazz"}' 2>/dev/null | grep -o '"changed_count":[0-9]*' | cut -d: -f2)
      if [ "$CHANGES" = "0" ] || [ -z "$CHANGES" ]; then
        echo "✓ Index up to date (0 changed files)"
      else
        echo "⚠ Index stale: $CHANGES changed files since last index"
        echo "  Re-index: npx codebase-memory-mcp cli index_repository '{\"repo_path\": \"'$(pwd)'\"}'"
      fi
    else
      echo "ℹ codebase-memory-mcp not installed (optional — skip if unused)"
    fi
    echo ""
    echo "Read AGENTS.md first if this is a fresh context."
    ;;

  end)
    echo "─── SESSION END — generating worklog entry ───"
    echo ""

    # Check for uncommitted changes
    if git diff --quiet && git diff --cached --quiet; then
      echo "No uncommitted changes. Skipping worklog entry."
    else
      # Generate entry draft
      COMMITS=$(git log --oneline origin/main..HEAD 2>/dev/null | wc -l | tr -d ' ')
      if [ "$COMMITS" = "0" ]; then
        COMMITS="uncommitted"
      fi

      ENTRY=$(cat <<EOF

---

## $DATE — [session goal: describe in one line]

### Done
- (list what was accomplished this session)

### Key decisions (WHY)
- (capture WHY decisions were made — this is the value over git log)

### Files touched
$(git diff --name-only HEAD 2>/dev/null | sed 's/^/- /' | head -20)

### Next
- (update NEXT.md with new items or check off completed ones)

EOF
)
      echo "Draft entry (review + edit WORKLOG.md):"
      echo "$ENTRY"
      echo ""

      # Prepend the entry to WORKLOG.md (after the header block)
      HEADER_END=$(awk '/^---$/{print NR; exit}' "$WORKLOG")
      if [ -n "$HEADER_END" ]; then
        TMP=$(mktemp)
        head -n "$HEADER_END" "$WORKLOG" > "$TMP"
        echo "$ENTRY" >> "$TMP"
        tail -n +$((HEADER_END + 1)) "$WORKLOG" >> "$TMP"
        mv "$TMP" "$WORKLOG"
        echo "✓ Draft entry prepended to $WORKLOG (edit the [session goal] + Done + Decisions)"
      else
        echo "⚠ Could not find header separator in $WORKLOG — entry not added."
      fi
    fi

    echo ""
    echo "─── Reminder: update NEXT.md ───"
    echo "  - Move completed items to [x] in the Done section"
    echo "  - Add new TODO items discovered this session"
    echo ""
    echo "─── To commit + push ───"
    echo "  ./scripts/session.sh push"
    ;;

  push)
    echo "─── PUSH to origin/main ───"
    # Pull --rebase first if behind (handles diverged branches)
    BEHIND=$(git rev-list --count main..origin/main 2>/dev/null || echo "0")
    if [ "$BEHIND" -gt "0" ]; then
      echo "Remote is $BEHIND commits ahead — pulling with rebase..."
      git pull --rebase origin main
    fi

    # Stage worklog + next if modified
    git add WORKLOG.md NEXT.md 2>/dev/null || true

    # Commit if there are staged changes
    if ! git diff --cached --quiet; then
      echo "Committing worklog/next updates..."
      git commit -m "chore: session worklog + next update ($DATE)" --no-verify || true
    fi

    echo "Pushing to origin/main..."
    git push origin main
    echo "✓ Push complete."

    # Re-index codebase-memory-mcp so the graph stays current
    if [ -f node_modules/codebase-memory-mcp/bin.js ]; then
      echo ""
      echo "─── Re-indexing codebase-memory-mcp ───"
      npx codebase-memory-mcp cli index_repository "{\"repo_path\": \"$(pwd)\"}" 2>/dev/null | grep -o '"status":"[a-z]*"' | head -1
    fi

    echo ""
    git log --oneline -3
    ;;

  help|*)
    cat <<EOF
scripts/session.sh — LLM agent session lifecycle

Commands:
  start   Print latest worklog entry + NEXT.md + git status + sync state.
          Run this at the beginning of a new context window.

  end     Generate a worklog entry draft from git log, prepend to WORKLOG.md.
          Edit the draft (fill in session goal, done, decisions) before push.

  push    Commit worklog/next updates + push to origin/main.
          Auto-rebases if remote is ahead.

Workflow:
  1. Fresh context → ./scripts/session.sh start  (get oriented)
  2. Read AGENTS.md + STATUS.md for full context
  3. Pick a task from NEXT.md "TODO" section
  4. Work on it (move to "In Progress" in NEXT.md)
  5. Before closing → ./scripts/session.sh end    (draft worklog entry)
  6. Edit WORKLOG.md entry (fill placeholders)
  7. Update NEXT.md (check off done items, add new ones)
  8. ./scripts/session.sh push                    (commit + push to GitHub)
EOF
    ;;
esac
