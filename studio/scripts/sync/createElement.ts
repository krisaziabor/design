import { rgbToHex } from '../../helpers/color';
import { elementExists } from './elementExists';

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