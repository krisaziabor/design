import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

export async function POST(req: NextRequest) {
  try {
    const { elementId, projectIds } = await req.json();
    if (!elementId || !Array.isArray(projectIds)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const projectRefs = projectIds.map((id) => ({ _type: 'reference', _ref: id, _key: id }));
    const result = await client.patch(elementId)
      .set({ connectedProjects: projectRefs })
      .commit();
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 