import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

export async function GET() {
  try {
    const projects = await client.fetch('*[_type == "project"]{_id, name}');
    return NextResponse.json({ projects });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
} 