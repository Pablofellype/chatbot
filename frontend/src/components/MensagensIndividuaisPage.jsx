import { useState, useEffect } from 'react';
import { mensagemIndividualService, numeroService, conexaoService } from '../services/api';
import MediaUploader from './MediaUploader';

const formVazio = { nome: '', mensagem: '', tipo: 'texto', mediaUrl: '', frequencia: 'uma_vez', diasSemana: '', horario: '', numeroId: '', conexaoId: '' };
const diasSemanaOpts = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getMediaSrc = (url) => {
  if (!url) return '';
  let cleanUrl = url.replace(/\\/g, '/');
  if (!cleanUrl.startsWith('/') && !cleanUrl.startsWith('http')) {
    cleanUrl = '/' + cleanUrl;
  }
  if (cleanUrl.startsWith('/uploads/')) {
    if (API_URL === '/api') return cleanUrl;
    const baseUrl = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
    return `${baseUrl}${cleanUrl}`;
  }
  return url;
};

function formatarNumero(num) {
  if (!num) return '';
  const d = num.replace(/\D/g, '');
  if (d.length === 13) return `+${d.slice(0,2)} ${d.slice(2,4)} ${d.slice(4,9)}-${d.slice(9)}`;
  if (d.length === 12) return `+${d.slice(0,2)} ${d.slice(2,4)} ${d.slice(4,8)}-${d.slice(8)}`;
  if (d.length === 11) return `+55 ${d.slice(0,2)} ${d.slice(2,7)}-${d.slice(7)}`;
  return `+${d}`;
}

export default function MensagensIndividuaisPage() {
  const [mensagens, setMensagens] = useState([]);
  const [numeros, setNumeros] = useState([]);
  const [conexoes, setConexoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(formVazio);
  const [editandoId, setEditandoId] = useState(null);

  const [agora, setAgora] = useState(Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const carregarConexoes = async () => {
    try {
      const { data } = await conexaoService.listar();
      setConexoes(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const interval = setInterval(carregarConexoes, 10000);
    return () => clearInterval(interval);
  }, []);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm', // 'confirm' or 'alert'
    onConfirm: null
  });

  const mostrarAlerta = (titulo, mensagem) => {
    setConfirmModal({
      isOpen: true,
      title: titulo,
      message: mensagem,
      type: 'alert',
      onConfirm: null
    });
  };

  const mostrarConfirmacao = (titulo, mensagem, aoConfirmar) => {
    setConfirmModal({
      isOpen: true,
      title: titulo,
      message: mensagem,
      type: 'confirm',
      onConfirm: aoConfirmar
    });
  };

  // Navegação: setor → conexão
  const [selectedSetor, setSelectedSetor] = useState(null);
  const [selectedConexao, setSelectedConexao] = useState(null);

  // Cache para conexões que já foram desbloqueadas nesta sessão
  const [desbloqueadas, setDesbloqueadas] = useState(() => {
    try {
      const cached = sessionStorage.getItem('conexoes_desbloqueadas');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Estados de senha e contatos ao vivo do WhatsApp
  const [senhaPrompt, setSenhaPrompt] = useState(null);
  const [senhaInput, setSenhaInput] = useState('');
  const [senhaErro, setSenhaErro] = useState('');
  const [contatosWhatsApp, setContatosWhatsApp] = useState([]);
  const [loadingContatos, setLoadingContatos] = useState(false);
  const [digitarManualmente, setDigitarManualmente] = useState(false);
  const [numeroManual, setNumeroManual] = useState('');
  const [nomeManual, setNomeManual] = useState('');
  const [buscaContato, setBuscaContato] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fotosContatos, setFotosContatos] = useState({});
  const [contatosExpandidos, setContatosExpandidos] = useState({});

  useEffect(() => {
    if (contatosWhatsApp.length > 0 && selectedConexao) {
      const fetchPhotos = async () => {
        // Busca as fotos dos primeiros 50 contatos de forma assíncrona
        const contatosParaBuscar = contatosWhatsApp.slice(0, 50);
        for (const c of contatosParaBuscar) {
          try {
            if (fotosContatos[c.numero]) continue;
            const res = await conexaoService.fotoContato(selectedConexao.id, c.numero);
            if (res.data?.fotoUrl) {
              setFotosContatos(prev => ({ ...prev, [c.numero]: res.data.fotoUrl }));
            }
          } catch (e) {
            // ignore error
          }
        }
      };
      fetchPhotos();
    }
  }, [contatosWhatsApp, selectedConexao]);


  const carregar = async () => {
    try {
      const [m, n, c] = await Promise.all([
        mensagemIndividualService.listar(),
        numeroService.listar(),
        conexaoService.listar(),
      ]);
      setMensagens(m.data);
      setNumeros(n.data.filter(x => x.ativo));
      setConexoes(c.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const carregarContatosWhatsApp = async (conexaoId) => {
    setLoadingContatos(true);
    try {
      const { data } = await conexaoService.contatos(conexaoId);
      setContatosWhatsApp(data);
      if (!data || data.length === 0) {
        mostrarAlerta('Aviso de Contatos', 'Nenhum contato ativo foi encontrado no WhatsApp conectado. Você pode usar a opção de digitar o número manualmente.');
      }
    } catch (e) {
      console.error('Erro ao carregar contatos do WhatsApp:', e);
      setContatosWhatsApp([]);
      mostrarAlerta('Instabilidade no WhatsApp', 'Não foi possível carregar a lista de contatos do seu celular. Você ainda pode digitar o número de telefone manualmente ou usar os contatos já registrados no painel.');
    } finally {
      setLoadingContatos(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (selectedConexao) {
      carregarContatosWhatsApp(selectedConexao.id);
    } else {
      setContatosWhatsApp([]);
    }
  }, [selectedConexao]);

  // Agrupar conexões por setor (nome)
  const setores = {};
  for (const c of conexoes) {
    if (!setores[c.nome]) setores[c.nome] = [];
    setores[c.nome].push(c);
  }

  // Mensagens da conexão selecionada
  const msgsDaConexao = selectedConexao
    ? mensagens.filter(m => m.conexaoId === selectedConexao.id)
    : [];

  useEffect(() => {
    if (msgsDaConexao.length > 0 && selectedConexao) {
      const fetchScheduledContactPhotos = async () => {
        const uniqueNums = [...new Set(msgsDaConexao.map(m => m.numero?.numero).filter(Boolean))];
        for (const num of uniqueNums) {
          if (fotosContatos[num]) continue;
          try {
            const res = await conexaoService.fotoContato(selectedConexao.id, num);
            if (res.data?.fotoUrl) {
              setFotosContatos(prev => ({ ...prev, [num]: res.data.fotoUrl }));
            }
          } catch (e) {
            // ignore error
          }
        }
      };
      fetchScheduledContactPhotos();
    }
  }, [msgsDaConexao, selectedConexao]);

  const handleSelecionarConexao = (conexao) => {
    if (conexao.senha && !desbloqueadas.includes(conexao.id)) {
      setSenhaPrompt(conexao);
      setSenhaInput('');
      setSenhaErro('');
    } else {
      setSelectedConexao(conexao);
    }
  };

  const handleConfirmarSenha = async (e) => {
    e.preventDefault();
    setSenhaErro('');
    try {
      await conexaoService.verificarSenha(senhaPrompt.id, senhaInput);
      
      const novas = [...desbloqueadas, senhaPrompt.id];
      setDesbloqueadas(novas);
      sessionStorage.setItem('conexoes_desbloqueadas', JSON.stringify(novas));
      
      setSelectedConexao(senhaPrompt);
      setSenhaPrompt(null);
      setSenhaInput('');
    } catch (error) {
      setSenhaErro(error.response?.data?.erro || 'Senha incorreta');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.mensagem || !form.horario) return;
    if (!digitarManualmente && !form.numeroId) return;

    let targetNumeroId = form.numeroId;

    if (digitarManualmente) {
      if (!numeroManual) {
        mostrarAlerta('Campos Obrigatórios', 'Por favor, informe o número de telefone.');
        return;
      }
      try {
        const { data: novoNum } = await numeroService.criar({ 
          numero: numeroManual, 
          nome: nomeManual || 'Contato Manual',
        });
        
        // Associa o novo número à conexão correspondente no banco de dados
        await numeroService.atualizar(novoNum.id, { conexaoId: selectedConexao.id });
        
        targetNumeroId = String(novoNum.id);
        // Atualiza a lista localmente
        await carregar();
      } catch (err) {
        mostrarAlerta('Erro', err.response?.data?.erro || 'Erro ao registrar número manual');
        return;
      }
    } else if (String(targetNumeroId).startsWith('wa-')) {
      const payloadStr = targetNumeroId.replace('wa-', '');
      const [numero, nome] = payloadStr.split('|');
      try {
        const { data: novoNum } = await numeroService.criar({ 
          numero, 
          nome: nome || 'Contato WhatsApp',
        });
        
        // Associa o novo número à conexão correspondente no banco de dados
        await numeroService.atualizar(novoNum.id, { conexaoId: selectedConexao.id });
        
        targetNumeroId = String(novoNum.id);
        // Atualiza a lista de números autorizados localmente
        await carregar();
      } catch (err) {
        mostrarAlerta('Erro', err.response?.data?.erro || 'Erro ao registrar contato no banco');
        return;
      }
    }

    const dados = {
      ...form,
      numeroId: targetNumeroId,
      conexaoId: String(selectedConexao.id),
      diasSemana: form.frequencia === 'semanal' ? form.diasSemana : null,
      mediaUrl: form.mediaUrl || null,
    };
    try {
      if (editandoId) await mensagemIndividualService.atualizar(editandoId, dados);
      else await mensagemIndividualService.criar(dados);
      setForm(formVazio); setEditandoId(null); setMostrarForm(false);
      setDigitarManualmente(false); setNumeroManual(''); setNomeManual(''); setBuscaContato('');
      carregar();
    } catch (error) { mostrarAlerta('Erro', error.response?.data?.erro || 'Erro'); }
  };

  const handleEditar = (msg) => {
    setForm({
      nome: msg.nome, mensagem: msg.mensagem, tipo: msg.tipo,
      mediaUrl: msg.mediaUrl || '', frequencia: msg.frequencia,
      diasSemana: msg.diasSemana || '', horario: msg.horario,
      numeroId: String(msg.numeroId), conexaoId: String(msg.conexaoId),
    });
    setEditandoId(msg.id);
    setDigitarManualmente(false); setNumeroManual(''); setNomeManual('');
    setMostrarForm(true);
  };

  const handleDeletar = (id) => {
    mostrarConfirmacao('Remover Agendamento', 'Tem certeza que deseja remover este agendamento permanentemente?', async () => {
      try {
        await mensagemIndividualService.deletar(id);
        carregar();
      } catch (error) {
        console.error(error);
        mostrarAlerta('Erro', 'Erro ao remover agendamento.');
      }
    });
  };

  const handleEnviar = async (id) => {
    try {
      await mensagemIndividualService.enviar(id);
      carregar();
    } catch (e) {
      mostrarAlerta('Erro ao Enviar', 'Erro: ' + (e.response?.data?.erro || e.message));
    }
  };

  const handleToggle = async (msg) => {
    await mensagemIndividualService.atualizar(msg.id, { ativo: !msg.ativo }); carregar();
  };

  const handleNovaMensagemParaContato = (grupo) => {
    setForm({
      ...formVazio,
      conexaoId: String(selectedConexao.id),
      numeroId: String(grupo.numeroId)
    });
    setEditandoId(null);
    setMostrarForm(true);
    setDigitarManualmente(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelar = () => { 
    setForm(formVazio); 
    setEditandoId(null); 
    setMostrarForm(false); 
    setDigitarManualmente(false); 
    setNumeroManual(''); 
    setNomeManual('');
    setBuscaContato('');
  };

  if (loading) return <div className="text-center py-20 text-[var(--text-muted)]">Carregando...</div>;

  // ========== NÍVEL 3: Mensagens de uma conexão ==========
  if (selectedConexao) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setSelectedConexao(null); setMostrarForm(false); setEditandoId(null); }} className="btn btn-ghost btn-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <div>
            <h2 className="text-xl font-display text-[var(--text-primary)]">
              {selectedConexao.apelido || selectedConexao.nome}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {selectedConexao.nome} — {selectedConexao.status?.info?.wid?.user || 'Numero'} — {selectedConexao.status?.connected ? 'Online' : 'Offline'}
            </p>
          </div>
          <div className="ml-auto">
            <button onClick={() => { setForm({ ...formVazio, conexaoId: String(selectedConexao.id) }); setEditandoId(null); setMostrarForm(!mostrarForm); }}
              className="btn btn-primary btn-lg">
              + Nova Mensagem
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <p className="stat-value">{msgsDaConexao.length}</p>
            <p className="stat-label">Total</p>
          </div>
          <div className="stat-card">
            <p className="stat-value text-emerald-600">{msgsDaConexao.filter(m => m.ativo).length}</p>
            <p className="stat-label">Ativos</p>
          </div>
          <div className="stat-card">
            <p className="stat-value text-blue-500">{new Set(msgsDaConexao.map(m => m.numeroId)).size}</p>
            <p className="stat-label">Contatos</p>
          </div>
        </div>

        {/* Form */}
        {mostrarForm && (
          <form onSubmit={handleSubmit} className="card p-6 mb-6 animate-fadeIn">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{editandoId ? 'Editar' : 'Nova'} Mensagem</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Para quem enviar {loadingContatos ? ' (carregando contatos...)' : ''} *</label>
                
                {digitarManualmente ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input 
                        value={numeroManual} 
                        onChange={(e) => setNumeroManual(e.target.value)} 
                        placeholder="Número (Ex: 5561999999999)" 
                        className="input flex-1" 
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => { setDigitarManualmente(false); setForm({ ...form, numeroId: '' }); }}
                        className="btn border border-[var(--border)] hover:bg-[var(--surface-sunken)] py-2 px-3 text-xs"
                      >
                        Lista
                      </button>
                    </div>
                    <input 
                      value={nomeManual} 
                      onChange={(e) => setNomeManual(e.target.value)} 
                      placeholder="Nome do Contato (opcional)" 
                      className="input w-full text-xs" 
                    />
                  </div>
                ) : (
                  <div className="relative">
                    {/* Backdrop para fechar o dropdown ao clicar fora */}
                    {dropdownOpen && (
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    )}
                    
                    {/* Botão Seletor Principal */}
                    <div 
                      onClick={() => {
                        if (loadingContatos) return;
                        setDropdownOpen(!dropdownOpen);
                      }} 
                      className={`input flex items-center justify-between transition-colors min-h-[46px] py-1 px-3 z-30 position-relative ${
                        loadingContatos 
                          ? 'opacity-65 cursor-not-allowed bg-[var(--surface-sunken)] border-[var(--border)]' 
                          : 'cursor-pointer hover:border-[var(--brand)]'
                      }`}
                    >
                      {form.numeroId ? (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const numId = form.numeroId;
                            let url = null;
                            let nome = '';
                            let numStr = '';
                            
                            if (String(numId).startsWith('wa-')) {
                              const [num, n] = numId.replace('wa-', '').split('|');
                              url = fotosContatos[num];
                              nome = n || 'WhatsApp';
                              numStr = num;
                            } else {
                              const found = numeros.find(n => String(n.id) === String(numId));
                              if (found) {
                                url = found.fotoUrl;
                                nome = found.nome || 'Painel';
                                numStr = found.numero;
                              }
                            }
                            
                            return (
                              <>
                                {url ? (
                                  <img src={url} alt={nome} className="w-8 h-8 rounded-full object-cover border border-[var(--border)] shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                    {(nome || 'C').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="text-left">
                                  <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{nome}</p>
                                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">+{numStr}</p>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)]">
                          {loadingContatos ? 'Carregando contatos do celular...' : 'Selecione o contato...'}
                        </span>
                      )}
                      {loadingContatos ? (
                        <svg className="animate-spin h-4 w-4 text-[var(--brand)] shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      )}
                    </div>

                    {/* Popover flutuante da lista */}
                    {dropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 p-2 max-h-[300px] overflow-y-auto animate-fadeIn">
                        {/* Campo de pesquisa dentro do dropdown */}
                        <div className="mb-2 sticky top-0 bg-[var(--surface)] pt-1 pb-1">
                          <input 
                            type="text" 
                            value={buscaContato} 
                            onChange={(e) => setBuscaContato(e.target.value)} 
                            placeholder="🔍 Digite para pesquisar..." 
                            className="input text-xs py-1.5 px-3 h-auto w-full"
                            onClick={(e) => e.stopPropagation()} // impede fechar o dropdown ao clicar
                          />
                        </div>

                        {/* Opção Manual */}
                        <div 
                          onClick={() => {
                            setDigitarManualmente(true);
                            setForm({ ...form, numeroId: '' });
                            setDropdownOpen(false);
                          }}
                          className="flex items-center gap-2 p-2 hover:bg-[var(--surface-sunken)] rounded-lg cursor-pointer text-xs text-[var(--brand)] font-semibold border-b border-[var(--border)] mb-1.5"
                        >
                          <div className="w-8 h-8 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand)] shrink-0 font-bold">+</div>
                          <span>➕ Digitar número manualmente...</span>
                        </div>

                        {/* Contatos do celular */}
                        {contatosWhatsApp.length > 0 && (
                          <div className="mb-2">
                            <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] px-2 mb-1">Contatos do Celular</p>
                            {contatosWhatsApp
                              .filter(c => 
                                (c.nome || '').toLowerCase().includes(buscaContato.toLowerCase()) || 
                                (c.numero || '').includes(buscaContato)
                              )
                              .map(c => {
                                const url = fotosContatos[c.numero];
                                return (
                                  <div 
                                    key={c.id} 
                                    onClick={() => {
                                      setForm({ ...form, numeroId: `wa-${c.numero}|${c.nome}` });
                                      setDropdownOpen(false);
                                    }}
                                    className="flex items-center gap-2.5 p-2 hover:bg-[var(--surface-sunken)] rounded-lg cursor-pointer transition-colors"
                                  >
                                    {url ? (
                                      <img src={url} alt={c.nome} className="w-8 h-8 rounded-full object-cover border border-[var(--border)] shrink-0" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                        {(c.nome || 'W').charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="text-left min-w-0">
                                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate leading-tight">{c.nome}</p>
                                      <p className="text-[10px] text-[var(--text-muted)] leading-tight">+{c.numero}</p>
                                    </div>
                                  </div>
                                );
                              })
                            }
                          </div>
                        )}

                        {/* Números Cadastrados */}
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] px-2 mb-1">Painel Administrativo</p>
                          {numeros
                            .filter(n => !n.conexaoId || n.conexaoId === selectedConexao.id)
                            .filter(n => 
                              (n.nome || '').toLowerCase().includes(buscaContato.toLowerCase()) || 
                              (n.numero || '').includes(buscaContato)
                            )
                            .map(n => {
                              return (
                                <div 
                                  key={n.id} 
                                  onClick={() => {
                                    setForm({ ...form, numeroId: String(n.id) });
                                    setDropdownOpen(false);
                                  }}
                                  className="flex items-center gap-2.5 p-2 hover:bg-[var(--surface-sunken)] rounded-lg cursor-pointer transition-colors"
                                >
                                  {n.fotoUrl ? (
                                    <img src={n.fotoUrl} alt={n.nome || 'Painel'} className="w-8 h-8 rounded-full object-cover border border-[var(--border)] shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-[var(--brand)] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                      {(n.nome || '📌').charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="text-left min-w-0">
                                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate leading-tight">{n.nome || 'Contato Painel'}</p>
                                    <p className="text-[10px] text-[var(--text-muted)] leading-tight">+{n.numero}</p>
                                  </div>
                                </div>
                              );
                            })
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="label">Nome do agendamento *</label>
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Lembrete diario" className="input" />
              </div>
            </div>
            <div className="mb-4">
              <label className="label">Mensagem *</label>
              <textarea value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} placeholder="Texto da mensagem..." rows={3} className="input resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="label">Horario *</label>
                <input type="time" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Frequencia</label>
                <select value={form.frequencia} onChange={(e) => setForm({ ...form, frequencia: e.target.value })} className="input">
                  <option value="uma_vez">Uma vez</option>
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                </select>
              </div>
              <div>
                <label className="label">Tipo</label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="input">
                  <option value="texto">Texto</option>
                  <option value="imagem">Imagem</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>
            {form.frequencia === 'semanal' && (
              <div className="mb-4">
                <label className="label">Dias da semana</label>
                <div className="flex gap-1.5">
                  {diasSemanaOpts.map(d => {
                    const sel = (form.diasSemana || '').split(',').map(x => x.trim()).includes(d);
                    return (
                      <button key={d} type="button" onClick={() => {
                        const atuais = (form.diasSemana || '').split(',').map(x => x.trim()).filter(Boolean);
                        setForm({ ...form, diasSemana: (sel ? atuais.filter(x => x !== d) : [...atuais, d]).join(',') });
                      }} className={`text-xs px-2.5 py-1.5 rounded-lg cursor-pointer font-medium transition-colors ${sel ? 'bg-[var(--text-primary)] text-white' : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:bg-[var(--border)]'}`}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {(form.tipo === 'imagem' || form.tipo === 'video') && (
              <div className="mb-4">
                <label className="label">Upload de {form.tipo === 'imagem' ? 'Imagem' : 'Video'}</label>
                <MediaUploader mediaUrl={form.mediaUrl || ''} type={form.tipo} onChange={(url) => setForm({ ...form, mediaUrl: url })} />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={cancelar} className="btn btn-ghost btn-sm">Cancelar</button>
              <button type="submit" className="btn btn-primary btn-lg">{editandoId ? 'Salvar' : 'Criar'}</button>
            </div>
          </form>
        )}

        {/* Lista de mensagens agrupadas por contato */}
        {msgsDaConexao.length === 0 && !mostrarForm ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-[var(--surface-sunken)] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-[var(--text-secondary)] font-medium">Nenhum agendamento</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">Crie mensagens programadas para este número</p>
          </div>
        ) : (
          (() => {
            // Agrupar mensagens por contato
            const contatosComMensagens = [];
            
            msgsDaConexao.forEach(msg => {
              const num = msg.numero?.numero || 'sem-numero';
              const nome = msg.numero?.nome || 'Sem nome';
              const foto = msg.numero?.fotoUrl || fotosContatos[num];
              
              let grupo = contatosComMensagens.find(g => g.numero === num);
              if (!grupo) {
                grupo = {
                  numero: num,
                  nome: nome,
                  fotoUrl: foto,
                  numeroId: msg.numeroId,
                  mensagens: []
                };
                contatosComMensagens.push(grupo);
              }
              grupo.mensagens.push(msg);
            });

            return (
              <div className="space-y-6 stagger">
                {contatosComMensagens.map(grupo => {
                  const isExpanded = contatosExpandidos[grupo.numero] !== undefined
                    ? contatosExpandidos[grupo.numero]
                    : contatosComMensagens.length === 1;

                  return (
                    <div key={grupo.numero} className="card border border-[var(--border)] shadow-sm bg-[var(--surface)] animate-fadeIn overflow-hidden">
                      {/* Cabeçalho do Contato com Foto de Perfil */}
                      <div 
                        onClick={() => setContatosExpandidos(prev => ({ ...prev, [grupo.numero]: !isExpanded }))}
                        className="flex items-center gap-4 p-6 border-b border-[var(--border-light)] cursor-pointer hover:bg-[var(--surface-sunken)] transition-colors select-none"
                      >
                        {/* Foto de Perfil */}
                        <div className="relative shrink-0">
                          {grupo.fotoUrl ? (
                            <img
                              src={grupo.fotoUrl}
                              alt={grupo.nome}
                              className="w-14 h-14 rounded-full object-cover border border-[var(--border)] shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center font-bold text-lg border-2 border-[var(--brand)] shadow-sm">
                              {grupo.nome.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Informações do Contato */}
                        <div>
                          <h3 className="text-base font-bold text-[var(--text-primary)] leading-tight">
                            {grupo.nome}
                          </h3>
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            {formatarNumero(grupo.numero)}
                          </p>
                        </div>
                        
                        {/* Botões do lado direito do cabeçalho */}
                        <div className="ml-auto flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleNovaMensagemParaContato(grupo); }}
                            className="btn btn-ghost btn-sm text-[#F40009] border-[#F40009]/20 hover:bg-[var(--brand-light)] font-bold text-xs cursor-pointer active:scale-95"
                            title="Adicionar agendamento para este contato"
                          >
                            + Novo Agendamento
                          </button>
                          <div 
                            onClick={() => setContatosExpandidos(prev => ({ ...prev, [grupo.numero]: !isExpanded }))}
                            className="bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-secondary)] text-xs font-bold px-3 py-1.5 rounded-full shrink-0 flex items-center gap-1.5 cursor-pointer hover:border-[var(--brand)] transition-colors"
                          >
                            {grupo.mensagens.length} agendamento(s)
                            <svg className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Sublista de Mensagens */}
                      {isExpanded && (
                        <div className="p-6 pt-4 space-y-3.5 animate-fadeIn">
                          {grupo.mensagens.map(msg => (
                            <div key={msg.id} className="bg-[var(--surface-sunken)] border border-[var(--border-light)] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[var(--border)]">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                  <span className="text-sm font-bold text-[var(--text-primary)]">{msg.nome}</span>
                                  
                                  <span className={`badge cursor-pointer ${msg.ativo ? 'badge-success' : 'badge-neutral'}`} onClick={() => handleToggle(msg)}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${msg.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                    {msg.ativo ? 'Ativo' : 'Inativo'}
                                  </span>
                                  
                                  <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)]">
                                    {msg.horario} | {msg.frequencia === 'uma_vez' ? 'Uma vez' : msg.frequencia === 'diario' ? 'Diário' : `Semanal (${msg.diasSemana})`}
                                  </span>
                                </div>
                                
                                <p className="text-xs text-[var(--text-secondary)] bg-[var(--surface)] p-3 rounded-lg border border-[var(--border-light)] font-medium leading-relaxed mb-2 whitespace-pre-line">
                                  {msg.mensagem}
                                </p>
                                
                                {msg.mediaUrl && (
                                  <div className="mt-2 mb-3 max-w-[240px] border border-[var(--border-light)] rounded-xl overflow-hidden bg-[var(--surface)] p-1.5 shadow-sm">
                                    {msg.tipo === 'imagem' ? (
                                      <img
                                        src={getMediaSrc(msg.mediaUrl)}
                                        alt="Anexo agendado"
                                        className="max-h-32 w-auto object-contain rounded-lg mx-auto"
                                      />
                                    ) : msg.tipo === 'video' ? (
                                      <video
                                        src={getMediaSrc(msg.mediaUrl)}
                                        controls
                                        className="max-h-32 w-auto object-contain rounded-lg mx-auto"
                                      />
                                    ) : (
                                      <a href={getMediaSrc(msg.mediaUrl)} target="_blank" rel="noreferrer" className="text-[11px] text-blue-500 font-semibold underline truncate block p-1">
                                        📂 {msg.mediaUrl.split('/').pop()}
                                      </a>
                                    )}
                                  </div>
                                )}
                                
                                {msg.ultimoEnvio && (
                                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-semibold">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Último envio: {new Date(msg.ultimoEnvio).toLocaleString('pt-BR')}
                                  </div>
                                )}
                              </div>
                              
                              {/* Botões de Ação */}
                              <div className="flex gap-2 shrink-0 md:self-center">
                                <button onClick={() => handleEnviar(msg.id)} className="btn btn-sm btn-primary">
                                  Enviar agora
                                </button>
                                <button onClick={() => handleEditar(msg)} className="btn btn-ghost btn-sm">
                                  Editar
                                </button>
                                <button onClick={() => handleDeletar(msg.id)} className="btn btn-danger btn-sm text-red-500">
                                  Excluir
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
        {/* Modal de Confirmação customizado (Estilo Brasal) */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fadeInScale">
              <h3 className="text-base font-bold text-[var(--text-primary)] font-display mb-2">{confirmModal.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-6">{confirmModal.message}</p>
              
              <div className="flex justify-end gap-3">
                {confirmModal.type === 'confirm' && (
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========== NÍVEL 2: Números de um setor ==========
  if (selectedSetor) {
    const connsDoSetor = setores[selectedSetor] || [];
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelectedSetor(null)} className="btn btn-ghost btn-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <div>
            <h2 className="text-xl font-display text-[var(--text-primary)]">{selectedSetor}</h2>
            <p className="text-[var(--text-muted)] text-sm mt-2">{connsDoSetor.length} numero(s) neste departamento</p>
          </div>
        </div>

        <div className="space-y-3 stagger">
          {connsDoSetor.map(c => {
            const msgsCount = mensagens.filter(m => m.conexaoId === c.id).length;
            const online = c.status?.connected;
            
            const connectedTime = c.status?.connectedAt ? new Date(c.status.connectedAt).getTime() : 0;
            const elapsed = connectedTime ? agora - connectedTime : 0;
            const cooldown = 3 * 60 * 1000; // 3 minutos de cooldown para números
            const restante = cooldown - elapsed;
            const emSincronizacao = c.status?.connected && connectedTime && restante > 0;

            const minutosRestantes = Math.floor(restante / 60000);
            const segundosRestantes = Math.floor((restante % 60000) / 1000);
            const countdownText = `${String(minutosRestantes).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`;

            if (emSincronizacao) {
              return (
                <div key={c.id}
                  className="w-full card p-5 flex items-center gap-4 text-left animate-fadeIn border border-amber-300 dark:border-amber-700/60 bg-amber-50/10 dark:bg-amber-950/5 select-none">
                  <div className="w-3 h-3 rounded-full shrink-0 bg-amber-500 animate-pulse shadow-sm shadow-amber-500/50" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{c.apelido || 'Sem apelido'}</span>
                      <span className="badge badge-warning">
                        Sincronizando
                      </span>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1.5 flex items-center gap-1.5">
                      <svg className="animate-spin h-3.5 w-3.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Carregando números... (Aguarde {countdownText})
                    </p>
                  </div>
                  <div className="text-right shrink-0 pr-2">
                    <svg className="w-5 h-5 text-amber-500/70" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                </div>
              );
            }

            return (
              <button key={c.id} onClick={() => handleSelecionarConexao(c)}
                className="w-full card card-interactive p-5 flex items-center gap-4 cursor-pointer text-left animate-fadeIn">
                <div className={`w-3 h-3 rounded-full shrink-0 ${online ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-[var(--text-muted)]'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{c.apelido || 'Sem apelido'}</span>
                    <span className={`badge ${online ? 'badge-success' : 'badge-neutral'}`}>
                      {online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{c.status?.info?.wid?.user || 'Aguardando conexao'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-[var(--text-primary)]">{msgsCount}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">agendamentos</p>
                </div>
                <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </button>
            );
          })}
        </div>

        {/* Modal de Senha Premium (Vermelho e Branco) */}
        {senhaPrompt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <form onSubmit={handleConfirmarSenha} className="card p-6 w-full max-w-sm border border-[var(--border)] shadow-xl animate-fadeInScale bg-white">
              <div className="flex items-center gap-2 mb-4 text-[#F40009]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                <h3 className="font-semibold text-sm">Acesso Restrito</h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-4">Insira a senha do número <strong>{senhaPrompt.apelido || senhaPrompt.nome}</strong> para acessar os agendamentos:</p>
              
              <input
                type="password"
                value={senhaInput}
                onChange={(e) => setSenhaInput(e.target.value)}
                placeholder="Senha da conexão"
                autoFocus
                className="input mb-3"
              />
              
              {senhaErro && <p className="text-xs text-red-500 mb-3">{senhaErro}</p>}
              
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setSenhaPrompt(null)} className="btn btn-ghost btn-sm">Cancelar</button>
                <button type="submit" className="btn btn-primary btn-md">Acessar</button>
              </div>
            </form>
          </div>
        )}
        {/* Modal de Confirmação customizado (Estilo Brasal) */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fadeInScale">
              <h3 className="text-base font-bold text-[var(--text-primary)] font-display mb-2">{confirmModal.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-6">{confirmModal.message}</p>
              
              <div className="flex justify-end gap-3">
                {confirmModal.type === 'confirm' && (
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========== NÍVEL 1: Departamentos (setores) ==========
  const setorNames = Object.keys(setores);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-[28px] font-display text-[var(--text-primary)] leading-none">Agendamentos</h2>
        <p className="text-[var(--text-muted)] text-sm mt-2">Selecione um departamento para gerenciar mensagens</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <p className="stat-value">{setorNames.length}</p>
          <p className="stat-label">Departamentos</p>
        </div>
        <div className="stat-card">
          <p className="stat-value text-emerald-600">{conexoes.filter(c => c.status?.connected).length}</p>
          <p className="stat-label">Numeros online</p>
        </div>
        <div className="stat-card">
          <p className="stat-value text-blue-500">{mensagens.length}</p>
          <p className="stat-label">Agendamentos</p>
        </div>
      </div>

      {setorNames.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-[var(--surface-sunken)] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
          </div>
          <p className="text-[var(--text-secondary)] font-medium">Nenhum departamento</p>
          <p className="text-[var(--text-muted)] text-sm mt-1">Adicione conexoes na pagina de Conexoes primeiro</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {setorNames.map(setor => {
            const conns = setores[setor];
            const onlineCount = conns.filter(c => c.status?.connected).length;
            const msgsCount = mensagens.filter(m => conns.some(c => c.id === m.conexaoId)).length;
            return (
              <button key={setor} onClick={() => setSelectedSetor(setor)}
                className="w-full card card-interactive p-5 flex items-center gap-4 cursor-pointer text-left animate-fadeIn">
                <div className="w-12 h-12 rounded-xl bg-[var(--surface-sunken)] text-[var(--text-secondary)] font-bold text-lg flex items-center justify-center shrink-0">
                  {setor.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{setor}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[var(--text-muted)]">{conns.length} numero(s)</span>
                    <span className={`text-xs ${onlineCount > 0 ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>{onlineCount} online</span>
                    <span className="text-xs text-[var(--text-muted)]">{msgsCount} agendamento(s)</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-[var(--text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação customizado (Estilo Brasal) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fadeInScale">
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6">{confirmModal.message}</p>
            
            <div className="flex justify-end gap-3">
              {confirmModal.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="btn btn-ghost btn-sm"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                }}
                className="btn btn-primary btn-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
