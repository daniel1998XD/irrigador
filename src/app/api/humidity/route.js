// src/app/api/humidity/route.js

// ... (imports continuam os mesmos)

export async function POST(request) {
  await dbConnect();
  try {
    const { humidity } = await request.json();
    
    // --- DEBUG LOG 1: VERIFICAR O DADO RECEBIDO ---
    console.log(`[DEBUG] Umidade recebida na API: ${humidity}, Tipo: ${typeof humidity}`);

    if (humidity === undefined) {
      return NextResponse.json({ error: 'Umidade não fornecida' }, { status: 400 });
    }
    
    const profiles = await PlantProfile.find({});

    // --- DEBUG LOG 2: VERIFICAR OS PERFIS ENCONTRADOS ---
    console.log(`[DEBUG] Perfis encontrados no banco: ${profiles.length}`);
    // Se o log acima mostrar "0", este é o seu problema!

    let commandGenerated = false;
    for (const profile of profiles) {
      // --- DEBUG LOG 3: VERIFICAR A COMPARAÇÃO ---
      console.log(`[DEBUG] Comparando: Umidade recebida (${humidity}) < Umidade Mín. do Perfil "${profile.name}" (${profile.minHumidity})?`);
      
      if (humidity < profile.minHumidity) {
        console.log(`[DEBUG] CONDIÇÃO VERDADEIRA! Gerando comando.`);
        const pendingCommand = await WateringCommand.findOne({ executed: false });
        if (!pendingCommand) {
          await WateringCommand.create({ duration: profile.wateringDuration });
          bot.sendMessage(profile.chatId, `[SIMULAÇÃO] Atenção! Umidade baixa (${humidity}%). Rega automática iniciada.`);
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