import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile'; // Importado para referência no aggregate
import HumidityLog from '@/models/humidityLog';
import mongoose from 'mongoose'; // Importado para usar mongoose.Types.ObjectId

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID é obrigatório' }, { status: 400 });
  }

  await dbConnect();

  try {
    // Pipeline de Agregação para buscar e combinar os dados eficientemente
    const humidityHistory = await HumidityLog.aggregate([
      // Estágio 1: Juntar (lookup) os dados do perfil da planta em cada log de umidade.
      // Isso funciona como um JOIN de SQL.
      {
        $lookup: {
          from: 'plantprofiles', // O nome da coleção de perfis no MongoDB (geralmente o plural do model em minúsculas)
          localField: 'plantProfileId', // O campo no HumidityLog
          foreignField: '_id', // O campo no PlantProfile
          as: 'plantProfileInfo' // O nome do novo array que conterá os dados do perfil juntado
        }
      },
      // Estágio 2: Desconstruir (unwind) o array 'plantProfileInfo'.
      // Como cada log só tem um perfil, isso transforma o array em um objeto.
      // 'preserveNullAndEmptyArrays' garante que, se um perfil foi deletado, o log de umidade não seja descartado.
      {
        $unwind: {
          path: '$plantProfileInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      // Estágio 3: Filtrar (match) para pegar apenas os logs cujo perfil associado pertence ao usuário (chatId).
      // Esta é a verificação de segurança e personalização.
      {
        $match: {
          'plantProfileInfo.chatId': chatId
        }
      },
      // Estágio 4: Ordenar (sort) os resultados por data, do mais recente para o mais antigo.
      {
        $sort: {
          timestamp: -1 // -1 para ordem decrescente
        }
      },
      // Estágio 5: Projetar (project) o formato final dos dados que serão enviados.
      // Isso limpa os dados e os molda para o que o frontend precisa.
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