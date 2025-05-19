import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/**
 * Handles uploading a non-JPG file (avif, heic, png, webp) for a given Eagle ID to Sanity.
 * Copies the main file, converts to JPG, resizes to max 2500x2500, uploads, and deletes the copy after upload.
 * @param eagleId The Eagle ID of the element
 * @param sanity The Sanity client
 * @returns The patched document, or null if upload failed
 */
export async function handleNonJPGSFileType(eagleId: string, sanity: any) {
  const supportedTypes = ['avif', 'heic', 'png', 'webp'];
  if (!eagleId) {
    console.warn('No eagleId provided to handleNonJPGSFileType.');
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

  // Copy the file
  const copyFilePath = path.join(folderPath, `copy_${mainFileName}`);
  try {
    await fs.copyFile(mainFilePath, copyFilePath);
    // console.log(`Copied main file to ${copyFilePath}`);
  } catch (err) {
    console.error(`Failed to copy file: ${mainFilePath} to ${copyFilePath}`, err);
    return null;
  }

  // Convert to JPG and resize
  const jpgFilePath = copyFilePath.replace(path.extname(copyFilePath), '.jpg');
  try {
    await sharp(copyFilePath)
      .resize({ width: 2500, height: 2500, fit: 'inside', withoutEnlargement: true })
      .jpeg()
      .toFile(jpgFilePath);
    // console.log(`Converted and resized image to JPG at ${jpgFilePath}`);
    await fs.unlink(copyFilePath); // Remove the non-JPG copy
  } catch (err) {
    console.error(`Failed to convert and resize file to JPG: ${copyFilePath}`, err);
    await fs.unlink(copyFilePath).catch(() => {}); // Clean up
    return null;
  }

  // Read the JPG as a buffer
  let fileBuffer;
  try {
    fileBuffer = await fs.readFile(jpgFilePath);
  } catch (err) {
    console.error(`Could not read file: ${jpgFilePath}`, err);
    await fs.unlink(jpgFilePath).catch(() => {});
    return null;
  }
  // Upload the file to Sanity and patch the element's file property
  let uploadedAsset;
  try {
    uploadedAsset = await sanity.assets.upload('file', fileBuffer, { filename: path.basename(jpgFilePath) });
  } catch (err) {
    console.error('Failed to upload file to Sanity:', err);
    await fs.unlink(jpgFilePath).catch(() => {});
    return null;
  }
  // Delete the JPG after successful upload
  try {
    await fs.unlink(jpgFilePath);
    // console.log(`Deleted temporary JPG: ${jpgFilePath}`);
  } catch (err) {
    console.error(`Failed to delete temporary JPG: ${jpgFilePath}`, err);
  }
  const patched = await sanity.patch(result._id).set({ file: { _type: 'file', asset: { _type: 'reference', _ref: uploadedAsset._id } } }).commit();
  // console.log(`Uploaded JPG (from non-JPG) for eagleId ${eagleId} to Sanity.`);
  return patched;
} 