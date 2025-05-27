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
      const { elementId, text } = await req.json();
      if (!elementId || typeof text !== 'string' || text.trim() === '') {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
      }
      const newComment = {
        _type: 'comment',
        _key: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
        text: text.trim(),
        dateAdded: new Date().toISOString(),
        parentElement: {
          _type: 'reference',
          _ref: elementId,
        },
      };
      // Patch the element to add the new comment
      const result = await client.patch(elementId)
        .setIfMissing({ comments: [] })
        .insert('after', 'comments[-1]', [newComment])
        .commit();
      return NextResponse.json({ comment: newComment, result });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      const { elementId, commentKey } = await req.json();
      if (!elementId || !commentKey) {
        return NextResponse.json({ error: 'Missing elementId or commentKey' }, { status: 400 });
      }
      // Remove the comment with the given _key from the comments array
      const result = await client
        .patch(elementId)
        .unset([`comments[_key=="${commentKey}"]`])
        .commit();
      return NextResponse.json({ result });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 