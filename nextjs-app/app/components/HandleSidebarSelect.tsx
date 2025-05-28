// NOTE: 'router' is typed as 'any' because next/navigation does not export its router type.
// This avoids linter errors and works with useRouter().

export type SidebarFilter = { type: 'all' | 'category' | 'subcategory' | 'project'; id?: string; parentCategoryId?: string };

export default function handleSidebarSelect(
  filter: SidebarFilter,
  router: any // see note above
) {
  if (filter.type === 'all') {
    router.push('/');
  } else if (filter.type === 'category' && filter.id) {
    router.push(`/?category=${filter.id}&openCategory=${filter.id}`);
  } else if (filter.type === 'subcategory' && filter.id && filter.parentCategoryId) {
    router.push(`/?subcategory=${filter.id}&openCategory=${filter.parentCategoryId}`);
  } else if (filter.type === 'subcategory' && filter.id) {
    router.push(`/?subcategory=${filter.id}`);
  } else if (filter.type === 'project' && filter.id) {
    router.push(`/?project=${filter.id}`);
  }
}
