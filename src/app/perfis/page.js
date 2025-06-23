import dbConnect from '@/lib/dbConnect';
import PlantProfile from '@/models/plantProfile';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export const revalidate = 0; // Garante que os dados estão sempre atualizados

export default async function PerfisPage() {
  
  // Como admin, buscamos TODOS os perfis, sem filtro de chatId.
  await dbConnect();
  const profiles = await PlantProfile.find({}).sort({ name: 1 });

  async function addProfile(formData) {
    "use server";

    // Pegamos TODOS os dados do formulário, incluindo o chatId do usuário alvo.
    const name = formData.get('name');
    const minHumidity = formData.get('minHumidity');
    const wateringDuration = formData.get('wateringDuration');
    const chatId = formData.get('chatId'); // <-- NOVO!

    // Validação simples
    if (!name || !minHumidity || !wateringDuration || !chatId) {
        console.error("Todos os campos, incluindo Chat ID, são obrigatórios.");
        return;
    }

    try {
      await dbConnect();
      await PlantProfile.create({
        name,
        minHumidity: Number(minHumidity),
        wateringDuration: Number(wateringDuration),
        chatId // Usamos o ID fornecido no formulário
      });
      console.log(`Perfil "${name}" criado com sucesso para o chatId ${chatId}!`);
    } catch (error) {
      console.error("ERRO AO CRIAR PERFIL NO BANCO:", error);
    }

    revalidatePath('/perfis');
  }

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '50px auto' }}>
      <Link href="/" style={{ color: '#0070f3' }}>&larr; Voltar para o Simulador</Link>

      <h1 style={{ textAlign: 'center' }}>Painel de Administrador de Perfis</h1>

      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '40px' }}>
        <h2>Adicionar Novo Perfil (Admin)</h2>
        <form action={addProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input name="name" type="text" placeholder="Nome da Planta" required style={{ padding: '10px' }} />
          <input name="minHumidity" type="number" placeholder="Umidade Mínima %" required style={{ padding: '10px' }} />
          <input name="wateringDuration" type="number" placeholder="Duração da Rega (segundos)" required style={{ padding: '10px' }} />
          {/* CAMPO NOVO E CRUCIAL */}
          <input name="chatId" type="text" placeholder="ID do Chat do Telegram do Usuário" required style={{ padding: '10px' }} />
          <button type="submit" style={{ padding: '12px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
            Salvar Perfil como Admin
          </button>
        </form>
      </div>

      <div>
        <h2>Todos os Perfis Cadastrados</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {profiles.length > 0 ? (
            profiles.map(profile => (
              <div key={profile._id.toString()} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', border: '1px solid #eee', borderRadius: '5px', flexWrap: 'wrap' }}>
                <span><strong>{profile.name}</strong></span>
                <span>Umidade Mín: {profile.minHumidity}%</span>
                <span>Rega: {profile.wateringDuration}s</span>
                <span style={{ color: '#888', fontSize: '0.8em', width: '100%', paddingTop: '5px' }}>Proprietário (Chat ID): {profile.chatId}</span>
              </div>
            ))
          ) : (
            <p>Nenhum perfil cadastrado ainda!</p>
          )}
        </div>
      </div>
    </main>
  );
}