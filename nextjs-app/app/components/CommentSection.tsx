import React from "react";
import { formatCommentDate } from "@/app/client-utils";

interface Comment {
  _key: string;
  _type: string;
  text: string;
  dateAdded: string;
  dateEdited?: string;
  parentElement?: any;
}

export default function CommentSection({ comments, id }: { comments: Comment[], id?: string }) {
  const validComments = Array.isArray(comments)
    ? comments.filter((comment) => comment && typeof comment.text === 'string')
    : [];

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
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {validComments.map((comment) => (
          <div key={comment._key || comment.dateAdded} className="flex flex-col text-sm">
            <span className="text-gray-400 mb-1">{formatCommentDate(comment.dateAdded)}</span>
            <span className="text-black">{comment.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 