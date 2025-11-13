#!/usr/bin/env bash

# Runs the Puppeteer harness.
# Usage:
#   bash tests/test.sh           # headed (default)
#   HEADLESS=1 bash tests/test.sh # headless (new) mode

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# copy the manifest file into the src/ directory
cp "${script_dir}/../manifest-chrome.json" "${script_dir}/../src/manifest.json"

if [ ! -d "${script_dir}/build/node_modules/puppeteer" ]; then
  echo "[test] Puppeteer not found in tests/build. Run: bash tests/setup.sh"
  exit 1
fi

node "${script_dir}/harness.js"

# delete the manifest file from the src/ directory
rm "${script_dir}/../src/manifest.json"
