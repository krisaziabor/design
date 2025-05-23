import React from "react";
import { formatCommentDate } from "@/app/client-utils";

export default function ActionSidebar({ element, loading }: { element: any, loading: boolean }) {
  return (
    <div className="w-64 min-h-screen bg-white flex flex-col pt-8 pb-8 pl-8 pr-4">
      <div className="flex flex-col w-full h-full flex-1 justify-between">
        {/* Top: Connected Projects Section */}
        <div className="w-full">
          <div className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-albragrotesk)' }}>Connected projects</div>
          {loading ? (
            <div className="text-sm text-gray-400">Loading...</div>
          ) : element && Array.isArray(element.connectedProjects) && element.connectedProjects.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {element.connectedProjects.map((proj: any, idx: number) => (
                <li key={proj._id || idx} className="text-sm text-black" style={{ fontFamily: 'var(--font-albragrotesk)' }}>{proj.name || 'Project'}</li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-400">This element is not connected to any projects.</div>
          )}
          {/* Add a new project */}
          {/* <div className="w-full flex items-center gap-2 cursor-pointer select-none mt-4">
            <span className="text-sm text-black" style={{ fontFamily: 'var(--font-albragrotesk)' }}>Add a new project</span>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8L10 13L15 8" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div> */}
        </div>
        {/* Middle: Comments Section */}
        <div className="w-full flex flex-col gap-3 my-auto">
          <div className="flex items-center mb-1">
            <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'var(--font-albragrotesk)' }}>Latest comment</span>
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
          ) : element && Array.isArray(element.comments) && element.comments.length > 0 ? (
            element.comments.slice(-1).reverse().map((comment: any, idx: number) => (
              <div key={comment._key || idx} className="mb-2">
                <div className="text-sm text-gray-400 mb-0.5" style={{ fontFamily: 'var(--font-albragrotesk)' }}>{comment.dateAdded ? formatCommentDate(comment.dateAdded) : ''}</div>
                <div className="text-sm text-black" style={{ fontFamily: 'var(--font-albragrotesk)' }}>{typeof comment.text === 'string' ? comment.text : ''}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-400">No comments yet.</div>
          )}
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
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-sm bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10" style={{ fontFamily: 'var(--font-albragrotesk)' }}>{color}</span>
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
              className="flex items-center gap-1 text-black hover:underline-none focus:underline-none text-sm break-all pl-0"
              style={{ fontFamily: 'var(--font-albragrotesk)', textDecoration: 'none' }}
            >
              <span>{element.url}</span>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 10H15M15 10L11 6M15 10L11 14" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          )}
          {/* 4. File Name (from file.asset.originalFilename) */}
          {element?.file?.asset?.originalFilename && (
            <div className="text-sm text-black truncate pl-0" style={{ fontFamily: 'var(--font-albragrotesk)' }}>
              {element.file.asset.originalFilename}
            </div>
          )}
        </div>
        {/* Bottom: Timestamp aligned like 'KAKA Design Library' */}
        {element?.dateAdded && (
          <div className="w-full mt-6 mb-4 flex-shrink-0 flex items-center">
            <span className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-albragrotesk)' }}>
              {new Date(element.dateAdded).toLocaleString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 