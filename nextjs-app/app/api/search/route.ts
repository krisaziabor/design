import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '@/sanity/lib/api';

const clientNoCdn = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
});

function extractAdvancedFilters(q: string) {
  // Extract proj:... and comm:... (up to next phrase or end)
  const projMatch = q.match(/proj:([^\s]+)/i);
  const commMatch = q.match(/comm:([^\s]+)/i);
  let proj = '';
  let comm = '';
  let rest = q;
  if (projMatch) {
    proj = projMatch[1].replace(/_/g, ' ').trim();
    rest = rest.replace(projMatch[0], '').trim();
  }
  if (commMatch) {
    comm = commMatch[1].replace(/_/g, ' ').trim();
    rest = rest.replace(commMatch[0], '').trim();
  }
  return { proj, comm, rest };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.toLowerCase() || '';

  // Advanced filter extraction
  const { proj, comm, rest } = extractAdvancedFilters(q);

  // Fetch all elements, including connected projects, comments, categories, and subcategories
  const elements = await clientNoCdn.fetch(
    '*[_type == "elements"]{_id, eagleId, fileType, fileName, file, url, mainCategory->{_id, name}, subCategories[]->{_id, name}, thumbnail, dateAdded, connectedProjects[]->{_id, name, description}, comments[]}'
  );

  // Filtering logic
  const filtered = (elements || []).filter((el: any) => {
    // Project filter
    let projMatch = true;
    if (proj) {
      projMatch = Array.isArray(el.connectedProjects) && el.connectedProjects.some((p: any) => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return name.includes(proj) || desc.includes(proj);
      });
    }
    // Comment filter
    let commMatch = true;
    if (comm) {
      const comments = Array.isArray(el.comments)
        ? el.comments.map((c: any) => (c.text || '').toLowerCase()).join(' ')
        : '';
      commMatch = comments.includes(comm);
    }
    // Regular filter (title, url, mainCategory, subCategories)
    let restMatch = true;
    if (rest) {
      const title = (el.fileName || '').toLowerCase();
      const url = (el.url || '').toLowerCase();
      const mainCategory = el.mainCategory?.name ? el.mainCategory.name.toLowerCase() : '';
      const subCategories = Array.isArray(el.subCategories)
        ? el.subCategories.map((s: any) => (s.name || '').toLowerCase()).join(' ')
        : '';
      restMatch =
        title.includes(rest) ||
        url.includes(rest) ||
        mainCategory.includes(rest) ||
        subCategories.includes(rest);
    }
    // All filters must match
    return (proj ? projMatch : true) && (comm ? commMatch : true) && (rest ? restMatch : true);
  });

  return NextResponse.json({ results: filtered });
} 