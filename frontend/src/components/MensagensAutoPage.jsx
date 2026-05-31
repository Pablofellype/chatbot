import { useState, useEffect } from 'react';
import { mensagemAutoService } from '../services/api';
import MediaUploader from './MediaUploader';

const freqLabels = { uma_vez: 'Uma vez', diario: 'Diario', semanal: 'Semanal' };
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
  const handleDeletar = async (id) => { if (!confirm('Remover esta mensagem?')) return; await mensagemAutoService.deletar(id); carregar(); };
  const handleEnviar = async (id) => {
    setEnviando(id);
    try { await mensagemAutoService.enviar(id); carregar(); }
    catch (e) { alert('Erro: ' + (e.response?.data?.erro || e.message)); }
    finally { setEnviando(null); }
  };

  const handleSelecionarGrupo = (grupo) => {
    setMostrarPopup(false); setBuscaGrupo('');
    setGrupoAberto(grupo.id); setCriandoNoGrupo(grupo.id);
    setForm({ ...formVazio });
  };

  // Formulario reutilizavel
  const renderForm = (onSalvar, onCancelar) => (
    <div className="bg-white rounded-[14px] p-4 space-y-3 border border-gray-200 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nome</label>
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Lembrete..." className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[#151515] text-sm focus:outline-none focus:border-[#e41e26]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Horario</label>
            <input type="time" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[#151515] text-sm focus:outline-none focus:border-[#e41e26]" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Frequencia</label>
            <select value={form.frequencia} onChange={(e) => setForm({ ...form, frequencia: e.target.value })} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[#151515] text-sm focus:outline-none focus:border-[#e41e26]">
              <option value="uma_vez">Uma vez</option>
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
            </select>
          </div>
        </div>
      </div>
      {form.frequencia === 'semanal' && (
        <div className="flex gap-1">
          {diasOptions.map((d) => {
            const ativo = form.diasSemana?.includes(d.valor);
            return <button key={d.valor} onClick={() => toggleDia(d.valor)} className={`text-xs px-2 py-1 rounded cursor-pointer ${ativo ? 'bg-[#e41e26] text-white' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>{d.label}</button>;
          })}
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Tipo de conteudo</label>
        <div className="flex gap-2">
          {[{ v: 'texto', l: 'Texto' }, { v: 'imagem', l: 'Imagem' }, { v: 'video', l: 'Video' }].map((t) => (
            <button key={t.v} onClick={() => setForm({ ...form, tipo: t.v })} className={`text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${form.tipo === t.v ? 'bg-[#e41e26] text-white' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>{t.l}</button>
          ))}
        </div>
      </div>
      {(form.tipo === 'imagem' || form.tipo === 'video') && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Upload da {form.tipo === 'imagem' ? 'Imagem' : 'Video'}</label>
          <MediaUploader mediaUrl={form.mediaUrl || ''} type={form.tipo} onChange={(url) => setForm({ ...form, mediaUrl: url })} />
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Mensagem {form.tipo !== 'texto' ? '(legenda)' : ''}</label>
        <textarea value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} placeholder="Texto da mensagem..." rows={3} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[#151515] text-sm focus:outline-none focus:border-[#e41e26] resize-none" />
      </div>
      <div className="flex gap-2">
        <button onClick={onSalvar} disabled={salvando || !form.nome || !form.mensagem || !form.horario} className="bg-[#e41e26] hover:bg-[#c61a21] disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer">
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button onClick={onCancelar} className="text-gray-500 hover:text-gray-300 text-xs cursor-pointer px-4 py-1.5 border border-gray-200 rounded-lg">Cancelar</button>
      </div>
    </div>
  );

  if (loading || loadingGrupos) return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-[#151515]">Mensagens Automaticas</h3>
            <p className="text-gray-500 text-sm">Conexao: <span className="text-blue-400">{conexaoNome}</span> — {grupos.length} grupo(s)</p>
          </div>
          <button onClick={() => setMostrarPopup(true)} className="bg-[#e41e26] hover:bg-[#c61a21] text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors">+ Adicionar Grupo</button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-[14px] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"><p className="text-2xl font-bold text-[#151515]">{gruposComMensagens.length}</p><p className="text-sm text-gray-500">Grupos ativos</p></div>
          <div className="bg-white border border-gray-200 rounded-[14px] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"><p className="text-2xl font-bold text-emerald-400">{mensagens.filter((m) => m.ativo).length}</p><p className="text-sm text-gray-500">Mensagens ativas</p></div>
          <div className="bg-white border border-gray-200 rounded-[14px] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"><p className="text-2xl font-bold text-blue-400">{mensagens.length}</p><p className="text-sm text-gray-500">Total mensagens</p></div>
        </div>

        {gruposComMensagens.length === 0 && !criandoNoGrupo ? (
          <div className="text-center py-16"><p className="text-gray-500 text-lg">Nenhum grupo com mensagens</p><p className="text-gray-600 text-sm mt-1">Clique em "+ Adicionar Grupo" para comecar</p></div>
        ) : (
          <div className="space-y-4">
            {gruposComMensagens.map((grupo) => {
              const msgs = msgsDoGrupo(grupo.id);
              const aberto = grupoAberto === grupo.id;
              return (
                <div key={grupo.id} className="bg-white border border-gray-200 rounded-[14px] overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                  <button onClick={() => setGrupoAberto(aberto ? null : grupo.id)} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    {grupo.foto ? <img src={grupo.foto} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" /> : <div className="w-12 h-12 rounded-full bg-[#e41e26]/10 flex items-center justify-center shrink-0"><span className="text-[#e41e26] text-lg font-bold">{grupo.nome.charAt(0)}</span></div>}
                    <div className="flex-1 text-left"><h4 className="text-[#151515] font-medium">{grupo.nome}</h4><p className="text-xs text-gray-500">{msgs.length} mensagem(ns) — {msgs.filter((m) => m.ativo).length} ativa(s)</p></div>
                    <span className="text-gray-600 text-sm">{aberto ? '▲' : '▼'}</span>
                  </button>

                  {aberto && (
                    <div className="border-t border-gray-200 p-4 space-y-3">
                      {msgs.map((msg) => (
                        editandoId === msg.id ? (
                          <div key={msg.id}>{renderForm(() => handleSalvarEdicao(msg), handleCancelarEdicao)}</div>
                        ) : (
                          <div key={msg.id} className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[#151515] text-sm font-medium">{msg.nome}</span>
                                <button onClick={() => handleToggle(msg)} className={`text-[10px] px-2 py-0.5 rounded-full font-medium cursor-pointer ${msg.ativo ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>{msg.ativo ? 'Ativo' : 'Inativo'}</button>
                                {msg.tipo && msg.tipo !== 'texto' && <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">{msg.tipo}</span>}
                              </div>
                              <div className="flex gap-1.5">
                                <button onClick={() => handleEditar(msg)} className="text-blue-400 text-[10px] border border-blue-500/20 px-2 py-1 rounded-lg cursor-pointer hover:bg-blue-500/10">Editar</button>
                                <button onClick={() => handleEnviar(msg.id)} disabled={enviando === msg.id} className="text-emerald-400 text-[10px] border border-emerald-500/20 px-2 py-1 rounded-lg cursor-pointer hover:bg-emerald-500/10 disabled:opacity-50">{enviando === msg.id ? 'Enviando...' : 'Enviar'}</button>
                                <button onClick={() => handleDeletar(msg.id)} className="text-gray-500 hover:text-red-400 text-[10px] border border-gray-200 px-2 py-1 rounded-lg cursor-pointer hover:border-red-500/30">Excluir</button>
                              </div>
                            </div>
                            {msg.mediaUrl && <p className="text-[10px] text-indigo-400 truncate mb-1">{msg.mediaUrl}</p>}
                            <p className="text-xs text-gray-500 whitespace-pre-wrap mb-1">{msg.mensagem}</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                              <span>{freqLabels[msg.frequencia] || msg.frequencia}</span>
                              <span>as {msg.horario}</span>
                              {msg.diasSemana && <span>({msg.diasSemana})</span>}
                              {msg.ultimoEnvio && <span>Ultimo: {new Date(msg.ultimoEnvio).toLocaleString('pt-BR')}</span>}
                            </div>
                          </div>
                        )
                      ))}

                      {criandoNoGrupo === grupo.id ? (
                        renderForm(() => handleCriar(grupo), () => setCriandoNoGrupo(null))
                      ) : (
                        <button onClick={() => { setCriandoNoGrupo(grupo.id); setForm({ ...formVazio }); }} className="w-full text-center text-xs text-[#e41e26] hover:text-[#c61a21] py-2 border border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#e41e26]/30 transition-colors">+ Adicionar mensagem</button>
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
                    <div key={msg.id} className="bg-white rounded-lg p-3 border border-amber-200 flex items-center justify-between">
                      <div>
                        <span className="text-[#151515] text-sm font-medium">{msg.nome}</span>
                        <p className="text-xs text-amber-600">Grupo: {msg.grupoNome} (nao encontrado)</p>
                      </div>
                      <button onClick={() => handleDeletar(msg.id)} className="text-red-500 hover:text-red-600 text-xs border border-red-200 px-2 py-1 rounded-lg cursor-pointer hover:bg-red-50">Remover</button>
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
                <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center gap-4 p-4">
                    {grupo.foto ? <img src={grupo.foto} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" /> : <div className="w-12 h-12 rounded-full bg-[#e41e26]/10 flex items-center justify-center shrink-0"><span className="text-[#e41e26] text-lg font-bold">{grupo.nome.charAt(0)}</span></div>}
                    <div className="flex-1"><h4 className="text-[#151515] font-medium">{grupo.nome}</h4><p className="text-xs text-gray-500">Novo grupo</p></div>
                  </div>
                  <div className="border-t border-gray-200 p-4">{renderForm(() => handleCriar(grupo), () => setCriandoNoGrupo(null))}</div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Popup de selecao */}
      {mostrarPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-[14px] w-[480px] max-h-[80vh] flex flex-col shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-[#151515]">Selecionar Grupo</h3>
                <button onClick={() => { setMostrarPopup(false); setBuscaGrupo(''); }} className="text-gray-500 hover:text-[#151515] cursor-pointer text-lg">x</button>
              </div>
              <input value={buscaGrupo} onChange={(e) => setBuscaGrupo(e.target.value)} placeholder="Buscar grupo..." autoFocus className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-[#151515] text-sm focus:outline-none focus:border-[#e41e26]" />
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {gruposFiltrados.length === 0 ? (
                <p className="text-center text-gray-500 py-8">{buscaGrupo ? 'Nenhum grupo encontrado' : 'Todos os grupos ja tem mensagens'}</p>
              ) : (
                <div className="space-y-1">
                  {gruposFiltrados.map((g) => (
                    <button key={g.id} onClick={() => handleSelecionarGrupo(g)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      {g.foto ? <img src={g.foto} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" /> : <div className="w-10 h-10 rounded-full bg-[#e41e26]/10 flex items-center justify-center shrink-0"><span className="text-[#e41e26] font-bold">{g.nome.charAt(0)}</span></div>}
                      <span className="text-gray-500 text-sm text-left">{g.nome}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
