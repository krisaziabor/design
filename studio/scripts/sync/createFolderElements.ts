import { createElement } from './createElement';
import { ensureSubCategoriesExist } from './ensureSubCategoriesExist';
import { updateElementURL } from './createElement';

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