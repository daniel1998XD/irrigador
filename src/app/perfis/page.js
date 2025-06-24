"use client"; // Esta página precisa de interatividade

import { useState, useEffect } from 'react';
import Link from 'next/link';
// Importamos a Server Action que vamos criar logo abaixo
import { setDefaultProfile } from './actions';

export default function PerfisPage() {
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userChatId, setUserChatId] = useState(null);

  useEffect(() => {
    const savedChatId = localStorage.getItem('userChatId');
    if (!savedChatId) {
      window.location.href = '/login';
      return;
    }
    setUserChatId(savedChatId);
    
    const fetchProfiles = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/get-my-profiles?chatId=${savedChatId}`);
        const data = await response.json();
        setProfiles(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  // ... (função handleLogout continua a mesma)

  if (isLoading) {
    return <p style={{ textAlign: 'center', marginTop: '100px' }}>Carregando...</p>;
  }

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '50px auto' }}>
      {/* ... (cabeçalho da página e botão de logout) ... */}
      <h1>Meus Perfis de Plantas</h1>
      <p>A rega automática e o histórico de umidade seguirão o perfil marcado como <strong>(Padrão)</strong>.</p>
      
      <div style={{ marginTop: '40px' }}>
        {profiles.length > 0 ? (
          profiles.map(profile => (
            <div key={profile._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: profile.isDefault ? '2px solid #0070f3' : '1px solid #eee', borderRadius: '5px', marginBottom: '10px' }}>
              <div>
                <Link href={`/perfis/${profile._id}`} style={{ fontWeight: 'bold', color: '#0070f3', textDecoration: 'none' }}>
                  {profile.name} {profile.isDefault && <strong>(Padrão)</strong>}
                </Link>
                <div style={{fontSize: '0.9em', color: '#666'}}>
                  <span>Umidade Mín: {profile.minHumidity}%</span> | 
                  <span> Rega: {profile.wateringDuration}s</span>
                </div>
              </div>
              {/* Formulário com o botão para definir como padrão */}
              {!profile.isDefault && (
                <form action={setDefaultProfile}>
                  <input type="hidden" name="profileId" value={profile._id} />
                  <button type="submit" style={{padding: '8px 12px', cursor: 'pointer'}}>Tornar Padrão</button>
                </form>
              )}
            </div>
          ))
        ) : (
          <p>Nenhum perfil cadastrado. Use o bot no Telegram para adicionar.</p>
        )}
      </div>
    </main>
  );
}