"use client";

import { useState } from 'react';

export default function LoginPage() {
  const [chatId, setChatId] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault(); // Impede que o formulário recarregue a página

    // Validação simples para ver se é um número
    if (!chatId || isNaN(Number(chatId))) {
      setError('Por favor, insira um ID de Chat válido (apenas números).');
      return;
    }

    // O passo mais importante: salvamos o ID no "cofre" do navegador.
    localStorage.setItem('userChatId', chatId);
    
    // Redireciona o usuário para a página de perfis.
    window.location.href = '/perfis';
  };

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '400px', margin: '100px auto', textAlign: 'center' }}>
      <h1>Login</h1>
      <p style={{ color: '#666' }}>Peça seu ID para o bot no Telegram com o comando <code>/meuid</code>.</p>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
        <input
          type="text"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          placeholder="Cole seu ID de Chat aqui"
          style={{ padding: '12px', fontSize: '1em', border: '1px solid #ddd', borderRadius: '5px' }}
        />
        <button 
          type="submit" 
          style={{ padding: '12px', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1em' }}
        >
          Entrar
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </main>
  );
}