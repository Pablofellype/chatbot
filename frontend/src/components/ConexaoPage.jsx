import { useState, useEffect } from 'react';
import { conexaoService } from '../services/api';

export default function ConexaoPage() {
  const [conexoes, setConexoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoNome, setNovoNome] = useState('');
  const [criando, setCriando] = useState(false);
  const [editandoNome, setEditandoNome] = useState(null);
  const [novoNomeEdit, setNovoNomeEdit] = useState('');
  const [editandoApelido, setEditandoApelido] = useState(null);
  const [novoApelido, setNovoApelido] = useState('');
  const [adicionandoNumero, setAdicionandoNumero] = useState(null);
  const [apelidoNovo, setApelidoNovo] = useState('');
  const [editandoSenha, setEditandoSenha] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');

  const carregar = async () => {
    try {
      const { data } = await conexaoService.listar();
      setConexoes(data);
    } catch { setConexoes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCriar = async () => {
    if (!novoNome.trim()) return;
    setCriando(true);
    try {
      await conexaoService.criar({ nome: novoNome.trim() });
      setNovoNome('');
      carregar();
    } catch (e) { console.error(e); }
    finally { setCriando(false); }
  };

  const handleAdicionarNumero = async (nomeSetor) => {
    try {
      await conexaoService.criar({ nome: nomeSetor, apelido: apelidoNovo.trim() || null });
      setAdicionandoNumero(null);
      setApelidoNovo('');
      carregar();
    } catch (e) { console.error(e); }
  };

  const handleLogout = async (id) => {
    if (!confirm('Desconectar este WhatsApp?')) return;
    await conexaoService.logout(id);
    carregar();
  };

  const handleReconectar = async (id) => {
    await conexaoService.reconectar(id);
    carregar();
  };

  const handleDeletar = async (id) => {
    if (!confirm('Remover esta conexao?')) return;
    await conexaoService.deletar(id);
    carregar();
  };

  const salvarNome = async (setor, novoNome) => {
    const conDoSetor = conexoes.filter((c) => c.nome === setor);
    for (const c of conDoSetor) {
      await conexaoService.atualizar(c.id, { nome: novoNome });
    }
    setEditandoNome(null);
    carregar();
  };

  const salvarApelido = async (id) => {
    await conexaoService.atualizar(id, { apelido: novoApelido.trim() || null });
    setEditandoApelido(null);
    carregar();
  };

  // Agrupar conexoes por nome (setor)
  const setores = {};
  conexoes.forEach((c) => {
    if (!setores[c.nome]) setores[c.nome] = [];
    setores[c.nome].push(c);
  });

  if (loading) return <div className="flex items-center justify-center h-full text-[var(--text-faint)]">Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-[28px] font-display text-[var(--text-primary)] leading-none">Conexoes WhatsApp</h2>
          <p className="text-[var(--text-muted)] text-sm mt-2">Gerencie setores e multiplos numeros</p>
        </div>
      </div>

      {/* Nova conexao */}
      <div className="card p-5 mb-6">
        <h3 className="text-[var(--text-primary)] font-semibold mb-3 text-sm">Novo Setor</h3>
        <div className="flex gap-3">
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCriar()}
            placeholder="Nome do setor (ex: Vendas, Suporte, RH)"
            className="input flex-1"
          />
          <button onClick={handleCriar} disabled={criando || !novoNome.trim()} className="btn btn-primary btn-md">
            {criando ? 'Criando...' : '+ Adicionar'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 stagger">
        <div className="stat-card animate-fadeIn">
          <p className="stat-value">{Object.keys(setores).length}</p>
          <p className="stat-label">Setores</p>
        </div>
        <div className="stat-card animate-fadeIn">
          <p className="stat-value text-emerald-600">{conexoes.filter((c) => c.status?.connected).length}</p>
          <p className="stat-label">Online</p>
        </div>
        <div className="stat-card animate-fadeIn">
          <p className="stat-value">{conexoes.length}</p>
          <p className="stat-label">Numeros</p>
        </div>
      </div>

      {/* Cards por setor */}
      {Object.keys(setores).length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--text-faint)] text-lg">Nenhuma conexao</p>
          <p className="text-[var(--text-muted)] text-sm mt-1">Adicione seu primeiro setor acima</p>
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {Object.entries(setores).map(([setor, conns]) => (
            <div key={setor} className="card overflow-hidden animate-fadeIn">
              {/* Header do setor */}
              <div className="px-6 py-4 border-b border-[var(--border-light)] flex items-center justify-between">
                {editandoNome === setor ? (
                  <div className="flex items-center gap-2">
                    <input value={novoNomeEdit} onChange={(e) => setNovoNomeEdit(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') salvarNome(setor, novoNomeEdit); if (e.key === 'Escape') setEditandoNome(null); }} autoFocus className="input w-56" />
                    <button onClick={() => salvarNome(setor, novoNomeEdit)} className="btn btn-dark btn-sm">Salvar</button>
                    <button onClick={() => setEditandoNome(null)} className="btn btn-ghost btn-sm">Cancelar</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{setor}</h3>
                    <button onClick={() => { setEditandoNome(setor); setNovoNomeEdit(setor); }} className="text-[var(--text-faint)] hover:text-[#e41e26] text-xs cursor-pointer transition-colors">editar</button>
                    <span className="badge badge-neutral">{conns.length} numero(s)</span>
                  </div>
                )}
              </div>

              {/* Lista de numeros */}
              <div className="divide-y divide-[var(--border-light)]">
                {conns.map((conexao) => {
                  const initializing = !conexao.status?.connected && !conexao.status?.qrCode && !conexao.status?.qrGenerated;

                  return (
                    <div key={conexao.id} className={`px-6 py-5 ${conexao.status?.connected ? 'border-l-[3px] border-l-emerald-500' : 'border-l-[3px] border-l-slate-300'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${conexao.status?.connected ? 'bg-emerald-500 animate-pulse' : conexao.status?.qrGenerated ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              {editandoApelido === conexao.id ? (
                                <div className="flex items-center gap-2">
                                  <input value={novoApelido} onChange={(e) => setNovoApelido(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') salvarApelido(conexao.id); if (e.key === 'Escape') setEditandoApelido(null); }} autoFocus placeholder="Nome do responsavel" className="input w-44" />
                                  <button onClick={() => salvarApelido(conexao.id)} className="btn btn-dark btn-sm">OK</button>
                                  <button onClick={() => setEditandoApelido(null)} className="btn btn-ghost btn-sm">x</button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-[var(--text-primary)] font-medium text-sm">
                                    {conexao.apelido || (conexao.status?.connected ? (conexao.status.pushname || conexao.status.info?.wid?.user) : 'Sem nome')}
                                  </span>
                                  <button onClick={() => { setEditandoApelido(conexao.id); setNovoApelido(conexao.apelido || ''); }} className="text-[var(--text-faint)] hover:text-[#e41e26] text-[10px] cursor-pointer transition-colors">nomear</button>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-faint)] mt-0.5">
                              {conexao.status?.connected
                                ? `${conexao.status.info?.wid?.user || ''} — ${conexao.status.deviceInfo?.manufacturer ? `${conexao.status.deviceInfo.manufacturer} ${conexao.status.deviceInfo.model}` : conexao.status.info?.platform || 'WhatsApp'}`
                                : conexao.status?.qrGenerated
                                ? 'Aguardando QR Code...'
                                : 'Desconectado'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {conexao.status?.connected && (
                            <span className="badge badge-success">Online</span>
                          )}
                          {conexao.status?.connected ? (
                            <button onClick={() => handleLogout(conexao.id)} className="btn btn-ghost btn-sm">Desconectar</button>
                          ) : (
                            <button onClick={() => handleReconectar(conexao.id)} className="btn btn-dark btn-sm">Reconectar</button>
                          )}
                          <button onClick={() => handleDeletar(conexao.id)} className="btn btn-danger btn-sm">Remover</button>
                          <button onClick={() => { setEditandoSenha(editandoSenha === conexao.id ? null : conexao.id); setNovaSenha(''); }} className={`${conexao.senha ? 'badge badge-success cursor-pointer' : 'btn btn-ghost btn-sm'}`}>
                            {conexao.senha ? 'Senha ativa' : 'Definir senha'}
                          </button>
                        </div>
                      </div>
                      
                      {/* Definir/alterar senha */}
                      {editandoSenha === conexao.id && (
                        <div className="mt-3 flex items-center gap-2">
                          <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} onKeyDown={async (e) => { if (e.key === 'Enter' && novaSenha) { await conexaoService.atualizar(conexao.id, { senha: novaSenha }); setEditandoSenha(null); carregar(); } }} placeholder="Nova senha para msgs automaticas" autoFocus className="input w-56" />
                          <button onClick={async () => { if (novaSenha) { await conexaoService.atualizar(conexao.id, { senha: novaSenha }); setEditandoSenha(null); carregar(); } }} className="btn btn-dark btn-sm">Salvar</button>
                          {conexao.senha && <button onClick={async () => { await conexaoService.atualizar(conexao.id, { senha: null }); setEditandoSenha(null); carregar(); }} className="btn btn-danger btn-sm">Remover senha</button>}
                          <button onClick={() => setEditandoSenha(null)} className="btn btn-ghost btn-sm">Cancelar</button>
                        </div>
                      )}

                      {/* --- ETAPAS DE PAREAMENTO PREMIUM --- */}

                      {/* Passo 1: Inicializando */}
                      {initializing && !conexao.status?.connected && (
                        <div className="mt-4 bg-[var(--surface-sunken)] border border-[var(--border)] border-dashed rounded-2xl p-6 text-center animate-pulse">
                          <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-[var(--brand)] animate-spin mx-auto mb-3" />
                          <h4 className="text-xs font-bold text-[var(--text-primary)]">Passo 1: Gerando conexão segura...</h4>
                          <p className="text-[var(--text-faint)] text-[10px] mt-1">Preparando o ambiente para o seu QR Code. Aguarde alguns segundos.</p>
                        </div>
                      )}

                      {/* Passo 2: QR Code gerado */}
                      {conexao.status?.qrCode && !conexao.status?.connected && (
                        <div className="mt-4 bg-[var(--surface-sunken)] border border-[var(--border)] rounded-2xl p-6 text-center animate-fadeIn">
                          <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1">Passo 2: Escaneie o QR Code</h4>
                          <p className="text-[var(--text-muted)] text-[10px] mb-4">Abra o WhatsApp no celular → Aparelhos conectados → Conectar aparelho</p>
                          
                          <div className="relative inline-block card p-3 bg-white border border-[var(--border)] shadow-md overflow-hidden group rounded-xl">
                            {/* Linha laser piscante */}
                            <div className="absolute left-0 top-0 w-full h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce" style={{ animationDuration: '3s' }} />
                            
                            <img src={conexao.status.qrCode} alt="QR Code" className="w-44 h-44 relative z-10 transition-transform duration-200 group-hover:scale-[1.02]" />
                          </div>
                          
                          <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-[var(--text-secondary)] font-medium bg-[var(--surface)] border border-[var(--border)] py-1.5 px-3 rounded-lg inline-flex">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Aguardando leitura do celular...
                          </div>
                        </div>
                      )}

                      {/* Passo 3: Card de Status Celular Ultra Polido (Conectado) */}
                      {conexao.status?.connected && (
                        <div className="mt-4 bg-[var(--surface-sunken)] border border-[var(--border)] rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 animate-fadeIn">
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            {conexao.status?.avatarUrl ? (
                              <img
                                src={conexao.status.avatarUrl}
                                alt="Avatar"
                                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500 shadow-sm text-emerald-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                                </svg>
                              </div>
                            )}
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[var(--surface-sunken)] rounded-full animate-pulse" />
                          </div>

                          {/* Device Info */}
                          <div className="flex-1 text-center md:text-left">
                            <h4 className="text-sm font-bold text-[var(--text-primary)]">
                              {conexao.apelido || conexao.status?.pushname || 'Dispositivo Conectado'}
                            </h4>
                            <p className="text-[11px] text-[var(--text-muted)] mt-1 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                              <span className="flex items-center gap-1 font-medium">
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                                </svg>
                                {conexao.status?.deviceInfo?.manufacturer 
                                  ? `${conexao.status.deviceInfo.manufacturer} ${conexao.status.deviceInfo.model}`
                                  : conexao.status?.info?.platform || 'Smartphone'}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Conectado com Sucesso
                              </span>
                            </p>
                          </div>

                          {/* Battery status bar */}
                          <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 rounded-xl shadow-xs shrink-0 select-none">
                            <div className="relative w-6 h-3.5 border border-[var(--text-muted)] rounded-[3px] p-[1px] flex items-center">
                              <div className="h-full bg-emerald-500 rounded-[1px] w-[88%]" />
                              <div className="absolute -right-[2px] top-1/2 -translate-y-1/2 w-[1.5px] h-[3px] bg-[var(--text-muted)] rounded-r-[1px]" />
                            </div>
                            <span className="text-[10px] font-bold text-[var(--text-secondary)]">88% • Online</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Adicionar numero */}
              {adicionandoNumero === setor ? (
                <div className="px-6 py-4 border-t border-[var(--border-light)] bg-[var(--surface-sunken)]/50">
                  <p className="label mb-2">Nome do responsavel (opcional)</p>
                  <div className="flex gap-2">
                    <input value={apelidoNovo} onChange={(e) => setApelidoNovo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdicionarNumero(setor)} placeholder="Ex: Pablo, Maria..." autoFocus className="input flex-1" />
                    <button onClick={() => handleAdicionarNumero(setor)} className="btn btn-primary btn-md">Gerar QR</button>
                    <button onClick={() => { setAdicionandoNumero(null); setApelidoNovo(''); }} className="btn btn-ghost btn-sm">Cancelar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAdicionandoNumero(setor)} className="w-full text-xs text-[var(--text-muted)] hover:text-[#e41e26] hover:bg-red-50 py-2.5 rounded-xl border border-dashed border-[var(--border)] hover:border-[#e41e26]/30 transition-colors cursor-pointer">
                  + Adicionar outro numero neste setor
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
