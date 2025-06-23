import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile';
import WateringCommand from '@/models/wateringCommand';
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

    console.log(`Umidade recebida do ESP32: ${humidity}%`);

    const profiles = await PlantProfile.find({});
    for (const profile of profiles) {
      if (humidity < profile.minHumidity) {
        const pendingCommand = await WateringCommand.findOne({ executed: false });
        if (!pendingCommand) {
          await WateringCommand.create({ duration: profile.wateringDuration });
          bot.sendMessage(profile.chatId, `Atenção! A umidade da planta "<span class="math-inline">\{profile\.name\}" está baixa \(</span>{humidity}%). Rega automática iniciada.`);
          console.log(`Comando de rega criado para ${profile.name}.`);
        }
      }
    }

    return NextResponse.json({ status: 'sucesso' }, { status: 200 });
  } catch (error) {
    console.error("Erro ao processar umidade:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}