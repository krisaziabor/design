import React, { useEffect, useState } from 'react';
import { render, Box, Text } from 'ink';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@sanity/client';
import pLimit from 'p-limit';
import { handleJPGFileType } from '../upload/file-types/jpgs.js';
import { handleNonJPGSFileType } from '../upload/file-types/nonJPGS.js';
import { handleOtherFileType } from '../upload/file-types/other.js';
import { handleUrlFileType } from '../upload/file-types/url.js';
import { updateElementToYoutube } from '../upload/file-types/youtube.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

const CONCURRENCY_LIMIT = 3;
const limit = pLimit(CONCURRENCY_LIMIT);
const dryRun = process.argv.includes('--dry-run');

const runUpload = async () => {
  // 1. Fetch only elements where fileUploaded is not true
  const elements = await sanity.fetch(
    '*[_type == "elements" && fileUploaded != true]{_id, eagleId, fileType, fileName, file}'
  );
  if (!elements || elements.length === 0) {
    return { count: 0, dryRun, items: [], errors: [], uploaded: [] };
  }
  if (dryRun) {
    return {
      count: elements.length,
      dryRun: true,
      items: elements,
      errors: [],
      uploaded: [],
    };
  }
  // 2. Upload in parallel with concurrency limit
  const uploadResults = await Promise.allSettled(
    elements.map((el: any) =>
      limit(async () => {
        try {
          let patched = null;
          if (el.fileType.toLowerCase() === 'jpg' || el.fileType.toLowerCase() === 'jpeg') {
            patched = await handleJPGFileType(el.eagleId, sanity);
          } else if ([ 'avif', 'heic', 'png', 'webp' ].includes(el.fileType.toLowerCase())) {
            patched = await handleNonJPGSFileType(el.eagleId, sanity);
          } else if ([ 'svg', 'pdf', 'mov', 'mp4', 'gif' ].includes(el.fileType.toLowerCase())) {
            patched = await handleOtherFileType(el.eagleId, sanity);
          } else if (el.fileType.toLowerCase() === 'url') {
            const youtubePatched = await updateElementToYoutube(el.eagleId, sanity);
            if (youtubePatched && youtubePatched._id) {
              el.fileType = 'youtube';
              return { ...el, status: 'skipped-youtube' };
            }
            patched = await handleUrlFileType(el.eagleId, sanity);
          } else {
            return { ...el, status: 'unknown-type' };
          }
          if (patched && patched._id) {
            await sanity.patch(patched._id).set({ fileUploaded: true }).commit();
            return { ...el, status: 'uploaded' };
          } else {
            return { ...el, status: 'upload-failed' };
          }
        } catch (err) {
          return { ...el, status: 'error', error: err };
        }
      })
    )
  );
  function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
    return result.status === 'fulfilled';
  }
  const uploaded = uploadResults.filter(
    (r) => isFulfilled(r) && r.value.status === 'uploaded'
  ).map((r) => (isFulfilled(r) ? r.value : null)).filter(Boolean);
  const errors = uploadResults.filter(
    (r) => isFulfilled(r) && r.value.status === 'error'
  ).map((r) => (isFulfilled(r) ? r.value : null)).filter(Boolean);
  const unknown = uploadResults.filter(
    (r) => isFulfilled(r) && r.value.status === 'unknown-type'
  ).map((r) => (isFulfilled(r) ? r.value : null)).filter(Boolean);
  const skippedYoutube = uploadResults.filter(
    (r) => isFulfilled(r) && r.value.status === 'skipped-youtube'
  ).map((r) => (isFulfilled(r) ? r.value : null)).filter(Boolean);
  const failed = uploadResults.filter(
    (r) => isFulfilled(r) && r.value.status === 'upload-failed'
  ).map((r) => (isFulfilled(r) ? r.value : null)).filter(Boolean);
  return {
    count: elements.length,
    dryRun: false,
    items: elements,
    uploaded,
    errors,
    unknown,
    skippedYoutube,
    failed,
  };
};

const App = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setStatus('running');
    runUpload()
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
      <Text color="magentaBright">⬆️  Eagle → Sanity Upload</Text>
      <Text>────────────────────────────</Text>
      {status === 'idle' && <Text>Preparing upload...</Text>}
      {status === 'running' && <Text color="yellow">⏳ Uploading...</Text>}
      {status === 'done' && stats && (
        <>
          <Text color={stats.dryRun ? 'yellow' : 'green'}>
            {stats.dryRun ? '✔️  Dry run complete! No uploads performed.' : '✔️  Upload complete!'}
          </Text>
          <Text>
            Elements to upload: <Text color="cyan">{stats.count}</Text>
          </Text>
          {stats.dryRun && (
            <>
              <Text>
                <Text color="yellow">{stats.count}</Text> elements would be uploaded:
              </Text>
              {stats.items.slice(0, 10).map((item: any, i: number) => (
                <Text key={item._id || i}>
                  - {item.fileName || item.eagleId} (ID: {item.eagleId}, type: {item.fileType})
                </Text>
              ))}
              {stats.count > 10 && (
                <Text color="gray">...and {stats.count - 10} more</Text>
              )}
            </>
          )}
          {!stats.dryRun && (
            <>
              <Text>
                Uploaded: <Text color="green">{stats.uploaded.length}</Text>
              </Text>
              {stats.uploaded.slice(0, 10).map((item: any, i: number) => (
                <Text key={item._id || i}>
                  - {item.fileName || item.eagleId} (ID: {item.eagleId}, type: {item.fileType})
                </Text>
              ))}
              {stats.uploaded.length > 10 && (
                <Text color="gray">...and {stats.uploaded.length - 10} more</Text>
              )}
              {stats.errors.length > 0 && (
                <>
                  <Text color="red">{stats.errors.length} errors occurred:</Text>
                  {stats.errors.slice(0, 10).map((err: any, i: number) => (
                    <Text key={err._id || i} color="red">
                      - {err.fileName || err.eagleId} (ID: {err.eagleId}, type: {err.fileType}): {String(err.error)}
                    </Text>
                  ))}
                  {stats.errors.length > 10 && (
                    <Text color="gray">...and {stats.errors.length - 10} more</Text>
                  )}
                </>
              )}
              {stats.unknown && stats.unknown.length > 0 && (
                <>
                  <Text color="yellow">{stats.unknown.length} unknown file types skipped.</Text>
                </>
              )}
              {stats.skippedYoutube && stats.skippedYoutube.length > 0 && (
                <>
                  <Text color="yellow">{stats.skippedYoutube.length} elements converted to YouTube and skipped this run.</Text>
                </>
              )}
              {stats.failed && stats.failed.length > 0 && (
                <>
                  <Text color="red">{stats.failed.length} elements failed to upload.</Text>
                </>
              )}
            </>
          )}
        </>
      )}
      {status === 'error' && (
        <>
          <Text color="red">❌ Upload failed!</Text>
          <Text color="red">{error}</Text>
        </>
      )}
    </Box>
  );
};

render(<App />); 