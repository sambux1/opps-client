#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

function getPuppeteer() {
  const localPkg = path.resolve(__dirname, 'build/node_modules/puppeteer');
  if (!fs.existsSync(localPkg)) {
    console.error('[test] Puppeteer not found in tests/build/. Run: bash tests/setup.sh');
    process.exit(1);
  }
  // Require puppeteer from tests/build
  // eslint-disable-next-line import/no-dynamic-require, global-require
  return require(localPkg);
}

(async () => {
  const puppeteer = getPuppeteer();
  const repoRoot = path.resolve(__dirname, '..');
  const extensionDir = path.resolve(repoRoot, 'src');
  if (!fs.existsSync(extensionDir)) {
    console.error(`[test] Extension directory not found: ${extensionDir}`);
    process.exit(1);
  }

  // Minimal control of headless vs headed
  // Default: headed (more reliable for extensions)
  // HEADLESS=1 -> headless 'new'
  const headless = (process.env.HEADLESS === '1' || (process.env.HEADLESS || '').toLowerCase() === 'true')
    ? 'new'
    : false;

  console.log(`[test] Launching Chromium (${headless ? 'headless' : 'headed'}) with extension: ${extensionDir}`);
  const browser = await puppeteer.launch({
    headless,
    args: [
      `--disable-extensions-except=${extensionDir}`,
      `--load-extension=${extensionDir}`,
      '--no-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    const version = await browser.version();
    console.log(`[test] Browser: ${version}`);
    console.log('[test] Launched successfully. (No behavior checks yet)');
  } catch (err) {
    console.error('[test] Harness error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
