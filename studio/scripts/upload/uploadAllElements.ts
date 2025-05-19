import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@sanity/client';
import { handleJPGFileType } from './file-types/jpgs';
import { handleNonJPGSFileType } from './file-types/nonJPGS';
import { handleOtherFileType } from './file-types/other';
import { handleUrlFileType } from './file-types/url';
import { updateElementToYoutube } from './file-types/youtube';
import { shouldSkipElementWithFile } from './helpers/shouldSkipElementWithFile';

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
  // Fetch all elements
  const elements = await sanity.fetch(
    '*[_type == "elements"]{eagleId, fileType, fileName, file}'
  );
  if (!elements || elements.length === 0) {
    console.log('No elements found.');
    return;
  }
  console.log(`Found ${elements.length} elements.`);

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    process.stdout.write(`\r${i + 1}/${elements.length}\nCurrent Element: ${el.fileName || el.eagleId}   `);
    if (!el.eagleId || !el.fileType) {
      console.warn(`Skipping element with missing eagleId or fileType:`, el);
      continue;
    }
    if (shouldSkipElementWithFile(el)) {
      console.log(`Skipping element ${el.eagleId} because file is already uploaded.`);
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