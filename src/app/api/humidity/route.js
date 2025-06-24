import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile';
import WateringCommand from '@/models/wateringCommand';
import HumidityLog from '@/models/humidityLog'; // Usando nosso novo modelo
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

export async function POST(request) {
  await dbConnect();
  try {
    const { humidity } = await request.json();

    if (humidity === undefined) {
      return NextResponse.json({ error: 'Umidade não fornecida' }, { status: 400 });
    }

    // 1. Encontra o perfil que está marcado como padrão
    const defaultProfile = await PlantProfile.findOne({ isDefault: true });

    if (!defaultProfile) {
      console.log("Nenhum perfil padrão definido. Nenhuma ação será tomada.");
      return NextResponse.json({ message: 'Nenhum perfil padrão definido.' });
    }

    // 2. Salva um registro no novo histórico de umidade, vinculado à planta padrão
    await HumidityLog.create({
      humidity: humidity,
      plantProfileId: defaultProfile._id
    });
    console.log(`[HISTÓRICO] Umidade ${humidity}% salva para o perfil padrão "${defaultProfile.name}".`);

    // 3. Verifica se precisa regar, com base APENAS na planta padrão
    if (humidity < defaultProfile.minHumidity) {
      const pendingCommand = await WateringCommand.findOne({ executed: false });
      if (!pendingCommand) {
        await WateringCommand.create({ 
          duration: defaultProfile.wateringDuration,
          plantProfileId: defaultProfile._id
        });
        bot.sendMessage(defaultProfile.chatId, `Atenção//! Umidade da planta padrão "${defaultProfile.name}" está baixa (${humidity}%). Rega automática iniciada.`);
        return NextResponse.json({ message: 'Umidade baixa, comando de rega gerado//!' });
      }
    }
    
    return NextResponse.json({ message: 'Umidade OK, nenhuma ação necessária.' });

  } catch (error) {
    console.error("Erro ao processar umidade:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}