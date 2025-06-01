import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@sanity/client';
import { handleJPGFileType } from './file-types/jpgs.js';
import { handleNonJPGSFileType } from './file-types/nonJPGS.js';
import { handleOtherFileType } from './file-types/other.js';
import { handleUrlFileType } from './file-types/url.js';
import { updateElementToYoutube } from './file-types/youtube.js';
import { shouldSkipElementWithFile } from './helpers/shouldSkipElementWithFile.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SANITY_PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_STUDIO_DATASET;
const SANITY_TOKEN = process.env.SANITY_API_TOKEN;

const sanity = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  token: SANITY_TOKEN,
  useCdn: false,
  apiVersion: '2023-01-01',
});

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  // Fetch only elements where fileUploaded is not true
  const elements = await sanity.fetch(
    '*[_type == "elements" && fileUploaded != true]{eagleId, fileType, fileName, file}'
  );
  if (!elements || elements.length === 0) {
    console.log('No elements found that need uploading.');
    return;
  }
  console.log(`Found ${elements.length} elements that need uploading.`);

  if (isDryRun) {
    console.log('\n--- DRY RUN: The following elements would be uploaded ---');
    elements.forEach((el: any, i: number) => {
      console.log(`${i + 1}. eagleId: ${el.eagleId}, fileType: ${el.fileType}, fileName: ${el.fileName}`);
    });
    console.log('--- END DRY RUN ---\n');
    return;
  }

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    process.stdout.write(`\r${i + 1}/${elements.length}\nCurrent Element: ${el.fileName || el.eagleId}   `);
    if (!el.eagleId || !el.fileType) {
      console.warn(`Skipping element with missing eagleId or fileType:`, el);
      continue;
    }
    let patched = null;
    try {
      if (el.fileType.toLowerCase() === 'jpg' || el.fileType.toLowerCase() === 'jpeg') {
        patched = await handleJPGFileType(el.eagleId, sanity);
      } else if ([ 'avif', 'heic', 'png', 'webp' ].includes(el.fileType.toLowerCase())) {
        patched = await handleNonJPGSFileType(el.eagleId, sanity);
      } else if ([ 'svg', 'pdf', 'mov', 'mp4', 'gif' ].includes(el.fileType.toLowerCase())) {
        patched = await handleOtherFileType(el.eagleId, sanity);
      } else if (el.fileType.toLowerCase() === 'url') {
        // First, check if it should be converted to youtube
        const youtubePatched = await updateElementToYoutube(el.eagleId, sanity);
        if (youtubePatched && youtubePatched._id) {
          // fileType was changed to youtube, skip this round so it can be picked up as youtube next run
          el.fileType = 'youtube';
          continue;
        }
        patched = await handleUrlFileType(el.eagleId, sanity);
      } else {
        console.warn(`Unknown fileType for element ${el.eagleId}: ${el.fileType}`);
      }
      if (patched && patched._id) {
        await sanity.patch(patched._id).set({ fileUploaded: true }).commit();
        console.log(`Set fileUploaded: true for element ${el.eagleId}`);
      }
    } catch (err) {
      console.error(`Error uploading element ${el.eagleId}:`, err);
    }
    console.log('\n'); // Add a line break after each element
  }
  console.log('Upload process complete.');
}

main(); 