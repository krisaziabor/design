import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/**
 * Handles uploading a JPG file for a given Eagle ID to the Sanity element's file property.
 * The JPG is copied, resized to max 2500x2500, uploaded, and the copy is deleted after successful upload.
 * @param eagleId The Eagle ID of the element
 * @param sanity The Sanity client
 * @returns The patched document, or null if upload failed
 */
export async function handleJPGFileType(eagleId: string, sanity: any) {
  if (!eagleId) {
    console.warn('No eagleId provided to handleJPGFileType.');
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
  const copyFilePath = path.join(folderPath, `copy_${mainFileName}`);

  // Copy the file
  try {
    await fs.copyFile(mainFilePath, copyFilePath);
    // console.log(`Copied main file to ${copyFilePath}`);
  } catch (err) {
    console.error(`Failed to copy file: ${mainFilePath} to ${copyFilePath}`, err);
    return null;
  }

  // Resize the copy to max 2500x2500
  try {
    await sharp(copyFilePath)
      .resize({ width: 2500, height: 2500, fit: 'inside', withoutEnlargement: true })
      .toFile(copyFilePath + '_resized.jpg');
    await fs.unlink(copyFilePath); // Remove the unresized copy
    await fs.rename(copyFilePath + '_resized.jpg', copyFilePath); // Use the resized as the copy
    // console.log(`Resized image to max 2500x2500 at ${copyFilePath}`);
  } catch (err) {
    console.error(`Failed to resize image: ${copyFilePath}`, err);
    await fs.unlink(copyFilePath).catch(() => {}); // Clean up
    return null;
  }

  // Fetch the element's _id by eagleId
  const result = await sanity.fetch(
    '*[_type == "elements" && eagleId == $eagleId][0]{_id}',
    { eagleId }
  );
  if (!result || !result._id) {
    console.warn(`No element found in Sanity with eagleId ${eagleId}`);
    await fs.unlink(copyFilePath).catch(() => {});
    return null;
  }

  // Read the resized file as a buffer
  let fileBuffer;
  try {
    fileBuffer = await fs.readFile(copyFilePath);
  } catch (err) {
    console.error(`Could not read file: ${copyFilePath}`, err);
    await fs.unlink(copyFilePath).catch(() => {});
    return null;
  }

  // Upload the file to Sanity and patch the element's file property
  let uploadedAsset;
  try {
    uploadedAsset = await sanity.assets.upload('file', fileBuffer, { filename: mainFileName });
  } catch (err) {
    console.error('Failed to upload file to Sanity:', err);
    await fs.unlink(copyFilePath).catch(() => {});
    return null;
  }

  // Delete the copy after successful upload
  try {
    await fs.unlink(copyFilePath);
    // console.log(`Deleted temporary copy: ${copyFilePath}`);
  } catch (err) {
    console.error(`Failed to delete temporary copy: ${copyFilePath}`, err);
  }

  const patched = await sanity.patch(result._id).set({ file: { _type: 'file', asset: { _type: 'reference', _ref: uploadedAsset._id } } }).commit();
  // console.log(`Uploaded JPG file for eagleId ${eagleId} to Sanity.`);
  return patched;
} 