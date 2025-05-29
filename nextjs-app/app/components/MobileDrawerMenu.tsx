'use client';
import React, { useState, useMemo } from 'react';
import { Drawer } from 'vaul';
import useSidebarData from './useSidebarData';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function MobileDrawerMenu({ selected, onSelect }: {
  selected: { type: 'all' | 'category' | 'subcategory' | 'project'; id?: string };
  onSelect: (filter: { type: 'all' | 'category' | 'subcategory' | 'project'; id?: string; parentCategoryId?: string }) => void;
}) {
  const { categories, subcategories, projects, totalElements, loading } = useSidebarData();
  const [open, setOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');

  // Find current category/subcategory/project name and count
  const current = useMemo(() => {
    if (selected.type === 'category' && selected.id) {
      const cat = categories.find(c => c._id === selected.id);
      return cat ? { name: cat.name, count: cat.count } : { name: 'Category', count: 0 };
    } else if (selected.type === 'subcategory' && selected.id) {
      const sub = subcategories.find(s => s._id === selected.id);
      return sub ? { name: sub.name, count: sub.count } : { name: 'Subcategory', count: 0 };
    } else if (selected.type === 'project' && selected.id) {
      const proj = projects.find(p => p._id === selected.id);
      return proj ? { name: proj.name, count: proj.count } : { name: 'Project', count: 0 };
    } else {
      return { name: 'All', count: totalElements };
    }
  }, [selected, categories, subcategories, projects, totalElements]);

  // Sort categories and projects alphabetically
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
  const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name));

  // Helper for color classes (copied from Sidebar)
  const getSidebarItemClass = (isSelected: boolean, isAll: boolean = false) =>
    [
      'text-sm transition-colors cursor-pointer',
      isSelected ? 'text-selected-light dark:text-selected-dark' : 'text-default-light dark:text-default-dark',
      'hover:text-selected-light dark:hover:text-selected-dark'
    ].join(' ');

  // Determine peek text logic
  let peekText: React.ReactNode = null;
  const isHome = pathname === '/';
  const isProject = pathname.startsWith('/projects/');
  const isElement = pathname.startsWith('/elements/');
  const isInfo = pathname === '/info';
  const isColophon = pathname === '/colophon';
  const isSignin = pathname === '/signin';
  const isSearch = pathname === '/search';
  if (
    isProject ||
    isElement ||
    isInfo ||
    isColophon ||
    isSignin ||
    isSearch ||
    (!isHome && !isProject && !isElement)
  ) {
    peekText = <span>KAKA Design Library</span>;
  } else if (
    isHome && ['category', 'subcategory', 'project'].includes(selected.type)
  ) {
    peekText = <>
      <span>{current.name}</span>
      <span className="text-xs text-selected-dark dark:text-selected-light">{current.count}</span>
    </>;
  } else if (isHome && selected.type === 'all') {
    peekText = <>
      <span>All</span>
      <span className="text-xs text-selected-dark dark:text-selected-light">{totalElements}</span>
    </>;
  } else {
    peekText = <span>KAKA Design Library</span>;
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} modal={true} direction="bottom">
      {/* Closed state: current category & count, drag handle */}
      {!open && (
        <Drawer.Trigger asChild>
          <button className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center bg-black dark:bg-white py-4 drop-shadow-xl rounded-t-2xl" style={{ minHeight: 64 }}>
            <div className="w-10 h-2 rounded-full bg-gray-200 dark:bg-gray-700 mb-2 mt-1" />
            <div className="flex items-center gap-2 font-[family-name:var(--font-albragrotesk)] text-base text-selected-dark dark:text-selected-light">
              {peekText}
            </div>
          </button>
        </Drawer.Trigger>
      )}
      {/* Drawer content */}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/30 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-black dark:bg-white rounded-t-2xl shadow-xl transition-shadow duration-300 max-h-[80vh] flex flex-col">
          {/* Always visible drag handle at the very top */}
          <div className="flex flex-col items-center pt-3 pb-2" style={{ minHeight: 32 }}>
            <div className="w-10 h-2 rounded-full bg-gray-200 dark:bg-gray-700 mb-2" />
          </div>
          {/* Main nav container: All, Search, Tags, Projects */}
          <div className="flex flex-col gap-3 px-4 pb-2">
            {/* All item */}
            <Link
              href="/"
              className={
                'w-full flex justify-between items-center text-sm font-[family-name:var(--font-albragrotesk)] text-white dark:text-black ' +
                (selected.type === 'all' ? 'text-selected-light dark:text-selected-dark' : 'text-default-light dark:text-default-dark')
              }
              onClick={() => setOpen(false)}
            >
              <span>All</span>
              <span>{totalElements}</span>
            </Link>
            {/* Search input with help icon */}
            <div className="w-full relative flex items-center">
              <form
                className="flex-1"
                onSubmit={e => {
                  e.preventDefault();
                  if (searchValue.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
                    setOpen(false);
                  }
                }}
              >
                <input
                  type="text"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  placeholder="Search..."
                  className="w-full text-sm text-selected-dark dark:text-selected-light placeholder-selected-dark dark:placeholder-default-light focus:outline-none bg-transparent"
                  aria-label="Search library"
                />
              </form>
              {/* Help icon */}
              <div className="relative ml-2 group flex-shrink-0">
                <button
                  type="button"
                  tabIndex={0}
                  aria-label="Search help"
                  className="text-selected-dark dark:text-selected-light focus:outline-none"
                  style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <text x="10" y="15" textAnchor="middle" fontSize="13" fill="currentColor" fontFamily="inherit">?</text>
                  </svg>
                </button>
                {/* Tooltip/modal */}
                <div className="absolute right-0 top-8 z-50 max-w-xs w-max bg-stone-900 dark:bg-white border border-selected-light dark:border-selected-dark rounded shadow-lg px-4 py-3 text-xs text-selected-dark dark:text-selected-light font-[family-name:var(--font-albragrotesk)] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-opacity duration-150" role="tooltip">
                  Use <span className="font-mono bg-gray-800 dark:bg-gray-100 px-1 rounded">proj:</span> and <span className="font-mono bg-gray-800 dark:bg-gray-100 px-1 rounded">comm:</span> to filter for either connected projects or comments (or both together)
                </div>
              </div>
            </div>
            {/* Collapsible Tags */}
            <div>
              <button className="w-full flex justify-between items-center text-sm text-white dark:text-black" onClick={() => setTagsOpen(v => !v)}>
                <span className="text-sm">Tags</span>
                <span>{tagsOpen ? '▲' : '▼'}</span>
              </button>
              {tagsOpen && (
                <div className="pl-2 pb-2 flex flex-col gap-1">
                  {sortedCategories.map(cat => {
                    const isDisabled = cat.count === 0;
                    const isSelected = selected.type === 'category' && selected.id === cat._id;
                    return (
                      <button
                        key={cat._id}
                        className={
                          getSidebarItemClass(isSelected) +
                          ` flex justify-between items-center w-full ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} text-white dark:text-black text-sm`
                        }
                        onClick={() => {
                          if (!isDisabled) {
                            onSelect({ type: 'category', id: cat._id });
                            setOpen(false);
                          }
                        }}
                        disabled={isDisabled}
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs text-gray-300 dark:text-gray-700">{cat.count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Collapsible Projects */}
            <div>
              <button className="w-full flex justify-between items-center text-sm text-white dark:text-black" onClick={() => setProjectsOpen(v => !v)}>
                <span className="text-sm">Projects</span>
                <span>{projectsOpen ? '▲' : '▼'}</span>
              </button>
              {projectsOpen && (
                <div className="pl-2 pb-2 flex flex-col gap-1">
                  {sortedProjects.map(proj => {
                    const isDisabled = proj.count === 0;
                    const isSelected = selected.type === 'project' && selected.id === proj._id;
                    return (
                      <button
                        key={proj._id}
                        className={
                          getSidebarItemClass(isSelected) +
                          ` flex justify-between items-center w-full ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} text-white dark:text-black text-sm`
                        }
                        onClick={() => {
                          if (!isDisabled) {
                            onSelect({ type: 'project', id: proj._id });
                            setOpen(false);
                          }
                        }}
                        disabled={isDisabled}
                      >
                        <span>{proj.name}</span>
                        <span className="text-xs text-gray-300 dark:text-gray-700">{proj.count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {/* Divider */}
          <div className="my-4 border-t border-gray-800 dark:border-gray-200" />
          {/* Bottom links */}
          <div className="flex flex-col gap-2 px-4 pb-6">
            <Link href="/info" className="text-left text-sm text-default-light dark:text-default-dark">Information</Link>
            <Link href="/colophon" className="text-left text-sm text-default-light dark:text-default-dark">Colophon</Link>
            <Link href="/signin" className="text-left text-sm text-default-light dark:text-default-dark">Log In</Link>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
} 