// design/studio/scripts/cli/eagle-sync-cli.tsx
import React, { useEffect, useState } from 'react';
import { render, Box, Text, Newline } from 'ink';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@sanity/client';
import { fetchEagleFolders, fetchEagleElements } from '../sync/fetch/eagle.js';
import { fileURLToPath } from 'url';

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

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

// Test sync logic: count unsynced Eagle elements
const testSync = async () => {
  if (!EAGLE_API) throw new Error('EAGLE_API_URL not set');
  // 1. Fetch all Eagle elements (across all folders)
  const eagleFolders = await fetchEagleFolders(EAGLE_API);
  let eagleElements: any[] = [];
  for (const folder of eagleFolders) {
    const elements = await fetchEagleElements(EAGLE_API, folder.id);
    eagleElements = eagleElements.concat(elements);
  }
  // 2. Fetch all Sanity elements' eagleIds
  const sanityElements = await sanity.fetch('*[_type == "elements"]{eagleId}');
  const sanityEagleIds = new Set(sanityElements.map((el: any) => el.eagleId));
  // 3. Find Eagle elements not in Sanity
  const unsynced = eagleElements.filter(el => !sanityEagleIds.has(el.id));
  return {
    eagleCount: eagleElements.length,
    sanityCount: sanityElements.length,
    unsyncedCount: unsynced.length,
    unsynced,
  };
};

// Import your sync logic as a function
const runSync = async (): Promise<{ success: boolean; error?: string; stats?: any }> => {
  try {
    const stats = await testSync();
    return { success: true, stats };
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
};

const App = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setStatus('running');
    runSync().then((result) => {
      if (result.success) {
        setStats(result.stats);
        setStatus('done');
      } else {
        setError(result.error || 'Unknown error');
        setStatus('error');
      }
    });
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyanBright">🦅 Eagle → Sanity Status</Text>
      <Text>────────────────────────────</Text>
      {status === 'idle' && <Text>Preparing status update...</Text>}
      {status === 'running' && <Text color="yellow">⏳ Checking sync status...</Text>}
      {status === 'done' && stats && (
        <>
          <Text color="green">✔️  Status check complete!</Text>
          <Text>
            Eagle elements: <Text color="cyan">{stats.eagleCount}</Text>
          </Text>
          <Text>
            Sanity elements: <Text color="cyan">{stats.sanityCount}</Text>
          </Text>
          <Text>
            <Text color={stats.unsyncedCount === 0 ? 'green' : 'yellow'}>
              {stats.unsyncedCount === 0 ? 'All Eagle elements are synced!' : `${stats.unsyncedCount} Eagle elements have yet to be synced.`}
            </Text>
          </Text>
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