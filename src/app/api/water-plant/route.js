// src/app/api/water-plant/route.js

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile';
import WateringCommand from '@/models/wateringCommand';

// Função para criar um comando de rega manual
export async function POST(request) {
    await dbConnect();

    try {
        const { plantId, chatId } = await request.json();

        if (!plantId ||!chatId) {
            return NextResponse.json({ error: 'ID da planta e ID do chat são obrigatórios.' }, { status: 400 });
        }

        // Passo de segurança:
        // Verifica se o perfil da planta existe E se pertence ao usuário que fez a requisição.
        const profile = await PlantProfile.findOne({ _id: plantId, chatId: chatId.toString() });

        if (!profile) {
            // Se não encontrou, ou o perfil não existe ou o usuário não tem permissão.
            return NextResponse.json({ error: 'Perfil não encontrado ou acesso negado.' }, { status: 404 });
        }

        // Se a verificação de segurança passou, cria o comando de rega
        await WateringCommand.create({
            duration: profile.wateringDuration,
            plantProfileId: profile._id
        });

        return NextResponse.json({ message: `Comando de rega para "${profile.name}" enviado com sucesso!` });

    } catch (error) {
        console.error("Erro ao criar comando de rega manual:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
