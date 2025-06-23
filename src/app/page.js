// src/app/page.js

"use client";

// Adicione useEffect aos seus imports do React
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SimulationPage() {
  // Nosso novo estado para controlar a montagem no cliente
  const [isMounted, setIsMounted] = useState(false);

  const [humidity, setHumidity] = useState(50);
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  // Este hook só roda no cliente, uma única vez, após a primeira renderização
  useEffect(() => {
    setIsMounted(true);
  }, []); // O array vazio [] garante que ele rode apenas uma vez

  const simulateHumidityReport = async () => {
    setLoading(true);
    setResponseMessage('Enviando dados...');

    try {
      const response = await fetch('/api/humidity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ humidity: humidity }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Ocorreu um erro na API');
      }
      setResponseMessage(`Sucesso: ${result.message || JSON.stringify(result)}`);
    } catch (error) {
      setResponseMessage(`Erro na simulação: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Se o componente ainda não foi montado no cliente, não renderizamos nada
  // para garantir que o servidor e o cliente inicial sejam idênticos.
  if (!isMounted) {
    return null;
  }

  // Após a montagem, renderizamos a página completa
  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '50px auto', textAlign: 'center' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/perfis" style={{ color: '#0070f3', fontSize: '1.1em' }}>
          Gerenciar Perfis de Plantas &rarr;
        </Link>
      </div>
      
      <h1>Simulador de Sensor de Umidade</h1>
      
      <div style={{ margin: '40px 0' }}>
        <label htmlFor="humidity-slider" style={{ fontSize: '1.2em', display: 'block', marginBottom: '10px' }}>
          Umidade Atual: <strong>{humidity}%</strong>
        </label>
        <input
          id="humidity-slider"
          type="range"
          min="0"
          max="100"
          value={humidity}
          onChange={(e) => setHumidity(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <button
        onClick={simulateHumidityReport}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '1em',
          cursor: 'pointer',
          backgroundColor: loading ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        {loading ? 'Enviando...' : 'Simular Envio de Umidade'}
      </button>

      {responseMessage && (
        <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
          <p><strong>Resposta do Servidor:</strong></p>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{responseMessage}</pre>
        </div>
      )}
    </main>
  );
}