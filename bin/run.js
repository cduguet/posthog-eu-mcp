#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Get the API key from environment variable
const apiKey = process.env.POSTHOG_API_KEY;

if (!apiKey) {
  console.error('Error: POSTHOG_API_KEY environment variable is required');
  console.error('Usage: POSTHOG_API_KEY=your_api_key npx posthog-eu-mcp');
  process.exit(1);
}

// For local development, we need to run the MCP server
// This should connect to the deployed Cloudflare Worker endpoint
// Based on the README, it seems this should connect to a deployed service

// Since this is a Cloudflare Worker-based MCP server, we need to run it locally
// using wrangler dev for development purposes
const args = [
  'wrangler',
  'dev',
  '--port', '8787',
  '--local',
  '--persist-to', '.wrangler/state'
];

// Use npx to run wrangler
const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname, '..'),
  env: {
    ...process.env,
    POSTHOG_API_KEY: apiKey
  }
});

child.on('error', (error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code || 0);
});