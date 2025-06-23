import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

// Esta é uma Server Component, ela pode buscar dados diretamente.
export default async function PerfisPage() {
  
  // Busca os perfis existentes no banco para listá-los
  await dbConnect();
  const profiles = await PlantProfile.find({}).sort({ name: 1 });

  // Esta é uma Server Action. Ela executa APENAS no servidor.
  async function addProfile(formData) {
    "use server"; // Mágica do Next.js!

    // 1. Pega os dados do formulário
    const name = formData.get('name');
    const minHumidity = formData.get('minHumidity');
    const wateringDuration = formData.get('wateringDuration');
    
    // Um chatId fixo para o exemplo, substitua pelo seu se necessário
    const chatId = process.env.YOUR_TELEGRAM_CHAT_ID || '00000000'; 
    // OBS: Você precisará adicionar seu Chat ID nas variáveis de ambiente na Vercel

    // 2. Conecta ao banco e cria o novo perfil
    await dbConnect();
    await PlantProfile.create({
      name,
      minHumidity: Number(minHumidity),
      wateringDuration: Number(wateringDuration),
      chatId
    });

    // 3. Limpa o cache para que a lista seja atualizada na tela
    revalidatePath('/perfis');
  }

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