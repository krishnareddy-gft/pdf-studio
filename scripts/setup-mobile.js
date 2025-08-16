#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up PDF HelpDesk for mobile conversion...\n');

// Check if package.json exists
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found. Please run this script from the project root.');
  process.exit(1);
}

try {
  // Install Capacitor dependencies
  console.log('📦 Installing Capacitor dependencies...');
  execSync('npm install @capacitor/core @capacitor/cli', { stdio: 'inherit' });
  execSync('npm install @capacitor/ios @capacitor/android', { stdio: 'inherit' });
  
  // Initialize Capacitor
  console.log('\n🔧 Initializing Capacitor...');
  execSync('npx cap init "PDF HelpDesk" "com.pdfhelpdesk.app" --web-dir=dist', { stdio: 'inherit' });
  
  // Add platforms
  console.log('\n📱 Adding iOS platform...');
  execSync('npx cap add ios', { stdio: 'inherit' });
  
  console.log('\n🤖 Adding Android platform...');
  execSync('npx cap add android', { stdio: 'inherit' });
  
  // Build the web app
  console.log('\n🏗️ Building web app...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Sync with native platforms
  console.log('\n🔄 Syncing with native platforms...');
  execSync('npx cap sync', { stdio: 'inherit' });
  
  console.log('\n✅ Mobile setup complete!');
  console.log('\n📱 To open in Xcode (iOS):');
  console.log('   npx cap open ios');
  console.log('\n🤖 To open in Android Studio:');
  console.log('   npx cap open android');
  console.log('\n🌐 To run in browser:');
  console.log('   npm run dev');
  
} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
}
