export async function promptForRemovals(eagleFolders: any[], sanityCategories: any[], sanity: any, prompt: (q: string) => Promise<boolean>) {
  const eagleIds = new Set(eagleFolders.map((f: any) => f.id));
  const toRemove = sanityCategories.filter((c: any) => !c.eagleId || !eagleIds.has(c.eagleId));
  console.log('\nCategories flagged for removal:', toRemove.map((c: any) => `${c.name} (eagleId: ${c.eagleId})`));
  if (toRemove.length > 0) {
    console.log('\nCategories in Sanity not found in Eagle or missing eagleId:');
    for (const c of toRemove) {
      console.log(`- ${c.name} (eagleId: ${c.eagleId})`);
      const confirm = await prompt(`Remove this category and all documents referencing it? (${c.name})`);
      if (confirm) {
        // Find all documents referencing this category
        const referencingDocs = await sanity.fetch(
          '*[references($catId)]{_id, _type}',
          { catId: c._id }
        );
        if (referencingDocs.length > 0) {
          for (const doc of referencingDocs) {
            await sanity.delete(doc._id);
            console.log(`  Removed referencing document: ${doc._id} (type: ${doc._type})`);
          }
        }
        await sanity.delete(c._id);
        console.log(`Removed category: ${c.name} (eagleId: ${c.eagleId})`);
      } else {
        console.log(`Skipped removal of category: ${c.name}`);
      }
    }
  }
} 