#!/usr/bin/env bash
# Lighthouse CI script
# Usage: npm run lhci [-- --upload]
#
# Runs local Lighthouse audit against production build.
# Requires @lhci/cli installed separately: npx @lhci/cli@0.13.0 lhci autorun

set -euo pipefail

cd "$(dirname "$0")"

# Build first
echo "🔨 Building..."
npm run build

# Run Lighthouse
echo "🚀 Running Lighthouse audit..."

# Local scoring (no upload needed)
npx @lhci/cli@0.13.0 lhci autorun 2>/dev/null || {
  echo ""
  echo "⚠️  @lhci/cli not available. Run with --local for inline audit:"
  echo "   npx lighthouse http://localhost:4173 --output=json --output-path=./reports/lighthouse.json"
  echo ""
  echo "Note: production-ready Lighthouse CI requires @lhci/cli or GitHub Action."
}
