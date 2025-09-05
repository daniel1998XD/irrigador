import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile';
import HumidityLog from '@/models/humidityLog';
import mongoose from 'mongoose'; 

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID é obrigatório' }, { status: 400 });
  }

  await dbConnect();

  try {
    const humidityHistory = await HumidityLog.aggregate([
      // Isso funciona como um JOIN de SQL.
      {
        $lookup: {
          from: 'plantprofiles', // O nome da coleção de perfis
          localField: 'plantProfileId', // O campo no HumidityLog
          foreignField: '_id', // O campo no PlantProfile
          as: 'plantProfileInfo' // O nome do novo array que conterá os dados do perfil juntado
        }
      },
      // 'preserveNullAndEmptyArrays' garante que, se um perfil foi deletado, o log de umidade não seja descartado.
      {
        $unwind: {
          path: '$plantProfileInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          'plantProfileInfo.chatId': chatId
        }
      },
      // Ordena os resultados por data, do mais recente para o mais antigo.
      {
        $sort: {
          timestamp: -1 // -1 para ordem decrescente
        }
      },
      //formato final dos dados que serão enviados.
      // Isso limpa os dados e os molda para o frontend.
      {
        $project: {
          _id: 1, // Mantém o _id original do log
          humidity: 1, // Mantém a umidade
          timestamp: 1, // Mantém a data
          // Cria o campo 'plantName', usando o nome do perfil se ele existir,
          // ou o texto "Perfil Removido" caso contrário ($ifNull).
          plantName: { $ifNull: ['$plantProfileInfo.name', 'Perfil Removido'] }
        }
      }
    ]);

    return NextResponse.json(humidityHistory);

  } catch (error) {
    console.error("Erro ao buscar histórico de umidade consolidado:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
