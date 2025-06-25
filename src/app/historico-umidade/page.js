// src/app/historico-umidade/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HumidityHistoryPage() {
  const [history, setHistory] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedChatId = localStorage.getItem('userChatId');
    if (!savedChatId) {
      router.push('/login');
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/history/humidity?chatId=${savedChatId}`);
        if (!response.ok) {
          throw new Error('Falha ao buscar o histórico de umidade.');
        }
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  const formatarData = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'medium'
    });
  };

  if (isLoading) {
    return <p style={{ textAlign: 'center', marginTop: '100px' }}>Carregando histórico...</p>;
  }

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '900px', margin: '50px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link href="/perfis" style={{ color: '#0070f3' }}>&larr; Voltar para Meus Perfis</Link>
        <Link href="/" style={{ color: '#0070f3' }}>Ir para o Simulador &rarr;</Link>
      </div>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Histórico Consolidado de Umidade</h1>

      {history.length > 0? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Data e Hora da Leitura</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Nome da Planta (Perfil na Hora)</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Umidade Registrada</th>
            </tr>
          </thead>
          <tbody>
            {history.map(item => (
              <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{formatarData(item.timestamp)}</td>
                <td style={{ padding: '12px' }}>
                  <em style={{ color: item.plantName === 'Perfil Removido'? '#999' : 'inherit' }}>
                    {item.plantName}
                  </em>
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{item.humidity}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ textAlign: 'center' }}>Nenhum histórico de umidade encontrado.</p>
      )}
    </main>
  );
}