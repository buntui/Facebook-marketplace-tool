#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXTENSION="$ROOT/extension"
OUT="$ROOT/ios"

rm -rf "$OUT"

xcrun safari-web-extension-converter "$EXTENSION"   --project-location "$OUT"   --app-name "Deal Finder"   --bundle-identifier "com.buntui.dealfinder"   --no-open   --copy-resources

echo
echo "Created the Safari Web Extension Xcode project in:"
echo "$OUT"
echo
echo "Open it in Xcode, choose your Apple Developer team, then run on your iPhone/iPad or archive for TestFlight."
