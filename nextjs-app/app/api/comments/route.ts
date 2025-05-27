import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

export async function POST(req: NextRequest) {
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
} 