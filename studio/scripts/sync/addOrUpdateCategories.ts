import { SanityClient } from '@sanity/client';

export async function addOrUpdateCategories(eagleFolders: any[], sanityCategories: any[], sanity: SanityClient) {
  const sanityIdToCategory = new Map(sanityCategories.map((c: any) => [c.eagleId, c]));

  for (const folder of eagleFolders) {
    const cat = sanityIdToCategory.get(folder.id);
    if (!cat) {
      // Create new category
      await sanity.create({
        _type: 'category',
        name: folder.name,
        description: folder.description || '',
        eagleId: folder.id
      });
      console.log(`Added category: ${folder.name} (Eagle ID: ${folder.id})`);
    } else if ((cat as any).name !== folder.name) {
      // Update name if needed
      await sanity.patch((cat as any)._id).set({ name: folder.name }).commit();
      console.log(`Updated category name to: ${folder.name} (Eagle ID: ${folder.id})`);
    }
  }
} 