import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Histórico de Bolões - Mega da Virada 2025",
  description: "Visualize o histórico de todos os bolões criados na Mega da Virada 2025. Acompanhe participantes, números sorteados e estatísticas completas.",
  robots: "noindex, follow",
  openGraph: {
    title: "Histórico de Bolões - Mega da Virada 2025",
    description: "Visualize o histórico de todos os bolões criados na Mega da Virada 2025",
    type: "website",
    url: "https://mega.hyz.is/historico",
  },
  twitter: {
    card: "summary",
    title: "Histórico de Bolões - Mega da Virada 2025",
    description: "Visualize o histórico de todos os bolões criados",
  },
};

export default function HistoricoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
