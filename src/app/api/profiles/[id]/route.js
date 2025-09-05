// src/app/api/profiles/[id]/route.js

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile';

// Função para buscar os detalhes de um único perfil
export async function GET(request, { params }) {
  const profileId = params.id;
  const chatId = request.headers.get('x-chat-id');

  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID é obrigatório no cabeçalho x-chat-id' }, { status: 401 });
  }

  await dbConnect();

  try {
    const profile = await PlantProfile.findById(profileId);

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Verificação de segurança
    if (profile.chatId!== chatId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}


// Função para ATUALIZAR um perfil existente
export async function PUT(request, { params }) {
  const profileId = params.id;
  const chatId = request.headers.get('x-chat-id');

  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID é obrigatório no cabeçalho x-chat-id' }, { status: 401 });
  }

  try {
    const { name, minHumidity, wateringDuration } = await request.json();

    if (!name || minHumidity === undefined || wateringDuration === undefined) {
      return NextResponse.json({ error: 'Dados incompletos para atualização' }, { status: 400 });
    }

    await dbConnect();

    const profile = await PlantProfile.findById(profileId);

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Verificação de segurança
    if (profile.chatId!== chatId) {
      return NextResponse.json({ error: 'Acesso negado. Você não pode modificar este perfil.' }, { status: 403 });
    }

    // Se a segurança passar, atualize o documento
    const updatedProfile = await PlantProfile.findByIdAndUpdate(
      profileId,
      { name, minHumidity, wateringDuration },
      { new: true, runValidators: true } // Retorna o documento atualizado e roda as validações do schema
    );

    return NextResponse.json(updatedProfile);

  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Função para DELETAR um perfil existente
export async function DELETE(request, { params }) {
  const profileId = params.id;
  const chatId = request.headers.get('x-chat-id');

  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID é obrigatório no cabeçalho x-chat-id' }, { status: 401 });
  }

  await dbConnect();

  try {
    const profile = await PlantProfile.findById(profileId);

    if (!profile) {
      // Se o perfil já não existe, consideramos a operação um sucesso
      return NextResponse.json({ message: 'Perfil não encontrado, nada a fazer.' }, { status: 200 });
    }

    // Verificação de segurança
    if (profile.chatId!== chatId) {
      return NextResponse.json({ error: 'Acesso negado. Você não pode deletar este perfil.' }, { status: 403 });
    }


    await PlantProfile.findByIdAndDelete(profileId);

    return NextResponse.json({ message: 'Perfil deletado com sucesso' });

  } catch (error) {
    console.error("Erro ao deletar perfil:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
