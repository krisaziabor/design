import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@sanity/client';
import readline from 'readline';
import pLimit from 'p-limit'; // npm install p-limit
import { addOrUpdateCategories } from './sync/addOrUpdateCategories.js';
import { promptForRemovals } from './sync/promptForRemovals.js';
import { fetchEagleFolders, fetchEagleElements } from './sync/fetch/eagle.js';
import { fetchSanityCategories } from './sync/fetch/sanity.js';
import { createFolderElements } from './sync/createFolderElements.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// --- CONFIG ---
const EAGLE_API = process.env.EAGLE_API_URL;
const SANITY_PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_STUDIO_DATASET;
const SANITY_TOKEN = process.env.SANITY_API_TOKEN;

if (!EAGLE_API || !SANITY_PROJECT_ID || !SANITY_DATASET || !SANITY_TOKEN) {
  throw new Error('One or more required environment variables are not set.');
}

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

const CONCURRENCY_LIMIT = 5; // Adjust as needed
const limit = pLimit(CONCURRENCY_LIMIT);

// Parse CLI flags
const dryRun = process.argv.includes('--dry-run');
if (dryRun) {
  console.log('\n[DRY RUN] No changes will be made to Sanity.');
}

(async () => {
  try {
    // 1. Fetch all Eagle folders and elements
    const eagleFolders = await fetchEagleFolders(EAGLE_API);
    let allEagleElements: any[] = [];
    for (const folder of eagleFolders) {
      const elements: any[] = await fetchEagleElements(EAGLE_API, folder.id);
      allEagleElements = allEagleElements.concat(
        elements.map((el: any) => ({ ...el, folder }))
      );
    }

    // 2. Fetch all Sanity elements' eagleIds
    const sanityElements: any[] = await sanity.fetch('*[_type == "elements"]{eagleId}');
    const sanityEagleIds = new Set(sanityElements.map((el: any) => el.eagleId));

    // 3. Find unsynced Eagle elements
    const unsyncedEagleElements = allEagleElements.filter(
      (el: any) => !sanityEagleIds.has(el.id)
    );

    // 4. Fetch Sanity categories
    const sanityCategories: any[] = await fetchSanityCategories(sanity);

    // 5. Add or update categories (if needed)
    await addOrUpdateCategories(eagleFolders, sanityCategories, sanity);

    // 6. Sync only unsynced Eagle elements, in parallel with a concurrency limit
    const syncResults = await Promise.allSettled(
      unsyncedEagleElements.map((el: any) =>
        limit(async () => {
          try {
            const mainCategoryRef = sanityCategories.find(
              (c: any) => c.eagleId === el.folder.id
            )?._id;
            if (dryRun) {
              console.log(`[DRY RUN] Would sync element: ${el.id} (${el.name}) in folder: ${el.folder.name}`);
              return { id: el.id, status: 'dry-run' };
            } else {
              await createFolderElements(el.folder, [el], mainCategoryRef, sanity);
              return { id: el.id, status: 'success' };
            }
          } catch (err) {
            return { id: el.id, status: 'error', error: err };
          }
        })
      )
    );

    // 7. Log results
    function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
      return result.status === 'fulfilled';
    }
    const successCount = syncResults.filter(
      (r) => isFulfilled(r) && r.value.status === 'success'
    ).length;
    const dryRunCount = syncResults.filter(
      (r) => isFulfilled(r) && r.value.status === 'dry-run'
    ).length;
    const errorResults = syncResults.filter(
      (r) => isFulfilled(r) && r.value.status === 'error'
    );

    if (dryRun) {
      console.log(`\n[DRY RUN] ${dryRunCount} elements would be synced. No changes were made.`);
    } else {
      console.log(
        `\nSync complete! ${successCount} elements synced, ${errorResults.length} errors.`
      );
    }
    if (errorResults.length > 0) {
      console.log('Errors:');
      errorResults.forEach((r) =>
        console.log(`- Element ID: ${isFulfilled(r) ? r.value.id : 'unknown'}, Error: ${isFulfilled(r) ? r.value.error : 'unknown'}`)
      );
    }

    // 8. Prompt for removals (if needed)
    if (!dryRun) {
      await promptForRemovals(eagleFolders, sanityCategories, sanity, prompt);
    } else {
      console.log('[DRY RUN] Removals prompt skipped.');
    }
  } catch (err) {
    console.error('Sync failed:', err);
  } finally {
    rl.close();
  }
})(); 