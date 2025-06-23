import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

// Esta é uma Server Component, ela pode buscar dados diretamente.
// Dentro de src/app/perfis/page.js

// ... (o resto do seu código, como a função PerfisPage, continua igual)

// Esta é a Server Action. Ela executa APENAS no servidor.
async function addProfile(formData) {
  "use server";

  const name = formData.get('name');
  const minHumidityStr = formData.get('minHumidity');
  const wateringDurationStr = formData.get('wateringDuration');
  const chatId = process.env.YOUR_TELEGRAM_CHAT_ID || '00000000'; 
  
  // --- VALIDAÇÃO DOS DADOS ---
  const minHumidity = Number(minHumidityStr);
  const wateringDuration = Number(wateringDurationStr);

  if (isNaN(minHumidity) || isNaN(wateringDuration)) {
    console.error("Erro de validação: Umidade ou Duração não são números válidos.");
    // Idealmente, você retornaria uma mensagem de erro para a interface aqui.
    // Por enquanto, vamos apenas impedir a execução.
    return; 
  }

  // --- BLOCO TRY...CATCH PARA CAPTURAR ERROS ---
  try {
    await dbConnect();
    await PlantProfile.create({
      name,
      minHumidity,
      wateringDuration,
      chatId
    });

    console.log(`Perfil "${name}" criado com sucesso!`);

  } catch (error) {
    // Se algo der errado ao salvar no banco, o erro será capturado aqui.
    console.error("ERRO AO CRIAR PERFIL NO BANCO:", error);
    // Isso vai mostrar o erro exato nos logs da Vercel sem quebrar a aplicação.
  }

  // Limpa o cache para que a lista seja atualizada na tela
  revalidatePath('/perfis');
}

// Função Server Component principal
export default async function PerfisPage() {
  await dbConnect();
  const profiles = await PlantProfile.find({}).lean();

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '50px auto' }}>
      <Link href="/" style={{ color: '#0070f3' }}>&larr; Voltar para o Simulador</Link>

      <h1 style={{ textAlign: 'center' }}>Gerenciar Perfis de Plantas</h1>

      {/* Formulário para adicionar um novo perfil */}
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '40px' }}>
        <h2>Adicionar Novo Perfil</h2>
        <form action={addProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input name="name" type="text" placeholder="Nome da Planta (ex: Tomate)" required style={{ padding: '10px' }} />
          <input name="minHumidity" type="number" placeholder="Umidade Mínima % (ex: 40)" required style={{ padding: '10px' }} />
          <input name="wateringDuration" type="number" placeholder="Duração da Rega (segundos, ex: 7)" required style={{ padding: '10px' }} />
          <button type="submit" style={{ padding: '12px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
            Salvar Perfil
          </button>
        </form>
      </div>

      {/* Lista de perfis já cadastrados */}
      <div>
        <h2>Perfis Cadastrados</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {profiles.length > 0 ? (
            profiles.map(profile => (
              <div key={profile._id.toString()} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
                <span><strong>{profile.name}</strong></span>
                <span>Umidade Mín: {profile.minHumidity}%</span>
                <span>Rega: {profile.wateringDuration}s</span>
              </div>
            ))
          ) : (
            <p>Nenhum perfil cadastrado ainda.</p>
          )}
        </div>
      </div>
    </main>
  );
}