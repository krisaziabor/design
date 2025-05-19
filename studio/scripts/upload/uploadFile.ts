import fs from 'fs/promises';
import path from 'path';

/**
 * Uploads the main content file for a given Eagle ID to the Sanity element's file property.
 * Looks in the folder: /Users/krisaziabor/Desktop/Visual Archive.library/images/EAGLE_ID.info
 * The folder contains metadata.json, a thumbnail PNG, and the main file to upload.
 * @param eagleId The Eagle ID of the element
 * @param sanity The Sanity client
 * @returns The patched document, or null if upload failed
 */
export async function uploadMainContentFile(eagleId: string, sanity: any) {
  if (!eagleId) {
    console.warn('No eagleId provided to uploadMainContentFile.');
    return null;
  }
  const folderPath = `/Users/krisaziabor/Desktop/Visual Archive.library/images/${eagleId}.info`;
  let files;
  try {
    files = await fs.readdir(folderPath);
  } catch (err) {
    console.error(`Could not read directory: ${folderPath}`, err);
    return null;
  }
  // Filter out metadata.json and *thumbnail.png
  const mainFiles = files.filter(f => f !== 'metadata.json' && !f.endsWith('thumbnail.png'));
  if (mainFiles.length !== 1) {
    console.error(`Expected exactly one main content file in ${folderPath}, found:`, mainFiles);
    return null;
  }
  const mainFilePath = path.join(folderPath, mainFiles[0]);
  // Fetch the element's _id by eagleId
  const result = await sanity.fetch(
    '*[_type == "elements" && eagleId == $eagleId][0]{_id}',
    { eagleId }
  );
  if (!result || !result._id) {
    console.warn(`No element found in Sanity with eagleId ${eagleId}`);
    return null;
  }
  // Read the file as a buffer
  let fileBuffer;
  try {
    fileBuffer = await fs.readFile(mainFilePath);
  } catch (err) {
    console.error(`Could not read file: ${mainFilePath}`, err);
    return null;
  }
  // Upload the file to Sanity and patch the element's file property
  let uploadedAsset;
  try {
    uploadedAsset = await sanity.assets.upload('file', fileBuffer, { filename: mainFiles[0] });
  } catch (err) {
    console.error('Failed to upload file to Sanity:', err);
    return null;
  }
  const patched = await sanity.patch(result._id).set({ file: { _type: 'file', asset: { _type: 'reference', _ref: uploadedAsset._id } } }).commit();
  console.log(`Uploaded main content file for eagleId ${eagleId} to Sanity.`);
  return patched;
} 