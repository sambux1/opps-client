#!/usr/bin/env bash

# Minimal installer automated testing with Puppeteer.
# - Ensures npm is available
# - Initializes package.json if missing
# - Installs Puppeteer as a dependency
#
# Usage:
#   bash tests/setup.sh

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"
build_dir="${script_dir}/build"

echo "[test] Verifying prerequisites..."
if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm not found. Please install Node.js (>=18) and npm, then re-run."
  exit 1
fi

echo "[test] Node: $(node -v || true)"
echo "[test] npm:  $(npm -v || true)"

mkdir -p "${build_dir}"
cd "${build_dir}"

if [ ! -f "package.json" ]; then
  echo "[test] No package.json in tests/build/. Initializing..."
  npm init -y >/dev/null
  echo "[test] Created tests/build/package.json"
else
  echo "[test] tests/build/package.json found."
fi

echo "[test] Installing Puppeteer..."
npm install --save-dev puppeteer

echo "[test] Done."
