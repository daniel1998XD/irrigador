

// src/app/api/telegram/route.js

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile';
import WateringCommand from '@/models/wateringCommand';
import DeviceStatus from '@/models/deviceStatus';
import UserState from '@/models/userState'; // Importamos o novo model
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

// Função de escape (sem alterações)
function escapeMarkdown(text) {
    if (!text) return '';
    const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
    return text.toString().replace(new RegExp(`[${specialChars.join('\\')}]`, 'g'), '\\$&');
}

// --- NOVO MANIPULADOR DE CALLBACK QUERY ---
async function handleCallbackQuery(callbackQuery) {
    const { data, message } = callbackQuery;
    const chatId = message.chat.id;
    const [action, field, profileId] = data.split(':');

    if (action !== 'edit') return;

    const profile = await PlantProfile.findById(profileId);
    if (!profile || profile.chatId !== chatId.toString()) {
        return bot.sendMessage(chatId, "Ops, este perfil não foi encontrado ou não pertence a você.");
    }

    let question = '';
    let nextAction = '';

    if (field === 'name') {
        question = `Qual o novo nome para o perfil *${escapeMarkdown(profile.name)}*?`;
        nextAction = 'awaiting_new_name';
    } else if (field === 'minHumidity') {
        question = `Qual a nova umidade mínima (em %) para *${escapeMarkdown(profile.name)}*? (Apenas números)`;
        nextAction = 'awaiting_min_humidity';
    } else if (field === 'wateringDuration') {
        question = `Qual a nova duração da rega (em segundos) para *${escapeMarkdown(profile.name)}*? (Apenas números)`;
        nextAction = 'awaiting_watering_duration';
    }

    if (question && nextAction) {
        // Salva o estado do usuário no banco de dados
        await UserState.findOneAndUpdate(
            { chatId },
            { action: nextAction, data: { profileId } },
            { upsert: true, new: true }
        );
        bot.sendMessage(chatId, question, { parse_mode: 'MarkdownV2' });
    }
}

// --- MANIPULADOR DE MENSAGENS DE TEXTO (handleCommand) ATUALIZADO ---
async function handleTextMessage(message) {
    const text = message.text || '';
    const chatId = message.chat.id;

    // 1. VERIFICAR SE HÁ UM ESTADO DE CONVERSA PENDENTE
    const userState = await UserState.findOne({ chatId });

    if (userState) {
        const profileId = userState.data.profileId;
        let newValue = text.trim();
        let updateField = {};
        let successMessage = '';

        try {
            if (userState.action === 'awaiting_new_name') {
                updateField = { name: newValue };
                successMessage = `Nome do perfil alterado para *${escapeMarkdown(newValue)}*!`;
            } else if (userState.action === 'awaiting_min_humidity') {
                const numValue = parseInt(newValue, 10);
                if (isNaN(numValue)) throw new Error("Valor inválido. Por favor, envie apenas números.");
                updateField = { minHumidity: numValue };
                successMessage = `Umidade mínima alterada para *${escapeMarkdown(numValue.toString())}%*!`;
            } else if (user_state.action === 'awaiting_watering_duration') {
                const numValue = parseInt(newValue, 10);
                if (isNaN(numValue)) throw new Error("Valor inválido. Por favor, envie apenas números.");
                updateField = { wateringDuration: numValue };
                successMessage = `Duração da rega alterada para *${escapeMarkdown(numValue.toString())}s*!`;
            }

            // Chama a API PUT para fazer a atualização segura
            const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles/${profileId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-chat-id': chatId.toString()
                },
                body: JSON.stringify(updateField)
            });

            if (!apiResponse.ok) throw new Error("Falha ao atualizar o perfil na API.");

            await UserState.deleteOne({ chatId }); // Limpa o estado
            return bot.sendMessage(chatId, `✅ ${successMessage}`, { parse_mode: 'MarkdownV2' });

        } catch (error) {
            await UserState.deleteOne({ chatId }); // Limpa o estado em caso de erro
            return bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
        }
    }

    // 2. SE NÃO HÁ ESTADO, PROCESSAR COMO UM COMANDO NORMAL
    if (text.startsWith('/')) {
        //... (código dos comandos /start, /addperfil, /listarperfis, etc.)

        // --- COMANDO /modificarperfil (NOVA LÓGICA) ---
        if (text.startsWith('/modificarperfil ')) {
            const plantName = text.substring(17).trim();
            if (!plantName) return bot.sendMessage(chatId, "Formato inválido\. Use: /modificarperfil <Nome da Planta>");

            const profile = await PlantProfile.findOne({ name: plantName, chatId: chatId });
            if (!profile) return bot.sendMessage(chatId, `Você não tem um perfil chamado "${escapeMarkdown(plantName)}"\.`);

            const keyboard = {
                inline_keyboard: [
                    { text: '✏️ Nome', callback_data: `edit:name:${profile._id}` },
                    { text: '💧 Umidade Mín.', callback_data: `edit:minHumidity:${profile._id}` }
                ],

            };

            bot.sendMessage(chatId, `O que você deseja modificar no perfil *${escapeMarkdown(profile.name)}*?`, {
                reply_markup: keyboard,
                parse_mode: 'MarkdownV2'
            });
        }

        // --- COMANDO /removerperfil (JÁ IMPLEMENTADO ACIMA) ---
        if (text === '/start') {
            const welcomeMessage = `Olá\\! Bem\\-vindo ao Bot de Irrigação\\. 🌱

*Comandos Disponíveis:*
\`/addperfil <Nome>;<UmidadeMin>;<TempoSeg>\` \\- Adiciona um novo perfil\\.
\`/listarperfis\` \\- Mostra todos os seus perfis\\.
\`/plantapadrao <Nome da Planta>\` \\- Define qual perfil a rega automática deve seguir\\.
\`/historico <Nome da Planta>\` \\- Mostra as últimas 3 regas da planta\\.
\`/umidade\` \\- Mostra a última umidade registrada\\.
\`/meuid\` \\- Mostra seu ID para login na web\\.
\`/regar <Nome da Planta>\` \\- Aciona uma rega manual\\.`;

            bot.sendMessage(chatId, welcomeMessage);
        }
        else if (text.startsWith('/removerperfil ')) {
            const plantName = text.substring(15).trim();
            if (!plantName) return bot.sendMessage(chatId, "Formato inválido\. Use: /removerperfil <Nome da Planta>");

            const safePlantName = escapeMarkdown(plantName);

            // Encontra o perfil para obter o ID
            const profile = await PlantProfile.findOne({ name: plantName, chatId: chatId });
            if (!profile) return bot.sendMessage(chatId, `Você não tem um perfil chamado "${safePlantName}"\.`);

            // Chama nossa nova API DELETE
            const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles/${profile._id}`, {
                method: 'DELETE',
                headers: {
                    'x-chat-id': chatId.toString()
                }
            });

            if (apiResponse.ok) {
                bot.sendMessage(chatId, `✅ Perfil *${safePlantName}* removido com sucesso\!`);
            } else {
                const errorData = await apiResponse.json();
                console.error("Erro da API ao remover perfil:", errorData);
                bot.sendMessage(chatId, `Ocorreu um erro ao remover o perfil\. Tente novamente\.`);
            }
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
        else if (text.startsWith('/plantapadrao ')) {
            const plantName = text.substring(14).trim();
            if (!plantName) return bot.sendMessage(chatId, "Formato inválido\\. Use: /plantapadrao <Nome da Planta>");

            const profile = await PlantProfile.findOne({ name: plantName, chatId: chatId });
            if (!profile) return bot.sendMessage(chatId, `Você não tem um perfil chamado "${escapeMarkdown(plantName)}"\\.`);

            await PlantProfile.updateMany({ chatId: chatId }, { isDefault: false });
            await PlantProfile.findByIdAndUpdate(profile._id, { isDefault: true });

            bot.sendMessage(chatId, `✅ Perfil *${escapeMarkdown(profile.name)}* definido como padrão\\!`);
        }
        else if (text.startsWith('/removerperfil ')) {
            const plantName = text.substring(15).trim();
            if (!plantName) return bot.sendMessage(chatId, "Formato inválido\. Use: /removerperfil <Nome da Planta>");

            const safePlantName = escapeMarkdown(plantName);

            // Encontra o perfil para obter o ID
            const profile = await PlantProfile.findOne({ name: plantName, chatId: chatId });
            if (!profile) return bot.sendMessage(chatId, `Você não tem um perfil chamado "${safePlantName}"\.`);

            // Chama nossa nova API DELETE
            const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles/${profile._id}`, {
                method: 'DELETE',
                headers: {
                    'x-chat-id': chatId.toString()
                }
            });

            if (apiResponse.ok) {
                bot.sendMessage(chatId, `✅ Perfil *${safePlantName}* removido com sucesso\!`);
            } else {
                const errorData = await apiResponse.json();
                console.error("Erro da API ao remover perfil:", errorData);
                bot.sendMessage(chatId, `Ocorreu um erro ao remover o perfil\. Tente novamente\.`);
            }
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
        //... (restante dos comandos: /listarperfis, /plantapadrao, etc.)
    }
}

// --- FUNÇÃO POST PRINCIPAL ATUALIZADA ---
export async function POST(request) {
    await dbConnect();
    try {
        const body = await request.json();

        // Roteamento da requisição: é uma mensagem de texto ou um clique em botão?
        if (body.message) {
            await handleTextMessage(body.message);
        } else if (body.callback_query) {
            await handleCallbackQuery(body.callback_query);
        }

        return NextResponse.json({ status: 'ok' }, { status: 200 });
    } catch (error) {
        console.error("--- ERRO GERAL NO WEBHOOK DO TELEGRAM ---", error);
        // Evita que o webhook quebre em caso de erro não tratado
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}