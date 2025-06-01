import { createElement } from './createElement.js';
import { ensureSubCategoriesExist } from './ensureSubCategoriesExist.js';
import { updateElementURL } from './createElement.js';

export async function createFolderElements(folder: any, elements: any[], mainCategoryRef: string, sanity: any) {
  for (const el of elements) {
    await createElement(el, mainCategoryRef, sanity, ensureSubCategoriesExist);
  }
} 

export async function updateFolderElementsURLs(folder: any, elements: any[], sanity: any) {
  for (const el of elements) {
    await updateElementURL(el, sanity);
  }
}