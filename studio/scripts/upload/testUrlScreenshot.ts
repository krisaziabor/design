import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@sanity/client';
import readline from 'readline';
import fs from 'fs/promises';
import axios from 'axios';
import { handleUrlFileType } from './file-types/url';

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

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, (ans: string) => { rl.close(); resolve(ans); }));
}

async function main() {
  const eagleId = await prompt('Enter the Sanity Element Eagle ID: ');
  if (!eagleId) {
    console.error('No Eagle ID provided. Exiting.');
    process.exit(1);
  }
  const el = await sanity.fetch(
    '*[_type == "elements" && eagleId == $eagleId][0]{_id, fileType, url, file, fileName}',
    { eagleId }
  );
  if (!el || !el._id) {
    console.error('Element not found.');
    return;
  }
  if (el.fileType && el.fileType.toLowerCase() === 'url') {
    await handleUrlFileType(eagleId, sanity);
    // Download the screenshot asset if it was uploaded
    const updated = await sanity.fetch(
      '*[_type == "elements" && eagleId == $eagleId][0]{file}',
      { eagleId }
    );
    const assetRef = updated?.file?.asset?._ref;
    if (assetRef) {
      const assetId = assetRef.replace('file-', '').replace(/-.*/, '');
      const assetUrl = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${assetId}.png`;
      const img = await axios.get(assetUrl, { responseType: 'arraybuffer' });
      const outPath = `${eagleId}_screenshot.png`;
      await fs.writeFile(outPath, img.data);
      console.log(`Saved screenshot to ${outPath}`);
    } else {
      console.log('No screenshot asset found.');
    }
  } else if (el.file && el.file.asset?._ref) {
    // Download the file asset
    const assetRef = el.file.asset._ref;
    const assetId = assetRef.replace('file-', '').replace(/-.*/, '');
    // Try to get extension from fileName or default to bin
    let ext = 'bin';
    if (el.fileName && el.fileName.includes('.')) {
      ext = el.fileName.split('.').pop();
    }
    const assetUrl = `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${assetId}.${ext}`;
    const file = await axios.get(assetUrl, { responseType: 'arraybuffer' });
    const outPath = `${eagleId}_file.${ext}`;
    await fs.writeFile(outPath, file.data);
    console.log(`Saved file to ${outPath}`);
  } else {
    console.log('Element has no file or url screenshot.');
  }
}

main(); 