'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/phone';

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
          <title>Mega da Virada 2025 - Histórico</title>
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
          <h1>🎰 Mega da Virada 2025</h1>
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
              🔒 Acesso Admin
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
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-emerald-700 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-3xl sm:text-4xl">🍀</span>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold text-green-700">Mega da Virada 2025</h1>
                <p className="text-xs sm:text-sm text-gray-600">Histórico de Bolões</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold flex items-center gap-1 sm:gap-2 transition-all text-sm sm:text-base shrink-0"
            >
              ← Voltar
            </button>
          </div>
        </div>

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
                        🖨️ Imprimir
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="space-y-4">
                      {gruposBoloes.map((bolao) => {
                        const participantes = bolao.jogos.filter(j => j.usuario).length;
                        const disponíveis = bolao.jogos.filter(j => !j.usuario).length;
                        const numerosParticipantes = new Set(
                          bolao.jogos
                            .filter(j => j.usuario)
                            .flatMap(j => j.numeros)
                        );
                        const todoNumeros = new Set(Array.from({length: 60}, (_, i) => i + 1));
                        const numerosFaltando = Array.from(todoNumeros).filter(n => !numerosParticipantes.has(n));
                        
                        return (
                          <div key={bolao.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all">
                            <div className="bg-gray-50 p-4 border-b">
                              <h3 className="font-bold text-gray-800 text-lg mb-2">{bolao.nome}</h3>
                              <p className="text-sm text-gray-600 mb-3">{bolao.descricao}</p>
                              <div className="grid grid-cols-4 gap-2 text-sm">
                                <div className="bg-white p-2 rounded border border-green-200">
                                  <div className="text-green-700 font-bold">{participantes}</div>
                                  <div className="text-xs text-gray-600">Participantes</div>
                                </div>
                                <div className="bg-white p-2 rounded border border-yellow-200">
                                  <div className="text-yellow-700 font-bold">{disponíveis}</div>
                                  <div className="text-xs text-gray-600">Disponíveis</div>
                                </div>
                                <div className="bg-white p-2 rounded border border-blue-200">
                                  <div className="text-blue-700 font-bold">{bolao.jogos.length}</div>
                                  <div className="text-xs text-gray-600">Total Jogos</div>
                                </div>
                                <div className="bg-white p-2 rounded border border-red-200">
                                  <div className="text-red-700 font-bold">{numerosFaltando.length}</div>
                                  <div className="text-xs text-gray-600">Números Faltando</div>
                                </div>
                              </div>
                            </div>
                            
                            {numerosFaltando.length > 0 && (
                              <div className="p-4 bg-red-50 border-t border-red-200">
                                <p className="text-sm font-semibold text-red-700 mb-2">Números faltando:</p>
                                <div className="flex flex-wrap gap-1">
                                  {numerosFaltando.slice(0, 20).map(num => (
                                    <span key={num} className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded">
                                      {num}
                                    </span>
                                  ))}
                                  {numerosFaltando.length > 20 && (
                                    <span className="text-xs text-red-700 px-2 py-1">
                                      +{numerosFaltando.length - 20} mais
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {participantes > 0 && (
                              <div className="p-4 border-t">
                                <p className="text-sm font-semibold text-gray-700 mb-2">Participantes:</p>
                                <div className="space-y-2">
                                  {bolao.jogos
                                    .filter(j => j.usuario)
                                    .map((jogo, idx) => (
                                      <div key={jogo.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                        <div>
                                          <span className="font-semibold text-gray-800">{jogo.usuario?.nome}</span>
                                          <span className="text-gray-600 text-xs ml-2">({formatPhoneNumber(jogo.usuario?.whatsapp || '')})</span>
                                        </div>
                                        <div className="flex gap-2">
                                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                            Jogo {(idx + 1).toString().padStart(2, '0')}
                                          </span>
                                          {jogo.editado && (
                                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                              ✏️ Editado
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
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
    </div>
  );
}
