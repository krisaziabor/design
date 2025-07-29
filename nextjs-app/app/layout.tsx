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


export const metadata: Metadata = {
  metadataBase: new URL('https://library.krisaziabor.com'),
  title: "Constellating Library",
  description:
    "A collection of design inspirations for my practice.",
  icons: "icon.ico",

  // This is where you can add your Open Graph details:
  openGraph: {
    title: "Constellating Library",
    description:
      "A collection of design inspirations for my practice.",
    url: "https://library.krisaziabor.com",
    siteName: "Constellating Library",
    images: [
      {
        url: "/cover.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // And here are Twitter-specific tags (many platforms also read them):
  twitter: {
    card: "summary_large_image",
    title: "Constellating Library",
    description:
      "A collection of design inspirations for my practice.",
    images: ["/cover.jpg"],
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
