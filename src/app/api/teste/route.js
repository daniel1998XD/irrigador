import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ status: "sucesso", message: "Conexão com MongoDB bem-sucedida//!" });
  } catch (error) {
    return NextResponse.json(
      { status: "erro", message: "Falha ao conectar com MongoDB", error: error.message },
      { status: 500 }
    );
  }
}