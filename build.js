const { execSync } = require('child_process');
const fs = require('fs');

console.log('Starting workspaces build...');

// 1. Run build in frontend workspace
try {
  execSync('npm run build --workspace=frontend', { stdio: 'inherit' });
} catch (error) {
  console.error('Frontend build failed:', error);
  process.exit(1);
}

// 2. Clean or create root dist folder
if (fs.existsSync('./dist')) {
  fs.rmSync('./dist', { recursive: true, force: true });
}
fs.mkdirSync('./dist');

// 3. Copy frontend/dist to root dist
try {
  fs.cpSync('./frontend/dist', './dist', { recursive: true });
  console.log('Build completed successfully. Copied frontend/dist to root dist.');
} catch (error) {
  console.error('Failed to copy build output:', error);
  process.exit(1);
}
