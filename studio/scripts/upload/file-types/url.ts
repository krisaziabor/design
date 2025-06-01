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

  // 1. Get screenshot for thumbnail
  const thumbnailScreenshotUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(result.url)}&access_key=${key}`;
  let thumbnailBuffer;
  try {
    const response = await axios.get(thumbnailScreenshotUrl, { responseType: 'arraybuffer' });
    thumbnailBuffer = Buffer.from(response.data);
  } catch (err) {
    console.error(`Failed to fetch thumbnail screenshot for URL: ${result.url}`, err);
    return null;
  }
  let uploadedThumbnailAsset;
  try {
    uploadedThumbnailAsset = await sanity.assets.upload('image', thumbnailBuffer, { filename: `${result.fileName || eagleId}_thumbnail.png` });
  } catch (err) {
    console.error('Failed to upload thumbnail screenshot to Sanity:', err);
    return null;
  }

  // 2. Get full-page screenshot for file property
  const fullPageScreenshotUrl = `https://api.screenshotone.com/take?full_page=true&url=${encodeURIComponent(result.url)}&access_key=${key}`;
  let fileBuffer;
  try {
    const response = await axios.get(fullPageScreenshotUrl, { responseType: 'arraybuffer' });
    fileBuffer = Buffer.from(response.data);
  } catch (err) {
    console.error(`Failed to fetch full-page screenshot, trying alternate URL for: ${result.url}`);
    // Try alternate URL with different parameters
    const alternateScreenshotUrl = `https://api.screenshotone.com/take?image_quality=100&viewport_height=1920&url=${encodeURIComponent(result.url)}&access_key=${key}`;
    try {
      const altResponse = await axios.get(alternateScreenshotUrl, { responseType: 'arraybuffer' });
      fileBuffer = Buffer.from(altResponse.data);
    } catch (altErr) {
      console.error(`Failed to fetch screenshot with alternate URL: ${result.url}`, altErr);
      return null;
    }
  }
  let uploadedFileAsset;
  try {
    uploadedFileAsset = await sanity.assets.upload('file', fileBuffer, { filename: `${result.fileName || eagleId}_fullpage.png` });
  } catch (err) {
    console.error('Failed to upload full-page screenshot to Sanity:', err);
    return null;
  }

  // Patch the element: set thumbnail and file
  const patched = await sanity.patch(result._id).set({
    thumbnail: { _type: 'image', asset: { _type: 'reference', _ref: uploadedThumbnailAsset._id } },
    file: { _type: 'file', asset: { _type: 'reference', _ref: uploadedFileAsset._id } }
  }).commit();
  return patched;
} 