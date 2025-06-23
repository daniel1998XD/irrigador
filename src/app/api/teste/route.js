import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: "A API está no ar e a rota funciona!" });
}