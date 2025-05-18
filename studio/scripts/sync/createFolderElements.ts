import { createElement } from './createElement';
import { ensureSubCategoriesExist } from './ensureSubCategoriesExist';

export async function createFolderElements(folder: any, elements: any[], mainCategoryRef: string, sanity: any) {
  for (const el of elements) {
    await createElement(el, mainCategoryRef, sanity, ensureSubCategoriesExist);
  }
} 