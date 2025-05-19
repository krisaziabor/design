import fs from 'fs/promises';
import path from 'path';

/**
 * Uploads the main file for supported 'other' types (svg, pdf, mov, mp4, gif) to Sanity.
 * @param eagleId The Eagle ID of the element
 * @param sanity The Sanity client
 * @returns The patched document, or null if upload failed
 */
export async function handleOtherFileType(eagleId: string, sanity: any) {
  const supportedTypes = ['svg', 'pdf', 'mov', 'mp4', 'gif'];
  if (!eagleId) {
    console.warn('No eagleId provided to handleOtherFileType.');
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
  const mainFileName = mainFiles[0];
  const mainFilePath = path.join(folderPath, mainFileName);

  // Fetch the element's _id and fileType by eagleId
  const result = await sanity.fetch(
    '*[_type == "elements" && eagleId == $eagleId][0]{_id, fileType}',
    { eagleId }
  );
  if (!result || !result._id) {
    console.warn(`No element found in Sanity with eagleId ${eagleId}`);
    return null;
  }
  const normalizedType = result.fileType?.trim().toLowerCase();
  if (!supportedTypes.includes(normalizedType)) {
    console.error(`Unfamiliar file type: '${result.fileType}'. Please update the script to handle this type.`);
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
    uploadedAsset = await sanity.assets.upload('file', fileBuffer, { filename: mainFileName });
  } catch (err) {
    console.error('Failed to upload file to Sanity:', err);
    return null;
  }
  const patched = await sanity.patch(result._id).set({ file: { _type: 'file', asset: { _type: 'reference', _ref: uploadedAsset._id } } }).commit();
  // console.log(`Uploaded main file for eagleId ${eagleId} to Sanity.`);
  return patched;
} 