// src/app/page.js

"use client"; // Diretiva OBRIGATÓRIA para usar interatividade (hooks, eventos)

import { useState } from 'react';

export default function SimulationPage() {
  // Estados para controlar a página
  const [humidity, setHumidity] = useState(50); // Valor inicial do slider
  const [loading, setLoading] = useState(false); // Para saber se estamos esperando uma resposta
  const [responseMessage, setResponseMessage] = useState(''); // Mensagem de feedback do servidor

  // Função que será chamada quando o botão for clicado
  const simulateHumidityReport = async () => {
    setLoading(true);
    setResponseMessage('Enviando dados...');

    try {
      const response = await fetch('/api/humidity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ humidity: humidity }), // Envia a umidade atual do slider
      });

      const result = await response.json();

      if (!response.ok) {
        // Se a resposta da API for um erro (status 4xx ou 5xx)
        throw new Error(result.error || 'Ocorreu um erro na API');
      }
      
      // Define a mensagem de feedback com base na resposta da API
      setResponseMessage(`Sucesso: ${result.message || JSON.stringify(result)}`);

    } catch (error) {
      // Se houver um erro de rede ou na lógica da requisição
      setResponseMessage(`Erro na simulação: ${error.message}`);
    } finally {
      // Garante que o estado de 'loading' seja desativado no final
      setLoading(false);
    }
  };

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '50px auto', textAlign: 'center' }}>
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
          onChange={(e) => setHumidity(Number(e.target.value))} // Atualiza o valor quando o slider é movido
          style={{ width: '100%' }}
        />
      </div>

      <button
        onClick={simulateHumidityReport}
        disabled={loading} // O botão fica desabilitado durante o envio
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