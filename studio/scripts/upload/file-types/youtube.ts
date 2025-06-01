import { elementExists } from '../../sync/elementExists.js';
import axios from 'axios';

/**
 * Updates the fileType of an element in Sanity from 'url' to 'youtube' if its url starts with 'https://www.youtube.com/'.
 * Also fetches and uploads the YouTube video thumbnail.
 * @param eagleId The Eagle element's id
 * @param sanity The Sanity client
 * @returns The patched document, or null if nothing was updated
 */
export async function updateElementToYoutube(eagleId: string, sanity: any) {
  if (!eagleId) {
    console.warn('No eagleId provided to updateElementToYoutube.');
    return null;
  }

  // Check if the element exists
  if (!(await elementExists(eagleId, sanity))) {
    console.warn(`No element found in Sanity with eagleId ${eagleId}`);
    return null;
  }

  // Fetch the element's _id, fileType, and url by eagleId
  const result = await sanity.fetch(
    '*[_type == "elements" && eagleId == $eagleId][0]{_id, fileType, url, fileName}',
    { eagleId }
  );
  if (!result || !result._id) {
    console.warn(`No element found in Sanity with eagleId ${eagleId}`);
    return null;
  }
  // Only update if the fileType is 'url' and url starts with 'https://www.youtube.com/'
  if (result.fileType !== 'url') {
    return null;
  }
  if (!result.url || !result.url.startsWith('https://www.youtube.com/')) {
    return null;
  }

  // Extract video ID from URL
  const videoId = result.url.match(/(?:v=|\/)([\w-]{11})(?:\?|$|&)/)?.[1];
  if (!videoId) {
    console.warn(`Could not extract video ID from URL: ${result.url}`);
    return null;
  }

  // Fetch thumbnail
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  let thumbnailBuffer;
  try {
    const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
    thumbnailBuffer = Buffer.from(response.data);
  } catch (err) {
    console.error(`Failed to fetch YouTube thumbnail: ${thumbnailUrl}`, err);
    return null;
  }

  // Upload thumbnail to Sanity
  let uploadedThumbnailAsset;
  try {
    uploadedThumbnailAsset = await sanity.assets.upload('image', thumbnailBuffer, { 
      filename: `${result.fileName || eagleId}_youtube_thumbnail.jpg` 
    });
  } catch (err) {
    console.error('Failed to upload YouTube thumbnail to Sanity:', err);
    return null;
  }

  // Update document with new fileType, thumbnail and set fileUploaded to true
  const patched = await sanity.patch(result._id).set({ 
    fileType: 'youtube',
    thumbnail: {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: uploadedThumbnailAsset._id
      }
    },
    fileUploaded: true
  }).commit();
  
  return patched;
}