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
const projectsWithCountQuery = `
  *[_type == "project"]{
    _id,
    name,
    "count": count(*[_type == 'elements' && references(^._id)])
  }
`;

export default function Sidebar() {
  // State for toggling between Tags and Projects
  const [view, setView] = useState<'tags' | 'projects'>('tags');
  const [categories, setCategories] = useState<{ _id: string; name: string; count: number }[]>([]);
  const [projects, setProjects] = useState<{ _id: string; name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [cats, projs] = await Promise.all([
        clientPublic.fetch(categoriesWithCountQuery),
        clientPublic.fetch(projectsWithCountQuery),
      ]);
      setCategories(cats || []);
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

  return (
    <aside className="w-64 min-h-screen bg-white flex flex-col pt-8 pb-8 pl-8 pr-4">
      <div className="flex flex-col w-full h-full flex-1 justify-between">
        {/* Top controls section container */}
        <div className="w-full flex flex-col gap-1">
          {/* Group 1: All with count aligned right */}
          <div className="flex items-center w-full justify-between">
            <span className="text-sm text-selected" style={{ fontFamily: 'var(--font-albragrotesk)' }}>All</span>
            <span className="text-sm text-selected" style={{ fontFamily: 'var(--font-albragrotesk)' }}>{allCount}</span>
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
            categories.map((cat) => (
              <div key={cat._id} className="flex items-center w-full justify-between">
                <span className="text-sm  text-black" style={{ fontFamily: 'var(--font-albragrotesk)' }}>{cat.name}</span>
                <span className="text-sm  text-black" style={{ fontFamily: 'var(--font-albragrotesk)' }}>{cat.count}</span>
              </div>
            ))
          ) : (
            <>
              <div className="mb-3 text-xs text-gray-500" style={{ fontFamily: 'var(--font-albragrotesk)' }}>
                Note: Not every element in the library is linked to a project. To view all elements, toggle the Tags view instead.
              </div>
              {projects.map((proj) => (
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