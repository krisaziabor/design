import type { Metadata } from "next";
import Head from "next/head";

import PageBuilderPage from "@/app/components/PageBuilder";
import { sanityFetch } from "@/sanity/lib/live";
import { getPageQuery, pagesSlugs } from "@/sanity/lib/queries";
import { GetPageQueryResult } from "@/sanity.types";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
};

/**
 * Generate the static params for the page.
 * Learn more: https://nextjs.org/docs/app/api-reference/functions/generate-static-params
 */
export async function generateStaticParams() {
  const { data } = await sanityFetch({
    query: pagesSlugs,
    // // Use the published perspective in generateStaticParams
    perspective: "published",
    stega: false,
  });
  return data;
}

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

export default async function Page(props: Props) {
  const params = await props.params;
  const [{ data: page }] = await Promise.all([
    sanityFetch({ query: getPageQuery, params }),
  ]);

  if (!page?._id) {
    return (
      <div className="py-40">
        <div className="text-center">
          <h2 className="text-sm font-semibold text-gray-900">404 - Page Not Found</h2>
          <p className="mt-2 text-gray-600">The page you are looking for does not exist.</p>
          <Link href="/" className="text-gray-600 hover:text-gray-900">Go back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="my-12 lg:my-24">
      <Head>
        <title>{page.heading}</title>
      </Head>
      <div className="">
        <div className="container">
          <div className="pb-6 border-b border-gray-100">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-7xl">
                {page.heading}
              </h2>
              <p className="mt-4 text-base lg:text-lg leading-relaxed text-gray-600 uppercase font-light">
                {page.subheading}
              </p>
            </div>
          </div>
        </div>
      </div>
      <PageBuilderPage page={page as GetPageQueryResult} />
    </div>
  );
}
