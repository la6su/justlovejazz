#!/usr/bin/env bash
# scripts/session.sh — safe orientation helpers for a PR-first workflow.

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

WORKLOG="WORKLOG.md"
NEXT="NEXT.md"
BRANCH=$(git branch --show-current)

case "${1:-help}" in
  start)
    echo "══ SESSION START ══"
    echo "Branch: $BRANCH"
    echo ""
    echo "── Latest worklog context ──"
    sed -n '1,70p' "$WORKLOG"
    echo ""
    echo "── Open backlog ──"
    cat "$NEXT"
    echo ""
    echo "── Working tree ──"
    git status --short
    echo ""
    echo "── Relative to origin/main ──"
    if git rev-parse --verify origin/main >/dev/null 2>&1; then
      AHEAD=$(git rev-list --count origin/main..HEAD)
      BEHIND=$(git rev-list --count HEAD..origin/main)
      echo "$AHEAD ahead, $BEHIND behind"
    else
      echo "origin/main is not available locally; run git fetch origin --prune"
    fi
    ;;

  end)
    cat <<'EOF'
── SESSION END ──

Update WORKLOG.md manually with a short newest-first entry:

## YYYY-MM-DD — concise decision

### Decision
- What changed and why.

### Verification
- Checks run and any environment limitation.

Then update NEXT.md only if an open backlog item changed state. Review the
scoped diff, commit on the feature branch, push it and open a pull request.
EOF
    ;;

  push)
    if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
      echo "Refusing to push a default branch directly. Create a feature branch and open a PR."
      exit 1
    fi
    git diff --check
    git push -u origin HEAD
    ;;

  help|*)
    cat <<'EOF'
scripts/session.sh — orientation helpers

Commands:
  start   Show the latest context, open backlog and branch divergence.
  end     Print the worklog/commit reminder; does not edit or push anything.
  push    Push the current non-default branch after git diff --check.

Publishing remains PR-first. See AGENTS.md and docs/DEVELOPMENT.md.
EOF
    ;;
esac
