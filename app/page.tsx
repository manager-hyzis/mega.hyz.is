'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Users, Sparkles, TrendingUp, Hash, Share2, RefreshCw, Calendar, Target, BarChart3, Edit2, Printer, Save, X, Lock } from 'lucide-react';
import { gerarBolao, historico } from '@/lib/gerador';
import DisclaimerFooter from '@/app/components/DisclaimerFooter';

export default function HomePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const [jogos, setJogos] = useState<number[][]>([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [mostrarGrafico, setMostrarGrafico] = useState(false);
  const [jogoEditando, setJogoEditando] = useState<number | null>(null);
  const [numerosEditando, setNumerosEditando] = useState<number[]>([]);
  
  const [nome, setNome] = useState('Mega da Virada 2026');
  const [descricao, setDescricao] = useState('Bolão colaborativo - Boa sorte! 🍀');
  const [quantidadeJogos, setQuantidadeJogos] = useState(15);
  const [criando, setCriando] = useState(false);

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
    } else {
      alert('Senha de admin incorreta');
    }
  };

  const reduzirNumerologico = (num: number): number => {
    while (num > 9) {
      num = num.toString().split('').reduce((a, b) => parseInt(a.toString()) + parseInt(b), 0);
    }
    return num;
  };

  const calcularFrequencia = () => {
    const freq: Record<number, number> = {};
    const anosAparecimento: Record<number, number[]> = {};
    
    historico.forEach(jogo => {
      jogo.numeros.forEach(num => {
        freq[num] = (freq[num] || 0) + 1;
        if (!anosAparecimento[num]) {
          anosAparecimento[num] = [];
        }
        anosAparecimento[num].push(jogo.ano);
      });
    });
    
    return { freq, anosAparecimento };
  };

  const gerarNovosBolao = () => {
    const novosJogos = gerarBolao(quantidadeJogos);
    setJogos(novosJogos);
  };

  const iniciarEdicao = (index: number) => {
    setJogoEditando(index);
    setNumerosEditando([...jogos[index]]);
  };

  const toggleNumero = (num: number) => {
    const index = numerosEditando.indexOf(num);
    if (index > -1) {
      setNumerosEditando(numerosEditando.filter(n => n !== num));
    } else if (numerosEditando.length < 6) {
      setNumerosEditando([...numerosEditando, num]);
    }
  };

  const salvarEdicao = () => {
    if (numerosEditando.length === 6 && jogoEditando !== null) {
      const novosJogos = [...jogos];
      novosJogos[jogoEditando] = [...numerosEditando].sort((a, b) => a - b);
      setJogos(novosJogos);
      setJogoEditando(null);
      setNumerosEditando([]);
    }
  };

  const criarBolao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Apenas admin pode criar bolões');
      return;
    }
    
    setCriando(true);
    
    try {
      const grupoId = new Date().getTime().toString();
      
      const res = await fetch('/api/bolao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          descricao,
          jogosGerados: jogos,
          grupoId
        })
      });
      
      if (!res.ok) throw new Error('Erro ao criar bolão');
      
      const bolao = await res.json();
      
      alert(`✅ Bolão criado com sucesso!\n\nGrupo ID: ${grupoId}\n\nVocê pode gerar mais bolões com o mesmo grupo ou compartilhar o link.`);
      
      setNome('Mega da Virada 2026');
      setDescricao('Bolão colaborativo - Boa sorte! 🍀');
      setJogos([]);
      
    } catch (error) {
      console.error('Erro ao criar bolão:', error);
      alert('Erro ao criar bolão. Tente novamente.');
    } finally {
      setCriando(false);
    }
  };

  const { freq, anosAparecimento } = calcularFrequencia();
  const maisSorteados = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-emerald-700 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={28} className="animate-pulse" />
                <h1 className="text-2xl sm:text-3xl font-bold">Mega da Virada 2026</h1>
              </div>
              {!isAdmin && (
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 transition-all"
                >
                  <Lock size={16} />
                  Admin
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setIsAdmin(false)}
                  className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  Sair
                </button>
              )}
            </div>
            <p className="text-green-100 text-xs sm:text-sm">Análise Completa + Gerador de Bolão</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs bg-white/20 rounded-lg px-2 py-1">📊 2009-2024</span>
              <span className="text-xs bg-white/30 rounded-lg px-2 py-1 font-semibold">🔢 Numerologia 1</span>
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

          {/* Botões de Navegação */}
          <div className="p-4 bg-green-50 flex gap-2 overflow-x-auto">
            <button
              onClick={() => {
                setMostrarHistorico(!mostrarHistorico);
                setMostrarGrafico(false);
              }}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                mostrarHistorico
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-green-700 border-2 border-green-200'
              }`}
            >
              <Calendar size={16} className="inline mr-1" />
              Histórico
            </button>
            <button
              onClick={() => {
                setMostrarGrafico(!mostrarGrafico);
                setMostrarHistorico(false);
              }}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                mostrarGrafico
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-green-700 border-2 border-green-200'
              }`}
            >
              <BarChart3 size={16} className="inline mr-1" />
              Gráfico
            </button>
          </div>

          {/* Tabela Histórico */}
          {mostrarHistorico && (
            <div className="p-4 sm:p-6 bg-white border-t-2 border-green-100">
              <h3 className="font-bold mb-4 text-green-800 flex items-center gap-2">
                <Calendar size={20} />
                Histórico Completo (2009-2024)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-green-600 text-white">
                      <th className="p-2 text-left">Ano</th>
                      <th className="p-2 text-left">Números Sorteados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((jogo, idx) => (
                      <tr key={jogo.ano} className={idx % 2 === 0 ? 'bg-green-50' : 'bg-white'}>
                        <td className="p-2 font-bold text-green-700">{jogo.ano}</td>
                        <td className="p-2">
                          <div className="flex gap-1 flex-wrap">
                            {jogo.numeros.map((num, i) => {
                              const ehNumeroUm = reduzirNumerologico(num) === 1;
                              return (
                                <span
                                  key={i}
                                  className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white font-bold text-xs ${
                                    ehNumeroUm
                                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                                      : 'bg-green-600'
                                  }`}
                                >
                                  {num.toString().padStart(2, '0')}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Gráfico de Frequência */}
          {mostrarGrafico && (
            <div className="p-4 sm:p-6 bg-white border-t-2 border-green-100">
              <h3 className="font-bold mb-4 text-green-800 flex items-center gap-2">
                <BarChart3 size={20} />
                Top 15 Números Mais Sorteados
              </h3>
              <div className="space-y-2">
                {maisSorteados.map(([num, frequencia], idx) => {
                  const ehNumeroUm = reduzirNumerologico(parseInt(num)) === 1;
                  const anos = anosAparecimento[parseInt(num)] || [];
                  const porcentagem = (frequencia / 16) * 100;
                  
                  return (
                    <div key={num} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-green-700 w-6">{idx + 1}º</span>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow relative ${
                          ehNumeroUm ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-green-600'
                        }`}>
                          {num}
                          {ehNumeroUm && <span className="absolute -top-1 -right-1 text-yellow-200 text-xs">🍀</span>}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-gray-700">
                              {frequencia}x sorteado ({porcentagem.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="bg-gray-200 h-6 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-green-600 h-full flex items-center justify-center transition-all"
                              style={{ width: `${porcentagem}%` }}
                            >
                              {porcentagem > 20 && (
                                <span className="text-xs text-white font-bold">{frequencia}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-16 text-xs text-gray-600">
                        <span className="font-semibold">Anos: </span>
                        {anos.sort((a, b) => b - a).join(', ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botão Gerar Bolão */}
          {isAdmin && (
            <div className="p-4 sm:p-6 bg-green-50">
              <button
                onClick={gerarNovosBolao}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw size={24} />
                <span>Gerar Bolão Completo ({quantidadeJogos} Jogos)</span>
              </button>
              <p className="text-center text-xs sm:text-sm text-gray-600 mt-2">
                Baseado em numerologia 2026 + análise histórica completa
              </p>
            </div>
          )}

          {/* Jogos do Bolão */}
          {jogos.length > 0 && isAdmin && (
            <div className="p-4 sm:p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2 text-green-800">
                  <Target size={20} />
                  <span>Seu Bolão</span>
                </h3>
                <span className="text-xs sm:text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                  {jogos.length} jogos
                </span>
              </div>
              
              <div className="space-y-3">
                {jogos.map((jogo, idx) => {
                  const pares = jogo.filter(n => n % 2 === 0).length;
                  const impares = 6 - pares;
                  const numerosUm = jogo.filter(n => reduzirNumerologico(n) === 1).length;
                  const estaEditando = jogoEditando === idx;
                  
                  return (
                    <div key={idx} className="bg-white p-3 sm:p-4 rounded-lg shadow-md border-2 border-green-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-green-700 text-sm sm:text-base">
                          Jogo {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="flex gap-2 items-center">
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-semibold text-xs">
                            {numerosUm}★
                          </span>
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {pares}P/{impares}I
                          </span>
                          {!estaEditando && (
                            <button
                              onClick={() => iniciarEdicao(idx)}
                              className="bg-blue-500 text-white p-1.5 rounded hover:bg-blue-600 transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {estaEditando ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-10 gap-1">
                            {Array.from({ length: 60 }, (_, i) => i + 1).map(num => {
                              const selecionado = numerosEditando.includes(num);
                              const ehNumeroUm = reduzirNumerologico(num) === 1;
                              return (
                                <button
                                  key={num}
                                  onClick={() => toggleNumero(num)}
                                  className={`w-full aspect-square rounded-lg text-xs font-bold transition-all ${
                                    selecionado
                                      ? ehNumeroUm
                                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-md'
                                        : 'bg-gradient-to-br from-green-600 to-green-700 text-white shadow-md'
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  {num}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setJogoEditando(null);
                                setNumerosEditando([]);
                              }}
                              className="bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-600 transition-all flex items-center gap-1"
                            >
                              <X size={16} />
                              Cancelar
                            </button>
                            <button
                              onClick={salvarEdicao}
                              disabled={numerosEditando.length !== 6}
                              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-1 ${
                                numerosEditando.length === 6
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              <Save size={16} />
                              Salvar ({numerosEditando.length}/6)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                          {jogo.map((num, i) => {
                            const ehNumeroUm = reduzirNumerologico(num) === 1;
                            return (
                              <div
                                key={i}
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md relative ${
                                  ehNumeroUm
                                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                                    : 'bg-gradient-to-br from-green-600 to-green-700'
                                }`}
                              >
                                {num.toString().padStart(2, '0')}
                                {ehNumeroUm && (
                                  <span className="absolute -top-0.5 -right-0.5 text-yellow-200 text-xs">🍀</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Resumo do Bolão */}
              <div className="mt-6 bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl">
                <h4 className="font-bold mb-3 text-center text-sm sm:text-base">📋 Resumo do Bolão</h4>
                <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                  <div className="bg-white/20 rounded-lg p-2 text-center">
                    <div className="font-bold text-lg sm:text-xl">{jogos.length}</div>
                    <div className="text-green-100">Jogos</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2 text-center">
                    <div className="font-bold text-lg sm:text-xl">
                      {jogos.reduce((acc, j) => acc + j.filter(n => reduzirNumerologico(n) === 1).length, 0)}
                    </div>
                    <div className="text-green-100">Números ★</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2 text-center">
                    <div className="font-bold text-lg sm:text-xl">60</div>
                    <div className="text-green-100">Números</div>
                  </div>
                </div>
              </div>

              {/* Criar Bolão */}
              <form onSubmit={criarBolao} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Bolão</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Mega da Virada 2026"
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Bolão dos amigos - Boa sorte!"
                    rows={2}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={criando}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50"
                >
                  {criando ? 'Criando...' : 'Criar e Compartilhar Bolão'}
                </button>
              </form>
            </div>
          )}

          {/* Numerologia */}
          <div className="p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-yellow-900 text-sm sm:text-base">
              <Hash size={18} />
              Numerologia 2026
            </h3>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
              <p className="text-sm sm:text-base font-semibold text-gray-800 mb-2">
                2 + 0 + 2 + 6 = 10 → 1 + 0 = <span className="text-2xl sm:text-3xl text-yellow-600">1</span>
              </p>
              <p className="text-xs sm:text-sm text-gray-700 mb-3">
                Novos começos, liderança e independência
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
                {[1, 10, 19, 28, 37, 46, 55].map(num => (
                  <div key={num} className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold rounded-lg p-2 sm:p-3 text-center text-sm sm:text-base shadow">
                    {num}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DisclaimerFooter />
    </div>
  );
}