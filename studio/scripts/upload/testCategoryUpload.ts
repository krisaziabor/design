import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@sanity/client';
import readline from 'readline';
import { handleJPGFileType } from './file-types/jpgs';
import { handleNonJPGSFileType } from './file-types/nonJPGS';
import { handleOtherFileType } from './file-types/other';
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

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function prompt(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, (ans: string) => { resolve(ans); }));
}

async function main() {
  let categoryEagleId = process.argv[2];
  if (!categoryEagleId) {
    categoryEagleId = await prompt('Enter the Sanity Category Eagle ID: ');
  }
  if (!categoryEagleId) {
    console.error('No Eagle ID provided. Exiting.');
    rl.close();
    process.exit(1);
  }

  // Find the Sanity category _id by eagleId
  const category = await sanity.fetch(
    '*[_type == "category" && eagleId == $eagleId][0]{_id}',
    { eagleId: categoryEagleId }
  );
  if (!category || !category._id) {
    console.error(`No category found with eagleId ${categoryEagleId}`);
    rl.close();
    process.exit(1);
  }

  // Find all elements with this mainCategory
  const elements = await sanity.fetch(
    '*[_type == "elements" && mainCategory._ref == $catId]{eagleId, fileType, fileName, file}',
    { catId: category._id }
  );
  if (!elements || elements.length === 0) {
    console.log('No elements found for this category.');
    rl.close();
    return;
  }
  console.log(`Found ${elements.length} elements in category.`);

  for (const el of elements) {
    if (!el.eagleId || !el.fileType) {
      console.warn(`Skipping element with missing eagleId or fileType:`, el);
      continue;
    }
    if (shouldSkipElementWithFile(el)) {
      console.log(`Skipping element ${el.eagleId} because file is already uploaded.`);
      continue;
    }
    if (el.fileType.toLowerCase() === 'url') {
      console.log(`Skipping URL element: ${el.eagleId}`);
      continue;
    }
    try {
      if (el.fileType.toLowerCase() === 'jpg' || el.fileType.toLowerCase() === 'jpeg') {
        await handleJPGFileType(el.eagleId, sanity);
      } else if ([ 'avif', 'heic', 'png', 'webp' ].includes(el.fileType.toLowerCase())) {
        await handleNonJPGSFileType(el.fileType);
      } else if ([ 'svg', 'pdf', 'mov', 'mp4', 'gif' ].includes(el.fileType.toLowerCase())) {
        await handleOtherFileType(el.fileType);
      } else {
        console.warn(`Unknown fileType for element ${el.eagleId}: ${el.fileType}`);
      }
    } catch (err) {
      console.error(`Error uploading element ${el.eagleId}:`, err);
    }
    console.log('\n');
  }
  console.log('Upload process complete.');
  rl.close();
}

main(); 