import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@sanity/client';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

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
  // Find all elements with fileType 'url' and a defined file
  const elements = await sanity.fetch(
    '*[_type == "elements" && fileType == "url" && defined(file) && file != null]{_id, file}'
  );
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    // Patch: set thumbnail to file, clear file, set fileUploaded to false
    await sanity.patch(el._id)
      .set({
        thumbnail: el.file ? { _type: 'image', asset: el.file.asset } : null,
        file: null,
        fileUploaded: false,
      })
      .commit();
    process.stdout.write(`\r${i + 1}`);
  }
  process.stdout.write('\nDone.\n');
}

main(); 