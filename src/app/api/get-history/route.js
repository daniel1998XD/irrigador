import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile';
import WateringCommand from '@/models/wateringCommand';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const plantId = searchParams.get('plantId');

    if (!plantId) {
      return NextResponse.json({ error: 'ID da planta é obrigatório' }, { status: 400 });
    }

    await dbConnect();

    // 1. Busca os dados do perfil da planta para podermos mostrar o nome
    const plant = await PlantProfile.findById(plantId);

    // 2. Busca TODOS os comandos de rega associados a este ID de perfil
    //    Ordena do mais recente para o mais antigo.
    const history = await WateringCommand.find({ plantProfileId: plantId }).sort({ timestamp: -1 });

    if (!plant) {
        return NextResponse.json({ error: 'Planta não encontrada' }, { status: 404 });
    }

    // Retorna um objeto contendo tanto os dados da planta quanto seu histórico
    return NextResponse.json({ plant, history });

  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}