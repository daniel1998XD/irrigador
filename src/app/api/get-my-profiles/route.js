import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile';

export async function GET(request) {
  try {
    // Pegamos o chatId que foi enviado como parâmetro na URL
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID é obrigatório' }, { status: 400 });
    }

    await dbConnect();

    // Buscamos no banco APENAS os perfis que pertencem a este chatId
    const profiles = await PlantProfile.find({ chatId: chatId }).sort({ name: 1 });

    return NextResponse.json(profiles);

  } catch (error) {
    console.error("Erro ao buscar perfis:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}