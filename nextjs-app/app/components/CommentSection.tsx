import React, { useState } from "react";
import { formatCommentDate } from "@/app/client-utils";
import { useUser } from '@clerk/nextjs';

interface Comment {
  _key: string;
  _type: string;
  text: string;
  dateAdded: string;
  dateEdited?: string;
  parentElement?: any;
}

export default function CommentSection({ comments, id, elementId, onCommentDeleted }: { comments: Comment[], id?: string, elementId: string, onCommentDeleted?: () => void }) {
  const { isSignedIn } = useUser();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  const validComments = Array.isArray(comments)
    ? comments.filter((comment) => comment && typeof comment.text === 'string')
    : [];

  // Sort comments by dateAdded descending (most recent first)
  const sortedComments = [...validComments].sort((a, b) => {
    const dateA = new Date(a.dateAdded).getTime();
    const dateB = new Date(b.dateAdded).getTime();
    return dateB - dateA;
  });

  async function handleDelete(commentKey: string) {
    setDeleting(commentKey);
    setError(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elementId, commentKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete comment');
      if (typeof window !== 'undefined' && typeof (window as any).refreshSidebar === 'function') {
        (window as any).refreshSidebar();
      }
      if (onCommentDeleted) onCommentDeleted();
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment');
    } finally {
      setDeleting(null);
      setConfirmKey(null);
    }
  }

  function openConfirm(key: string) {
    setConfirmKey(key);
  }

  function closeConfirm() {
    setConfirmKey(null);
  }

  if (validComments.length === 0) {
    return (
      <div id={id} className="w-full max-w-4xl mx-auto border-t border-gray-200 mt-8 pt-8 text-sm">
        <div className="mb-4 font-semibold">All comments</div>
        <div className="text-gray-400">No comments yet.</div>
      </div>
    );
  }

  return (
    <div id={id} className="w-full max-w-4xl mx-auto border-t border-gray-200 mt-8 pt-8 text-sm">
      <div className="mb-4 font-semibold">All comments</div>
      {error && <div className="text-xs text-red-500 mb-2">{error}</div>}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {sortedComments.map((comment) => (
          <div key={comment._key || comment.dateAdded} className="flex flex-col text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400">{formatCommentDate(comment.dateAdded)}</span>
              {isSignedIn && (
                <button
                  className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
                  title="Delete comment"
                  onClick={() => openConfirm(comment._key)}
                  disabled={deleting === comment._key}
                  aria-label="Delete comment"
                  type="button"
                >
                  {deleting === comment._key ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd" /></svg>
                  )}
                </button>
              )}
            </div>
            <span className="text-black">{comment.text}</span>
            {/* Confirmation Modal */}
            {confirmKey === comment._key && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded shadow-lg p-6 max-w-sm w-full text-center">
                  <div className="mb-4 text-lg font-semibold text-black">Delete this comment?</div>
                  <div className="mb-6 text-gray-700">Are you sure you want to delete this comment? This action cannot be undone.</div>
                  <div className="flex justify-center gap-4">
                    <button
                      className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none"
                      onClick={closeConfirm}
                      disabled={deleting === comment._key}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 focus:outline-none"
                      onClick={() => handleDelete(comment._key)}
                      disabled={deleting === comment._key}
                    >
                      {deleting === comment._key ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 