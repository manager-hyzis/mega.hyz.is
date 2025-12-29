import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareLink = `${baseUrl}/bolao/${id}`;

  return {
    title: 'Mega da Virada 2025 - Bolão Colaborativo',
    description: 'Escolha seu jogo na Mega da Virada 2025! 🍀 Insira seu nome e WhatsApp, selecione um jogo disponível ou edite os números. Se não gostar do nome gerado, edite-o. Compartilhe o link com amigos para participar do bolão colaborativo.',
    keywords: ['Mega da Virada', 'Bolão', 'Loteria', 'Colaborativo', '2026'],
    openGraph: {
      title: 'Mega da Virada 2025 - Bolão Colaborativo',
      description: 'Escolha seu jogo na Mega da Virada 2025! 🍀 Insira seu nome e WhatsApp, selecione um jogo disponível ou edite os números. Se não gostar do nome gerado, edite-o. Compartilhe o link com amigos para participar do bolão colaborativo.',
      url: shareLink,
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og.webp`,
          width: 1200,
          height: 630,
          alt: 'Mega da Virada 2025 - Bolão Colaborativo',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Mega da Virada 2025 - Bolão Colaborativo',
      description: 'Escolha seu jogo na Mega da Virada 2025! 🍀 Insira seu nome e WhatsApp, selecione um jogo disponível ou edite os números. Se não gostar do nome gerado, edite-o. Compartilhe o link com amigos para participar do bolão colaborativo.',
      images: [`${baseUrl}/og.webp`],
    },
  };
}

export default function BolaoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
