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

    const plant = await PlantProfile.findById(plantId);

    if (!plant) {
      return NextResponse.json({ error: 'Planta não encontrada' }, { status: 404 });
    }

    const history = await WateringCommand.find({ plantProfileId: plantId }).sort({ timestamp: -1 });

    return NextResponse.json({ plant, history });

  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}