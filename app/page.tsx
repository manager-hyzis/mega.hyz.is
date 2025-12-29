'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Trash2, Eye, Lock, Plus, Minus } from 'lucide-react';
import { gerarBolao } from '@/lib/gerador';

interface Bolao {
  id: string;
  nome: string;
  descricao: string;
  linkCompartilhamento: string;
  createdAt: string;
  jogos: Array<{
    id: string;
    numeros: number[];
    usuario: any;
  }>;
}

export default function HomePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const [boloes, setBoloes] = useState<Bolao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [showGerador, setShowGerador] = useState(false);
  
  // Opções de geração
  const [quantidadeJogos, setQuantidadeJogos] = useState(10);
  const [criando, setCriando] = useState(false);
  const [bolaoSucesso, setBolaoSucesso] = useState<{ id: string; link: string } | null>(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const adminTokenExpiry = localStorage.getItem('adminTokenExpiry');
    
    if (adminToken && adminTokenExpiry) {
      const now = new Date().getTime();
      if (now < parseInt(adminTokenExpiry)) {
        setIsAdmin(true);
      } else {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminTokenExpiry');
      }
    }
    
    carregarBoloes();
  }, []);

  const carregarBoloes = async () => {
    try {
      setCarregando(true);
      const res = await fetch('/api/bolao?listar=true');
      if (res.ok) {
        const data = await res.json();
        setBoloes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar bolões:', error);
    } finally {
      setCarregando(false);
    }
  };

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
    }
  };

  const gerarNovosBolao = async () => {
    setCriando(true);
    try {
      const novosJogos = gerarBolao(quantidadeJogos);
      const grupoId = new Date().getTime().toString();
      
      const res = await fetch('/api/bolao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Mega da Virada 2025',
          descricao: 'Bolão colaborativo - Boa sorte! 🍀',
          jogosGerados: novosJogos,
          grupoId
        })
      });
      
      if (!res.ok) throw new Error('Erro ao criar bolão');
      
      const bolao = await res.json();
      const linkCompartilhamento = bolao.linkCompartilhamento;
      const linkId = linkCompartilhamento.split('/').pop();
      
      setBolaoSucesso({
        id: linkId || '',
        link: linkCompartilhamento
      });
      
      setShowGerador(false);
      carregarBoloes();
      
    } catch (error) {
      console.error('Erro ao gerar bolão:', error);
    } finally {
      setCriando(false);
    }
  };

  const deletarBolao = async (linkId: string) => {
    try {
      const res = await fetch(`/api/bolao?linkId=${linkId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        carregarBoloes();
      }
    } catch (error) {
      console.error('Erro ao deletar bolão:', error);
    }
  };

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
                <p className="text-xs sm:text-sm text-gray-600">Gerenciador de Bolões</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {!isAdmin && (
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold flex items-center gap-1 sm:gap-2 transition-all text-sm sm:text-base"
                >
                  🔐 Admin
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsAdmin(false);
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminTokenExpiry');
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base"
                >
                  Sair
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Admin Login Modal */}
        {showAdminLogin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
              <h2 className="text-2xl font-bold text-green-700 mb-4">Acesso Admin</h2>
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdminLogin(false)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
                  >
                    Entrar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Botão Gerar Bolão (Admin) - Apenas quando autenticado */}
        {isAdmin && (
          <div className="mb-6">
            <button
              onClick={() => setShowGerador(!showGerador)}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Trophy size={24} />
              Gerar Novo Bolão
            </button>
          </div>
        )}

        {/* Painel de Geração */}
        {isAdmin && showGerador && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-green-700 mb-2">Configurar Geração de Bolão</h2>
            <p className="text-sm text-gray-600 mb-6">Defina os parâmetros do bolão de acordo com as regras oficiais</p>
            
            <div className="space-y-6">
              {/* Quantidade de Jogos (Apostas) */}
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantidade de Jogos</label>
                <p className="text-xs text-gray-600 mb-3">Até 10 apostas diferentes (sequências de números)</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantidadeJogos(Math.max(1, Math.min(10, quantidadeJogos - 1)))}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="text-4xl font-bold text-blue-700 w-20 text-center">{quantidadeJogos}</div>
                  <button
                    onClick={() => setQuantidadeJogos(Math.min(10, quantidadeJogos + 1))}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Quantidade de Dezenas */}
              <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantidade de Dezenas</label>
                <p className="text-xs text-gray-600 mb-3">Números por jogo (padrão: 6)</p>
                <div className="text-3xl font-bold text-purple-700">6</div>
              </div>

              {/* Quantidade de Cotas */}
              <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantidade de Cotas</label>
                <p className="text-xs text-gray-600 mb-3">Participações no bolão (mínimo 2, máximo 100)</p>
                <p className="text-xs text-gray-500 mb-2">Cada cota = 1 participação com direito igual ao prêmio</p>
                <div className="text-3xl font-bold text-orange-700">Informativo</div>
                <p className="text-xs text-gray-600 mt-2">As cotas serão definidas pelos participantes ao se registrarem no bolão</p>
              </div>

              {/* Informações Importantes */}
              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <p className="text-sm font-semibold text-green-700 mb-2">📋 Regras Oficiais</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>✓ Mínimo 2 cotas, máximo 100 cotas por bolão</li>
                  <li>✓ Até 10 apostas diferentes (jogos)</li>
                  <li>✓ 6 números por jogo (padrão Mega)</li>
                  <li>✓ Cada cota tem valor igual</li>
                  <li>✓ Prêmio dividido igualmente entre cotas</li>
                </ul>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowGerador(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={gerarNovosBolao}
                  disabled={criando}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  {criando ? 'Gerando...' : `Gerar ${quantidadeJogos} Jogo${quantidadeJogos > 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Bolões */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-green-700 mb-6">Bolões Ativos</h2>
          
          {carregando ? (
            <div className="text-center py-8 text-gray-600">Carregando bolões...</div>
          ) : boloes.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>Nenhum bolão gerado ainda</p>
              <p className="text-sm mt-2">Clique em "Gerar Novo Bolão" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {boloes.map((bolao) => {
                const linkId = bolao.linkCompartilhamento.split('/').pop();
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
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{bolao.nome}</h3>
                          <p className="text-sm text-gray-600">{bolao.descricao}</p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => deletarBolao(linkId || '')}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all"
                            title="Deletar bolão"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                      
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
                          <div className="text-xs text-gray-600">Faltando</div>
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
                    
                    <div className="p-4 bg-white border-t">
                      <button
                        onClick={() => router.push(`/bolao/${linkId || ''}`)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <Eye size={18} />
                        Visualizar Bolão
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Sucesso */}
      {bolaoSucesso && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-green-700 mb-4">✅ Bolão Criado com Sucesso!</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">ID do Bolão:</p>
                <p className="font-mono text-sm font-bold text-gray-800">{bolaoSucesso.id}</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-2">Link para Compartilhar:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bolaoSucesso.link}
                    readOnly
                    className="flex-1 px-3 py-2 border border-green-300 rounded-lg text-sm font-mono bg-white"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bolaoSucesso.link);
                      alert('Link copiado!');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <button
                onClick={() => setBolaoSucesso(null)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
