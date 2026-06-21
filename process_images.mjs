import sharp from 'sharp';
import path from 'path';

const SRC = 'public/interface.png';
const ANDROID = 'android/app/src/main/res';

// Step 1: Crop out status bar (top ~80px) and nav bar (bottom ~120px)
async function main() {
  const meta = await sharp(SRC).metadata();
  console.log(`Source: ${meta.width}x${meta.height}`);
  
  // Crop status bar and nav bar
  const topCrop = 75;
  const bottomCrop = 110;
  const cleanHeight = meta.height - topCrop - bottomCrop;
  
  const cleanSplash = sharp(SRC).extract({ left: 0, top: topCrop, width: meta.width, height: cleanHeight });
  
  // Save clean splash for reference
  const cleanBuf = await cleanSplash.toBuffer();
  await sharp(cleanBuf).toFile('public/tfc_splash_clean.png');
  console.log(`Clean splash: ${meta.width}x${cleanHeight}`);
  
  // Step 2: Find TFC text bounding box for icon extraction
  // The TFC logo is black text on white background in the center
  // Extract the raw pixel data to find the text bounds
  const raw = await sharp(cleanBuf).grayscale().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = raw.info;
  const pixels = raw.data;
  
  let minX = w, maxX = 0, minY = h, maxY = 0;
  const threshold = 100; // pixels darker than this are "text"
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (pixels[idx] < threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  console.log(`TFC text bounds: x=${minX}-${maxX}, y=${minY}-${maxY}`);
  
  // Add padding around the TFC text
  const pad = 40;
  const tfcLeft = Math.max(0, minX - pad);
  const tfcTop = Math.max(0, minY - pad);
  const tfcWidth = Math.min(w - tfcLeft, (maxX - minX) + pad * 2);
  const tfcHeight = Math.min(h - tfcTop, (maxY - minY) + pad * 2);
  
  // Extract TFC region
  const tfcBuf = await sharp(cleanBuf).extract({
    left: tfcLeft, top: tfcTop, width: tfcWidth, height: tfcHeight
  }).toBuffer();
  
  // Step 3: Generate splash screen PNGs for all Android densities
  const splashSizes = {
    'drawable-port-mdpi': { w: 320, h: 470 },
    'drawable-port-hdpi': { w: 480, h: 640 },
    'drawable-port-xhdpi': { w: 720, h: 960 },
    'drawable-port-xxhdpi': { w: 1080, h: 1440 },
    'drawable-port-xxxhdpi': { w: 1440, h: 1920 },
    'drawable-land-mdpi': { w: 470, h: 320 },
    'drawable-land-hdpi': { w: 640, h: 480 },
    'drawable-land-xhdpi': { w: 960, h: 720 },
    'drawable-land-xxhdpi': { w: 1440, h: 1080 },
    'drawable-land-xxxhdpi': { w: 1920, h: 1440 },
    'drawable': { w: 720, h: 960 },
  };
  
  for (const [dir, size] of Object.entries(splashSizes)) {
    // Create white canvas, resize clean splash to fit, center it
    const resized = await sharp(cleanBuf)
      .resize(size.w, size.h, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toBuffer();
    
    const outPath = path.join(ANDROID, dir, 'splash.png');
    await sharp(resized).toFile(outPath);
    console.log(`  Splash ${dir}: ${size.w}x${size.h}`);
  }
  
  // Step 4: Generate app icons from TFC text
  const iconSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
  };
  
  for (const [dir, size] of Object.entries(iconSizes)) {
    // Create square icon: white background with centered TFC text
    const tfcSquare = await sharp(tfcBuf)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toBuffer();
    
    const basePath = path.join(ANDROID, dir);
    await sharp(tfcSquare).toFile(path.join(basePath, 'ic_launcher.png'));
    await sharp(tfcSquare).toFile(path.join(basePath, 'ic_launcher_foreground.png'));
    await sharp(tfcSquare).toFile(path.join(basePath, 'ic_launcher_round.png'));
    console.log(`  Icon ${dir}: ${size}x${size}`);
  }
  
  console.log('\nDone! All splash screens and icons generated.');
}

main().catch(console.error);
