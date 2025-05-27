'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn, useUser, SignOutButton } from '@clerk/nextjs';

import { clientPublic } from '@/sanity/lib/client-public';

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

export function CustomSignIn() {
  const [emailSent, setEmailSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, setActive } = useSignIn();
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <div className="flex flex-col gap-2 p-4 items-start">
        <div className="text-sm font-normal mb-1 text-left">You are currently signed in.</div>
        <SignOutButton>
          <button className="text-blue-600 underline text-sm text-left">Log out</button>
        </SignOutButton>
      </div>
    );
  }

  async function sendEmailCode() {
    setLoading(true);
    setError('');
    if (!signIn) {
      setError('Sign in not ready. Please try again.');
      setLoading(false);
      return;
    }
    try {
      await signIn.create({ identifier: 'studio@krisaziabor.com', strategy: 'email_code' });
      setEmailSent(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  async function resendEmailCode() {
    setLoading(true);
    setError('');
    if (!signIn) {
      setError('Sign in not ready. Please try again.');
      setLoading(false);
      return;
    }
    try {
      await signIn.create({ identifier: 'studio@krisaziabor.com', strategy: 'email_code' });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  }

  async function submitCode() {
    setLoading(true);
    setError('');
    if (!signIn) {
      setError('Sign in not ready. Please try again.');
      setLoading(false);
      return;
    }
    try {
      const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setEmailSent(false);
        setCode('');
      } else {
        setError('Invalid code or not complete.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-lg font-semibold mb-2">Sign in</div>
      {!emailSent ? (
        <button
          className="text-blue-600 font-semibold py-2 px-4 rounded bg-gray-100 hover:bg-blue-50 disabled:opacity-50"
          onClick={sendEmailCode}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send email code'}
        </button>
      ) : (
        <>
          <input
            type="text"
            className="border rounded px-2 py-1 text-sm mb-2"
            placeholder="Enter code"
            value={code}
            onChange={e => setCode(e.target.value)}
            disabled={loading}
          />
          <div className="flex gap-2 mb-2">
            <button
              className="text-blue-600 underline text-sm"
              onClick={resendEmailCode}
              disabled={loading}
            >
              Resend
            </button>
            <button
              className="text-blue-600 font-semibold py-1 px-3 rounded bg-gray-100 hover:bg-blue-50 text-sm"
              onClick={submitCode}
              disabled={loading || !code}
            >
              {loading ? 'Verifying...' : 'Enter'}
            </button>
          </div>
        </>
      )}
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      <div className="text-xs text-gray-500 mt-2">Sign in with studio@krisaziabor.com</div>
    </div>
  );
}

export default function Sidebar({
  onSelect,

  selected: selectedProp,

  infoMode: infoModeProp,

  setInfoMode: setInfoModeProp,

  infoTab: infoTabProp,

  setInfoTab: setInfoTabProp,

  initialView,
}: {
  onSelect: (filter: { type: 'all' | 'category' | 'subcategory' | 'project'; id?: string }) => void;

  selected?: { type: 'all' | 'category' | 'subcategory' | 'project'; id?: string };

  infoMode?: boolean;

  setInfoMode?: (v: boolean) => void;

  infoTab?: 'information' | 'colophon' | 'login';

  setInfoTab?: (v: 'information' | 'colophon' | 'login') => void;

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

  const [infoModeInternal, setInfoModeInternal] = useState(false);

  const [infoTabInternal, setInfoTabInternal] = useState<'information' | 'colophon' | 'login'>(
    'information'
  );

  const [totalElements, setTotalElements] = useState<number>(0);

  const router = useRouter();

  const infoMode = typeof infoModeProp === 'boolean' ? infoModeProp : infoModeInternal;

  const setInfoMode = setInfoModeProp || setInfoModeInternal;

  const infoTab = infoTabProp || infoTabInternal;

  const setInfoTab = setInfoTabProp || setInfoTabInternal;

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

    onSelect({ type: 'subcategory', id: subId });
  }

  function handleSelectProject(projId: string) {
    setSelected({ type: 'project', id: projId });
    router.push(`/projects/${projId}`);
    onSelect({ type: 'project', id: projId });
  }

  // Helper for color classes

  const getSidebarItemClass = (isSelected: boolean, isAll: boolean = false) =>
    isAll
      ? 'text-sm text-gray-500 hover:text-foreground transition-colors'
      : `text-sm ${isSelected ? 'text-foreground' : 'text-gray-500'} hover:text-foreground transition-colors`;

  const getSidebarSubItemClass = (isSelected: boolean) =>
    `text-xs ${isSelected ? 'text-foreground' : 'text-gray-500'} hover:text-foreground transition-colors`;

  const getSidebarButtonClass = (isSelected: boolean) =>
    `text-sm focus:outline-none ${isSelected ? 'text-foreground' : 'text-gray-500'} hover:text-foreground transition-colors`;

  const getSidebarBottomLinkClass = (isSelected: boolean) =>
    `text-sm cursor-pointer ${isSelected ? 'text-foreground' : 'text-gray-500'} hover:text-foreground transition-colors`;

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-black flex flex-col pt-8 pb-8 pl-8 pr-4">
      <div className="flex flex-col w-full h-full flex-1 justify-between">
        {/* Top controls section container */}

        {infoMode ? (
          <div className="w-full flex flex-col gap-2 mb-6">
            <span
              className={`text-sm cursor-pointer ${infoTab === 'information' ? 'text-foreground' : 'text-gray-500'} hover:text-foreground font-[family-name:var(--font-albragrotesk)]`}
              onClick={() => setInfoTab('information')}
            >
              Information
            </span>

            <span
              className={`text-sm cursor-pointer ${infoTab === 'colophon' ? 'text-foreground' : 'text-gray-500'} hover:text-foreground font-[family-name:var(--font-albragrotesk)]`}
              onClick={() => setInfoTab('colophon')}
            >
              Colophon
            </span>

            <span
              className={`text-sm cursor-pointer ${infoTab === 'login' ? 'text-foreground' : 'text-gray-500'} hover:text-foreground font-[family-name:var(--font-albragrotesk)]`}
              onClick={() => setInfoTab('login')}
            >
              Sign in
            </span>
          </div>
        ) : (
          <>
            {/* Group 1: All with count aligned right */}

            <div
              className="flex items-center w-full justify-between cursor-pointer font-[family-name:var(--font-albragrotesk)]"
              onClick={handleSelectAll}
            >
              <span
                className= {getSidebarItemClass(false, true)}
              >
                All
              </span>

              <span
                className={getSidebarItemClass(false, true)}
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

            {/* Group 3: Search label */}

            <div className="w-full">
              <span
                className="text-sm text-foreground font-[family-name:var(--font-albragrotesk)]"
              >
                Search
              </span>
            </div>
          </>
        )}

        {/* Middle list section container (vertically centered) */}

        {!infoMode && (
          <div className="w-full flex flex-col gap-1 my-auto overflow-y-auto">
            {loading ? (
              <span className="text-xs text-gray-400">Loading...</span>
            ) : view === 'tags' ? (
              sortedCategories.map((cat) => {
                const isDisabled = cat.count === 0;
                return (
                  <React.Fragment key={cat._id}>
                    <div
                      className={`flex items-center w-full justify-between ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={isDisabled ? undefined : () => handleSelectCategory(cat._id)}
                    >
                      <span
                        className={getSidebarItemClass(
                          (selected.type === 'category' && selected.id === cat._id) ||
                            (selected.type === 'subcategory' && openCategory === cat._id)
                        )}
                      >
                        {cat.name}
                      </span>
                      <span
                        className={getSidebarItemClass(
                          (selected.type === 'category' && selected.id === cat._id) ||
                            (selected.type === 'subcategory' && openCategory === cat._id)
                        )}
                      >
                        {cat.count}
                      </span>
                    </div>
                    {/* Subcategories, if this category is open */}
                    {openCategory === cat._id && subcategoriesByParent[cat._id] && (
                      <div className="ml-4 flex flex-col gap-1">
                        {subcategoriesByParent[cat._id].map((sub) => {
                          const isSubDisabled = sub.count === 0;
                          return (
                            <div
                              key={sub._id}
                              className={`flex items-center w-full justify-between ${isSubDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              onClick={isSubDisabled ? undefined : () => handleSelectSubcategory(sub._id, cat._id)}
                            >
                              <span
                                className={getSidebarSubItemClass(
                                  selected.type === 'subcategory' && selected.id === sub._id
                                )}
                              >
                                {sub.name}
                              </span>
                              <span
                                className={getSidebarSubItemClass(
                                  selected.type === 'subcategory' && selected.id === sub._id
                                )}
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
                  className="mb-3 text-xs text-gray-500"
                >
                  Note: Not every element in the library is linked to a project. To view all
                  elements, toggle the Tags view instead.
                </div>

                {sortedProjects.map((proj) => {
                  const isDisabled = proj.count === 0;
                  return (
                    <div
                      key={proj._id}
                      className={`flex items-center w-full justify-between ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={isDisabled ? undefined : () => handleSelectProject(proj._id)}
                    >
                      <span
                        className="text-sm text-foreground"
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
          {infoMode ? (
            <span
              className={getSidebarBottomLinkClass(true)}
              onClick={() => setInfoMode(false)}
              tabIndex={0}
              role="button"
            >
              Return
            </span>
          ) : (
            <span
              className={getSidebarBottomLinkClass(true)}
              onClick={() => setInfoMode(true)}
              tabIndex={0}
              role="button"
            >
              KAKA Design Library
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
