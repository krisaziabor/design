import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 