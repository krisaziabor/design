import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { formatCommentDate } from '@/app/client-utils';

interface ActionSidebarProps {
  element: any;
  loading: boolean;
  onCommentAdded?: () => void;
}

export default function ActionSidebar({ element, loading, onCommentAdded }: ActionSidebarProps) {
  const [showInput, setShowInput] = useState(false);

  const [newComment, setNewComment] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');

  const [latestComment, setLatestComment] = useState<any>(null);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState('');

  const router = useRouter();

  React.useEffect(() => {
    if (element && Array.isArray(element.comments) && element.comments.length > 0) {
      setLatestComment(element.comments[element.comments.length - 1]);
    } else {
      setLatestComment(null);
    }
  }, [element]);

  useEffect(() => {
    if (showProjectModal) {
      setProjectLoading(true);
      fetch('/api/projects')
        .then((res) => res.json())
        .then((data) => {
          setAllProjects(data.projects || []);
          setSelectedProjects(
            Array.isArray(element?.connectedProjects)
              ? element.connectedProjects.map((p: any) => p._ref || p._id)
              : []
          );
          setProjectLoading(false);
        })
        .catch((err) => {
          setProjectError('Failed to load projects');
          setProjectLoading(false);
        });
    }
  }, [showProjectModal, element]);

  async function handleAddComment() {
    if (!showInput) {
      setShowInput(true);

      setError('');

      return;
    }

    if (!newComment.trim()) {
      setError('Comment cannot be empty');

      return;
    }

    setSubmitting(true);

    setError('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ elementId: element._id, text: newComment }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to add comment');

      setLatestComment(data.comment);

      setShowInput(false);

      setNewComment('');

      if (onCommentAdded) onCommentAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  }

  const handleProjectCheckbox = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleUpdateProjects = async () => {
    setProjectLoading(true);
    setProjectError('');
    try {
      const res = await fetch('/api/connected-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elementId: element._id, projectIds: selectedProjects }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update projects');
      setShowProjectModal(false);
      if (onCommentAdded) onCommentAdded();
      router.refresh();
      if (typeof window !== 'undefined' && typeof (window as any).refreshSidebar === 'function') {
        (window as any).refreshSidebar();
      }
    } catch (err: any) {
      setProjectError(err.message || 'Failed to update projects');
    } finally {
      setProjectLoading(false);
    }
  };

  return (
    <div className="w-64 min-h-screen bg-white dark:bg-black flex flex-col pt-8 pb-8 pl-8 pr-4">
      <div className="flex flex-col w-full h-full flex-1 justify-between">
        {/* Top: Connected Projects Section */}

        <div className="w-full">
          <div
            className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
            style={{ fontFamily: 'var(--font-albragrotesk)' }}
          >
            Connected projects
          </div>

          {loading ? (
            <div className="text-sm text-gray-400">Loading...</div>
          ) : (
            Array.isArray(element?.connectedProjects) && element.connectedProjects.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {element.connectedProjects.map((proj: any, idx: number) => (
                  <li
                    key={proj._id || proj._ref || idx}
                    className="text-sm text-black dark:text-white"
                    style={{ fontFamily: 'var(--font-albragrotesk)' }}
                  >
                    {proj.name || proj.title || 'Project'}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-400">
                This element is not connected to any projects.
              </div>
            )
          )}

          {/* Add a new project */}
          <div className="w-full flex flex-col gap-2 mt-4">
            <span
              className="text-sm text-blue-600 cursor-pointer select-none"
              style={{ fontFamily: 'var(--font-albragrotesk)' }}
              onClick={() => setShowProjectModal((v) => !v)}
            >
              Update connected projects
            </span>
            {showProjectModal && (
              <div className="bg-white border rounded shadow p-4 mt-2 z-10">
                <div className="mb-2 font-semibold text-black">Select projects to connect</div>
                {projectLoading ? (
                  <div className="text-gray-400">Loading...</div>
                ) : projectError ? (
                  <div className="text-red-500 text-xs">{projectError}</div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {allProjects.map((proj) => (
                      <label key={proj._id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(proj._id)}
                          onChange={() => handleProjectCheckbox(proj._id)}
                          className="accent-blue-600"
                        />
                        <span className="text-sm text-black">{proj.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <button
                  className="mt-4 text-sm font-semibold text-blue-600 cursor-pointer focus:outline-none bg-transparent border-none p-0 text-left"
                  style={{ fontFamily: 'var(--font-albragrotesk)' }}
                  onClick={handleUpdateProjects}
                  disabled={projectLoading}
                >
                  Update connected projects
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Comments Section */}

        <div className="w-full flex flex-col gap-3 my-auto">
          <div className="flex items-center mb-1">
            <span
              className="text-sm font-semibold text-gray-700 dark:text-gray-200"
              style={{ fontFamily: 'var(--font-albragrotesk)' }}
            >
              Latest comment
            </span>

            <button
              type="button"
              className="text-sm font-semibold text-gray-700 cursor-pointer ml-1 focus:outline-none bg-transparent border-none p-0"
              style={{ fontFamily: 'var(--font-albragrotesk)' }}
              onClick={() => {
                const el = document.getElementById('comment-section');

                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              (view all)
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-gray-400">Loading...</div>
          ) : latestComment ? (
            <div className="mb-2">
              <div
                className="text-sm text-gray-400 mb-0.5"
                style={{ fontFamily: 'var(--font-albragrotesk)' }}
              >
                {latestComment.dateAdded ? formatCommentDate(latestComment.dateAdded) : ''}
              </div>

              <div
                className="text-sm text-black dark:text-white"
                style={{ fontFamily: 'var(--font-albragrotesk)' }}
              >
                {typeof latestComment.text === 'string' ? latestComment.text : ''}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">No comments yet.</div>
          )}

          {/* Add new comment UI */}

          {showInput && (
            <div className="mb-2 flex flex-col gap-1">
              <textarea
                className="w-full border rounded p-1 text-sm text-black dark:text-white bg-white dark:bg-black"
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={submitting}
                placeholder="Type your comment..."
                style={{ fontFamily: 'var(--font-albragrotesk)' }}
              />

              {error && <div className="text-xs text-red-500">{error}</div>}
            </div>
          )}

          <button
            type="button"
            className="text-sm font-semibold text-blue-600 cursor-pointer focus:outline-none bg-transparent border-none p-0 text-left"
            style={{ fontFamily: 'var(--font-albragrotesk)' }}
            onClick={handleAddComment}
            disabled={submitting}
          >
            Add new comment
          </button>
        </div>

        {/* Bottom: Element Details Section */}

        <div className="w-full flex flex-col gap-8 mt-8 pl-0">
          {/* 1. Color Squares */}

          <div className="flex flex-row gap-2 pl-0">
            {element?.colors && element.colors.length > 0 ? (
              element.colors.slice(0, 5).map((color: string, idx: number) => (
                <div key={color + idx} className="relative group flex flex-col items-center">
                  <div
                    className="w-5 h-5 border border-gray-200 cursor-pointer"
                    style={{ backgroundColor: color }}
                  ></div>

                  <span
                    className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-sm bg-black dark:bg-white text-white dark:text-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                    style={{ fontFamily: 'var(--font-albragrotesk)' }}
                  >
                    {color}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-sm text-gray-400">No colors</span>
            )}
          </div>

          {/* 2. Full URL with arrow */}

          {element?.url && (
            <a
              href={element.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-black dark:text-white hover:underline-none focus:underline-none text-sm break-all pl-0"
              style={{ fontFamily: 'var(--font-albragrotesk)', textDecoration: 'none' }}
            >
              <span>{element.url}</span>

              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 10H15M15 10L11 6M15 10L11 14"
                  stroke="#222"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          )}

          {/* 4. File Name (from file.asset.originalFilename) */}

          {element?.file?.asset?.originalFilename && (
            <div
              className="text-sm text-black dark:text-white truncate pl-0"
              style={{ fontFamily: 'var(--font-albragrotesk)' }}
            >
              {element.file.asset.originalFilename}
            </div>
          )}
        </div>

        {/* Bottom: Timestamp aligned like 'KAKA Design Library' */}

        {element?.dateAdded && (
          <div className="w-full mt-6 mb-4 flex-shrink-0 flex items-center">
            <span
              className="text-sm text-gray-500"
              style={{ fontFamily: 'var(--font-albragrotesk)' }}
            >
              {new Date(element.dateAdded).toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',

                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
