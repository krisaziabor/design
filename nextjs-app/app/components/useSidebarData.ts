import { useState, useEffect } from 'react';
import { clientPublic } from '@/sanity/lib/client-public';

const categoriesWithCountQuery = `
*[_type == "category"]{
  _id,
  name,
  "count": count(*[_type == 'elements' && references(^._id)])
}
`;

const subcategoriesWithCountQuery = `
*[_type == "subcategory"]{
  _id,
  name,
  parentCategory->{_id},
  "count": count(*[_type == 'elements' && references(^._id)])
}
`;

const projectsWithCountQuery = `
*[_type == "project"]{
  _id,
  name,
  "count": count(*[_type == 'elements' && references(^._id)])
}
`;

export default function useSidebarData() {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [cats, subs, projs, allCount] = await Promise.all([
        clientPublic.fetch(categoriesWithCountQuery),
        clientPublic.fetch(subcategoriesWithCountQuery),
        clientPublic.fetch(projectsWithCountQuery),
        clientPublic.fetch("count(*[_type == 'elements'])"),
      ]);
      setCategories(cats || []);
      setSubcategories(subs || []);
      setProjects(projs || []);
      setTotalElements(allCount || 0);
      setLoading(false);
    }
    fetchData();
    (window as any).refreshSidebar = fetchData;
    function handleFocus() { fetchData(); }
    window.addEventListener('focus', handleFocus);
    return () => { window.removeEventListener('focus', handleFocus); };
  }, []);

  return { categories, subcategories, projects, totalElements, loading };
} 