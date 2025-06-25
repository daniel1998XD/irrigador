import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile';
import WateringCommand from '@/models/wateringCommand';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

// Função para processar os comandos
function escapeMarkdown(text) {
    const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']; // <--- ADICIONAMOS O '!' AQUI
    return text.toString().replace(new RegExp(`[${specialChars.join('\\')}]`, 'g'), '\\$&');
}
async function handleCommand(message) {
    const text = message.text;
    const chatId = message.chat.id;

    if (text.startsWith('/start')) {
        const welcomeMessage = `Olá\\! Bem-vindo ao Bot de Irrigação. 🌱

*Comandos Disponíveis:*
\`/addperfil <Nome>;<UmidadeMin>;<TempoSeg>\` - Adiciona um novo perfil de planta.
\`/listarperfis\` - Mostra todos os seus perfis.
\`/plantapadrao <Nome da Planta>\` - Define qual perfil a rega automática deve seguir.
\`/historico <Nome da Planta>\` - Mostra as últimas 3 regas da planta.
\`/umidade\` - Mostra a última umidade registrada pelo sensor.
\`/meuid\` - Mostra seu ID para login na web.
\`/regar <Nome da Planta>\` - Aciona uma rega manual para uma planta.`;

        bot.sendMessage(chatId, welcomeMessage, { parse_mode: "MarkdownV2" });
    }
    else if (text.startsWith('/addperfil')) {
        const params = text.substring(11).split(';');
        if (params.length !== 3) {
            return bot.sendMessage(chatId, "Formato inválido. Use: /addperfil Nome;UmidadeMin;TempoSeg");
        }
        const [name, minHumidity, wateringDuration] = params;
        await PlantProfile.create({ name, minHumidity: parseInt(minHumidity), wateringDuration: parseInt(wateringDuration), chatId });
        bot.sendMessage(chatId, `Perfil "${safeName}" adicionado com sucesso\\!`);
    }
    else if (text.startsWith('/listarperfis')) {Add commentMore actions
        const profiles = await PlantProfile.find({ chatId });
        if (profiles.length === 0) return bot.sendMessage(chatId, "Nenhum perfil cadastrado.");
        let response = "Perfis cadastrados:\n\n";
        profiles.forEach(p => { response += `Nome: ${p.name}\nUmidade Mínima: ${p.minHumidity}%\nDuração da Rega: ${p.wateringDuration}s\n\n`; });
        bot.sendMessage(chatId, response);
    }Add commentMore actions
    else if (text.startsWith('/historico')) {
        const plantNameToFind = text.substring(11).trim();
        @@ -92, 34 + 111, 34 @@async function handleCommand(message) {
        }
    }
    else if (text.startsWith('/plantapadrao')) {
        const plantNameToSetDefault = text.substring(14).trim();

        if (!plantNameToSetDefault) {
            return bot.sendMessage(chatId, "Formato inválido. Use: /plantapadrao <Nome da Planta>");
        }

        try {
            // Primeiro, verifica se o perfil que o usuário quer definir como padrão realmente existe e pertence a ele.
            const profile = await PlantProfile.findOne({ name: plantNameToSetDefault, chatId: chatId });

            if (!profile) {
                return bot.sendMessage(chatId, `Você não tem um perfil de planta chamado "${plantNameToSetDefault}".`);
            }

            // Se encontrou, executa a "transação" de 2 passos:
            // 1. Define TODOS os perfis DESTE USUÁRIO como não-padrão.
            await PlantProfile.updateMany({ chatId: chatId }, { isDefault: false });

            // 2. Define APENAS o perfil escolhido como padrão.
            await PlantProfile.findByIdAndUpdate(profile._id, { isDefault: true });

            bot.sendMessage(chatId, `✅ Perfil "${profile.name}" definido como padrão para a rega automática!`);

        } catch (error) {
            console.error("Erro no comando /setardefault:", error);
            bot.sendMessage(chatId, "Ocorreu um erro ao definir o perfil padrão.");

        }
    }

    else if (text === '/meuid') {
        bot.sendMessage(chatId, `Seu ID de Chat para login na web é:\n\n\`\`\`${chatId}\`\`\`\n\nCopie este número e cole-o na página de login.`);
    }
    else if (text.startsWith('/regar')) {
        const plantNameToWater = text.substring(7).trim(); // Pega o nome da planta do comando

        if (!plantNameToWater) {
            return bot.sendMessage(chatId, "Formato inválido. Use: /regar <Nome da Planta>");
        }

        try {
            // Procura pelo perfil da planta que pertence a este usuário
            const profile = await PlantProfile.findOne({ name: plantNameToWater, chatId: chatId });

            if (!profile) {
                return bot.sendMessage(chatId, `Perfil de planta "${plantNameToWater}" não encontrado.`);
            }

            // Se encontrou, cria um comando de rega VINCULADO a este perfil
            await WateringCommand.create({
                duration: profile.wateringDuration, // Usa a duração salva no perfil
                plantProfileId: profile._id // Salva a referência ao perfil
            });

            bot.sendMessage(chatId, `Comando de rega manual para "${profile.name}" enviado\\!`);

        } catch (error) {
            console.error("Erro no comando /regar:", error);
            bot.sendMessage(chatId, "Ocorreu um erro ao processar seu comando.");
        }
    }
}

export async function POST(request) {
    await dbConnect();
    try {
        const body = await request.json();
        if (body.message) {
            await handleCommand(body.message);
        }
        return NextResponse.json({ status: 'ok' }, { status: 200 });
    } catch (error) {
        // ---- BLOCO DE DEBUG APRIMORADO ----
        console.error("--- ERRO GERAL NO WEBHOOK DO TELEGRAM ---");
        console.error("Mensagem de Erro:", error.message);
        console.error("Código do Erro:", error.code); // Ex: EFATAL
        console.error("Stack Trace Detalhado:", error.stack);

        // Tenta logar o corpo da requisição que causou o erro, se possível.
        try {
            const bodyForErrorLog = await request.json();
            console.error("Corpo da Requisição que Causou o Erro:", JSON.stringify(bodyForErrorLog, null, 2));
        } catch (bodyError) {
            console.error("Não foi possível parsear o corpo da requisição no log de erro.");
        }

        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}