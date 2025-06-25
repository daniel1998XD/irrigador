"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { setDefaultProfile, deleteProfile } from './actions';

export default function PerfisPage() {
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userChatId, setUserChatId] = useState(null);

  // --- ESTADOS PARA O MODAL DE DELEÇÃO ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);

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

  const handleLogout = () => {
    localStorage.removeItem('userChatId');
    window.location.href = '/login';
  };

  // --- FUNÇÕES PARA CONTROLAR O MODAL ---
  const openDeleteModal = (profile) => {
    setProfileToDelete(profile);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setProfileToDelete(null);
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!profileToDelete) return;
    
    const formData = new FormData();
    formData.append('profileId', profileToDelete._id);
    
    await deleteProfile(formData);
    
    setProfiles(profiles.filter(p => p._id !== profileToDelete._id));
    
    closeDeleteModal();
  };

  if (isLoading) {
    return <p style={{ textAlign: 'center', marginTop: '100px' }}>Carregando...</p>;
  }

  return (
    <>
      <main style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '50px auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Meus Perfis de Plantas</h1>
          <button onClick={handleLogout} style={{ padding: '8px 12px', cursor: 'pointer', border: '1px solid #ccc', background: 'none', borderRadius: '5px' }}>Sair</button>
        </div>
        <p>A rega automática e o histórico de umidade seguirão o perfil marcado como <strong>(Padrão)</strong>.</p>
        <div style={{ margin: '20px 0' }}>
          <Link href="/historico-umidade" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>
              Ver Histórico Geral de Umidade &rarr;
          </Link>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          {profiles.length > 0 ? (
            profiles.map(profile => (
              <div key={profile._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: profile.isDefault ? '2px solid #0070f3' : '1px solid #eee', borderRadius: '5px', marginBottom: '10px' }}>
                <div style={{ flexGrow: 1 }}>
                  <Link href={`/perfis/${profile._id}`} style={{ fontWeight: 'bold', color: '#0070f3', textDecoration: 'none', fontSize: '1.2em' }}>
                    {profile.name} {profile.isDefault && <span style={{ color: '#0070f3', fontWeight: 'bold' }}>(Padrão)</span>}
                  </Link>
                  <div style={{fontSize: '0.9em', color: '#666'}}>
                    <span>Umidade Mín: {profile.minHumidity}%</span> | 
                    <span> Rega: {profile.wateringDuration}s</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {!profile.isDefault && (
                    <form action={setDefaultProfile}>
                      <input type="hidden" name="profileId" value={profile._id} />
                      <input type="hidden" name="chatId" value={userChatId} />
                      <button type="submit" style={{padding: '8px 12px', cursor: 'pointer', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '5px'}}>Tornar Padrão</button>
                    </form>
                  )}
                  <Link href={`/perfis/editar/${profile._id}`} style={{ padding: '8px 12px', cursor: 'pointer', background: '#ffc107', color: 'black', textDecoration: 'none', border: 'none', borderRadius: '5px' }}>
                      Modificar
                  </Link>
                  <button onClick={() => openDeleteModal(profile)} style={{padding: '8px 12px', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px'}}>
                      Deletar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>Nenhum perfil cadastrado. Use o bot no Telegram para adicionar.</p>
          )}
        </div>
      </main>

      {/* --- JSX DO MODAL DE CONFIRMAÇÃO --- */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{ marginTop: 0 }}>Confirmar Exclusão</h2>
            <p>
              Você tem certeza que deseja remover o perfil &ldquo;<strong>{profileToDelete?.name}</strong>&rdquo;?
            </p>
            <p style={{ fontSize: '0.9em', color: '#666' }}>
              Esta ação não pode ser desfeita.
            </p>
            <div style={styles.modalActions}>
              <button onClick={closeDeleteModal} style={styles.buttonSecondary}>
                Cancelar
              </button>
              <button onClick={handleConfirmDelete} style={styles.buttonDanger}>
                Sim, quero remover
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- ESTILOS PARA O MODAL ---
const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '25px',
  },
  buttonSecondary: {
    padding: '10px 18px',
    border: '1px solid #ccc',
    backgroundColor: '#f0f0f0',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  buttonDanger: {
    padding: '10px 18px',
    border: 'none',
    backgroundColor: '#dc3545',
    color: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};