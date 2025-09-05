import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile';

// Função para CRIAR um novo perfil
export async function POST(request) {
  try {
    // Lendo todos os dados do corpo da requisição
    const { name, minHumidity, wateringDuration, chatId } = await request.json();

    // Verificação se os dados essenciais foram recebidos
    if (!name || minHumidity === undefined || wateringDuration === undefined || !chatId) {
      return NextResponse.json({ error: 'Dados incompletos. Nome, umidade mínima, duração da rega e chatId são obrigatórios.' }, { status: 400 });
    }

    await dbConnect();

    const newProfile = await PlantProfile.create({
      name,
      minHumidity: parseInt(minHumidity, 10),
      wateringDuration: parseInt(wateringDuration, 10),
      chatId: chatId, 
      isDefault: false
    });

    return NextResponse.json(newProfile, { status: 201 }); 

  } catch (error) {
    console.error("Erro ao criar perfil:", error);
    if (error.code === 11000) {
        return NextResponse.json({ error: `O nome de perfil "${error.keyValue.name}" já existe.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
