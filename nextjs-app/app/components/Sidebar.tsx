"use client";
import React, { useState, useEffect } from "react";
import { clientPublic } from "@/sanity/lib/client-public";

// GROQ queries
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

export default function Sidebar({ onSelect, selected: selectedProp }: { onSelect: (filter: { type: 'all' | 'category' | 'subcategory', id?: string }) => void, selected?: { type: 'all' | 'category' | 'subcategory', id?: string } }) {
  // State for toggling between Tags and Projects
  const [view, setView] = useState<'tags' | 'projects'>('tags');
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ type: 'all' | 'category' | 'subcategory', id?: string }>(selectedProp || { type: 'all' });

  useEffect(() => {
    if (selectedProp && (selectedProp.type !== selected.type || selectedProp.id !== selected.id)) {
      setSelected(selectedProp);
    }
  }, [selectedProp, selected.id, selected.type]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [cats, subs, projs] = await Promise.all([
        clientPublic.fetch(categoriesWithCountQuery),
        clientPublic.fetch(subcategoriesWithCountQuery),
        clientPublic.fetch(projectsWithCountQuery),
      ]);
      setCategories(cats || []);
      setSubcategories(subs || []);
      setProjects(projs || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Calculate total inspirations for 'All'
  const allCount =
    view === 'tags'
      ? categories.reduce((sum, c) => sum + (c.count || 0), 0)
      : projects.reduce((sum, p) => sum + (p.count || 0), 0);

  // Sort categories and projects alphabetically by name
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
  const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name));

  // Group subcategories by parentCategory._id
  const subcategoriesByParent: Record<string, any[]> = {};
  for (const sub of subcategories) {
    if (!sub.parentCategory?._id) continue;
    if (!subcategoriesByParent[sub.parentCategory._id]) subcategoriesByParent[sub.parentCategory._id] = [];
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
    onSelect({ type: 'subcategory', id: subId });
  }

  return (
    <aside className="w-64 min-h-screen bg-white flex flex-col pt-8 pb-8 pl-8 pr-4">
      <div className="flex flex-col w-full h-full flex-1 justify-between">
        {/* Top controls section container */}
        <div className="w-full flex flex-col gap-1">
          {/* Group 1: All with count aligned right */}
          <div className="flex items-center w-full justify-between cursor-pointer" onClick={handleSelectAll}>
            <span className={`text-sm ${selected.type === 'all' ? 'text-gray-500' : 'text-black'}`} style={{ fontFamily: 'var(--font-albragrotesk)' }}>All</span>
            <span className={`text-sm ${selected.type === 'all' ? 'text-gray-500' : 'text-black'}`} style={{ fontFamily: 'var(--font-albragrotesk)' }}>{allCount}</span>
          </div>
          {/* Group 2: Tags | Projects with vertical bar and toggle */}
          <div className="flex items-center w-full">
            <button
              className={`text-sm focus:outline-none ${view === 'tags' ? 'text-selected' : 'text-black'}`}
              style={{ fontFamily: 'var(--font-albragrotesk)' }}
              onClick={() => setView('tags')}
              aria-pressed={view === 'tags'}
              type="button"
            >
              Tags
            </button>
            <span className="h-4 w-px bg-black mx-2" />
            <button
              className={`text-sm focus:outline-none ${view === 'projects' ? 'text-selected' : 'text-black'}`}
              style={{ fontFamily: 'var(--font-albragrotesk)' }}
              onClick={() => setView('projects')}
              aria-pressed={view === 'projects'}
              type="button"
            >
              Projects
            </button>
          </div>
          {/* Group 3: Search label */}
          <div className="w-full">
            <span className="text-sm text-black" style={{ fontFamily: 'var(--font-albragrotesk)' }}>Search</span>
          </div>
        </div>
        {/* Middle list section container (vertically centered) */}
        <div className="w-full flex flex-col gap-1 my-auto overflow-y-auto">
          {loading ? (
            <span className="text-xs text-gray-400">Loading...</span>
          ) : view === 'tags' ? (
            sortedCategories.map((cat) => (
              <React.Fragment key={cat._id}>
                <div
                  className={`flex items-center w-full justify-between cursor-pointer`}
                  onClick={() => handleSelectCategory(cat._id)}
                >
                  <span className={`text-sm ${((selected.type === 'category' && selected.id === cat._id) || (selected.type === 'subcategory' && openCategory === cat._id)) ? 'text-gray-500' : 'text-black'}`} style={{ fontFamily: 'var(--font-albragrotesk)' }}>{cat.name}</span>
                  <span className={`text-sm ${((selected.type === 'category' && selected.id === cat._id) || (selected.type === 'subcategory' && openCategory === cat._id)) ? 'text-gray-500' : 'text-black'}`} style={{ fontFamily: 'var(--font-albragrotesk)' }}>{cat.count}</span>
                </div>
                {/* Subcategories, if this category is open */}
                {openCategory === cat._id && subcategoriesByParent[cat._id] && (
                  <div className="ml-4 flex flex-col gap-1">
                    {subcategoriesByParent[cat._id].map((sub) => (
                      <div
                        key={sub._id}
                        className={`flex items-center w-full justify-between cursor-pointer`}
                        onClick={() => handleSelectSubcategory(sub._id, cat._id)}
                      >
                        <span className={`text-xs ${selected.type === 'subcategory' && selected.id === sub._id ? 'text-gray-500' : 'text-black'}`} style={{ fontFamily: 'var(--font-albragrotesk)' }}>{sub.name}</span>
                        <span className={`text-xs ${selected.type === 'subcategory' && selected.id === sub._id ? 'text-gray-500' : 'text-black'}`} style={{ fontFamily: 'var(--font-albragrotesk)' }}>{sub.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))
          ) : (
            <>
              <div className="mb-3 text-xs text-gray-500" style={{ fontFamily: 'var(--font-albragrotesk)' }}>
                Note: Not every element in the library is linked to a project. To view all elements, toggle the Tags view instead.
              </div>
              {sortedProjects.map((proj) => (
                <div key={proj._id} className="flex items-center w-full justify-between">
                  <span className="text-sm  text-black" style={{ fontFamily: 'var(--font-albragrotesk)' }}>{proj.name}</span>
                  <span className="text-sm  text-black" style={{ fontFamily: 'var(--font-albragrotesk)' }}>{proj.count}</span>
                </div>
              ))}
            </>
          )}
        </div>
        {/* Bottom section container */}
        <div className="w-full mt-6 mb-4 flex-shrink-0 flex items-center">
          <span className="text-sm  text-black" style={{ fontFamily: 'var(--font-albragrotesk)' }}>KAKA Design Library</span>
        </div>
      </div>
    </aside>
  );
} 