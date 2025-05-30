import "./globals.css";
import localFont from "next/font/local";
// import { Analytics } from "@vercel/analytics/react";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { VisualEditing, toPlainText } from "next-sanity";
import { Toaster } from "sonner";
import { ClerkProvider } from '@clerk/nextjs';

import DraftModeToast from "@/app/components/DraftModeToast";
import * as demo from "@/sanity/lib/demo";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import { settingsQuery } from "@/sanity/lib/queries";
import { resolveOpenGraphImage } from "@/sanity/lib/utils";
import { handleError } from "./client-utils";

const albragrotesk = localFont({
  src: "./fonts/AlbraGrotesk-Regular.otf",
  variable: "--font-albragrotesk",
  weight: "400",
});

const albragroteskmedium = localFont({
  src: "./fonts/AlbraGrotesk-Medium.otf",
  variable: "--font-albragroteskmedium",
  weight: "500",
});


/**
 * Generate metadata for the page.
 * Learn more: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#generatemetadata-function
 */
export const metadata: Metadata = {
  title: "KAKA Design Library",
  openGraph: {
    images: ["/cover.jpg"],
  },
  icons: {
    icon: "/icon.ico",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEnabled: isDraftMode } = await draftMode();

  return (
    <html lang="en" className={`${albragrotesk.variable} ${albragroteskmedium.variable} bg-white text-black`}>
      <ClerkProvider>
        <body>
          {/* The <Toaster> component is responsible for rendering toast notifications used in /app/client-utils.ts and /app/components/DraftModeToast.tsx */}
          <Toaster />
          {isDraftMode && (
            <>
              <DraftModeToast />
              {/*  Enable Visual Editing, only to be rendered when Draft Mode is enabled */}
              <VisualEditing />
            </>
          )}
          {/* The <SanityLive> component is responsible for making all sanityFetch calls in your application live, so should always be rendered. */}
          <SanityLive onError={handleError} />
          <main className="">{children}</main>
          <SpeedInsights />
        </body>
      </ClerkProvider>
    </html>
  );
}
