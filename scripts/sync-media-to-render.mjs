import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Utility script to migrate local media files to Render persistent storage
 * without touching database records or modifying metadata.
 *
 * Usage on Render Shell:
 *   node ./scripts/sync-media-to-render.mjs
 *
 * Or specify source and destination:
 *   node ./scripts/sync-media-to-render.mjs --src=./media --dest=/var/data/media
 */

const targetDir =
  process.env.MEDIA_STORAGE_DIR ||
  (fs.existsSync('/var/data/media') ? '/var/data/media' : null);

console.log('='.repeat(70));
console.log('  UNCHARTERED PODCAST — MEDIA PERSISTENT STORAGE SYNC TOOL');
console.log('='.repeat(70));

const localDirs = [
  path.resolve(process.cwd(), 'media'),
  path.resolve(process.cwd(), 'public', 'media'),
];

console.log('Source directories inspected:');
localDirs.forEach((d) => console.log(` - ${d} (${fs.existsSync(d) ? 'Found' : 'Not found'})`));

if (!targetDir) {
  console.log('\nDestination: No Render persistent disk mounted at /var/data/media.');
  console.log('Listing local media files available for migration:\n');

  let totalFiles = 0;
  for (const dir of localDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isFile()) {
        const sizeKb = (fs.statSync(fullPath).size / 1024).toFixed(1);
        console.log(` • [${sizeKb} KB] ${file}`);
        totalFiles++;
      }
    }
  }

  console.log(`\nTotal local media files discovered: ${totalFiles}`);
  console.log('\n--- HOW TO MIGRATE FILES TO RENDER PERSISTENT DISK (/var/data/media) ---');
  console.log('Method 1 (Render Web Dashboard Shell):');
  console.log('  1. Open Render Dashboard -> "unchartered-podcast-web" -> "Shell".');
  console.log('  2. Verify persistent mount: ls -la /var/data/media');
  console.log('  3. If files exist in Git repo or an external URL:');
  console.log('     curl -o /var/data/media/<filename> <source-url>');
  console.log('\nMethod 2 (Upload via Admin Media Library):');
  console.log('  1. Log into your production admin dashboard: https://<render-url>/admin');
  console.log('  2. Navigate to "Media Library" (/admin/media) or the Episode Editor.');
  console.log('  3. Upload the cover or asset directly through the UI. It will be saved directly into /var/data/media!');
  console.log('='.repeat(70));
  process.exit(0);
}

console.log(`\nTarget persistent storage directory: ${targetDir}`);
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

let copiedCount = 0;
let skippedCount = 0;

for (const dir of localDirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const srcPath = path.join(dir, file);
    if (!fs.statSync(srcPath).isFile()) continue;

    const destPath = path.join(targetDir, file);
    if (fs.existsSync(destPath)) {
      skippedCount++;
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(` ✓ Copied ${file} -> ${destPath}`);
      copiedCount++;
    }
  }
}

console.log(`\nSync complete! Copied: ${copiedCount}, Already present: ${skippedCount}`);
console.log('='.repeat(70));
