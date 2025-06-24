"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Hook para ler parâmetros da URL
import Link from 'next/link';

export default function HistoryPage() {
  const params = useParams(); // Pega os parâmetros da URL, ex: { id: '12345' }
  const plantId = params.id;

  const [history, setHistory] = useState([]);
  const [plantName, setPlantName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (plantId) {
      const fetchHistory = async () => {
        try {
          // Vamos buscar os dados na nossa nova rota de API
          const response = await fetch(`/api/get-history?plantId=${plantId}`);
          if (!response.ok) {
            throw new Error('Falha ao buscar histórico');
          }
          const data = await response.json();
          setPlantName(data.plant.name);
          setHistory(data.history);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchHistory();
    }
  }, [plantId]); // Roda o efeito sempre que o plantId mudar

  const formatarData = (timestamp) => {
    // Formata a data e hora para o padrão brasileiro
    return new Date(timestamp).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });
  };

  if (isLoading) {
    return <p style={{ textAlign: 'center', marginTop: '100px' }}>Carregando histórico...</p>;
  }

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '50px auto' }}>
      <Link href="/perfis" style={{ color: '#0070f3' }}>&larr; Voltar para Meus Perfis</Link>
      <h1 style={{ textAlign: 'center' }}>Histórico de Rega para: <em>{plantName}</em></h1>

      <div style={{ marginTop: '40px' }}>
        {history.length > 0 ? (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {history.map(item => (
              <li key={item._id} style={{ padding: '12px', border: '1px solid #eee', borderRadius: '5px', marginBottom: '10px' }}>
                Regado por <strong>{item.duration} segundos</strong> em: {formatarData(item.timestamp)}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ textAlign: 'center' }}>Nenhum histórico de rega encontrado para esta planta.</p>
        )}
      </div>
    </main>
  );
}