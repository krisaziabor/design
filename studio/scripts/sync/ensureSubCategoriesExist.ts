export async function ensureSubCategoriesExist(tags: string[], sanity: any, parentCategoryId: string) {
  if (!tags || tags.length === 0) return [];
  // Fetch all existing subCategories with their parentCategory
  const existingSubCategories = await sanity.fetch(`*[_type == "subcategory"]{_id, name, parentCategory}`);
  const refs = [];
  for (const tag of tags) {
    let subCat = existingSubCategories.find((sc: any) =>
      sc.name === tag &&
      sc.parentCategory && sc.parentCategory._ref === parentCategoryId
    );
    if (!subCat) {
      subCat = await sanity.create({
        _type: 'subcategory',
        name: tag,
        parentCategory: { _type: 'reference', _ref: parentCategoryId }
      });
      console.log(`Created new subCategory: ${subCat.name}`);
    }
    refs.push({ _type: 'reference', _ref: subCat._id, _key: subCat._id });
  }
  return refs;
}
