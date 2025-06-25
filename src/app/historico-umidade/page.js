"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GeneralHistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedChatId = localStorage.getItem('userChatId');
    if (!savedChatId) {
      window.location.href = '/login';
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/history/humidity?chatId=${savedChatId}`);
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: 'Falha ao processar a resposta do servidor' }));
          throw new Error(errData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setHistory(data);

      } catch (err) {
        console.error("Erro detalhado ao buscar histórico:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatarData = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'America/Sao_Paulo'
    });
  };

  if (isLoading) {
    return <p style={{ textAlign: 'center', marginTop: '100px' }}>Carregando histórico de umidade...</p>;
  }

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '50px auto' }}>
      <Link href="/perfis" style={{ color: '#0070f3' }}>&larr; Voltar para Meus Perfis</Link>
      <h1 style={{ textAlign: 'center' }}>Histórico Geral de Umidade</h1>

      {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>Ocorreu um erro: {error}</p>}

      <div style={{ marginTop: '40px' }}>
        {!error && history.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Planta</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Umidade Registrada</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Data e Hora</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    {/* ----- MUDANÇA AQUI ----- */}
                    {/* Lendo o campo 'plantName' que a API envia */}
                    <strong>{item.plantName}</strong>
                  </td>
                  <td style={{ padding: '12px' }}>{item.humidity}%</td>
                  <td style={{ padding: '12px', color: '#555' }}>{formatarData(item.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !error && <p style={{ textAlign: 'center' }}>Nenhum registro de umidade encontrado.</p>
        )}
      </div>
    </main>
  );
}