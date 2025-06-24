"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PerfisPage() {
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userChatId, setUserChatId] = useState(null);

  useEffect(() => {
    // Este código roda no navegador assim que a página carrega.
    const savedChatId = localStorage.getItem('userChatId');

    if (!savedChatId) {
      // Se não encontrou ID no "cofre", manda o usuário para a tela de login.
      window.location.href = '/login';
    } else {
      // Se encontrou, guardamos o ID e buscamos os perfis.
      setUserChatId(savedChatId);
      
      // Criamos uma nova função para buscar os dados da API
      const fetchProfiles = async () => {
        try {
          // Buscamos na API, passando o ID do usuário como parâmetro de busca
          const response = await fetch(`/api/get-my-profiles?chatId=${savedChatId}`);
          if (!response.ok) {
            throw new Error('Falha ao buscar perfis');
          }
          const data = await response.json();
          setProfiles(data);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchProfiles();
    }
  }, []); // O array vazio [] faz este useEffect rodar apenas uma vez.

  const handleLogout = () => {
    localStorage.removeItem('userChatId');
    window.location.href = '/login';
  };

  if (isLoading) {
    return <p style={{ textAlign: 'center', marginTop: '100px' }}>Carregando...</p>;
  }

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '50px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: '#0070f3' }}>&larr; Voltar para o Simulador</Link>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>Sair</button>
      </div>
      
      <h1 style={{ textAlign: 'center' }}>Meus Perfis de Plantas</h1>
      <p style={{ textAlign: 'center', color: '#888', fontSize: '0.9em' }}>Logado como ID: {userChatId}</p>

      {/* A lista de perfis */}
      <div style={{ marginTop: '40px' }}>
        {profiles.length > 0 ? (
          profiles.map(profile => (
            <div key={profile._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', border: '1px solid #eee', borderRadius: '5px', marginBottom: '10px' }}>
              <span><strong>{profile.name}</strong></span>
              <span>Umidade Mín: {profile.minHumidity}%</span>
              <span>Rega: {profile.wateringDuration}s</span>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center' }}>Você ainda não cadastrou nenhum perfil. Use o bot no Telegram para adicionar.</p>
        )}
      </div>
    </main>
  );
}