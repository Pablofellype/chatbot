import { useState, useEffect } from 'react';
import { mensagemIndividualService, numeroService, conexaoService } from '../services/api';
import MediaUploader from './MediaUploader';

const formVazio = { nome: '', mensagem: '', tipo: 'texto', mediaUrl: '', frequencia: 'uma_vez', diasSemana: '', horario: '', numeroId: '', conexaoId: '' };
const diasSemanaOpts = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

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
  const [mostrarForm, setMostrarForm] = useState(false);

  // Navegação: setor → conexão
  const [selectedSetor, setSelectedSetor] = useState(null);
  const [selectedConexao, setSelectedConexao] = useState(null);

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

  useEffect(() => { carregar(); }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.mensagem || !form.numeroId || !form.horario) return;
    const dados = {
      ...form,
      conexaoId: String(selectedConexao.id),
      diasSemana: form.frequencia === 'semanal' ? form.diasSemana : null,
      mediaUrl: form.mediaUrl || null,
    };
    try {
      if (editandoId) await mensagemIndividualService.atualizar(editandoId, dados);
      else await mensagemIndividualService.criar(dados);
      setForm(formVazio); setEditandoId(null); setMostrarForm(false);
      carregar();
    } catch (error) { alert(error.response?.data?.erro || 'Erro'); }
  };

  const handleEditar = (msg) => {
    setForm({
      nome: msg.nome, mensagem: msg.mensagem, tipo: msg.tipo,
      mediaUrl: msg.mediaUrl || '', frequencia: msg.frequencia,
      diasSemana: msg.diasSemana || '', horario: msg.horario,
      numeroId: String(msg.numeroId), conexaoId: String(msg.conexaoId),
    });
    setEditandoId(msg.id);
    setMostrarForm(true);
  };

  const handleDeletar = async (id) => {
    if (!confirm('Remover agendamento?')) return;
    await mensagemIndividualService.deletar(id); carregar();
  };

  const handleEnviar = async (id) => {
    try { await mensagemIndividualService.enviar(id); carregar(); }
    catch (e) { alert('Erro: ' + (e.response?.data?.erro || e.message)); }
  };

  const handleToggle = async (msg) => {
    await mensagemIndividualService.atualizar(msg.id, { ativo: !msg.ativo }); carregar();
  };

  const cancelar = () => { setForm(formVazio); setEditandoId(null); setMostrarForm(false); };

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
                <label className="label">Para quem enviar *</label>
                <select value={form.numeroId} onChange={(e) => setForm({ ...form, numeroId: e.target.value })} className="input">
                  <option value="">Selecione o contato...</option>
                  {numeros.map(n => (
                    <option key={n.id} value={n.id}>{n.nome ? `${n.nome} (${formatarNumero(n.numero)})` : formatarNumero(n.numero)}</option>
                  ))}
                </select>
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

        {/* Lista de mensagens */}
        {msgsDaConexao.length === 0 && !mostrarForm ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-[var(--surface-sunken)] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-[var(--text-secondary)] font-medium">Nenhum agendamento</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">Crie mensagens programadas para este numero</p>
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {msgsDaConexao.map(msg => (
              <div key={msg.id} className="card px-5 py-4 flex items-center justify-between animate-fadeIn">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{msg.nome}</span>
                    <span className={`badge ${msg.ativo ? 'badge-success' : 'badge-neutral'}`}>
                      {msg.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">{msg.horario} | {msg.frequencia === 'uma_vez' ? 'Uma vez' : msg.frequencia === 'diario' ? 'Diario' : `Semanal (${msg.diasSemana})`}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{msg.mensagem}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-[var(--text-muted)]">Para: {msg.numero?.nome || formatarNumero(msg.numero?.numero)}</span>
                    {msg.ultimoEnvio && <span className="text-[10px] text-[var(--text-muted)]">Enviado: {new Date(msg.ultimoEnvio).toLocaleString('pt-BR')}</span>}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 ml-4">
                  <button onClick={() => handleEnviar(msg.id)} className="btn btn-sm text-[var(--brand)] border border-[var(--brand-light)] hover:bg-[var(--brand-light)]">Enviar</button>
                  <button onClick={() => handleEditar(msg)} className="btn btn-ghost btn-sm">Editar</button>
                  <button onClick={() => handleToggle(msg)} className="btn btn-ghost btn-sm">{msg.ativo ? 'Off' : 'On'}</button>
                  <button onClick={() => handleDeletar(msg.id)} className="btn btn-danger btn-sm">X</button>
                </div>
              </div>
            ))}
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
            return (
              <button key={c.id} onClick={() => setSelectedConexao(c)}
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
    </div>
  );
}
