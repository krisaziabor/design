import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@sanity/client';
import readline from 'readline';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SANITY_PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_STUDIO_DATASET;
const SANITY_TOKEN = process.env.SANITY_API_TOKEN;
const SANITY_API_VERSION = process.env.SANITY_API_VERSION || '2023-01-01';

const sanity = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  token: SANITY_TOKEN,
  useCdn: false,
  apiVersion: SANITY_API_VERSION,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

(async () => {
  try {
    const docId = await prompt('Enter the Sanity document ID to delete: ');
    if (!docId) {
      console.log('No document ID provided. Exiting.');
      rl.close();
      return;
    }

    // Find all documents referencing this document
    const referencingDocs = await sanity.fetch(
      '*[references($docId)]{_id, _type}',
      { docId }
    );
    if (referencingDocs.length > 0) {
      console.log(`Found ${referencingDocs.length} documents referencing this document:`);
      referencingDocs.forEach((doc: any) => {
        console.log(`- ${doc._id} (type: ${doc._type})`);
      });
      const confirm = await prompt('Delete all referencing documents? (y/N): ');
      if (confirm.toLowerCase() === 'y') {
        for (const doc of referencingDocs) {
          await sanity.delete(doc._id);
          console.log(`Deleted referencing document: ${doc._id}`);
        }
      } else {
        console.log('Aborted deletion of referencing documents. Exiting.');
        rl.close();
        return;
      }
    } else {
      console.log('No documents reference this document.');
    }
    // Delete the target document
    const confirmDelete = await prompt('Delete the target document? (y/N): ');
    if (confirmDelete.toLowerCase() === 'y') {
      await sanity.delete(docId);
      console.log(`Deleted document: ${docId}`);
    } else {
      console.log('Aborted deletion of target document.');
    }
    rl.close();
  } catch (err) {
    console.error('Error:', err);
    rl.close();
    process.exit(1);
  }
})(); 