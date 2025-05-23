"use client";

import { isCorsOriginError } from "next-sanity";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";

export function handleError(error: unknown) {
  if (isCorsOriginError(error)) {
    // If the error is a CORS origin error, let's display that specific error.
    const { addOriginUrl } = error;
    toast.error(`Sanity Live couldn't connect`, {
      description: `Your origin is blocked by CORS policy`,
      duration: Infinity,
      action: addOriginUrl
        ? {
            label: "Manage",
            onClick: () => window.open(addOriginUrl.toString(), "_blank"),
          }
        : undefined,
    });
  } else if (error instanceof Error) {
    console.error(error);
    toast.error(error.name, { description: error.message, duration: Infinity });
  } else {
    console.error(error);
    toast.error("Unknown error", {
      description: "Check the console for more details",
      duration: Infinity,
    });
  }
}

export function formatCommentDate(dateString: string | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'LLLL d, yyyy');
}
