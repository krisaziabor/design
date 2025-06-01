import { rgbToHex } from '../../helpers/color.js';
import { elementExists } from './elementExists.js';

export async function createElement(el: any, mainCategoryRef: string, sanity: any, ensureSubCategoriesExist: (tags: string[], sanity: any, parentCategoryId: string) => Promise<any[]>) {
  // Check if the element already exists in Sanity by eagleId
  if (await elementExists(el.id, sanity)) {
    console.log(`Element with eagleId ${el.id} already exists. Skipping.`);
    return null;
  }

  // Ensure all subCategories exist and get their references, scoped to the main category
  const subCategoryRefs = await ensureSubCategoriesExist(el.tags || [], sanity, mainCategoryRef);

  const sanityElement = {
    _type: 'elements',
    fileName: el.name,
    fileType: el.ext,
    eagleId: el.id,
    url: el.url,
    dateAdded: new Date(el.btime).toISOString(),
    dateUpdated: new Date(el.mtime).toISOString(),
    colors: Array.isArray(el.palettes)
      ? el.palettes.map((p: any) => rgbToHex(p.color))
      : [],
    mainCategory: {
      _type: 'reference',
      _ref: mainCategoryRef
    },
    subCategories: subCategoryRefs
  };

  const created = await sanity.create(sanityElement);
  console.log('Created element:', created.fileName);
  return created;
}

/**
 * Updates the 'url' field of an existing element in Sanity, given the Eagle response.
 * If the Eagle response's URL is null or empty, does nothing.
 * @param el The Eagle element object (should contain id and url)
 * @param sanity The Sanity client
 * @returns The patched document, or null if nothing was updated
 */
export async function updateElementURL(el: any, sanity: any) {
  if (!el || !el.id) {
    console.warn('No element or eagleId provided to updateElement.');
    return null;
  }
  if (!el.url || typeof el.url !== 'string' || el.url.trim() === '') {
    // No valid URL to update
    return null;
  }
  // Fetch the element's _id by eagleId
  const result = await sanity.fetch(
    '*[_type == "elements" && eagleId == $eagleId][0]{_id, url}',
    { eagleId: el.id }
  );
  if (!result || !result._id) {
    console.warn(`No element found in Sanity with eagleId ${el.id}`);
    return null;
  }
  // Only update if the URL is different
  if (result.url === el.url) {
    return null;
  }
  const patched = await sanity.patch(result._id).set({ url: el.url }).commit();
  console.log(`Updated element (eagleId: ${el.id}) with new URL.`);
  return patched;
} 