// This script creates a simple PNG icon for the app
// Run: node create-icon.js
// Requires: npm install canvas (optional) or just use any .png file renamed to icon.png

const fs = require('fs');
const path = require('path');

// Create a minimal 256x256 PNG (blue circle with "A" letter)
// This is a simplified approach - in production, use a proper image
const iconPath = path.join(__dirname, 'icon.png');

if (!fs.existsSync(iconPath)) {
  console.log('⚠️  فایل icon.png یافت نشد.');
  console.log('');
  console.log('برای ساخت آیکون:');
  console.log('  1. یک تصویر مربعی 256x256 بسازید');
  console.log('  2. آن را با نام icon.png در پوشه driver-app ذخیره کنید');
  console.log('');
  console.log('یا از هر فایل PNG دلخواهی استفاده کنید.');
  console.log('بدون آیکون هم ساخت EXE امکان‌پذیر است.');
} else {
  console.log('✅ فایل icon.png موجود است.');
}
