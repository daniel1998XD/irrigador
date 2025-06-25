// src/app/perfis/editar/[id]/page.js
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id;

  const [profile, setProfile] = useState({ name: '', minHumidity: '', wateringDuration: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userChatId, setUserChatId] = useState(null);

  useEffect(() => {
    const savedChatId = localStorage.getItem('userChatId');
    if (!savedChatId) {
      router.push('/login');
      return;
    }
    setUserChatId(savedChatId);

    if (profileId) {
      const fetchProfileData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/profiles/${profileId}`, {
            headers: { 'x-chat-id': savedChatId }
          });
          if (!response.ok) {
            throw new Error('Falha ao buscar dados do perfil. Verifique se você tem permissão.');
          }
          const data = await response.json();
          setProfile(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfileData();
    }
  }, [profileId, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prevState => ({
     ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const updatedData = {
        name: profile.name,
        minHumidity: parseInt(profile.minHumidity, 10),
        wateringDuration: parseInt(profile.wateringDuration, 10)
    };

    if (!updatedData.name || isNaN(updatedData.minHumidity) || isNaN(updatedData.wateringDuration)) {
        setError('Por favor, preencha todos os campos com valores válidos.');
        return;
    }

    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-chat-id': userChatId
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao atualizar o perfil.');
      }
      
      // Sucesso! Redireciona de volta para a lista de perfis.
      router.push('/perfis');

    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) return <p style={{ textAlign: 'center', marginTop: '100px' }}>Carregando dados do perfil...</p>;

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '50px auto' }}>
      <Link href="/perfis" style={{ color: '#0070f3' }}>&larr; Voltar para Meus Perfis</Link>
      <h1 style={{ textAlign: 'center' }}>Editar Perfil: <em>{profile.name}</em></h1>

      <form onSubmit={handleSubmit} style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>Nome do Perfil</label>
          <input type="text" id="name" name="name" value={profile.name} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
        </div>
        <div>
          <label htmlFor="minHumidity" style={{ display: 'block', marginBottom: '5px' }}>Umidade Mínima (%)</label>
          <input type="number" id="minHumidity" name="minHumidity" value={profile.minHumidity} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
        </div>
        <div>
          <label htmlFor="wateringDuration" style={{ display: 'block', marginBottom: '5px' }}>Duração da Rega (segundos)</label>
          <input type="number" id="wateringDuration" name="wateringDuration" value={profile.wateringDuration} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
        </div>
        
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

        <button type="submit" style={{ padding: '12px', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1em' }}>
          Salvar Alterações
        </button>
      </form>
    </main>
  );
}