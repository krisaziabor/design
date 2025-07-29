#!/usr/bin/env node

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the main script
const scriptPath = path.join(__dirname, '..', 'generateVideoThumbnails.ts')

console.log('🎬 Starting video thumbnail generation...\n')

// Run the script with ts-node
const child = spawn('npx', ['ts-node', '--esm', scriptPath], {
  stdio: 'inherit',
  cwd: process.cwd()
})

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Video thumbnail generation completed successfully!')
  } else {
    console.log(`\n❌ Video thumbnail generation failed with code ${code}`)
    process.exit(code || 1)
  }
})

child.on('error', (error) => {
  console.error('❌ Failed to start video thumbnail generation:', error)
  process.exit(1)
}) 