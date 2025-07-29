'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { clientPublic } from '@/sanity/lib/client-public';

// GROQ queries

const categoriesWithCountQuery = `
*[_type == "category"]{
  _id,
  name,
  "count": count(*[_type == 'elements' && fileUploaded == true && references(^._id)])
}
`;

const subcategoriesWithCountQuery = `
*[_type == "subcategory"]{
  _id,
  name,
  parentCategory->{_id},
  "count": count(*[_type == 'elements' && fileUploaded == true && references(^._id)])
}
`;

const projectsWithCountQuery = `
*[_type == "project"]{
  _id,
  name,
  "count": count(*[_type == 'elements' && fileUploaded == true && references(^._id)])
}
`;

export default function Sidebar({
  onSelect,
  selected: selectedProp,
  initialView,
}: {
  onSelect: (filter: { type: 'all' | 'category' | 'subcategory' | 'project'; id?: string; parentCategoryId?: string }) => void;
  selected?: { type: 'all' | 'category' | 'subcategory' | 'project'; id?: string };
  initialView?: 'tags' | 'projects';
}) {
  // State for toggling between Tags and Projects

  const [view, setView] = useState<'tags' | 'projects'>(initialView || 'tags');

  const [categories, setCategories] = useState<any[]>([]);

  const [subcategories, setSubcategories] = useState<any[]>([]);

  const [projects, setProjects] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const [selected, setSelected] = useState<{
    type: 'all' | 'category' | 'subcategory' | 'project';
    id?: string;
  }>(selectedProp || { type: 'all' });

  const [totalElements, setTotalElements] = useState<number>(0);

  const [searchValue, setSearchValue] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (selectedProp && (selectedProp.type !== selected.type || selectedProp.id !== selected.id)) {
      setSelected(selectedProp);
    }

    // If a subcategory is selected, open its parent category

    if (
      selectedProp &&
      selectedProp.type === 'subcategory' &&
      selectedProp.id &&
      subcategories.length > 0
    ) {
      const sub = subcategories.find((s) => s._id === selectedProp.id);

      if (sub && sub.parentCategory && sub.parentCategory._id) {
        setOpenCategory(sub.parentCategory._id);
      }
    }
  }, [selectedProp, selected.id, selected.type, subcategories]);

  // Set openCategory from URL on mount
  useEffect(() => {
    const openCategoryParam = searchParams.get('openCategory');
    if (openCategoryParam) {
      setOpenCategory(openCategoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [cats, subs, projs, allCount] = await Promise.all([
        clientPublic.fetch(categoriesWithCountQuery),
        clientPublic.fetch(subcategoriesWithCountQuery),
        clientPublic.fetch(projectsWithCountQuery),
        clientPublic.fetch("count(*[_type == 'elements' && fileUploaded == true])"),
      ]);
      setCategories(cats || []);
      setSubcategories(subs || []);
      setProjects(projs || []);
      setTotalElements(allCount || 0);
      setLoading(false);
    }
    fetchData();
    // Expose refreshSidebar for other components
    (window as any).refreshSidebar = fetchData;

    // Add event listener to refetch on window focus
    function handleFocus() {
      fetchData();
    }
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Calculate total inspirations for 'All'

  const allCount = totalElements;

  // Sort categories and projects alphabetically by name

  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name));

  // Group subcategories by parentCategory._id

  const subcategoriesByParent: Record<string, any[]> = {};

  for (const sub of subcategories) {
    if (!sub.parentCategory?._id) continue;

    if (!subcategoriesByParent[sub.parentCategory._id])
      subcategoriesByParent[sub.parentCategory._id] = [];

    subcategoriesByParent[sub.parentCategory._id].push(sub);
  }

  function handleSelectAll() {
    setSelected({ type: 'all' });

    setOpenCategory(null); // collapse all categories

    onSelect({ type: 'all' });
  }

  function handleSelectCategory(catId: string) {
    setSelected({ type: 'category', id: catId });
    setOpenCategory(openCategory === catId ? null : catId);
    onSelect({ type: 'category', id: catId });
  }

  function handleSelectSubcategory(subId: string, parentId: string) {
    setSelected({ type: 'subcategory', id: subId });
    setOpenCategory(parentId); // keep parent open
    onSelect({ type: 'subcategory', id: subId, parentCategoryId: parentId });
  }

  function handleSelectProject(projId: string) {
    setSelected({ type: 'project', id: projId });
    router.push(`/projects/${projId}`);
    onSelect({ type: 'project', id: projId });
  }

  // Helper for color classes

  const getSidebarItemClass = (isSelected: boolean, isAll: boolean = false) =>
    [
      'text-sm transition-colors cursor-pointer',
      isSelected ? 'text-selected-light dark:text-selected-dark' : 'text-default-light dark:text-default-dark',
      'hover:text-selected-light dark:hover:text-selected-dark'
    ].join(' ');

  const getSidebarSubItemClass = (isSelected: boolean) =>
    [
      'text-xs transition-colors cursor-pointer',
      isSelected ? 'text-selected-light dark:text-selected-dark' : 'text-default-light dark:text-default-dark',
      'hover:text-selected-light dark:hover:text-selected-dark'
    ].join(' ');

  const getSidebarButtonClass = (isSelected: boolean) =>
    [
      'text-sm focus:outline-none transition-colors cursor-pointer',
      isSelected ? 'text-selected-light dark:text-selected-dark' : 'text-default-light dark:text-default-dark',
      'hover:text-selected-light dark:hover:text-selected-dark'
    ].join(' ');

  const getSidebarBottomLinkClass = (isSelected: boolean) =>
    [
      'text-sm cursor-pointer transition-colors',
      isSelected ? 'text-selected-light dark:text-selected-dark' : 'text-default-light dark:text-default-dark',
      'hover:text-selected-light dark:hover:text-selected-dark'
    ].join(' ');

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-black flex flex-col pt-8 pb-8 pl-8 pr-4">
      <div className="flex flex-col w-full h-full flex-1 justify-between">
        {/* Top controls section container */}

        {/* Group 1: All with count aligned right */}

        <div
          className="group flex items-center w-full justify-between cursor-pointer font-[family-name:var(--font-albragrotesk)]"
          onClick={handleSelectAll}
        >
          <span
            className={getSidebarItemClass(false, true) + ' group-hover:text-selected-light dark:group-hover:text-selected-dark'}
          >
            All
          </span>

          <span
            className={getSidebarItemClass(false, true) + ' group-hover:text-selected-light dark:group-hover:text-selected-dark'}
          >
            {allCount}
          </span>
        </div>

        {/* Group 2: Tags | Projects with vertical bar and toggle */}

        <div className="flex items-center w-full font-[family-name:var(--font-albragrotesk)]">
          <button
            className={getSidebarButtonClass(view === 'tags')}
            onClick={() => setView('tags')}
            aria-pressed={view === 'tags'}
            type="button"
          >
            Tags
          </button>

          <span className="h-4 w-px bg-foreground mx-2 font-[family-name:var(--font-albragrotesk)]" />

          <button
            className={getSidebarButtonClass(view === 'projects')}
            onClick={() => setView('projects')}
            aria-pressed={view === 'projects'}
            type="button"
          >
            Projects
          </button>
        </div>

        {/* Group 3: Search input with help icon */}
        <div className="w-full relative flex items-center">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (searchValue.trim()) {
                router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
              }
            }}
            className="flex-1"
          >
            <input
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="Search..."
              className="w-full text-sm text-selected-light dark:text-selected-dark placeholder-default-light dark:placeholder-default-dark font-[family-name:var(--font-albragrotesk)] focus:outline-none bg-transparent border-none p-0 m-0 shadow-none"
              aria-label="Search library"
              style={{ boxShadow: 'none', background: 'none', border: 'none' }}
            />
          </form>
          {/* Help icon */}
          <div className="relative ml-2 group flex-shrink-0">
            <button
              type="button"
              tabIndex={0}
              aria-label="Search help"
              className="text-default-light dark:text-default-dark focus:outline-none"
              style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <text x="10" y="15" textAnchor="middle" fontSize="13" fill="currentColor" fontFamily="inherit">?</text>
              </svg>
            </button>
            {/* Tooltip/modal */}
            <div className="absolute right-auto left-2 top-7 z-50 w-64 bg-white dark:bg-black border-default-light dark:border-default-dark border rounded shadow-lg px-4 py-3 text-xs text-selected-light dark:text-selected-dark font-[family-name:var(--font-albragrotesk)] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-opacity duration-150" role="tooltip">
              Use <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">proj:</span> and <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">comm:</span> to filter for either connected projects or comments (or both together)
            </div>
          </div>
        </div>

        {/* Middle list section container (vertically centered) */}

        {!loading && (
          <div className="w-full flex flex-col gap-1 my-auto overflow-y-auto">
            {view === 'tags' ? (
              sortedCategories.filter(cat => cat.count > 0).map((cat) => {
                const isDisabled = cat.count === 0;
                return (
                  <React.Fragment key={cat._id}>
                    <div
                      className={`group flex items-center w-full justify-between ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={isDisabled ? undefined : () => handleSelectCategory(cat._id)}
                    >
                      <span
                        className={getSidebarItemClass(
                          (selected.type === 'category' && selected.id === cat._id) ||
                            (selected.type === 'subcategory' && openCategory === cat._id)
                        ) + ' group-hover:text-selected-light dark:group-hover:text-selected-dark'}
                      >
                        {cat.name}
                      </span>
                      <span
                        className={getSidebarItemClass(
                          (selected.type === 'category' && selected.id === cat._id) ||
                            (selected.type === 'subcategory' && openCategory === cat._id)
                        ) + ' group-hover:text-selected-light dark:group-hover:text-selected-dark'}
                      >
                        {cat.count}
                      </span>
                    </div>
                    {/* Subcategories, if this category is open */}
                    {openCategory === cat._id && subcategoriesByParent[cat._id] && (
                      <div className="ml-4 flex flex-col gap-1">
                        {subcategoriesByParent[cat._id].filter(sub => sub.count > 0).map((sub) => {
                          const isSubDisabled = sub.count === 0;
                          return (
                            <div
                              key={sub._id}
                              className={`group flex items-center w-full justify-between ${isSubDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              onClick={isSubDisabled ? undefined : () => handleSelectSubcategory(sub._id, cat._id)}
                            >
                              <span
                                className={getSidebarSubItemClass(
                                  selected.type === 'subcategory' && selected.id === sub._id
                                ) + ' group-hover:text-selected-light dark:group-hover:text-selected-dark'}
                              >
                                {sub.name}
                              </span>
                              <span
                                className={getSidebarSubItemClass(
                                  selected.type === 'subcategory' && selected.id === sub._id
                                ) + ' group-hover:text-selected-light dark:group-hover:text-selected-dark'}
                              >
                                {sub.count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <>
                <div
                  className="mb-3 text-xs text-default-light dark:text-default-dark"
                >
                  Note: Not every element in the library is linked to a project. To view all
                  elements, toggle the Tags view instead.
                </div>

                {sortedProjects.filter(proj => proj.count > 0).map((proj) => {
                  const isDisabled = proj.count === 0;
                  return (
                    <div
                      key={proj._id}
                      className={`flex items-center w-full justify-between ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'group cursor-pointer'}`}
                      onClick={isDisabled ? undefined : () => handleSelectProject(proj._id)}
                    >
                      <span
                        className={
                          isDisabled
                            ? 'text-sm transition-colors text-default-light dark:text-default-dark'
                            : 'text-sm transition-colors text-default-light dark:text-default-dark group-hover:text-selected-light dark:group-hover:text-selected-dark'
                        }
                      >
                        {proj.name}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Bottom section container */}

        <div className="w-full mt-6 mb-4 flex-shrink-0 flex items-center">
          <div className="group w-full">
            <Link href="/info" className="text-sm cursor-pointer transition-colors text-default-light dark:text-default-dark group-hover:text-selected-light dark:group-hover:text-selected-dark">
              Constellating
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
