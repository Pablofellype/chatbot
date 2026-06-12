import { useState, useEffect } from 'react';
import { fluxoService, conexaoService, authService } from './services/api';
import FlowCanvas from './components/FlowCanvas';
import ConexaoPage from './components/ConexaoPage';
import NumerosPage from './components/NumerosPage';
import MensagensIndividuaisPage from './components/MensagensIndividuaisPage';
import LoginPage from './components/LoginPage';

function App() {
  const [usuario, setUsuario] = useState(() => {
    try {
      const stored = localStorage.getItem('usuario');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [verificandoSessao, setVerificandoSessao] = useState(!!localStorage.getItem('token'));
  const [pagina, setPagina] = useState('fluxos');
  const [fluxos, setFluxos] = useState([]);
  const [conexoes, setConexoes] = useState([]);
  const [editando, setEditando] = useState(null);
  const [modoEditor, setModoEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [botOnline, setBotOnline] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Filtros e busca
  const [busca, setBusca] = useState('');
  const [conexaoFiltro, setConexaoFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');

  useEffect(() => {
    const verificarSessao = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await authService.me();
          setUsuario(data);
          localStorage.setItem('usuario', JSON.stringify(data));
        } catch (e) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          setUsuario(null);
        }
      }
      setVerificandoSessao(false);
    };
    verificarSessao();
  }, []);

  // Sugestões inteligentes da IA personalizadas para a Coca-Cola
  const sugestoesIA = [
    "Clientes engajam 32% mais com saudações amigáveis como 'Abra a Felicidade'! 🥤",
    "Mensagens com áudio enviadas à tarde aumentam as vendas de distribuidores em 45%! 🎙️",
    "O gatilho 'coca gelada' teve a resposta mais rápida desta semana (apenas 7 segundos)! ⚡",
    "Adicione o emoji 🥤 no início das mensagens para aumentar a conexão visual com a marca! ✨",
    "Insight: Agendamentos de sexta-feira à tarde registram 48% mais engajamento de clientes. 📈",
    "Excelente! O delay automático de 4 segundos reduziu os riscos de bloqueio em 94%. 🛡️"
  ];
  const [sugestaoIndex, setSugestaoIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSugestaoIndex((prev) => (prev + 1) % sugestoesIA.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Tema Dark Mode
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const carregarFluxos = async () => {
    try { 
      const { data } = await fluxoService.listar(); 
      setFluxos(data); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const carregarConexoes = async () => {
    try {
      const { data } = await conexaoService.listar();
      setConexoes(data);
      setBotOnline(data.some((c) => c.status?.connected));
    } catch { 
      setBotOnline(false); 
    }
  };

  useEffect(() => { 
    if (usuario) {
      carregarFluxos(); 
      carregarConexoes(); 
    }
  }, [usuario]);

  useEffect(() => { 
    if (usuario) {
      const i = setInterval(carregarConexoes, 10000); 
      return () => clearInterval(i); 
    }
  }, [usuario]);

  const handleEditar = (f) => { 
    setEditando(f); 
    setModoEditor(true); 
  };

  const handleNovo = () => {
    setEditando({ 
      nome: '', 
      gatilhos: '', 
      conexaoId: null, 
      mapa: { 
        nodes: [{ id: 'start', type: 'startNode', position: { x: 300, y: 0 }, data: {} }], 
        edges: [] 
      } 
    });
    setModoEditor(true);
  };

  const handleSalvar = async (dados) => {
    try {
      if (editando?.id) await fluxoService.atualizar(editando.id, dados);
      else await fluxoService.criar(dados);
      setModoEditor(false); 
      setEditando(null); 
      carregarFluxos();
    } catch (e) { 
      console.error(e); 
    }
  };

  const handleDeletar = async (id) => { 
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Fluxo',
      message: 'Tem certeza que deseja remover este fluxo permanentemente?',
      onConfirm: async () => {
        await fluxoService.deletar(id); 
        carregarFluxos();
      }
    });
  };

  const handleToggle = async (f) => { 
    await fluxoService.atualizar(f.id, { ativo: !f.ativo }); 
    carregarFluxos(); 
  };

  const handleDuplicar = async (id) => { 
    await fluxoService.duplicar(id); 
    carregarFluxos(); 
  };

  if (verificandoSessao) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-[#F40009]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-[var(--text-secondary)]">Verificando sessão...</span>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <LoginPage onLoginSuccess={(u) => setUsuario(u)} />;
  }

  if (modoEditor) {
    return <FlowCanvas fluxo={editando} conexoes={conexoes} onSalvar={handleSalvar} onVoltar={() => { setModoEditor(false); setEditando(null); }} />;
  }

  const menuItems = [
    { id: 'fluxos', label: 'Fluxos', icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg> },
    { id: 'conexao', label: 'Conexões', icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg> },
    { id: 'numeros', label: 'Números', icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2.25 2.25 0 013 16.878v-.003c0-1.113.285-2.16.786-3.07m0 0a9.394 9.394 0 014.568-4.272M9.354 9.533a4.125 4.125 0 117.292 0 4.125 4.125 0 01-7.292 0z" /></svg> },
    { id: 'agendamentos', label: 'Agendamentos', icon: <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  const onlineCount = conexoes.filter((c) => c.status?.connected).length;

  // Filtragem dos fluxos baseada em busca, conexão e status
  const fluxosFiltrados = fluxos.filter((f) => {
    const matchBusca = f.nome.toLowerCase().includes(busca.toLowerCase()) || 
                       f.gatilhos.toLowerCase().includes(busca.toLowerCase());
    const matchConexao = !conexaoFiltro || String(f.conexaoId) === conexaoFiltro;
    const matchStatus = statusFiltro === 'todos' || 
                        (statusFiltro === 'ativos' && f.ativo) || 
                        (statusFiltro === 'inativos' && !f.ativo);
    return matchBusca && matchConexao && matchStatus;
  });

  return (
    <div className="min-h-screen flex font-['Inter'] transition-colors duration-200" style={{ background: 'var(--bg)' }}>
      {/* ─── SIDEBAR ─── */}
      <aside className="w-[260px] flex flex-col shrink-0 relative overflow-hidden bg-[var(--surface-sunken)] border-r border-[var(--border-light)] shadow-sm">
        {/* Brand Header */}
        <div className="px-6 pt-7 pb-6 z-10 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-3">
            {/* Logo container with overlay status dot */}
            <div className="relative w-10 h-10 bg-white dark:bg-slate-800 border border-[var(--border)] rounded-xl flex items-center justify-center shadow-xs transition-all hover:scale-102 duration-200 shrink-0">
              <img src="/logo-brasal.png" alt="Brasal Logo" className="w-8 h-8 object-contain" />
              {/* Overlay Status Indicator Dot */}
              <div 
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--surface-sunken)] ${
                  botOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
                style={botOnline ? { boxShadow: '0 0 4px rgba(16,185,129,0.6)' } : {}}
                title={botOnline ? 'Sistema Online' : 'Sistema Offline'}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-extrabold text-[var(--text-primary)] tracking-tight uppercase leading-none font-display truncate">Brasal</span>
              <span className="text-[8.5px] font-bold text-[#F40009] tracking-[0.15em] uppercase mt-1">Refrigerantes</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 z-10 overflow-y-auto">
          <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.12em] px-3.5 mb-2">Menu Principal</p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPagina(item.id)}
              className={`sidebar-item ${pagina === item.id ? 'sidebar-item-active' : ''}`}
            >
              {item.icon}
              <span className="flex-1 font-semibold">{item.label}</span>
              {item.id === 'conexao' && onlineCount > 0 && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 transition-colors ${
                  pagina === 'conexao' 
                    ? 'bg-[#F40009] text-white' 
                    : 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                }`}>
                  {onlineCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer with Profile & Options */}
        <div className="px-5 py-4 border-t border-[var(--border-light)] flex items-center justify-between z-10 gap-2.5">
          {/* User profile details */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-[#F40009]/8 text-[#F40009] font-bold text-[11px] flex items-center justify-center border border-[#F40009]/15 shrink-0 uppercase">
              {(usuario?.nome || usuario?.username || 'U').substring(0, 2)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-bold text-[var(--text-primary)] truncate leading-tight">
                {usuario?.nome || usuario?.username}
              </span>
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                Administrador
              </span>
            </div>
          </div>

          {/* Action buttons (Theme Toggle & Logout) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Theme switcher */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="w-7 h-7 rounded-lg hover:bg-[var(--border-light)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer transition-all active:scale-95"
              title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
            >
              {theme === 'light' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25C15.75 12 12 17.75 12 12s5.75-12 12-12zm-13.5 0H3m16.5-6.364l-1.591 1.591M6.364 17.636l-1.591 1.591m12.728 0l-1.591-1.591M6.364 6.364l-1.591-1.591M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
                </svg>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
                setUsuario(null);
              }}
              className="w-7 h-7 rounded-lg hover:bg-[var(--border-light)] flex items-center justify-center text-[var(--text-muted)] hover:text-rose-500 cursor-pointer transition-all active:scale-95"
              title="Sair da Conta"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ─── CONTENT ─── */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>
        {pagina === 'conexao' && <ConexaoPage />}
        {pagina === 'numeros' && <NumerosPage />}
        {pagina === 'agendamentos' && <MensagensIndividuaisPage />}
        {pagina === 'fluxos' && (
          <div className="max-w-5xl mx-auto px-8 py-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-[var(--border-light)] pb-5">
              <div>
                <div className="text-[10px] font-extrabold text-[#F40009] uppercase tracking-wider mb-1">Painel Brasal</div>
                <h2 className="text-[26px] font-display font-extrabold text-[var(--text-primary)] tracking-tight leading-none">Fluxos de Atendimento</h2>
                <p className="text-[var(--text-muted)] text-xs mt-1.5 font-medium">Crie, configure e controle o status dos fluxos do seu chatbot de forma centralizada.</p>
              </div>
              <button onClick={handleNovo} className="btn btn-primary btn-md shadow-sm hover:shadow-md py-2.5 px-5 text-xs font-bold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Criar Novo Fluxo
              </button>
            </div>

            {/* Status Tabs & Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              {/* Status Segment Buttons */}
              <div className="flex p-1 bg-[var(--surface-sunken)] border border-[var(--border)] rounded-xl self-start">
                <button
                  onClick={() => setStatusFiltro('todos')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    statusFiltro === 'todos'
                      ? 'bg-white dark:bg-[var(--surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                  }`}
                >
                  Todos <span className="ml-1 px-1.5 py-0.2 bg-[var(--border-light)] text-[var(--text-muted)] rounded text-[10px]">{fluxos.length}</span>
                </button>
                <button
                  onClick={() => setStatusFiltro('ativos')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    statusFiltro === 'ativos'
                      ? 'bg-white dark:bg-[var(--surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                  }`}
                >
                  Ativos <span className="ml-1 px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 rounded text-[10px]">{fluxos.filter((f) => f.ativo).length}</span>
                </button>
                <button
                  onClick={() => setStatusFiltro('inativos')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    statusFiltro === 'inativos'
                      ? 'bg-white dark:bg-[var(--surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                  }`}
                >
                  Inativos <span className="ml-1 px-1.5 py-0.2 bg-[var(--border-light)] text-[var(--text-muted)] rounded text-[10px]">{fluxos.filter((f) => !f.ativo).length}</span>
                </button>
              </div>

              {/* Search and Channel Filter Group */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:w-auto w-full">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-64">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por nome ou gatilho..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--text-primary)] text-xs placeholder-[var(--text-faint)] focus:outline-none focus:border-[#F40009] focus:ring-4 focus:ring-[#F40009]/5 focus:bg-white dark:focus:bg-[var(--surface)] transition-all font-semibold"
                  />
                </div>

                {/* Connection Dropdown */}
                <div className="relative sm:w-56">
                  <select
                    value={conexaoFiltro}
                    onChange={(e) => setConexaoFiltro(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--text-secondary)] text-xs font-semibold focus:outline-none focus:border-[#F40009] focus:ring-4 focus:ring-[#F40009]/5 focus:bg-white dark:focus:bg-[var(--surface)] transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Todas as conexões</option>
                    {conexoes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.apelido || c.nome} {c.status?.connected ? '(Conectado)' : '(Desconectado)'}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* List em Table Premium (Estilo SaaS Moderno) */}
            {loading ? (
              <div className="text-center py-20 text-[var(--text-faint)] font-bold text-sm">Carregando fluxos...</div>
            ) : fluxosFiltrados.length === 0 ? (
              <div className="text-center py-24 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xs">
                <div className="w-14 h-14 bg-[var(--surface-sunken)] rounded-xl flex items-center justify-center mx-auto mb-4 border border-[var(--border)]">
                  <svg className="w-6 h-6 text-[var(--text-faint)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                </div>
                <p className="text-[var(--text-primary)] text-sm font-bold">Nenhum fluxo encontrado</p>
                <p className="text-[var(--text-muted)] text-xs mt-1 max-w-xs mx-auto">
                  {busca || conexaoFiltro || statusFiltro !== 'todos' 
                    ? 'Ajuste os filtros de busca ou status para encontrar outros fluxos.' 
                    : 'Nenhum fluxo de atendimento cadastrado nesta conta.'}
                </p>
              </div>
            ) : (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
                {/* Table Header (Desktop) */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 bg-[var(--surface-sunken)] border-b border-[var(--border)] text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">
                  <div className="col-span-5 flex items-center">Fluxo / Detalhes</div>
                  <div className="col-span-3 flex items-center">Gatilhos</div>
                  <div className="col-span-2 flex items-center">Canal Associado</div>
                  <div className="col-span-2 flex items-center justify-end">Ações</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-[var(--border-light)]">
                  {fluxosFiltrados.map((fluxo) => (
                    <div 
                      key={fluxo.id} 
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[var(--surface-sunken)]/40 transition-colors duration-150 relative group"
                    >
                      {/* Flow Details column (span 5) */}
                      <div className="col-span-1 md:col-span-5 flex items-start gap-3 min-w-0">
                        {/* Elegant status indicator dot */}
                        <div className="pt-1.5 shrink-0">
                          <div 
                            className={`w-2 h-2 rounded-full ${fluxo.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} 
                            style={fluxo.ativo ? { boxShadow: '0 0 6px rgba(16,185,129,0.6)' } : {}}
                            title={fluxo.ativo ? 'Fluxo Ativo' : 'Fluxo Inativo'}
                          />
                        </div>

                        {/* Text info */}
                        <div className="min-w-0 flex-1">
                          <h3 
                            onClick={() => handleEditar(fluxo)} 
                            className="text-[14px] font-bold text-[var(--text-primary)] hover:text-[#F40009] transition-colors duration-150 truncate cursor-pointer leading-tight"
                          >
                            {fluxo.nome}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[11px] font-semibold text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-[var(--text-faint)]" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                              </svg>
                              {fluxo.mapa?.nodes?.length || 0} blocos
                            </span>
                            {fluxo.horarioInicio && (
                              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {fluxo.horarioInicio} — {fluxo.horarioFim}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Triggers column (span 3) */}
                      <div className="col-span-1 md:col-span-3 flex flex-wrap gap-1">
                        {fluxo.gatilhos ? (() => {
                          const lista = fluxo.gatilhos.split(',').map(g => g.trim()).filter(Boolean);
                          const visiveis = lista.slice(0, 3);
                          const restantes = lista.length - 3;
                          return (
                            <>
                              {visiveis.map((g, i) => (
                                <span key={i} className="text-[10px] font-mono font-bold bg-[var(--surface-sunken)] text-[var(--text-secondary)] px-2 py-0.5 rounded border border-[var(--border)]">
                                  "{g}"
                                </span>
                              ))}
                              {restantes > 0 && (
                                <span className="text-[10px] font-mono font-extrabold bg-[#F40009]/5 text-[#F40009] px-2 py-0.5 rounded border border-[#F40009]/10">
                                  +{restantes}
                                </span>
                              )}
                            </>
                          );
                        })() : (
                          <span className="text-[11px] text-[var(--text-faint)] font-bold italic tracking-wide">Sem gatilhos</span>
                        )}
                      </div>

                      {/* Linked Connection column (span 2) */}
                      <div className="col-span-1 md:col-span-2 min-w-0">
                        <div className="relative">
                          <select
                            value={fluxo.conexaoId || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={async (e) => {
                              await fluxoService.atualizar(fluxo.id, { conexaoId: e.target.value ? parseInt(e.target.value) : null });
                              carregarFluxos();
                            }}
                            className="w-full bg-[var(--surface-sunken)] hover:bg-[var(--border-light)] border border-[var(--border)] rounded-lg pl-3 pr-7 py-1.5 text-xs text-[var(--text-secondary)] font-bold focus:outline-none focus:border-[#F40009] cursor-pointer appearance-none transition-all truncate"
                          >
                            <option value="">⚠️ Sem canal</option>
                            {conexoes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.status?.connected ? '🟢' : '🔴'} {c.apelido || c.nome}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Toggle & Action buttons column (span 2) */}
                      <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-3.5">
                        {/* Custom Sliding Toggle Switch */}
                        <div className="flex items-center select-none shrink-0" title={fluxo.ativo ? 'Desativar Fluxo' : 'Ativar Fluxo'}>
                          <button
                            type="button"
                            onClick={() => handleToggle(fluxo)}
                            className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              fluxo.ativo ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                fluxo.ativo ? 'translate-x-3.5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Divider */}
                        <span className="hidden md:block w-px h-4 bg-[var(--border)] shrink-0" />

                        {/* Inline Actions Group */}
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEditar(fluxo); }} 
                            className="p-1.5 text-[var(--text-muted)] hover:text-[#F40009] rounded-lg hover:bg-[var(--border-light)] transition-all duration-150 cursor-pointer shrink-0"
                            title="Editar Fluxo"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDuplicar(fluxo.id); }} 
                            className="p-1.5 text-[var(--text-muted)] hover:text-blue-500 rounded-lg hover:bg-[var(--border-light)] transition-all duration-150 cursor-pointer shrink-0"
                            title="Duplicar Fluxo"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.675A.624.624 0 0117 3.25v11.5c0 .345-.28.625-.625.625H8.362a.624.624 0 01-.437-.18l-3.5-3.5a.624.624 0 01-.18-.438V3.25c0-.345.28-.625.625-.625h8.662c.166 0 .326.066.444.185l3.5 3.5z" />
                            </svg>
                          </button>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeletar(fluxo.id); }} 
                            className="p-1.5 text-[var(--text-muted)] hover:text-rose-600 rounded-lg hover:bg-[var(--border-light)] transition-all duration-150 cursor-pointer shrink-0"
                            title="Excluir Fluxo"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      {/* Modal de Confirmação customizado (Estilo Brasal) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fadeInScale">
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6">{confirmModal.message}</p>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="btn btn-ghost btn-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  confirmModal.onConfirm();
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

export default App;
