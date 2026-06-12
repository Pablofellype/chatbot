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

  // Filtragem dos fluxos baseada em busca e conexão
  const fluxosFiltrados = fluxos.filter((f) => {
    const matchBusca = f.nome.toLowerCase().includes(busca.toLowerCase()) || 
                       f.gatilhos.toLowerCase().includes(busca.toLowerCase());
    const matchConexao = !conexaoFiltro || String(f.conexaoId) === conexaoFiltro;
    return matchBusca && matchConexao;
  });

  return (
    <div className="min-h-screen flex font-['Inter'] transition-colors duration-200" style={{ background: 'var(--bg)' }}>
      {/* ─── SIDEBAR ─── */}
      <aside className="w-[260px] flex flex-col shrink-0 relative overflow-hidden">
        {/* Brand Header */}
        <div className="px-6 pt-7 pb-6 z-10 border-b border-[var(--border-light)] relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white border border-[var(--border)] rounded-xl flex items-center justify-center relative overflow-hidden shadow-sm transition-all hover:scale-105 duration-200">
              <img src="/logo-brasal.png" alt="Brasal Logo" className="w-9 h-9 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-[16px] font-extrabold text-[var(--text-primary)] tracking-tight uppercase leading-none font-display">Brasal</span>
              <span className="text-[9px] font-bold text-[#F40009] tracking-[0.12em] uppercase mt-0.5">Refrigerantes</span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className={`w-[7px] h-[7px] rounded-full ${botOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} style={botOnline ? { boxShadow: '0 0 6px rgba(16,185,129,0.5)' } : {}} />
                <span className={`text-[11px] font-semibold tracking-wide ${botOnline ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {botOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 z-10 overflow-y-auto">
          <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-[0.1em] px-3 mb-2">Menu</p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPagina(item.id)}
              className={`sidebar-item ${pagina === item.id ? 'sidebar-item-active' : ''}`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.id === 'conexao' && onlineCount > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  pagina === 'conexao' 
                    ? 'bg-white text-[#F40009]' 
                    : 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                }`}>
                  {onlineCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Elegant glowing ribbon wave */}
        <div className="absolute bottom-16 left-0 w-full overflow-hidden pointer-events-none opacity-[0.06] select-none h-16 z-0">
          <svg className="absolute bottom-0 left-0 w-[120%] text-[#F40009]" viewBox="0 0 220 60" fill="currentColor">
            <path d="M0,25 Q60,45 120,20 T240,25 L240,60 L0,60 Z" />
            <path d="M0,35 Q60,50 120,35 T240,40 L240,60 L0,60 Z" opacity="0.4" />
          </svg>
        </div>

        {/* Footer with User Info, Logout & Dark Mode Switch */}
        <div className="px-6 py-4 border-t border-[var(--border-light)] flex items-center justify-between z-10 bg-transparent gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-bold text-[var(--text-primary)] truncate">
              {usuario?.nome || usuario?.username}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
                setUsuario(null);
              }}
              className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 mt-0.5 cursor-pointer transition-colors active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Sair
            </button>
          </div>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-7 h-7 rounded-lg bg-[var(--surface-sunken)] hover:bg-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer transition-all border border-[var(--border)] active:scale-95 shrink-0"
            title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
          >
            {theme === 'light' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25C17.75 12 12 17.75 12 12s5.75-12 12-12zm-13.5 0H3m16.5-6.364l-1.591 1.591M6.364 17.636l-1.591 1.591m12.728 0l-1.591-1.591M6.364 6.364l-1.591-1.591M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
              </svg>
            )}
          </button>
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-[28px] font-display font-extrabold text-[#0F172A] tracking-tight leading-none">Fluxos de Atendimento</h2>
                <p className="text-[var(--text-muted)] text-sm mt-2">Crie, duplique e controle a ativação dos seus fluxos de chatbot.</p>
              </div>
              <button onClick={handleNovo} className="btn btn-primary btn-lg shadow-md hover:shadow-lg">
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Criar Novo Fluxo
              </button>
            </div>

            {/* Insights Bar */}
            <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-red-50/60 to-white border border-[#E2E8F0] dark:from-[#180506]/35 dark:to-[#0f172a] shadow-xs flex items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-[#F40009]/10 rounded-xl flex items-center justify-center shrink-0 border border-[#F40009]/20 shadow-xs">
                  <svg className="w-5.5 h-5.5 text-[#F40009]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-1.5-1.5M9 21l1.5-1.5m3.313-3.596L15 21m0 0l-1.5-1.5M15 21l1.5-1.5" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#F40009]">Dica de Desempenho</h4>
                  <p className="text-xs text-[var(--text-secondary)] font-medium mt-1 transition-all duration-300">
                    {sugestoesIA[sugestaoIndex]}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 bg-[var(--surface-sunken)] px-3 py-1.5 rounded-xl border border-[var(--border)] text-[9px] font-extrabold text-[var(--text-secondary)] shrink-0 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F40009]" />
                Insight Ativo
              </div>
            </div>

            {/* Stats Metric Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
              {/* Stat 1: Total de Fluxos */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs flex items-center justify-between transition-all hover:shadow-md hover:border-[#F40009]/20">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#94A3B8]">Total de Fluxos</p>
                  <p className="text-3xl font-extrabold text-[#0F172A] font-display">{fluxos.length}</p>
                  <span className="text-[10px] font-semibold text-[#64748B] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Fluxos configurados
                  </span>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 border border-blue-100">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                </div>
              </div>

              {/* Stat 2: Fluxos Ativos */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs flex items-center justify-between transition-all hover:shadow-md hover:border-[#F40009]/20">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#94A3B8]">Fluxos Ativos</p>
                  <p className="text-3xl font-extrabold text-emerald-600 font-display">
                    {fluxos.filter((f) => f.ativo).length}
                  </p>
                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Em execução no momento
                  </span>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* Stat 3: Total de Nodes */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs flex items-center justify-between transition-all hover:shadow-md hover:border-[#F40009]/20">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#94A3B8]">Elementos do Mapa</p>
                  <p className="text-3xl font-extrabold text-[#F40009] font-display">
                    {fluxos.reduce((a, f) => a + (f.mapa?.nodes?.length || 0), 0)}
                  </p>
                  <span className="text-[10px] font-semibold text-[#64748B] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F40009]" />
                    Total de blocos integrados
                  </span>
                </div>
                <div className="w-12 h-12 bg-[#F40009]/5 rounded-xl flex items-center justify-center text-[#F40009] border border-[#F40009]/10">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.97 5.97 0 00-.75-2.985m-.75-10.378a3 3 0 11-6 0 3 3 0 016 0zm-3 8.25a8.985 8.985 0 00-6 2.512m0 0A8.987 8.987 0 0118 18m-12 0A8.967 8.967 0 0118 18" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Buscar fluxos por nome ou palavra-chave de gatilho..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-[#F40009] focus:ring-4 focus:ring-[#F40009]/5 focus:bg-white transition-all font-medium"
                />
              </div>
              <div className="relative md:w-72">
                <select
                  value={conexaoFiltro}
                  onChange={(e) => setConexaoFiltro(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#334155] text-sm focus:outline-none focus:border-[#F40009] focus:ring-4 focus:ring-[#F40009]/5 focus:bg-white transition-all font-semibold appearance-none cursor-pointer"
                >
                  <option value="">Filtrar por conexão...</option>
                  {conexoes.map((c) => (
                    <option key={c.id} value={c.id}>
                      📞 {c.apelido || c.nome} {c.status?.connected ? '(Conectado)' : '(Desconectado)'}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* List em Grid de Cards Premium (Estilo SaaS Moderno) */}
            {loading ? (
              <div className="text-center py-20 text-[var(--text-faint)]">Carregando fluxos...</div>
            ) : fluxosFiltrados.length === 0 ? (
              <div className="text-center py-24 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs">
                <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#E2E8F0]">
                  <svg className="w-7 h-7 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                </div>
                <p className="text-[#334155] text-base font-bold">Nenhum fluxo encontrado</p>
                <p className="text-[#64748B] text-sm mt-1">
                  {busca || conexaoFiltro ? 'Ajuste os filtros de busca para encontrar outros fluxos.' : 'Comece criando o seu primeiro fluxo de atendimento.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
                {fluxosFiltrados.map((fluxo) => (
                  <div key={fluxo.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative group shadow-xs">
                    {/* Brand top indicator bar (visible on hover) */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-transparent group-hover:bg-[#F40009] transition-all rounded-t-2xl duration-200" />

                    <div>
                      {/* Card Top: Title & Custom Sliding Switch */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="min-w-0">
                          <h3 className="text-[#0F172A] font-bold text-base tracking-tight pr-2 group-hover:text-[#F40009] transition-colors duration-200 truncate">
                            {fluxo.nome}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]" />
                            <span className="text-[11px] text-[#64748B] font-semibold">{fluxo.mapa?.nodes?.length || 0} elementos no fluxo</span>
                          </div>
                        </div>
                        
                        {/* Custom Sliding Toggle Switch */}
                        <div className="flex items-center gap-2.5 shrink-0 select-none">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider transition-colors duration-200 ${fluxo.ativo ? 'text-emerald-600' : 'text-[#94A3B8]'}`}>
                            {fluxo.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggle(fluxo)}
                            className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              fluxo.ativo ? 'bg-emerald-500' : 'bg-[#E2E8F0]'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                                fluxo.ativo ? 'translate-x-4.5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Dropdown Vínculo Número */}
                      <div className="space-y-3.5 mb-5 bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]/80">
                        <div>
                          <label className="text-[9px] uppercase tracking-widest font-extrabold text-[#94A3B8] block mb-2">Canal Vinculado</label>
                          <div className="relative">
                            <select
                              value={fluxo.conexaoId || ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={async (e) => {
                                await fluxoService.atualizar(fluxo.id, { conexaoId: e.target.value ? parseInt(e.target.value) : null });
                                carregarFluxos();
                              }}
                              className="w-full bg-white border border-[#CBD5E1] rounded-lg pl-3 pr-8 py-2 text-xs text-[#334155] font-semibold focus:outline-none focus:border-[#F40009] focus:ring-4 focus:ring-[#F40009]/5 cursor-pointer transition-all appearance-none"
                            >
                              <option value="">⚠️ Sem número associado...</option>
                              {conexoes.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.status?.connected ? '🟢' : '🔴'} {c.apelido || c.nome} {c.status?.info?.wid?.user ? `(${c.status.info.wid.user})` : ''}
                                </option>
                              ))}
                            </select>
                            {/* Down arrow decorator */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {fluxo.horarioInicio && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#475569] pt-1">
                            <svg className="w-4.5 h-4.5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Funcionamento:</span>
                            <span className="text-[10.5px] bg-white text-[#F40009] px-2 py-0.5 rounded border border-[#E2E8F0] font-bold">{fluxo.horarioInicio} — {fluxo.horarioFim}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Triggers & Bottom Action Buttons */}
                    <div>
                      {fluxo.gatilhos && (() => {
                        const lista = fluxo.gatilhos.split(',').map(g => g.trim()).filter(Boolean);
                        const visiveis = lista.slice(0, 5);
                        const restantes = lista.length - 5;
                        return (
                          <div className="flex flex-wrap gap-1.5 py-4 border-t border-[#E2E8F0] mb-4">
                            {visiveis.map((g, i) => (
                              <span key={i} className="text-[10.5px] font-mono font-bold bg-[#F8FAFC] text-[#334155] px-2.5 py-1 rounded-lg border border-[#E2E8F0] shadow-xs">
                                "{g}"
                              </span>
                            ))}
                            {restantes > 0 && (
                              <span className="text-[10.5px] font-extrabold bg-[#F40009]/5 text-[#F40009] px-2.5 py-1 rounded-lg border border-[#F40009]/10">
                                +{restantes}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex gap-2 justify-end pt-3.5 border-t border-[#E2E8F0]">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditar(fluxo); }} 
                          className="btn btn-primary btn-sm flex-1 font-bold shadow-sm"
                        >
                          Editar Fluxo
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDuplicar(fluxo.id); }} 
                          className="btn btn-ghost btn-sm text-[#475569] font-bold"
                        >
                          Duplicar
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeletar(fluxo.id); }} 
                          className="btn btn-danger btn-sm text-red-600 font-bold hover:bg-red-50/75"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
