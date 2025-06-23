// src/app/api/humidity/route.js

// ... (seus imports continuam os mesmos)
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

    console.log(`[SIMULAÇÃO] Umidade recebida: ${humidity}%`);
    
    let commandGenerated = false;
    const profiles = await PlantProfile.find({});
    for (const profile of profiles) {
      if (humidity < profile.minHumidity) {
        const pendingCommand = await WateringCommand.findOne({ executed: false });
        if (!pendingCommand) {
          await WateringCommand.create({ duration: profile.wateringDuration });
          bot.sendMessage(profile.chatId, `[SIMULAÇÃO] Atenção! Umidade baixa (${humidity}%). Rega automática iniciada.`);
          console.log(`[SIMULAÇÃO] Comando de rega criado para ${profile.name}.`);
          commandGenerated = true;
        }
      }
    }
    
    if (commandGenerated) {
      return NextResponse.json({ message: 'Umidade baixa, comando de rega gerado!' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Umidade OK, nenhuma ação necessária.' }, { status: 200 });
    }

  } catch (error) {
    console.error("Erro ao processar umidade:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}