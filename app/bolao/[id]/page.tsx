'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Users, Share2, Edit2, Check, X } from 'lucide-react';
import { formatPhoneNumber, normalizaPhoneNumber } from '@/lib/phone';
import { gerarBolao, historico } from '@/lib/gerador';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [mostrarGrafico, setMostrarGrafico] = useState(false);
  
  // Estados para AlertDialog
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
  }>({
    open: false,
    title: '',
    description: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    isDestructive: false,
  });

  useEffect(() => {
    // Verificar se é admin autenticado na home page
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
    
    // Se não é admin, verificar autenticação de usuário
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
    } else if (!savedToken && !adminToken) {
      setMostrarAuth(true);
    }
  }, []);

  useEffect(() => {
    if (params.id) {
      carregarBolao();
    }
  }, [params.id]);

  const carregarBolao = async () => {
    try {
      setLoading(true);
      const linkId = params.id as string;
      
      if (!linkId) {
        throw new Error('Link ID não fornecido');
      }
      
      const res = await fetch(`/api/bolao?linkId=${linkId}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Bolão não encontrado');
      }
      
      const data = await res.json();
      setBolao(data);
    } catch (error) {
      console.error('Erro ao carregar bolão:', error);
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
      setAlertDialog({
        open: true,
        title: 'Erro na Autenticação',
        description: error.message || 'Erro ao autenticar. Tente novamente.',
        confirmText: 'OK',
        cancelText: '',
      });
    }
  };

  const reservarJogo = async (jogoId: string) => {
    if (!token) {
      setMostrarAuth(true);
      return;
    }

    const jogo = bolao?.jogos.find(j => j.id === jogoId);
    if (jogo?.reservado) {
      setAlertDialog({
        open: true,
        title: 'Jogo Indisponível',
        description: 'Este jogo já foi reservado por outro participante.',
        confirmText: 'OK',
        cancelText: '',
      });
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
      setAlertDialog({
        open: true,
        title: '✅ Sucesso!',
        description: 'Jogo reservado com sucesso!',
        confirmText: 'OK',
        cancelText: '',
      });
    } catch (error: any) {
      console.error('Erro ao reservar jogo:', error);
      setAlertDialog({
        open: true,
        title: 'Erro ao Reservar',
        description: error.message || 'Erro ao reservar jogo',
        confirmText: 'OK',
        cancelText: '',
      });
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
      setAlertDialog({
        open: true,
        title: '✅ Sucesso!',
        description: 'Jogo editado com sucesso!',
        confirmText: 'OK',
        cancelText: '',
      });
    } catch (error: any) {
      console.error('Erro ao editar jogo:', error);
      setAlertDialog({
        open: true,
        title: 'Erro ao Editar',
        description: error.message || 'Erro ao editar jogo',
        confirmText: 'OK',
        cancelText: '',
      });
    }
  };

  const cancelarReserva = async (jogoId: string) => {
    if (!token) return;
    
    setAlertDialog({
      open: true,
      title: 'Cancelar Reserva',
      description: 'Deseja realmente cancelar este jogo?',
      confirmText: 'Sim, Cancelar',
      cancelText: 'Não',
      isDestructive: true,
      onConfirm: () => executarCancelamento(jogoId),
    });
  };

  const executarCancelamento = async (jogoId: string) => {
    
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
      setAlertDialog({
        open: true,
        title: '✅ Sucesso!',
        description: 'Reserva cancelada com sucesso!',
        confirmText: 'OK',
        cancelText: '',
      });
    } catch (error: any) {
      console.error('Erro ao cancelar reserva:', error);
      setAlertDialog({
        open: true,
        title: 'Erro ao Cancelar',
        description: error.message || 'Erro ao cancelar reserva',
        confirmText: 'OK',
        cancelText: '',
      });
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
      setAlertDialog({
        open: true,
        title: 'Acesso Negado',
        description: 'Senha de admin incorreta.',
        confirmText: 'OK',
        cancelText: '',
      });
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
      setAlertDialog({
        open: true,
        title: '✅ Link Copiado!',
        description: 'Link copiado para a área de transferência!',
        confirmText: 'OK',
        cancelText: '',
      });
    }
  };

  const reduzirNumerologico = (num: number): number => {
    while (num > 9) {
      num = num.toString().split('').reduce((a, b) => parseInt(a.toString()) + parseInt(b), 0);
    }
    return num;
  };

  const calcularFrequencia = () => {
    const freq: { [key: number]: number } = {};
    historico.forEach((ano) => {
      ano.numeros.forEach(num => {
        freq[num] = (freq[num] || 0) + 1;
      });
    });
    return freq;
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
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-emerald-700 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Principal */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-start gap-2 sm:gap-3 flex-1">
              <span className="text-3xl sm:text-4xl flex-shrink-0">🍀</span>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-green-700 break-words">{bolao.nome}</h1>
                <p className="text-sm sm:text-base text-gray-600 break-words">{bolao.descricao}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {isAdmin && (
                <button
                  onClick={() => {
                    const conteudo = bolao.jogos.map((jogo, idx) => {
                      const nomeJogador = jogo.usuario?.nome || 'Disponível';
                      const numeros = jogo.numeros.join(', ');
                      return `Jogo ${(idx + 1).toString().padStart(2, '0')}: ${numeros} - ${nomeJogador}`;
                    }).join('\n');
                    
                    const janela = window.open('', '', 'width=600,height=800');
                    if (janela) {
                      janela.document.write(`
                        <html>
                          <head>
                            <title>${bolao.nome}</title>
                            <style>
                              body { font-family: Arial, sans-serif; padding: 20px; }
                              h1 { text-align: center; color: #15803d; }
                              p { text-align: center; color: #666; margin-bottom: 20px; }
                              pre { font-size: 14px; line-height: 1.8; }
                            </style>
                          </head>
                          <body>
                            <h1>${bolao.nome}</h1>
                            <p>${bolao.descricao}</p>
                            <pre>${conteudo}</pre>
                          </body>
                        </html>
                      `);
                      janela.document.close();
                      janela.print();
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none justify-center"
                >
                  <span className="hidden sm:inline">🖨️</span>
                  <span className="sm:hidden">🖨️</span>
                  <span className="hidden sm:inline">Imprimir</span>
                </button>
              )}
              <button
                onClick={compartilhar}
                className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none justify-center"
              >
                <Share2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Compartilhar</span>
                <span className="sm:hidden">Compartilhar</span>
              </button>
              {usuario && (
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('usuario');
                    setUsuario(null);
                    setToken(null);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base flex-1 sm:flex-none"
                >
                  Sair
                </button>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-green-50 p-2 sm:p-3 rounded border border-green-200">
              <div className="text-green-700 font-bold text-base sm:text-lg">{bolao.jogos.length}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="bg-yellow-50 p-2 sm:p-3 rounded border border-yellow-200">
              <div className="text-yellow-700 font-bold text-base sm:text-lg">{jogosReservados}</div>
              <div className="text-xs text-gray-600">Reservados</div>
            </div>
            <div className="bg-blue-50 p-2 sm:p-3 rounded border border-blue-200">
              <div className="text-blue-700 font-bold text-base sm:text-lg">{jogosDisponiveis}</div>
              <div className="text-xs text-gray-600">Disponíveis</div>
            </div>
            {usuario && (
              <div className="bg-purple-50 p-2 sm:p-3 rounded border border-purple-200">
                <div className="text-purple-700 font-bold text-xs sm:text-sm truncate">{usuario.nome}</div>
                <div className="text-xs text-gray-600 truncate">{formatPhoneNumber(usuario.whatsapp)}</div>
              </div>
            )}
          </div>
        </div>

        {usuario && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="grid grid-cols-2 gap-0">
              <button
                onClick={() => {
                  setMostrarHistorico(!mostrarHistorico);
                  setMostrarGrafico(false);
                }}
                className={`p-4 font-semibold text-center transition-all ${
                  mostrarHistorico
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white text-green-700 border-2 border-green-200'
                }`}
              >
                📅 Histórico
              </button>
              <button
                onClick={() => {
                  setMostrarGrafico(!mostrarGrafico);
                  setMostrarHistorico(false);
                }}
                className={`p-4 font-semibold text-center transition-all ${
                  mostrarGrafico
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white text-green-700 border-2 border-green-200'
                }`}
              >
                📊 Gráfico
              </button>
            </div>

            {mostrarHistorico && (
              <div className="p-3 sm:p-6 bg-white border-t-2 border-green-100">
                <h3 className="font-bold mb-4 text-green-800 flex items-center gap-2 text-sm sm:text-base">
                  📅 Histórico Completo (2009-2024)
                </h3>
                <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                  <table className="w-full text-xs sm:text-sm min-w-full">
                    <thead>
                      <tr className="bg-green-600 text-white">
                        <th className="p-2 text-left">Ano</th>
                        <th className="p-2 text-left">Números</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historico.map((jogo, idx) => (
                        <tr key={jogo.ano} className={idx % 2 === 0 ? 'bg-green-50' : 'bg-white'}>
                          <td className="p-2 font-bold text-green-700 whitespace-nowrap">{jogo.ano}</td>
                          <td className="p-2">
                            <div className="flex gap-1 flex-wrap">
                              {jogo.numeros.map((num, i) => {
                                const ehNumeroUm = reduzirNumerologico(num) === 1;
                                return (
                                  <span
                                    key={i}
                                    className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-white font-bold text-xs shadow ${
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

            {mostrarGrafico && (
              <div className="p-3 sm:p-6 bg-white border-t-2 border-green-100">
                <h3 className="font-bold mb-4 text-green-800 flex items-center gap-2 text-sm sm:text-base">
                  📊 Top 15 Números Mais Sorteados
                </h3>
                <div className="space-y-2">
                  {Object.entries(calcularFrequencia())
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 15)
                    .map(([num, frequencia], idx) => {
                      const ehNumeroUm = reduzirNumerologico(parseInt(num)) === 1;
                      const porcentagem = ((frequencia as number) / 16) * 100;
                      
                      return (
                        <div key={num} className="bg-gray-50 rounded-lg p-2 sm:p-3">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <span className="text-xs font-bold text-green-700 w-5">{idx + 1}º</span>
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow relative shrink-0 ${
                              ehNumeroUm ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-green-600'
                            }`}>
                              {num}
                              {ehNumeroUm && <span className="absolute -top-1 -right-1 text-yellow-200 text-xs">★</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1 gap-1">
                                <span className="text-xs font-semibold text-gray-700 truncate">
                                  {frequencia}x ({porcentagem.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="bg-gray-200 h-5 sm:h-6 rounded-full overflow-hidden">
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
                        </div>
                      );
                    })}
                </div>
                
                <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
                  <h4 className="font-bold text-yellow-900 text-xs sm:text-sm mb-2">📊 Análise de Probabilidade</h4>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• <strong>Alta (5-6x):</strong> ~31-38% dos anos</li>
                    <li>• <strong>Média (3-4x):</strong> ~19-25% dos anos</li>
                    <li>• <strong>Baixa (1-2x):</strong> ~6-13% dos anos</li>
                    <li>• <strong>★ Numerológicos:</strong> Reduzem para 1</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="p-3 sm:p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-t-2 border-yellow-200">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-yellow-900 text-sm sm:text-base">
                🍀 Numerologia 2026
              </h3>
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
                <p className="text-xs sm:text-base font-semibold text-gray-800 mb-2">
                  2+0+2+6=10 → 1+0 = <span className="text-xl sm:text-3xl text-yellow-600">1</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-700 mb-3">
                  Novos começos, liderança e independência
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-1 sm:gap-2">
                  {[1, 10, 19, 28, 37, 46, 55].map(num => (
                    <div key={num} className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white font-bold rounded-lg p-2 sm:p-3 text-center text-sm sm:text-base shadow">
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          {bolao.jogos.map((jogo, idx) => {
            const meuJogo = jogo.usuario?.id === usuario?.id;
            const estaEditando = jogoEditando === jogo.id;
            
            return (
              <div
                key={jogo.id}
                className={`bg-white rounded-xl p-3 sm:p-4 shadow-lg ${
                  meuJogo ? 'border-4 border-yellow-400' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <span className="font-bold text-green-700 text-base sm:text-lg">
                    Jogo {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  {jogo.reservado && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Check size={12} />
                      Reservado
                    </span>
                  )}
                  {!jogo.reservado && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">
                      ✨ Disponível
                    </span>
                  )}
                </div>

                {estaEditando ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-1">
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

                    {!jogo.reservado && (
                      <button
                        onClick={() => reservarJogo(jogo.id)}
                        className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-all"
                      >
                        Escolher este jogo
                      </button>
                    )}

                    {meuJogo && usuario && (
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-green-700 mb-3 sm:mb-4">
              {isRegistering ? 'Cadastro' : 'Entre no Bolão'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              {isRegistering 
                ? 'Complete seu cadastro:'
                : 'Digite seu WhatsApp para entrar:'}
            </p>
            
            <form onSubmit={handleAuth} className="space-y-3 sm:space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none"
                    autoFocus
                  />
                </div>
              )}
              
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
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
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none"
                  autoFocus={!isRegistering}
                />
              </div>
              
              <div className="flex gap-2 flex-col sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarAuth(false);
                    setIsRegistering(false);
                    setNome('');
                    setWhatsApp('');
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 sm:py-3 rounded-lg font-semibold hover:bg-green-700 transition-all text-sm sm:text-base"
                >
                  {isRegistering ? 'Cadastrar' : 'Entrar'}
                </button>
              </div>

              {!isRegistering && (
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="w-full text-green-700 font-semibold hover:underline text-sm sm:text-base"
                >
                  Não tem conta? Cadastre-se
                </button>
              )}

              {isRegistering && (
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="w-full text-green-700 font-semibold hover:underline text-sm sm:text-base"
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

      {/* AlertDialog para mensagens */}
      <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog({ ...alertDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {alertDialog.cancelText && (
              <AlertDialogCancel>{alertDialog.cancelText}</AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={() => {
                if (alertDialog.onConfirm) {
                  alertDialog.onConfirm();
                }
                setAlertDialog({ ...alertDialog, open: false });
              }}
              className={alertDialog.isDestructive ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {alertDialog.confirmText || 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
