#!/usr/bin/env node

const { spawn } = require('child_process');

// Find the wrangler executable in the local node_modules
const wranglerPath = require.resolve('wrangler/bin/wrangler.js');

const child = spawn(process.execPath, [wranglerPath, 'dev'], {
  stdio: 'inherit',
  shell: false
});

child.on('close', (code) => {
  process.exit(code);
});