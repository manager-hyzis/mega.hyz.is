'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Users, Share2, Edit2, Check, X, Trophy, Sparkles, Printer, Lock } from 'lucide-react';
import { formatPhoneNumber, normalizaPhoneNumber } from '@/lib/phone';
import DisclaimerFooter from '@/app/components/DisclaimerFooter';

interface Usuario {
  id: string;
  nome: string;
  whatsapp: string;
}

interface Jogo {
  id: string;
  numeros: number[];
  reservado: boolean;
  editado: boolean;
  usuario?: Usuario;
}

interface Bolao {
  id: string;
  nome: string;
  descricao: string;
  linkCompartilhamento: string;
  jogos: Jogo[];
}

export default function BolaoPage() {
  const params = useParams();
  const [bolao, setBolao] = useState<Bolao | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarAuth, setMostrarAuth] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [jogoEditando, setJogoEditando] = useState<string | null>(null);
  const [numerosEditando, setNumerosEditando] = useState<number[]>([]);
  
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsApp] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [usuariosVinculados, setUsuariosVinculados] = useState<any[]>([]);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUsuario = localStorage.getItem('usuario');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (savedToken && savedUsuario && tokenExpiry) {
      const now = new Date().getTime();
      if (now < parseInt(tokenExpiry)) {
        setToken(savedToken);
        setUsuario(JSON.parse(savedUsuario));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('tokenExpiry');
        setMostrarAuth(true);
      }
    } else if (!savedToken) {
      setMostrarAuth(true);
    }
    
    carregarBolao();
  }, []);

  const carregarBolao = async () => {
    try {
      const linkId = params.id;
      const res = await fetch(`/api/bolao?linkId=${linkId}`);
      
      if (!res.ok) throw new Error('Bolão não encontrado');
      
      const data = await res.json();
      setBolao(data);
    } catch (error) {
      console.error('Erro ao carregar bolão:', error);
      alert('Erro ao carregar bolão');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Se não está registrando, primeiro verifica se o usuário existe
      if (!isRegistering) {
        const checkRes = await fetch('/api/auth/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ whatsapp })
        });
        
        const checkData = await checkRes.json();
        
        // Se usuário não existe, mostra modal de registro
        if (!checkData.exists) {
          setIsRegistering(true);
          return;
        }
      }
      
      const body = isRegistering 
        ? { nome, whatsapp }
        : { whatsapp };
      
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro na autenticação');
      }
      
      const data = await res.json();
      
      setToken(data.token);
      setUsuario(data.usuario);
      
      const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      localStorage.setItem('tokenExpiry', expiryTime.toString());
      
      setMostrarAuth(false);
      setNome('');
      setWhatsApp('');
      setIsRegistering(false);
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      alert(error.message || 'Erro ao autenticar. Tente novamente.');
    }
  };

  const reservarJogo = async (jogoId: string) => {
    if (!token) {
      setMostrarAuth(true);
      return;
    }

    const jogo = bolao?.jogos.find(j => j.id === jogoId);
    if (jogo?.reservado) {
      alert('Este jogo já foi reservado por outro participante');
      return;
    }
    
    try {
      const res = await fetch('/api/jogos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ jogoId })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      
      await carregarBolao();
      alert('Jogo reservado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao reservar jogo:', error);
      alert(error.message || 'Erro ao reservar jogo');
    }
  };

  const iniciarEdicao = (jogo: Jogo) => {
    setJogoEditando(jogo.id);
    setNumerosEditando([...jogo.numeros]);
  };

  const toggleNumero = (num: number) => {
    const index = numerosEditando.indexOf(num);
    if (index > -1) {
      setNumerosEditando(numerosEditando.filter(n => n !== num));
    } else if (numerosEditando.length < 6) {
      setNumerosEditando([...numerosEditando, num]);
    }
  };

  const salvarEdicao = async () => {
    if (!token || !jogoEditando) return;
    
    try {
      const res = await fetch('/api/jogos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          jogoId: jogoEditando,
          numeros: numerosEditando
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      
      await carregarBolao();
      setJogoEditando(null);
      setNumerosEditando([]);
      alert('Jogo editado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao editar jogo:', error);
      alert(error.message || 'Erro ao editar jogo');
    }
  };

  const cancelarReserva = async (jogoId: string) => {
    if (!token) return;
    
    if (!confirm('Deseja realmente cancelar este jogo?')) return;
    
    try {
      const res = await fetch(`/api/jogos?jogoId=${jogoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      
      await carregarBolao();
      alert('Reserva cancelada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao cancelar reserva:', error);
      alert(error.message || 'Erro ao cancelar reserva');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminSecret = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    if (adminPassword === adminSecret) {
      setIsAdmin(true);
      setAdminPassword('');
      carregarUsuariosVinculados();
    } else {
      alert('Senha de admin incorreta');
    }
  };

  const carregarUsuariosVinculados = async () => {
    if (!bolao) return;
    
    try {
      const res = await fetch(`/api/bolao/usuarios?bolaoId=${bolao.id}`);
      if (!res.ok) throw new Error('Erro ao carregar usuários');
      
      const data = await res.json();
      setUsuariosVinculados(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const imprimirUsuarios = () => {
    const conteudo = `
      <html>
        <head>
          <title>${bolao?.nome} - Lista de Participantes</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #15803d; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #15803d; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>${bolao?.nome}</h1>
          <p>${bolao?.descricao}</p>
          <h2>Lista de Participantes</h2>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>WhatsApp</th>
                <th>Jogo</th>
                <th>Números</th>
                <th>Editado</th>
              </tr>
            </thead>
            <tbody>
              ${usuariosVinculados.map((j, idx) => `
                <tr>
                  <td>${j.usuario?.nome || '-'}</td>
                  <td>${j.usuario?.whatsapp ? formatPhoneNumber(j.usuario.whatsapp) : '-'}</td>
                  <td>Jogo ${(idx + 1).toString().padStart(2, '0')}</td>
                  <td>${j.numeros?.join(', ') || '-'}</td>
                  <td>${j.editado ? 'Sim' : 'Não'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const janela = window.open('', '', 'width=800,height=600');
    if (janela) {
      janela.document.write(conteudo);
      janela.document.close();
      janela.print();
    }
  };

  const compartilhar = () => {
    if (!bolao) return;
    
    const texto = `🎰 *${bolao.nome}*\n\n${bolao.descricao}\n\nEntre e escolha seu jogo: ${bolao.linkCompartilhamento}`;
    
    if (navigator.share) {
      navigator.share({
        title: bolao.nome,
        text: texto,
        url: bolao.linkCompartilhamento
      });
    } else {
      navigator.clipboard.writeText(bolao.linkCompartilhamento);
      alert('Link copiado para a área de transferência!');
    }
  };

  const reduzirNumerologico = (num: number): number => {
    while (num > 9) {
      num = num.toString().split('').reduce((a, b) => parseInt(a.toString()) + parseInt(b), 0);
    }
    return num;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!bolao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Bolão não encontrado</h1>
          <p className="text-gray-600">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  const jogosDisponiveis = bolao.jogos.filter(j => !j.reservado).length;
  const jogosReservados = bolao.jogos.filter(j => j.reservado).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-emerald-700">
      <div className="bg-green-700 shadow-lg">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-400" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-white">{bolao.nome}</h1>
                <p className="text-green-100 text-sm">{bolao.descricao}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {!isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
                >
                  <Lock size={18} />
                  Admin
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsAdmin(false);
                    setShowAdminPanel(false);
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-all"
                >
                  Sair Admin
                </button>
              )}
              <button
                onClick={compartilhar}
                className="bg-white text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-all flex items-center gap-2"
              >
                <Share2 size={18} />
                Compartilhar
              </button>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{bolao.jogos.length}</div>
              <div className="text-green-100 text-sm">Total de Jogos</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{jogosReservados}</div>
              <div className="text-green-100 text-sm">Reservados</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">{jogosDisponiveis}</div>
              <div className="text-green-100 text-sm">Disponíveis</div>
            </div>
          </div>
        </div>
      </div>

      {usuario && (
        <div className="bg-green-600 border-b border-green-500">
          <div className="max-w-6xl mx-auto p-3">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-2">
                  <Users size={16} />
                </div>
                <div>
                  <span className="font-semibold">{usuario.nome}</span>
                  <span className="text-green-100 text-sm ml-2">• {formatPhoneNumber(usuario.whatsapp)}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('usuario');
                  setUsuario(null);
                  setToken(null);
                }}
                className="text-sm hover:underline"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {bolao.jogos.map((jogo, idx) => {
            const meuJogo = jogo.usuario?.id === usuario?.id;
            const estaEditando = jogoEditando === jogo.id;
            
            return (
              <div
                key={jogo.id}
                className={`bg-white rounded-xl p-4 shadow-lg ${
                  meuJogo ? 'border-4 border-yellow-400' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-green-700 text-lg">
                    Jogo {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  {jogo.reservado && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Check size={12} />
                      Reservado
                    </span>
                  )}
                  {!jogo.reservado && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Sparkles size={12} />
                      Disponível
                    </span>
                  )}
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
                            className={`aspect-square rounded text-xs font-bold transition-all ${
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setJogoEditando(null);
                          setNumerosEditando([]);
                        }}
                        className="flex-1 bg-gray-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-all flex items-center justify-center gap-1"
                      >
                        <X size={16} />
                        Cancelar
                      </button>
                      <button
                        onClick={salvarEdicao}
                        disabled={numerosEditando.length !== 6}
                        className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 ${
                          numerosEditando.length === 6
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Check size={16} />
                        Salvar ({numerosEditando.length}/6)
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {jogo.numeros.map((num, i) => {
                        const ehNumeroUm = reduzirNumerologico(num) === 1;
                        return (
                          <div
                            key={i}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md relative ${
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

                    {jogo.usuario && (
                      <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600">Reservado por:</div>
                        <div className="font-semibold text-gray-800">{jogo.usuario.nome}</div>
                        {jogo.editado && (
                          <div className="text-xs text-blue-600 mt-1">✏️ Números editados</div>
                        )}
                      </div>
                    )}

                    {!isAdmin && !jogo.reservado && (
                      <button
                        onClick={() => reservarJogo(jogo.id)}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all"
                      >
                        Escolher este jogo
                      </button>
                    )}

                    {meuJogo && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => iniciarEdicao(jogo)}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-1"
                        >
                          <Edit2 size={16} />
                          Editar
                        </button>
                        <button
                          onClick={() => cancelarReserva(jogo.id)}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-1"
                        >
                          <X size={16} />
                          Cancelar
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {mostrarAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-green-700 mb-4">
              {isRegistering ? 'Cadastro' : 'Entre no Bolão'}
            </h2>
            <p className="text-gray-600 mb-4">
              {isRegistering 
                ? 'Complete seu cadastro:'
                : 'Digite seu WhatsApp para entrar:'}
            </p>
            
            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none"
                    autoFocus
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    let formatted = '';
                    
                    if (cleaned.length <= 2) {
                      formatted = cleaned;
                    } else if (cleaned.length <= 7) {
                      formatted = cleaned.replace(/(\d{2})(\d{0,5})/, '($1) $2');
                    } else {
                      formatted = cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                    }
                    
                    setWhatsApp(formatted);
                  }}
                  placeholder="(12) 98765-4321"
                  required
                  maxLength={15}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none"
                  autoFocus={!isRegistering}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarAuth(false);
                    setIsRegistering(false);
                    setNome('');
                    setWhatsApp('');
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all"
                >
                  {isRegistering ? 'Cadastrar' : 'Entrar'}
                </button>
              </div>

              {!isRegistering && (
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="w-full text-green-700 font-semibold hover:underline"
                >
                  Não tem conta? Cadastre-se
                </button>
              )}

              {isRegistering && (
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="w-full text-green-700 font-semibold hover:underline"
                >
                  Já tem conta? Entre
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal de Autenticação Admin */}
      {showAdminPanel && !isAdmin && (
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
                  onClick={() => setShowAdminPanel(false)}
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

      {/* Painel Admin */}
      {isAdmin && (
        <div className="max-w-6xl mx-auto p-4 mt-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-green-700 text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users size={24} />
                  Painel Admin - Participantes
                </h2>
                <button
                  onClick={imprimirUsuarios}
                  className="bg-white text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-all flex items-center gap-2"
                >
                  <Printer size={18} />
                  Imprimir
                </button>
              </div>
            </div>

            <div className="p-6">
              {usuariosVinculados.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nenhum participante vinculado ainda</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">WhatsApp</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Jogo</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Números</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Editado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosVinculados.map((jogo, idx) => (
                        <tr key={jogo.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-800 font-semibold">{jogo.usuario?.nome || '-'}</td>
                          <td className="py-3 px-4 text-gray-600">{jogo.usuario?.whatsapp ? formatPhoneNumber(jogo.usuario.whatsapp) : '-'}</td>
                          <td className="py-3 px-4 text-gray-600">Jogo {(idx + 1).toString().padStart(2, '0')}</td>
                          <td className="py-3 px-4 text-gray-600">{jogo.numeros?.join(', ') || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${jogo.editado ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                              {jogo.editado ? 'Sim' : 'Não'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <DisclaimerFooter />
    </div>
  );
}
