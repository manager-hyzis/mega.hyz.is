'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Printer, ArrowLeft } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/phone';
import DisclaimerFooter from '@/app/components/DisclaimerFooter';

interface Jogo {
  id: string;
  numeros: number[];
  reservado: boolean;
  editado: boolean;
  usuario?: {
    id: string;
    nome: string;
    whatsapp: string;
  };
}

interface Bolao {
  id: string;
  nome: string;
  descricao: string;
  grupoId: string;
  createdAt: string;
  jogos: Jogo[];
}

export default function HistoricoPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [boloes, setBoloes] = useState<Bolao[]>([]);
  const [loading, setLoading] = useState(false);
  const [grupoSelecionado, setGrupoSelecionado] = useState<string | null>(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const adminTokenExpiry = localStorage.getItem('adminTokenExpiry');
    
    if (adminToken && adminTokenExpiry) {
      const now = new Date().getTime();
      if (now < parseInt(adminTokenExpiry)) {
        setIsAdmin(true);
        carregarBoloes();
      } else {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminTokenExpiry');
        setShowAdminLogin(true);
      }
    } else {
      setShowAdminLogin(true);
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminSecret = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    if (adminPassword === adminSecret) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
      
      const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
      localStorage.setItem('adminToken', 'true');
      localStorage.setItem('adminTokenExpiry', expiryTime.toString());
      
      carregarBoloes();
    } else {
      alert('Senha de admin incorreta');
    }
  };

  const carregarBoloes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bolao/historico');
      if (!res.ok) throw new Error('Erro ao carregar histórico');
      
      const data = await res.json();
      setBoloes(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      alert('Erro ao carregar histórico de bolões');
    } finally {
      setLoading(false);
    }
  };

  const imprimirGrupo = (grupoId: string) => {
    const gruposBoloes = boloes.filter(b => b.grupoId === grupoId);
    
    let conteudo = `
      <html>
        <head>
          <title>Mega da Virada 2026 - Histórico</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #15803d; text-align: center; }
            h2 { color: #15803d; margin-top: 30px; border-bottom: 2px solid #15803d; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #15803d; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .jogo-header { background-color: #e8f5e9; font-weight: bold; }
            .numeros { font-family: monospace; }
            .sem-participante { color: #999; font-style: italic; }
            .page-break { page-break-after: always; }
          </style>
        </head>
        <body>
          <h1>🎰 Mega da Virada 2026</h1>
          <p style="text-align: center; color: #666;">Histórico de Bolões - ${new Date().toLocaleDateString('pt-BR')}</p>
    `;

    gruposBoloes.forEach((bolao, idx) => {
      conteudo += `
        <div class="page-break">
          <h2>Bolão: ${bolao.nome}</h2>
          <p><strong>Descrição:</strong> ${bolao.descricao || '-'}</p>
          <p><strong>Data:</strong> ${new Date(bolao.createdAt).toLocaleDateString('pt-BR')} às ${new Date(bolao.createdAt).toLocaleTimeString('pt-BR')}</p>
          
          <table>
            <thead>
              <tr>
                <th>Jogo</th>
                <th>Números</th>
                <th>Participante</th>
                <th>WhatsApp</th>
                <th>Editado</th>
              </tr>
            </thead>
            <tbody>
      `;

      bolao.jogos.forEach((jogo, jogoIdx) => {
        conteudo += `
          <tr>
            <td class="jogo-header">Jogo ${(jogoIdx + 1).toString().padStart(2, '0')}</td>
            <td class="numeros">${jogo.numeros.join(', ')}</td>
            <td>${jogo.usuario?.nome || '<span class="sem-participante">Disponível</span>'}</td>
            <td>${jogo.usuario?.whatsapp ? formatPhoneNumber(jogo.usuario.whatsapp) : '-'}</td>
            <td>${jogo.editado ? '✏️ Sim' : 'Não'}</td>
          </tr>
        `;
      });

      conteudo += `
            </tbody>
          </table>
        </div>
      `;
    });

    conteudo += `
        </body>
      </html>
    `;

    const janela = window.open('', '', 'width=900,height=600');
    if (janela) {
      janela.document.write(conteudo);
      janela.document.close();
      janela.print();
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4">
        {showAdminLogin && (
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
              <Lock size={24} />
              Acesso Admin
            </h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Digite a senha de admin"
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
              >
                Entrar
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  const grupos = Array.from(new Set(boloes.map(b => b.grupoId)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-emerald-700">
      <div className="bg-green-700 shadow-lg">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="text-white hover:bg-green-600 p-2 rounded-lg transition-all"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-3xl font-bold text-white">Histórico de Bolões</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 mt-6">
        {loading ? (
          <div className="text-white text-center py-8">Carregando...</div>
        ) : grupos.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-600 text-lg">Nenhum bolão gerado ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grupos.map(grupoId => {
              const gruposBoloes = boloes.filter(b => b.grupoId === grupoId);
              const primeiroData = new Date(gruposBoloes[0].createdAt);
              
              return (
                <div key={grupoId} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-green-700 text-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">{gruposBoloes.length} Bolão(ões)</h2>
                        <p className="text-green-100 text-sm">
                          Criado em {primeiroData.toLocaleDateString('pt-BR')} às {primeiroData.toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                      <button
                        onClick={() => imprimirGrupo(grupoId)}
                        className="bg-white text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-all flex items-center gap-2"
                      >
                        <Printer size={18} />
                        Imprimir
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="space-y-3">
                      {gruposBoloes.map((bolao, idx) => {
                        const participantes = bolao.jogos.filter(j => j.usuario).length;
                        const disponíveis = bolao.jogos.filter(j => !j.usuario).length;
                        
                        return (
                          <div key={bolao.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-800">
                                  {bolao.nome}
                                </h3>
                                <p className="text-sm text-gray-600">{bolao.descricao}</p>
                                <div className="flex gap-4 mt-2 text-sm">
                                  <span className="text-green-700 font-semibold">👥 {participantes} participante(s)</span>
                                  <span className="text-yellow-700 font-semibold">🎮 {disponíveis} disponível(is)</span>
                                  <span className="text-blue-700 font-semibold">🎯 {bolao.jogos.length} total</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DisclaimerFooter />
    </div>
  );
}
