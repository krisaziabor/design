import { elementExists } from '../../sync/elementExists';

/**
 * Updates the fileType of an element in Sanity from 'url' to 'youtube' if its url starts with 'https://www.youtube.com/'.
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
    '*[_type == "elements" && eagleId == $eagleId][0]{_id, fileType, url}',
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
  const patched = await sanity.patch(result._id).set({ fileType: 'youtube' }).commit();
  return patched;
} 