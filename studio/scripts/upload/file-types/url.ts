import axios from 'axios';

/**
 * Handles uploading a screenshot for a URL element using ScreenshotOne API.
 * @param eagleId The Eagle ID of the element
 * @param sanity The Sanity client
 * @param accessKey (optional) The ScreenshotOne API access key. If not provided, will use process.env.SCREENSHOTONE_ACCESS_KEY
 * @returns The patched document, or null if upload failed
 */
export async function handleUrlFileType(eagleId: string, sanity: any, accessKey?: string) {
  if (!eagleId) {
    console.warn('No eagleId provided to handleUrlFileType.');
    return null;
  }
  const key = accessKey || process.env.SCREENSHOTONE_ACCESS_KEY;
  if (!key) {
    console.error('No ScreenshotOne API access key provided.');
    return null;
  }
  // Fetch the element's _id and url by eagleId
  const result = await sanity.fetch(
    '*[_type == "elements" && eagleId == $eagleId][0]{_id, url, fileName}',
    { eagleId }
  );
  if (!result || !result._id || !result.url) {
    console.warn(`No element found in Sanity with eagleId ${eagleId} or missing url.`);
    return null;
  }
  const screenshotUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(result.url)}&access_key=${key}`;
  let screenshotBuffer;
  try {
    const response = await axios.get(screenshotUrl, { responseType: 'arraybuffer' });
    screenshotBuffer = Buffer.from(response.data);
    // console.log(`Fetched screenshot for URL: ${result.url}`);
  } catch (err) {
    console.error(`Failed to fetch screenshot for URL: ${result.url}`, err);
    return null;
  }
  // Upload the screenshot to Sanity and patch the element's file property
  let uploadedAsset;
  try {
    uploadedAsset = await sanity.assets.upload('file', screenshotBuffer, { filename: `${result.fileName || eagleId}_screenshot.png` });
  } catch (err) {
    console.error('Failed to upload screenshot to Sanity:', err);
    return null;
  }
  const patched = await sanity.patch(result._id).set({ file: { _type: 'file', asset: { _type: 'reference', _ref: uploadedAsset._id } } }).commit();
  // console.log(`Uploaded screenshot for eagleId ${eagleId} to Sanity.`);
  return patched;
} 