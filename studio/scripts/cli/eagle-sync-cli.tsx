import React, { useEffect, useState } from 'react';
import { render, Box, Text } from 'ink';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@sanity/client';
import pLimit from 'p-limit';
import { addOrUpdateCategories } from '../sync/addOrUpdateCategories.js';
import { fetchEagleFolders, fetchEagleElements } from '../sync/fetch/eagle.js';
import { fetchSanityCategories } from '../sync/fetch/sanity.js';
import { createFolderElements } from '../sync/createFolderElements.js';
import { fileURLToPath } from 'url';

// Load env variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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

const CONCURRENCY_LIMIT = 5;
const limit = pLimit(CONCURRENCY_LIMIT);
const dryRun = process.argv.includes('--dry-run');

const runSync = async () => {
  if (!EAGLE_API || !SANITY_PROJECT_ID || !SANITY_DATASET || !SANITY_TOKEN) {
    throw new Error('One or more required environment variables are not set.');
  }
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
            return { id: el.id, name: el.name, folder: el.folder.name, status: 'dry-run' };
          } else {
            await createFolderElements(el.folder, [el], mainCategoryRef, sanity);
            return { id: el.id, name: el.name, folder: el.folder.name, status: 'success' };
          }
        } catch (err) {
          return { id: el.id, name: el.name, folder: el.folder.name, status: 'error', error: err };
        }
      })
    )
  );
  function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
    return result.status === 'fulfilled';
  }
  const success = syncResults.filter(
    (r) => isFulfilled(r) && r.value.status === 'success'
  ).map((r) => (isFulfilled(r) ? r.value : null)).filter(Boolean);
  const dryRunItems = syncResults.filter(
    (r) => isFulfilled(r) && r.value.status === 'dry-run'
  ).map((r) => (isFulfilled(r) ? r.value : null)).filter(Boolean);
  const errors = syncResults.filter(
    (r) => isFulfilled(r) && r.value.status === 'error'
  ).map((r) => (isFulfilled(r) ? r.value : null)).filter(Boolean);
  return {
    eagleCount: allEagleElements.length,
    sanityCount: sanityElements.length,
    unsyncedCount: unsyncedEagleElements.length,
    syncedCount: success.length,
    dryRunCount: dryRunItems.length,
    errorCount: errors.length,
    dryRunItems,
    errors,
    dryRun,
  };
};

const App = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setStatus('running');
    runSync()
      .then((result) => {
        setStats(result);
        setStatus('done');
      })
      .catch((err) => {
        setError(err.message || String(err));
        setStatus('error');
      });
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyanBright">🦅 Eagle → Sanity Sync</Text>
      <Text>────────────────────────────</Text>
      {status === 'idle' && <Text>Preparing sync...</Text>}
      {status === 'running' && <Text color="yellow">⏳ Syncing...</Text>}
      {status === 'done' && stats && (
        <>
          <Text color={stats.dryRun ? 'yellow' : 'green'}>
            {stats.dryRun ? '✔️  Dry run complete! No changes made.' : '✔️  Sync complete!'}
          </Text>
          <Text>
            Eagle elements: <Text color="cyan">{stats.eagleCount}</Text>
          </Text>
          <Text>
            Sanity elements: <Text color="cyan">{stats.sanityCount}</Text>
          </Text>
          <Text>
            Unsynced Eagle elements: <Text color={stats.unsyncedCount === 0 ? 'green' : 'yellow'}>{stats.unsyncedCount}</Text>
          </Text>
          {!stats.dryRun && (
            <Text>
              Synced: <Text color="green">{stats.syncedCount}</Text>
            </Text>
          )}
          {stats.dryRun && (
            <>
              <Text>
                <Text color="yellow">{stats.dryRunCount}</Text> elements would be synced:
              </Text>
              {stats.dryRunItems.slice(0, 10).map((item: any) => (
                <Text key={item.id}>
                  - {item.name} (ID: {item.id}) in folder: {item.folder}
                </Text>
              ))}
              {stats.dryRunCount > 10 && (
                <Text color="gray">...and {stats.dryRunCount - 10} more</Text>
              )}
            </>
          )}
          {stats.errorCount > 0 && (
            <>
              <Text color="red">{stats.errorCount} errors occurred:</Text>
              {stats.errors.slice(0, 5).map((err: any, i: number) => (
                <Text key={i} color="red">
                  - {err.name} (ID: {err.id}) in folder: {err.folder}: {String(err.error)}
                </Text>
              ))}
              {stats.errorCount > 5 && (
                <Text color="gray">...and {stats.errorCount - 5} more</Text>
              )}
            </>
          )}
        </>
      )}
      {status === 'error' && (
        <>
          <Text color="red">❌ Sync failed!</Text>
          <Text color="red">{error}</Text>
        </>
      )}
    </Box>
  );
};

render(<App />);