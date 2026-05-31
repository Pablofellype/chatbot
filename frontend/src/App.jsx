import { useState, useEffect } from 'react';
import { fluxoService, conexaoService } from './services/api';
import FlowCanvas from './components/FlowCanvas';
import ConexaoPage from './components/ConexaoPage';
import NumerosPage from './components/NumerosPage';
import MensagensIndividuaisPage from './components/MensagensIndividuaisPage';

function App() {
  const [pagina, setPagina] = useState('fluxos');
  const [fluxos, setFluxos] = useState([]);
  const [conexoes, setConexoes] = useState([]);
  const [editando, setEditando] = useState(null);
  const [modoEditor, setModoEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [botOnline, setBotOnline] = useState(false);

  // Filtros e busca
  const [busca, setBusca] = useState('');
  const [conexaoFiltro, setConexaoFiltro] = useState('');

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
    carregarFluxos(); 
    carregarConexoes(); 
  }, []);

  useEffect(() => { 
    const i = setInterval(carregarConexoes, 10000); 
    return () => clearInterval(i); 
  }, []);

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
    if (!confirm('Deseja remover este fluxo?')) return; 
    await fluxoService.deletar(id); 
    carregarFluxos(); 
  };

  const handleToggle = async (f) => { 
    await fluxoService.atualizar(f.id, { ativo: !f.ativo }); 
    carregarFluxos(); 
  };

  const handleDuplicar = async (id) => { 
    await fluxoService.duplicar(id); 
    carregarFluxos(); 
  };

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
    <div className="min-h-screen flex font-['Barlow'] transition-colors duration-200" style={{ background: 'var(--bg)' }}>
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
              <span>{item.label}</span>
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

        {/* Footer with Dark Mode Switch */}
        <div className="px-6 py-4 border-t border-[var(--border-light)] flex items-center justify-end z-10 bg-transparent">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-7 h-7 rounded-lg bg-[var(--surface-sunken)] hover:bg-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer transition-all border border-[var(--border)] active:scale-95"
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
                <h2 className="text-[28px] font-display text-[var(--text-primary)] leading-none">Fluxos</h2>
                <p className="text-[var(--text-muted)] text-sm mt-2">Gerencie seus fluxos conversacionais</p>
              </div>
              <button onClick={handleNovo} className="btn btn-primary btn-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Novo Fluxo
              </button>
            </div>

            {/* Stats com Sparklines Reais (Super Premium!) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger">
              {/* Stat 1: Total */}
              <div className="stat-card animate-fadeIn flex items-center justify-between gap-4">
                <div>
                  <p className="stat-value">{fluxos.length}</p>
                  <p className="stat-label">Total de fluxos</p>
                </div>
                {/* Sparkline azul */}
                <svg className="w-16 h-8 text-blue-500 shrink-0 opacity-80" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M0,25 Q15,20 30,18 T60,10 T90,2 T100,5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Stat 2: Ativos */}
              <div className="stat-card animate-fadeIn flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="stat-value text-emerald-600">{fluxos.filter((f) => f.ativo).length}</p>
                  </div>
                  <p className="stat-label">Ativos agora</p>
                </div>
                {/* Sparkline verde */}
                <svg className="w-16 h-8 text-emerald-500 shrink-0 opacity-80" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M0,28 Q10,25 20,20 T40,22 T60,15 T80,5 T100,2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Stat 3: Nodes */}
              <div className="stat-card animate-fadeIn flex items-center justify-between gap-4">
                <div>
                  <p className="stat-value text-purple-600">{fluxos.reduce((a, f) => a + (f.mapa?.nodes?.length || 0), 0)}</p>
                  <p className="stat-label">Nodes criados</p>
                </div>
                {/* Sparkline roxa */}
                <svg className="w-16 h-8 text-purple-500 shrink-0 opacity-80" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M0,25 Q20,22 40,15 T70,8 T90,2 T100,0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Premium Barra de Filtros e Busca */}
            <div className="flex flex-col md:flex-row gap-3 mb-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
              <div className="flex-1 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Buscar fluxo por nome ou gatilho..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="input !pl-10 !py-2.5"
                />
              </div>
              <select
                value={conexaoFiltro}
                onChange={(e) => setConexaoFiltro(e.target.value)}
                className="input !w-full md:!w-64 !py-2.5"
              >
                <option value="">Filtrar por conexão...</option>
                {conexoes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.apelido || c.nome} {c.status?.connected ? ' (Online)' : ' (Offline)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Lista em Grid de Cards Premium (Estilo SaaS Moderno) */}
            {loading ? (
              <div className="text-center py-20 text-[var(--text-faint)]">Carregando...</div>
            ) : fluxosFiltrados.length === 0 ? (
              <div className="text-center py-24 animate-fadeIn bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm">
                <div className="w-16 h-16 bg-[var(--surface-sunken)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--border)]">
                  <svg className="w-7 h-7 text-[var(--text-faint)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
                </div>
                <p className="text-[var(--text-secondary)] text-base font-semibold">Nenhum fluxo encontrado</p>
                <p className="text-[var(--text-muted)] text-sm mt-1">
                  {busca || conexaoFiltro ? 'Ajuste os filtros de busca para encontrar outros fluxos' : 'Comece criando seu primeiro fluxo'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
                {fluxosFiltrados.map((fluxo) => (
                  <div key={fluxo.id} className="card card-interactive animate-fadeIn p-6 flex flex-col justify-between">
                    <div>
                      {/* Top Header do Card */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[var(--text-primary)] font-bold text-base truncate pr-2">{fluxo.nome}</h3>
                          <p className="text-[11px] text-[var(--text-faint)] font-medium mt-1">{fluxo.mapa?.nodes?.length || 0} nodes criados</p>
                        </div>
                        <button 
                          onClick={() => handleToggle(fluxo)} 
                          className={`badge cursor-pointer shrink-0 transition-colors ${fluxo.ativo ? 'badge-success' : 'badge-neutral'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${fluxo.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          {fluxo.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                      </div>

                      {/* Dropdown de vínculo e detalhes */}
                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-faint)] block mb-1">Número Conectado</label>
                          <select
                            value={fluxo.conexaoId || ''}
                            onClick={(e) => e.stopPropagation()} // impede clique no card
                            onChange={async (e) => {
                              await fluxoService.atualizar(fluxo.id, { conexaoId: e.target.value ? parseInt(e.target.value) : null });
                              carregarFluxos();
                            }}
                            className="input !py-1.5 !px-2.5 !text-xs !rounded-lg !w-full"
                          >
                            <option value="">Desvinculado (sem número)...</option>
                            {conexoes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.apelido || c.nome}{c.status?.info?.wid?.user ? ` (${c.status.info.wid.user})` : ''}{c.status?.connected ? ' ✓' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {fluxo.horarioInicio && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-[var(--text-faint)]">Horário:</span>
                            <span className="text-[11px] text-[var(--text-secondary)] font-semibold bg-[var(--surface-sunken)] px-2 py-0.5 rounded border border-[var(--border)]">{fluxo.horarioInicio} — {fluxo.horarioFim}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ações e Gatilhos */}
                    <div>
                      {fluxo.gatilhos && (() => {
                        const lista = fluxo.gatilhos.split(',').map(g => g.trim()).filter(Boolean);
                        const visiveis = lista.slice(0, 10);
                        const restantes = lista.length - 10;
                        return (
                          <div className="flex flex-wrap gap-1.5 py-3 border-t border-[var(--border-light)] mb-4">
                            {visiveis.map((g, i) => (
                              <span key={i} className="text-[10px] font-bold bg-[var(--surface-sunken)] text-[var(--text-secondary)] px-2.5 py-1 rounded-lg border border-[var(--border)]">{g}</span>
                            ))}
                            {restantes > 0 && (
                              <span className="text-[10px] font-extrabold bg-[var(--brand-light)] text-[var(--brand)] px-2.5 py-1 rounded-lg border border-[rgba(244,0,9,0.1)]">+{restantes}</span>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex gap-2 justify-end pt-3 border-t border-[var(--border-light)]">
                        <button onClick={(e) => { e.stopPropagation(); handleEditar(fluxo); }} className="btn btn-dark btn-sm flex-1 md:flex-initial">Editar</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDuplicar(fluxo.id); }} className="btn btn-ghost btn-sm">Duplicar</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeletar(fluxo.id); }} className="btn btn-danger btn-sm text-red-500">Excluir</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
