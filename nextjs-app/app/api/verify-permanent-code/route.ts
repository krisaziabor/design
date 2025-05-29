import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { code } = await req.json();
  if (code === process.env.PERSONAL_CODE) {
    return NextResponse.json({ valid: true });
  }
  return NextResponse.json({ valid: false }, { status: 401 });
} 