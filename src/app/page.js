"use client"; // Essencial, pois precisamos acessar o localStorage do navegador

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Hook de roteamento do Next.js

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Assim que a página carrega no navegador, verificamos o localStorage.
    const savedChatId = localStorage.getItem('userChatId');

    if (savedChatId) {
      // Se encontramos um ID, o usuário já logou antes.
      // Redirecionamos para a página de perfis, que é a nossa nova "home".
      router.push('/perfis');
    } else {
      // Se não há ID, o usuário precisa fazer login.
      // Redirecionamos para a página de login.
      router.push('/login');
    }
  }, [router]); // O useEffect depende do router para funcionar

  // Enquanto o redirecionamento acontece (o que é quase instantâneo),
  // mostramos uma mensagem simples.
  return (
    <main style={{ fontFamily: 'sans-serif', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <p>Redirecionando...</p>
    </main>
  );
}