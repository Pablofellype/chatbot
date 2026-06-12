import { useState, useEffect } from 'react';
import { mensagemAutoService } from '../services/api';
import MediaUploader from './MediaUploader';

const freqLabels = { uma_vez: 'Uma vez', diario: 'Diario', semanal: 'Semanal' };

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

const diasOptions = [
  { valor: 'seg', label: 'Seg' }, { valor: 'ter', label: 'Ter' },
  { valor: 'qua', label: 'Qua' }, { valor: 'qui', label: 'Qui' },
  { valor: 'sex', label: 'Sex' }, { valor: 'sab', label: 'Sab' },
  { valor: 'dom', label: 'Dom' },
];

const formVazio = { nome: '', mensagem: '', tipo: 'texto', mediaUrl: '', frequencia: 'diario', diasSemana: '', horario: '' };

export default function MensagensAutoPage({ conexaoIdFixa, conexaoNome }) {
  const [mensagens, setMensagens] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [grupoAberto, setGrupoAberto] = useState(null);
  const [criandoNoGrupo, setCriandoNoGrupo] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ ...formVazio });
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert', // 'alert' or 'confirm'
    onConfirm: null
  });

  const mostrarAlerta = (titulo, mensagem) => {
    setModalConfig({
      isOpen: true,
      title: titulo,
      message: mensagem,
      type: 'alert',
      onConfirm: null
    });
  };

  const mostrarConfirmacao = (titulo, mensagem, aoConfirmar) => {
    setModalConfig({
      isOpen: true,
      title: titulo,
      message: mensagem,
      type: 'confirm',
      onConfirm: aoConfirmar
    });
  };

  // Popup
  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [buscaGrupo, setBuscaGrupo] = useState('');

  const carregar = async () => {
    try {
      const { data } = await mensagemAutoService.listar();
      setMensagens(data.filter((m) => m.conexaoId === conexaoIdFixa));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const carregarGrupos = async () => {
    setLoadingGrupos(true);
    try {
      const { data } = await mensagemAutoService.grupos(conexaoIdFixa);
      setGrupos(data);
    } catch { setGrupos([]); }
    finally { setLoadingGrupos(false); }
  };

  useEffect(() => { carregar(); carregarGrupos(); }, [conexaoIdFixa]);

  const grupoIds = new Set(grupos.map((g) => g.id));
  const msgsDoGrupo = (grupoId) => mensagens.filter((m) => m.grupoId === grupoId);
  const gruposComMensagens = grupos.filter((g) => msgsDoGrupo(g.id).length > 0);
  const gruposSemMensagens = grupos.filter((g) => msgsDoGrupo(g.id).length === 0);
  const msgsOrfas = mensagens.filter((m) => !grupoIds.has(m.grupoId));
  const gruposFiltrados = gruposSemMensagens.filter((g) => g.nome.toLowerCase().includes(buscaGrupo.toLowerCase()));

  const toggleDia = (dia) => {
    const atuais = form.diasSemana ? form.diasSemana.split(',').map((d) => d.trim()) : [];
    const novos = atuais.includes(dia) ? atuais.filter((d) => d !== dia) : [...atuais, dia];
    setForm({ ...form, diasSemana: novos.join(',') });
  };

  const handleCriar = async (grupo) => {
    if (!form.nome || !form.mensagem || !form.horario) return;
    setSalvando(true);
    try {
      await mensagemAutoService.criar({ ...form, conexaoId: conexaoIdFixa, grupoId: grupo.id, grupoNome: grupo.nome });
      setForm({ ...formVazio }); setCriandoNoGrupo(null); carregar();
    } catch (e) { console.error(e); }
    finally { setSalvando(false); }
  };

  const handleEditar = (msg) => {
    setEditandoId(msg.id);
    setForm({ nome: msg.nome, mensagem: msg.mensagem, tipo: msg.tipo || 'texto', mediaUrl: msg.mediaUrl || '', frequencia: msg.frequencia, diasSemana: msg.diasSemana || '', horario: msg.horario });
  };

  const handleSalvarEdicao = async (msg) => {
    if (!form.nome || !form.mensagem || !form.horario) return;
    setSalvando(true);
    try {
      await mensagemAutoService.atualizar(msg.id, { ...form });
      setEditandoId(null); setForm({ ...formVazio }); carregar();
    } catch (e) { console.error(e); }
    finally { setSalvando(false); }
  };

  const handleCancelarEdicao = () => { setEditandoId(null); setForm({ ...formVazio }); };

  const handleToggle = async (msg) => { await mensagemAutoService.atualizar(msg.id, { ativo: !msg.ativo }); carregar(); };
  const handleDeletar = async (id) => {
    mostrarConfirmacao('Remover Mensagem', 'Tem certeza que deseja remover esta mensagem automática?', async () => {
      try {
        await mensagemAutoService.deletar(id);
        carregar();
      } catch (err) {
        mostrarAlerta('Erro', err.response?.data?.erro || 'Erro ao remover mensagem');
      }
    });
  };
  const handleEnviar = async (id) => {
    setEnviando(id);
    try {
      await mensagemAutoService.enviar(id);
      carregar();
    } catch (e) {
      mostrarAlerta('Erro ao Enviar', e.response?.data?.erro || e.message);
    } finally {
      setEnviando(null);
    }
  };

  const handleSelecionarGrupo = (grupo) => {
    setMostrarPopup(false); setBuscaGrupo('');
    setGrupoAberto(grupo.id); setCriandoNoGrupo(grupo.id);
    setForm({ ...formVazio });
  };

  // Formulario reutilizavel
  // Formulario reutilizavel
  const renderForm = (onSalvar, onCancelar) => (
    <div className="card p-5 space-y-4 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Nome</label>
          <input 
            value={form.nome} 
            onChange={(e) => setForm({ ...form, nome: e.target.value })} 
            placeholder="Ex: Lembrete diário..." 
            className="input" 
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Horário</label>
            <input 
              type="time" 
              value={form.horario} 
              onChange={(e) => setForm({ ...form, horario: e.target.value })} 
              className="input" 
            />
          </div>
          <div>
            <label className="label">Frequência</label>
            <select 
              value={form.frequencia} 
              onChange={(e) => setForm({ ...form, frequencia: e.target.value })} 
              className="input"
            >
              <option value="uma_vez">Uma vez</option>
              <option value="diario">Diário</option>
              <option value="semanal">Semanal</option>
            </select>
          </div>
        </div>
      </div>

      {form.frequencia === 'semanal' && (
        <div>
          <label className="label">Dias da Semana</label>
          <div className="flex flex-wrap gap-1.5">
            {diasOptions.map((d) => {
              const ativo = form.diasSemana?.includes(d.valor);
              return (
                <button 
                  key={d.valor} 
                  type="button"
                  onClick={() => toggleDia(d.valor)} 
                  className={`text-xs px-2.5 py-1.5 rounded-lg cursor-pointer font-medium transition-colors ${
                    ativo 
                      ? 'bg-[var(--text-primary)] text-white' 
                      : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:bg-[var(--border)] border border-[var(--border)]'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="label">Tipo de Conteúdo</label>
        <div className="flex gap-2">
          {[{ v: 'texto', l: 'Texto' }, { v: 'imagem', l: 'Imagem' }, { v: 'video', l: 'Vídeo' }].map((t) => (
            <button 
              key={t.v} 
              type="button"
              onClick={() => setForm({ ...form, tipo: t.v })} 
              className={`btn btn-sm px-4 py-1.5 ${form.tipo === t.v ? 'btn-primary' : 'btn-ghost'}`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {(form.tipo === 'imagem' || form.tipo === 'video') && (
        <div className="animate-fadeIn">
          <label className="label">Upload de {form.tipo === 'imagem' ? 'Imagem' : 'Vídeo'}</label>
          <MediaUploader mediaUrl={form.mediaUrl || ''} type={form.tipo} onChange={(url) => setForm({ ...form, mediaUrl: url })} />
        </div>
      )}

      <div>
        <label className="label">Mensagem {form.tipo !== 'texto' ? '(legenda)' : ''}</label>
        <textarea 
          value={form.mensagem} 
          onChange={(e) => setForm({ ...form, mensagem: e.target.value })} 
          placeholder="Digite o texto da mensagem..." 
          rows={3} 
          className="input resize-none" 
        />
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-[var(--border-light)]">
        <button 
          type="button"
          onClick={onCancelar} 
          className="btn btn-ghost btn-sm"
        >
          Cancelar
        </button>
        <button 
          type="button"
          onClick={onSalvar} 
          disabled={salvando || !form.nome || !form.mensagem || !form.horario} 
          className="btn btn-primary btn-md"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );

  if (loading || loadingGrupos) return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] font-display">Mensagens Automáticas</h3>
            <p className="text-[var(--text-muted)] text-sm mt-1">Conexão: <span className="text-blue-500 font-semibold">{conexaoNome}</span> — {grupos.length} grupo(s)</p>
          </div>
          <button onClick={() => setMostrarPopup(true)} className="btn btn-primary btn-md">+ Adicionar Grupo</button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="stat-card p-4"><p className="stat-value">{gruposComMensagens.length}</p><p className="stat-label">Grupos ativos</p></div>
          <div className="stat-card p-4"><p className="stat-value text-emerald-600">{mensagens.filter((m) => m.ativo).length}</p><p className="stat-label">Mensagens ativas</p></div>
          <div className="stat-card p-4"><p className="stat-value text-blue-600">{mensagens.length}</p><p className="stat-label">Total mensagens</p></div>
        </div>

        {gruposComMensagens.length === 0 && !criandoNoGrupo ? (
          <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-sm">
            <p className="text-[var(--text-secondary)] font-semibold text-lg">Nenhum grupo com mensagens</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">Clique em "+ Adicionar Grupo" para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {gruposComMensagens.map((grupo) => {
              const msgs = msgsDoGrupo(grupo.id);
              const aberto = grupoAberto === grupo.id;
              return (
                <div key={grupo.id} className="card overflow-hidden">
                  <button onClick={() => setGrupoAberto(aberto ? null : grupo.id)} className="w-full flex items-center gap-4 p-4 hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer text-left">
                    {grupo.foto ? (
                      <img src={grupo.foto} alt="" className="w-12 h-12 rounded-full object-cover shrink-0 border border-[var(--border)]" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)]/10 flex items-center justify-center shrink-0">
                        <span className="text-[var(--brand)] text-lg font-bold">{grupo.nome.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[var(--text-primary)] font-bold text-sm truncate">{grupo.nome}</h4>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{msgs.length} mensagem(ns) — {msgs.filter((m) => m.ativo).length} ativa(s)</p>
                    </div>
                    <span className="text-[var(--text-muted)] text-sm">{aberto ? '▲' : '▼'}</span>
                  </button>

                  {aberto && (
                    <div className="border-t border-[var(--border-light)] p-4 space-y-3 bg-[var(--surface-sunken)]/30">
                      {msgs.map((msg) => (
                        editandoId === msg.id ? (
                          <div key={msg.id}>{renderForm(() => handleSalvarEdicao(msg), handleCancelarEdicao)}</div>
                        ) : (
                          <div key={msg.id} className="bg-[var(--surface)] border border-[var(--border-light)] rounded-xl p-4 transition-all hover:border-[var(--border)]">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="text-[var(--text-primary)] text-sm font-bold">{msg.nome}</span>
                                <button 
                                  type="button"
                                  onClick={() => handleToggle(msg)} 
                                  className={`badge cursor-pointer ${msg.ativo ? 'badge-success' : 'badge-neutral'}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${msg.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                  {msg.ativo ? 'Ativo' : 'Inativo'}
                                </button>
                                {msg.tipo && msg.tipo !== 'texto' && (
                                  <span className="badge badge-neutral text-[10px]">
                                    {msg.tipo === 'imagem' ? 'Imagem' : 'Vídeo'}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1.5">
                                <button onClick={() => handleEditar(msg)} className="btn btn-ghost btn-sm text-blue-500 py-1 px-2.5">Editar</button>
                                <button onClick={() => handleEnviar(msg.id)} disabled={enviando === msg.id} className="btn btn-ghost btn-sm text-emerald-500 py-1 px-2.5 disabled:opacity-50">{enviando === msg.id ? 'Enviando...' : 'Enviar'}</button>
                                <button onClick={() => handleDeletar(msg.id)} className="btn btn-danger btn-sm text-red-500 py-1 px-2.5">Excluir</button>
                              </div>
                            </div>
                            {msg.mediaUrl && (
                              <div className="mt-2 mb-3 max-w-[200px] border border-[var(--border-light)] rounded-lg overflow-hidden bg-[var(--surface-sunken)] p-1 shadow-sm">
                                {msg.tipo === 'imagem' ? (
                                  <img
                                    src={getMediaSrc(msg.mediaUrl)}
                                    alt="Anexo agendado"
                                    className="max-h-24 w-auto object-contain rounded mx-auto"
                                  />
                                ) : msg.tipo === 'video' ? (
                                  <video
                                    src={getMediaSrc(msg.mediaUrl)}
                                    controls
                                    className="max-h-24 w-auto object-contain rounded mx-auto"
                                  />
                                ) : (
                                  <a href={getMediaSrc(msg.mediaUrl)} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 font-semibold underline truncate block p-0.5">
                                    📂 {msg.mediaUrl.split('/').pop()}
                                  </a>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap mb-2 font-medium leading-relaxed">{msg.mensagem}</p>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-muted)] font-semibold">
                              <span className="bg-[var(--surface-sunken)] px-2 py-0.5 rounded border border-[var(--border)]">{freqLabels[msg.frequencia] || msg.frequencia}</span>
                              <span>às {msg.horario}</span>
                              {msg.diasSemana && <span>({msg.diasSemana})</span>}
                              {msg.ultimoEnvio && (
                                <span className="text-emerald-600">
                                  • Último envio: {new Date(msg.ultimoEnvio).toLocaleString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      ))}

                      {criandoNoGrupo === grupo.id ? (
                        renderForm(() => handleCriar(grupo), () => setCriandoNoGrupo(null))
                      ) : (
                        <button 
                          type="button"
                          onClick={() => { setCriandoNoGrupo(grupo.id); setForm({ ...formVazio }); }} 
                          className="w-full text-center text-xs text-[var(--brand)] hover:text-[var(--brand-hover)] hover:bg-[var(--brand-light)] py-2.5 border border-dashed border-[var(--border)] hover:border-[var(--brand)]/30 rounded-xl cursor-pointer transition-colors"
                        >
                          + Adicionar mensagem automática
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Alerta: mensagens de grupos que nao existem mais */}
            {msgsOrfas.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-amber-600 text-lg">!</span>
                  <h4 className="text-amber-800 font-semibold text-sm">Grupos nao encontrados neste numero</h4>
                </div>
                <p className="text-xs text-amber-600 mb-3">Estas mensagens estao vinculadas a grupos que nao existem no WhatsApp conectado. Pode ser que o numero tenha mudado ou o grupo foi removido.</p>
                <div className="space-y-2">
                  {msgsOrfas.map((msg) => (
                    <div key={msg.id} className="bg-[var(--surface)] rounded-xl p-3 border border-amber-200 flex items-center justify-between gap-3 shadow-xs">
                      <div>
                        <span className="text-[var(--text-primary)] text-sm font-bold">{msg.nome}</span>
                        <p className="text-xs text-amber-600 font-semibold mt-0.5">Grupo: {msg.grupoNome} (não encontrado)</p>
                      </div>
                      <button onClick={() => handleDeletar(msg.id)} className="btn btn-danger btn-sm text-red-500">Remover</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grupo recem adicionado */}
            {criandoNoGrupo && !gruposComMensagens.find((g) => g.id === criandoNoGrupo) && (() => {
              const grupo = grupos.find((g) => g.id === criandoNoGrupo);
              if (!grupo) return null;
              return (
                <div className="card overflow-hidden shadow-sm">
                  <div className="flex items-center gap-4 p-4">
                    {grupo.foto ? (
                      <img src={grupo.foto} alt="" className="w-12 h-12 rounded-full object-cover shrink-0 border border-[var(--border)]" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)]/10 flex items-center justify-center shrink-0">
                        <span className="text-[var(--brand)] text-lg font-bold">{grupo.nome.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-[var(--text-primary)] font-bold text-sm">{grupo.nome}</h4>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">Novo grupo</p>
                    </div>
                  </div>
                  <div className="border-t border-[var(--border-light)] p-4">{renderForm(() => handleCriar(grupo), () => setCriandoNoGrupo(null))}</div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Popup de selecao */}
      {mostrarPopup && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-[480px] max-h-[80vh] flex flex-col shadow-2xl animate-fadeInScale">
            <div className="p-5 border-b border-[var(--border-light)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display">Selecionar Grupo</h3>
                <button 
                  type="button"
                  onClick={() => { setMostrarPopup(false); setBuscaGrupo(''); }} 
                  className="w-7 h-7 rounded-lg bg-[var(--surface-sunken)] hover:bg-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors active:scale-95"
                >
                  ✕
                </button>
              </div>
              <input 
                value={buscaGrupo} 
                onChange={(e) => setBuscaGrupo(e.target.value)} 
                placeholder="Buscar grupo por nome..." 
                autoFocus 
                className="input" 
              />
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {gruposFiltrados.length === 0 ? (
                <p className="text-center text-[var(--text-faint)] py-8 text-xs font-medium">{buscaGrupo ? 'Nenhum grupo encontrado' : 'Todos os grupos já possuem mensagens'}</p>
              ) : (
                <div className="space-y-1">
                  {gruposFiltrados.map((g) => (
                    <button 
                      key={g.id} 
                      type="button"
                      onClick={() => handleSelecionarGrupo(g)} 
                      className="w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer text-left"
                    >
                      {g.foto ? (
                        <img src={g.foto} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-[var(--border)]" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)]/10 flex items-center justify-center shrink-0 font-bold">
                          {g.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[var(--text-primary)] font-semibold text-xs truncate">{g.nome}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Custom Modal (Visual Brasal Premium) */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fadeInScale">
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display mb-2">{modalConfig.title}</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6">{modalConfig.message}</p>
            
            <div className="flex justify-end gap-3">
              {modalConfig.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                  className="btn btn-ghost btn-sm"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setModalConfig((prev) => ({ ...prev, isOpen: false }));
                  if (modalConfig.onConfirm) modalConfig.onConfirm();
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
