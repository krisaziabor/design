import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@sanity/client';
import readline from 'readline';

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

async function fetchEagleFolders() {
  const res = await axios.get(
    `${EAGLE_API}/folder/list`
  );
  return res.data.data || [];
}

async function fetchSanityCategories() {
  return sanity.fetch(`*[_type == "category"]{_id, name, eagleId}`);
}

(async () => {
  try {
    const eagleFolders = await fetchEagleFolders();
    const sanityCategories = await fetchSanityCategories();
    const eagleIdToFolder = new Map(eagleFolders.map((f: any) => [f.id, f]));
    const sanityIdToCategory = new Map(sanityCategories.map((c: any) => [c.eagleId, c]));

    // Add or update categories
    for (const folder of eagleFolders) {
      const cat = sanityIdToCategory.get(folder.id);
      if (!cat) {
        // Create new category
        await sanity.create({
          _type: 'category',
          name: folder.name,
          description: folder.description || '',
          eagleId: folder.id
        });
        console.log(`Added category: ${folder.name} (Eagle ID: ${folder.id})`);
      } else if ((cat as any).name !== folder.name) {
        // Update name if needed
        await sanity.patch((cat as any)._id).set({ name: folder.name }).commit();
        console.log(`Updated category name to: ${folder.name} (Eagle ID: ${folder.id})`);
      }
    }

    // Debug: print all Sanity categories and their eagleIds
    console.log('\nAll Sanity categories and their eagleIds:');
    sanityCategories.forEach((c: any) => {
      console.log(`- ${c.name} (eagleId: ${c.eagleId})`);
    });

    // Prompt for removals (including missing/empty eagleId)
    const eagleIds = new Set(eagleFolders.map((f: any) => f.id));
    const toRemove = sanityCategories.filter((c: any) => !c.eagleId || !eagleIds.has(c.eagleId));
    console.log('\nCategories flagged for removal:', toRemove.map((c: any) => `${c.name} (eagleId: ${c.eagleId})`));
    if (toRemove.length > 0) {
      console.log('\nCategories in Sanity not found in Eagle or missing eagleId:');
      for (const c of toRemove) {
        console.log(`- ${c.name} (eagleId: ${c.eagleId})`);
        const confirm = await prompt(`Remove this category and all documents referencing it? (${c.name})`);
        if (confirm) {
          // Find all documents referencing this category
          const referencingDocs = await sanity.fetch(
            '*[references($catId)]{_id, _type}',
            { catId: c._id }
          );
          if (referencingDocs.length > 0) {
            for (const doc of referencingDocs) {
              await sanity.delete(doc._id);
              console.log(`  Removed referencing document: ${doc._id} (type: ${doc._type})`);
            }
          }
          await sanity.delete(c._id);
          console.log(`Removed category: ${c.name} (eagleId: ${c.eagleId})`);
        } else {
          console.log(`Skipped removal of category: ${c.name}`);
        }
      }
    }
    rl.close();
  } catch (err) {
    console.error('Sync failed:', err);
    rl.close();
    process.exit(1);
  }
})(); 