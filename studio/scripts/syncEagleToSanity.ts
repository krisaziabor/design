import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@sanity/client';
import readline from 'readline';
import { addOrUpdateCategories } from './sync/addOrUpdateCategories';
import { promptForRemovals } from './sync/promptForRemovals';
import { fetchEagleFolders, fetchEagleElements } from './sync/fetch/eagle';
import { fetchSanityCategories } from './sync/fetch/sanity';
import { createFolderElements } from './sync/createFolderElements';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// --- CONFIG ---
const EAGLE_API = process.env.EAGLE_API_URL;
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

if (!EAGLE_API) {
  throw new Error('EAGLE_API environment variable is not set.');
}

(async () => {
  try {
    const eagleFolders = await fetchEagleFolders(EAGLE_API);
    const sanityCategories = await fetchSanityCategories(sanity);

    // Add or update categories
    await addOrUpdateCategories(eagleFolders, sanityCategories, sanity);

    // Debug: print all Sanity categories and their eagleIds
    // console.log('\nAll Sanity categories and their eagleIds:');
    // sanityCategories.forEach((c: any) => {
    //   console.log(`- ${c.name} (eagleId: ${c.eagleId})`);
    // });

    // Iterate through all Eagle folders
    for (const folder of eagleFolders) {
      const elementCount = folder.imageCount !== undefined ? folder.imageCount : 'N/A';
      console.log(`Folder: ${folder.name} (ID: ${folder.id}) - Elements: ${elementCount}`);
      const elements = await fetchEagleElements(EAGLE_API, folder.id);
      // Find the main category reference
      const mainCategoryRef = sanityCategories.find((c: any) => c.eagleId === folder.id)?._id;
      await createFolderElements(folder, elements, mainCategoryRef, sanity);
    }

    // Prompt for removals (including missing/empty eagleId)
    await promptForRemovals(eagleFolders, sanityCategories, sanity, prompt);
    rl.close();
  } catch (err) {
    console.error('Sync failed:', err);
    rl.close();
    process.exit(1);
  }
})(); 