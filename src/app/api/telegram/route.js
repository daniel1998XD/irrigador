import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile';
import WateringCommand from '@/models/wateringCommand';
import DeviceStatus from '@/models/deviceStatus';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

// Função de ajuda para evitar que caracteres especiais quebrem a formatação do Telegram.
function escapeMarkdown(text) {
  if (!text) return '';
  const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  return text.toString().replace(new RegExp(`[${specialChars.join('\\')}]`, 'g'), '\\$&');
}

// Função principal que processa todos os comandos recebidos.
async function handleCommand(message) {
    const text = message.text || '';
    const chatId = message.chat.id;

    // --- COMANDO /start ---
    if (text === '/start') {
        const welcomeMessage = `Olá\\! Bem\\-vindo ao Bot de Irrigação\\. 🌱

*Comandos Disponíveis:*
\`/addperfil <Nome>;<UmidadeMin>;<TempoSeg>\` \\- Adiciona um novo perfil\\.
\`/listarperfis\` \\- Mostra todos os seus perfis\\.
\`/setardefault <Nome da Planta>\` \\- Define qual perfil a rega automática deve seguir\\.
\`/historico <Nome da Planta>\` \\- Mostra as últimas 3 regas da planta\\.
\`/umidade\` \\- Mostra a última umidade registrada\\.
\`/meuid\` \\- Mostra seu ID para login na web\\.
\`/regar <Nome da Planta>\` \\- Aciona uma rega manual\\.`;

        bot.sendMessage(chatId, welcomeMessage);
    }
    // --- COMANDO /addperfil ---
    else if (text.startsWith('/addperfil ')) {
        const params = text.substring(11).split(';');
        if (params.length !== 3) {
            return bot.sendMessage(chatId, "Formato inválido\\. Use: /addperfil Nome;UmidadeMin;TempoSeg");
        }
        const [name, minHumidity, wateringDuration] = params;
        await PlantProfile.create({ name, minHumidity: parseInt(minHumidity), wateringDuration: parseInt(wateringDuration), chatId });
        
        // CORREÇÃO: Usamos a variável 'name' que acabamos de criar, e a escapamos.
        const safeName = escapeMarkdown(name);
        bot.sendMessage(chatId, `Perfil *${safeName}* adicionado com sucesso\\!`);
    }
    // --- COMANDO /listarperfis ---
    else if (text === '/listarperfis') {
        const profiles = await PlantProfile.find({ chatId });
        if (profiles.length === 0) return bot.sendMessage(chatId, "Nenhum perfil cadastrado\\.");
        
        let responseMessage = "Perfis cadastrados:\n\n";
        for (const p of profiles) {
            const safePlantName = escapeMarkdown(p.name);
            const indicator = p.isDefault ? ' *(Padrão)* ⭐' : '';
            responseMessage += `*${safePlantName}${indicator}*\n`;
            responseMessage += `Umidade Mín: ${escapeMarkdown(p.minHumidity.toString())}%\n`;
            responseMessage += `Duração da Rega: ${escapeMarkdown(p.wateringDuration.toString())}s\n\n`;
        }
        bot.sendMessage(chatId, responseMessage);
    }
    // --- COMANDO /setardefault ---
    else if (text.startsWith('/setardefault ')) {
        const plantName = text.substring(14).trim();
        if (!plantName) return bot.sendMessage(chatId, "Formato inválido\\. Use: /setardefault <Nome da Planta>");
        
        const profile = await PlantProfile.findOne({ name: plantName, chatId: chatId });
        if (!profile) return bot.sendMessage(chatId, `Você não tem um perfil chamado "${escapeMarkdown(plantName)}"\\.`);

        await PlantProfile.updateMany({ chatId: chatId }, { isDefault: false });
        await PlantProfile.findByIdAndUpdate(profile._id, { isDefault: true });

        bot.sendMessage(chatId, `✅ Perfil *${escapeMarkdown(profile.name)}* definido como padrão\\!`);
    }
    // --- COMANDO /umidade ---
    else if (text === '/umidade') {
        const status = await DeviceStatus.findOne({ identifier: 'main_device' });
        if (!status || status.lastHumidity === null) return bot.sendMessage(chatId, "Ainda não recebi nenhuma leitura de umidade.");

        const dataLeitura = escapeMarkdown(new Date(status.lastReportTimestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
        const responseMsg = `💧 A última umidade registrada foi de *${status.lastHumidity}%*\\.\n\n_(Leitura recebida em ${dataLeitura})_`;
        bot.sendMessage(chatId, responseMsg);
    }
    // --- COMANDO /historico ---
    else if (text.startsWith('/historico ')) {
        const plantName = text.substring(11).trim();
        if (!plantName) return bot.sendMessage(chatId, "Formato inválido\\. Use: /historico <Nome da Planta>");

        const profile = await PlantProfile.findOne({ name: plantName, chatId: chatId });
        if (!profile) return bot.sendMessage(chatId, `Perfil de planta "${escapeMarkdown(plantName)}" não encontrado\\.`);
        
        const history = await WateringCommand.find({ plantProfileId: profile._id }).sort({ timestamp: -1 }).limit(3);
        if (history.length === 0) return bot.sendMessage(chatId, `Nenhum histórico de rega para "${escapeMarkdown(profile.name)}"\\.`);

        let responseMessage = `Últimas 3 regas para *${escapeMarkdown(profile.name)}*:\n\n`;
        for (const item of history) {
            const dataFormatada = escapeMarkdown(new Date(item.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
            responseMessage += `\\- Regado por ${item.duration}s em: ${dataFormatada}\n`;
        }
        bot.sendMessage(chatId, responseMessage);
    }
    // --- COMANDO /meuid ---
    else if (text === '/meuid') {
        bot.sendMessage(chatId, `Seu ID de Chat para login na web é:\n\n\`\`\`${chatId}\`\`\`\n\nCopie este número e cole\\-o na página de login\\.`);
    }
    // --- COMANDO /regar ---
    else if (text.startsWith('/regar ')) {
        const plantName = text.substring(7).trim();
        if (!plantName) return bot.sendMessage(chatId, "Formato inválido\\. Use: /regar <Nome da Planta>");

        const profile = await PlantProfile.findOne({ name: plantName, chatId: chatId });
        if (!profile) return bot.sendMessage(chatId, `Perfil de planta "${escapeMarkdown(plantName)}" não encontrado\\.`);
        
        await WateringCommand.create({
            duration: profile.wateringDuration,
            plantProfileId: profile._id
        });
        bot.sendMessage(chatId, `Comando de rega manual para "*${escapeMarkdown(profile.name)}*" enviado\\!`);
    }
}


export async function POST(request) {
    await dbConnect();
    try {
        const body = await request.json();
        if (body.message) {
            // Envolvemos a chamada em um try...catch para que um erro em um comando não quebre o webhook.
            try {
                await handleCommand(body.message);
            } catch (commandError) {
                console.error("--- ERRO AO PROCESSAR COMANDO DO TELEGRAM ---", commandError);
                // Envia uma mensagem de erro genérica para o usuário, se possível.
                if (body.message.chat && body.message.chat.id) {
                    bot.sendMessage(body.message.chat.id, "Ops\\! Ocorreu um erro ao processar seu comando\\. Tente novamente\\.");
                }
            }
        }
        return NextResponse.json({ status: 'ok' }, { status: 200 });
    } catch (error) {
        console.error("--- ERRO GERAL NO WEBHOOK DO TELEGRAM ---", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
