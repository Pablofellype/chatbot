import { useState, useEffect } from 'react';
import { mensagemAutoService } from '../services/api';
import MediaUploader from './MediaUploader';

const freqLabels = { uma_vez: 'Uma vez', diario: 'Diário', semanal: 'Semanal' };

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
  { valor: 'sex', label: 'Sex' }, { valor: 'sab', label: 'Sáb' },
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

  const renderForm = (onSalvar, onCancelar) => (
    <div className="space-y-4.5 py-2 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Nome da Mensagem</label>
          <input 
            value={form.nome} 
            onChange={(e) => setForm({ ...form, nome: e.target.value })} 
            placeholder="Ex: Lembrete diário..." 
            className="input" 
          />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="label">Horário de Disparo</label>
            <input 
              type="time" 
              value={form.horario} 
              onChange={(e) => setForm({ ...form, horario: e.target.value })} 
              className="input" 
            />
          </div>
          <div>
            <label className="label">Frequência</label>
            <div className="relative">
              <select 
                value={form.frequencia} 
                onChange={(e) => setForm({ ...form, frequencia: e.target.value })} 
                className="input pr-8 appearance-none cursor-pointer"
              >
                <option value="uma_vez">Uma vez</option>
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {form.frequencia === 'semanal' && (
        <div className="animate-fadeIn">
          <label className="label">Dias da Semana</label>
          <div className="flex flex-wrap gap-1.5">
            {diasOptions.map((d) => {
              const ativo = form.diasSemana?.includes(d.valor);
              return (
                <button 
                  key={d.valor} 
                  type="button"
                  onClick={() => toggleDia(d.valor)} 
                  className={`text-[11px] px-3 py-1.5 rounded-lg cursor-pointer font-bold transition-all ${
                    ativo 
                      ? 'bg-[var(--brand)] text-white shadow-xs shadow-[var(--brand-ring)]' 
                      : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--border)] border border-[var(--border)]'
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
              className={`btn btn-sm px-4.5 py-2 text-xs font-bold transition-all ${
                form.tipo === t.v 
                  ? 'btn-primary' 
                  : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--border-light)]'
              }`}
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

      <div className="flex gap-2 justify-end pt-3 border-t border-[var(--border-light)]">
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
          className="btn btn-primary btn-md shadow-xs font-bold"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );

  if (loading || loadingGrupos) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
        <svg className="animate-spin h-8 w-8 text-[#F40009]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-bold text-[var(--text-muted)] tracking-wide">Carregando dados...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-[var(--border-light)] pb-5">
          <div>
            <div className="text-[10px] font-extrabold text-[#F40009] uppercase tracking-wider mb-1">Painel Brasal</div>
            <h2 className="text-[26px] font-display font-extrabold text-[var(--text-primary)] tracking-tight leading-none">Mensagens Automáticas</h2>
            <p className="text-[var(--text-muted)] text-xs mt-1.5 flex items-center flex-wrap gap-1">
              Conexão vinculada:
              <span className="text-[#F40009] dark:text-[#ff3b45] font-extrabold bg-[var(--brand-light)] px-2.5 py-0.5 rounded-md border border-[#F40009]/10 text-[10.5px] ml-1 select-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {conexaoNome}
              </span>
              <span className="text-[var(--text-faint)] font-bold ml-1">•</span>
              <span className="ml-1 text-[var(--text-secondary)] font-semibold">{grupos.length} grupo(s) cadastrado(s)</span>
            </p>
          </div>
          <button 
            onClick={() => setMostrarPopup(true)} 
            className="btn btn-primary btn-md shadow-xs font-bold text-xs py-2.5 px-4.5 cursor-pointer active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Adicionar Grupo
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="stat-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="stat-value text-2.5xl leading-none">{gruposComMensagens.length}</p>
              <p className="stat-label mt-1 text-[11px] font-bold uppercase tracking-wider">Grupos Ativos</p>
            </div>
          </div>
          
          <div className="stat-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="stat-value text-2.5xl leading-none text-emerald-600 dark:text-emerald-400">{mensagens.filter((m) => m.ativo).length}</p>
              <p className="stat-label mt-1 text-[11px] font-bold uppercase tracking-wider">Mensagens Ativas</p>
            </div>
          </div>

          <div className="stat-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.085 8.169m0 0l4.085-8.169m-4.085 8.169V3" />
              </svg>
            </div>
            <div>
              <p className="stat-value text-2.5xl leading-none text-[var(--brand)]">{mensagens.length}</p>
              <p className="stat-label mt-1 text-[11px] font-bold uppercase tracking-wider">Total Agendadas</p>
            </div>
          </div>
        </div>

        {/* List of Groups / Accordions */}
        {gruposComMensagens.length === 0 && !criandoNoGrupo ? (
          <div className="text-center py-20 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xs animate-fadeIn">
            <div className="w-14 h-14 bg-[var(--surface-sunken)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--border)] text-[var(--text-muted)]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.085 8.169m0 0l4.085-8.169m-4.085 8.169V3" />
              </svg>
            </div>
            <p className="text-[var(--text-primary)] font-bold text-sm">Nenhuma mensagem automática programada</p>
            <p className="text-[var(--text-muted)] text-xs mt-1.5 max-w-sm mx-auto font-medium">Você pode programar mensagens automáticas periódicas (diárias, semanais ou avulsas) para disparar em grupos específicos do WhatsApp.</p>
            <button 
              onClick={() => setMostrarPopup(true)} 
              className="btn btn-primary btn-sm mt-5 shadow-xs font-bold"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Adicionar Primeiro Grupo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {gruposComMensagens.map((grupo) => {
              const msgs = msgsDoGrupo(grupo.id);
              const aberto = grupoAberto === grupo.id;
              return (
                <div key={grupo.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs hover:border-[var(--border-hover)] transition-all duration-200">
                  <button 
                    onClick={() => setGrupoAberto(aberto ? null : grupo.id)} 
                    className="w-full flex items-center gap-4 px-6 py-4.5 hover:bg-[var(--surface-sunken)]/50 transition-colors cursor-pointer text-left focus:outline-none"
                  >
                    {grupo.foto ? (
                      <img src={grupo.foto} alt="" className="w-11 h-11 rounded-full object-cover shrink-0 border border-[var(--border)]" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)]/10 flex items-center justify-center shrink-0">
                        <span className="text-[var(--brand)] text-base font-extrabold font-display">{grupo.nome.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[var(--text-primary)] font-bold text-[14px] truncate tracking-tight">{grupo.nome}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                          {msgs.length} {msgs.length === 1 ? 'mensagem agendada' : 'mensagens agendadas'}
                        </span>
                        <span className="text-[var(--border)] font-bold">•</span>
                        <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                          {msgs.filter((m) => m.ativo).length} ativa(s)
                        </span>
                      </div>
                    </div>
                    <div className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0">
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={2.5} 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </button>

                  {aberto && (
                    <div className="border-t border-[var(--border-light)] p-5 space-y-4 bg-[var(--surface-sunken)]/20">
                      <div className="space-y-3">
                        {msgs.map((msg) => (
                          editandoId === msg.id ? (
                            <div key={msg.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs animate-fadeIn">
                              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-light)]">
                                <span className="text-xs font-extrabold uppercase text-[#F40009] tracking-wider">Editar Mensagem Automática</span>
                                <button onClick={handleCancelarEdicao} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold">Cancelar</button>
                              </div>
                              {renderForm(() => handleSalvarEdicao(msg), handleCancelarEdicao)}
                            </div>
                          ) : (
                            <div key={msg.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4.5 transition-all hover:border-[var(--border-hover)] hover:shadow-xs relative">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3 pb-3 border-b border-[var(--border-light)]">
                                <div className="flex items-center flex-wrap gap-2.5">
                                  <span className="text-[var(--text-primary)] text-[13.5px] font-extrabold tracking-tight">{msg.nome}</span>
                                  
                                  {/* Toggle Switch Pill */}
                                  <button 
                                    type="button"
                                    onClick={() => handleToggle(msg)} 
                                    className={`badge cursor-pointer select-none transition-all hover:scale-[1.02] ${msg.ativo ? 'badge-success' : 'badge-neutral'}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${msg.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                    {msg.ativo ? 'Ativo' : 'Inativo'}
                                  </button>

                                  {msg.tipo && msg.tipo !== 'texto' && (
                                    <span className="text-[10px] font-extrabold uppercase bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--border)] px-2.5 py-0.5 rounded-md">
                                      📁 {msg.tipo === 'imagem' ? 'Imagem' : 'Vídeo'}
                                    </span>
                                  )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1.5">
                                  <button 
                                    onClick={() => handleEditar(msg)} 
                                    className="btn btn-ghost btn-sm text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-200 py-1.5 px-3"
                                    title="Editar mensagem"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 20.013a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                    </svg>
                                    Editar
                                  </button>

                                  <button 
                                    onClick={() => handleEnviar(msg.id)} 
                                    disabled={enviando === msg.id} 
                                    className="btn btn-ghost btn-sm text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-200 py-1.5 px-3 disabled:opacity-50"
                                    title="Disparar mensagem agora"
                                  >
                                    {enviando === msg.id ? (
                                      <>
                                        <svg className="animate-spin h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Enviando
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                        </svg>
                                        Testar
                                      </>
                                    )}
                                  </button>

                                  <button 
                                    onClick={() => handleDeletar(msg.id)} 
                                    className="btn btn-danger btn-sm text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 py-1.5 px-3"
                                    title="Excluir mensagem"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                    Excluir
                                  </button>
                                </div>
                              </div>

                              {msg.mediaUrl && (
                                <div className="mt-2 mb-3 max-w-[260px] border border-[var(--border-light)] rounded-xl overflow-hidden bg-[var(--surface-sunken)] p-1.5 shadow-xs transition-transform hover:scale-[1.01]">
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
                                    <a href={getMediaSrc(msg.mediaUrl)} target="_blank" rel="noreferrer" className="text-[11px] text-blue-500 font-semibold hover:underline truncate flex items-center gap-1.5 p-1">
                                      📂 <span className="truncate">{msg.mediaUrl.split('/').pop()}</span>
                                    </a>
                                  )}
                                </div>
                              )}

                              <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap mb-4 font-medium leading-relaxed bg-[var(--surface-sunken)]/40 p-3.5 rounded-lg border border-[var(--border-light)]">{msg.mensagem}</p>
                              
                              <div className="flex flex-wrap items-center gap-2.5 text-[10.5px] text-[var(--text-muted)] font-bold">
                                <span className="flex items-center gap-1 bg-[var(--surface-sunken)] px-2.5 py-1 rounded-md border border-[var(--border)]">
                                  <svg className="w-3.5 h-3.5 text-[var(--text-faint)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7C4.68 9.547 4.634 10.768 4.634 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.092-1.209.138-2.3-.138-3.662z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 10.5h6m-6 3h6" />
                                  </svg>
                                  {freqLabels[msg.frequencia] || msg.frequencia}
                                </span>

                                <span className="flex items-center gap-1 bg-[var(--surface-sunken)] px-2.5 py-1 rounded-md border border-[var(--border)]">
                                  <svg className="w-3.5 h-3.5 text-[var(--text-faint)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  às {msg.horario}
                                </span>

                                {msg.diasSemana && (
                                  <span className="flex items-center gap-1 bg-[var(--surface-sunken)] px-2.5 py-1 rounded-md border border-[var(--border)]">
                                    <svg className="w-3.5 h-3.5 text-[var(--text-faint)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.228 21h13.544A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.228 9h13.544A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                                    </svg>
                                    dias: {msg.diasSemana.split(',').map(d => d.trim().toUpperCase()).join(', ')}
                                  </span>
                                )}

                                {msg.ultimoEnvio && (
                                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 px-2.5 py-1 rounded-md border border-emerald-500/10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Último disparo: {new Date(msg.ultimoEnvio).toLocaleString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        ))}
                      </div>

                      {criandoNoGrupo === grupo.id ? (
                        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs">
                          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-light)]">
                            <span className="text-xs font-extrabold uppercase text-[#F40009] tracking-wider">Nova Mensagem Automática</span>
                            <button onClick={() => setCriandoNoGrupo(null)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold">Cancelar</button>
                          </div>
                          {renderForm(() => handleCriar(grupo), () => setCriandoNoGrupo(null))}
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => { setCriandoNoGrupo(grupo.id); setForm({ ...formVazio }); }} 
                          className="w-full flex items-center justify-center gap-2 text-xs font-bold text-[#F40009] hover:text-[#d10007] hover:bg-[#F40009]/5 py-3 border border-dashed border-[#F40009]/20 hover:border-[#F40009]/45 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.99]"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Adicionar mensagem automática
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Alert: messages in missing groups */}
            {msgsOrfas.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-5 animate-fadeIn">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h4 className="text-amber-800 dark:text-amber-400 font-bold text-[13.5px] tracking-tight">Grupos não encontrados neste número</h4>
                </div>
                <p className="text-[11.5px] text-amber-700/80 dark:text-amber-400/70 font-medium mb-4">Estas mensagens estão vinculadas a grupos que não constam no WhatsApp conectado. Pode ser que o número de WhatsApp tenha mudado ou que o grupo foi removido.</p>
                <div className="space-y-2">
                  {msgsOrfas.map((msg) => (
                    <div key={msg.id} className="bg-[var(--surface)] rounded-xl p-3.5 border border-amber-500/15 flex items-center justify-between gap-3 shadow-xs">
                      <div>
                        <span className="text-[var(--text-primary)] text-xs font-bold">{msg.nome}</span>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold mt-0.5 uppercase tracking-wide">Grupo: {msg.grupoNome || 'Sem Nome'} (Inexistente)</p>
                      </div>
                      <button 
                        onClick={() => handleDeletar(msg.id)} 
                        className="btn btn-danger btn-sm text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recently added group without messages yet */}
            {criandoNoGrupo && !gruposComMensagens.find((g) => g.id === criandoNoGrupo) && (() => {
              const grupo = grupos.find((g) => g.id === criandoNoGrupo);
              if (!grupo) return null;
              return (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm animate-fadeIn">
                  <div className="flex items-center gap-4 p-5">
                    {grupo.foto ? (
                      <img src={grupo.foto} alt="" className="w-11 h-11 rounded-full object-cover shrink-0 border border-[var(--border)]" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)]/10 flex items-center justify-center shrink-0">
                        <span className="text-[var(--brand)] text-base font-extrabold font-display">{grupo.nome.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-[var(--text-primary)] font-bold text-[14px]">{grupo.nome}</h4>
                      <p className="text-[10px] text-[var(--brand)] font-bold uppercase tracking-wider mt-0.5">Novo grupo adicionado</p>
                    </div>
                  </div>
                  <div className="border-t border-[var(--border-light)] p-5 bg-[var(--surface-sunken)]/20">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4.5">
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-light)]">
                        <span className="text-xs font-extrabold uppercase text-[#F40009] tracking-wider">Configurar primeira mensagem automática</span>
                        <button onClick={() => setCriandoNoGrupo(null)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold">Cancelar</button>
                      </div>
                      {renderForm(() => handleCriar(grupo), () => setCriandoNoGrupo(null))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Select Group Popup */}
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
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  value={buscaGrupo} 
                  onChange={(e) => setBuscaGrupo(e.target.value)} 
                  placeholder="Buscar grupo por nome..." 
                  autoFocus 
                  className="input pl-9.5 text-xs font-semibold" 
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
              {gruposFiltrados.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-faint)] font-bold text-xs">
                  {buscaGrupo ? 'Nenhum grupo encontrado' : 'Todos os grupos da conexão já possuem mensagens'}
                </div>
              ) : (
                <div className="space-y-1">
                  {gruposFiltrados.map((g) => (
                    <button 
                      key={g.id} 
                      type="button"
                      onClick={() => handleSelecionarGrupo(g)} 
                      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-[var(--surface-sunken)] transition-all duration-150 cursor-pointer text-left hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {g.foto ? (
                        <img src={g.foto} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-[var(--border)]" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)]/10 flex items-center justify-center shrink-0 font-extrabold text-[13px]">
                          {g.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[var(--text-primary)] font-bold text-xs truncate block">{g.nome}</span>
                        <span className="text-[9.5px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block mt-0.5">Grupo WhatsApp</span>
                      </div>
                      <div className="text-[var(--text-faint)] shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Alert Modal */}
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
