import { useState, useEffect } from 'react';
import { numeroService } from '../services/api';

function formatarNumero(num) {
  if (!num) return '';
  const d = num.replace(/\D/g, '');
  if (d.length === 13) return `+${d.slice(0,2)} ${d.slice(2,4)} ${d.slice(4,9)}-${d.slice(9)}`;
  if (d.length === 12) return `+${d.slice(0,2)} ${d.slice(2,4)} ${d.slice(4,8)}-${d.slice(8)}`;
  if (d.length === 11) return `+55 ${d.slice(0,2)} ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `+55 ${d.slice(0,2)} ${d.slice(2,6)}-${d.slice(6)}`;
  return `+${d}`;
}

export default function NumerosPage() {
  const [numeros, setNumeros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [novoNumero, setNovoNumero] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novoLid, setNovoLid] = useState('');
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ numero: '', nome: '', lid: '' });

  const carregar = async () => {
    try {
      const { data } = await numeroService.listar();
      setNumeros(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { carregar(); }, []);

  const handleAdicionar = async (e) => {
    e.preventDefault();
    if (!novoNumero.trim()) return;
    try {
      await numeroService.criar({ numero: novoNumero, nome: novoNome, lid: novoLid || undefined });
      setNovoNumero(''); setNovoNome(''); setNovoLid('');
      setMostrarForm(false);
      carregar();
    } catch (error) {
      alert(error.response?.data?.erro || 'Erro ao adicionar');
    }
  };

  const iniciarEdicao = (num) => {
    setEditando(num.id);
    setEditForm({
      numero: formatarNumero(num.numero),
      nome: num.nome || '',
      lid: num.lid || '',
    });
  };

  const handleSalvarEdicao = async (e) => {
    e.preventDefault();
    try {
      await numeroService.atualizar(editando, {
        numero: editForm.numero,
        nome: editForm.nome,
        lid: editForm.lid || null,
      });
      setEditando(null);
      carregar();
    } catch (error) {
      alert(error.response?.data?.erro || 'Erro ao salvar');
    }
  };

  const handleToggle = async (num) => {
    await numeroService.atualizar(num.id, { ativo: !num.ativo });
    carregar();
  };

  const handleDeletar = async (id) => {
    if (!confirm('Remover este numero?')) return;
    await numeroService.deletar(id);
    carregar();
  };

  const getAvatar = (num) => {
    if (num.nome) return num.nome.charAt(0).toUpperCase();
    return '#';
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[28px] font-display text-[var(--text-primary)] leading-none">Numeros Autorizados</h2>
          <p className="text-[var(--text-muted)] text-sm mt-2">O bot so responde estes numeros</p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="btn btn-primary btn-md"
        >
          + Adicionar
        </button>
      </div>

      {/* Form adicionar */}
      {mostrarForm && (
        <form onSubmit={handleAdicionar} className="card p-5 mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="label">Numero *</label>
              <input
                value={novoNumero}
                onChange={(e) => setNovoNumero(e.target.value)}
                placeholder="+55 61 90000-0000"
                className="input"
              />
            </div>
            <div>
              <label className="label">Nome</label>
              <input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Joao (opcional)"
                className="input"
              />
            </div>
            <div>
              <label className="label">LID (interno)</label>
              <input
                value={novoLid}
                onChange={(e) => setNovoLid(e.target.value)}
                placeholder="Preenchido automaticamente"
                className="input"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setMostrarForm(false)} className="btn btn-ghost btn-sm">Cancelar</button>
            <button type="submit" className="btn btn-primary btn-md">Adicionar</button>
          </div>
        </form>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-faint)]">Carregando...</div>
      ) : numeros.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-faint)]">Nenhum numero cadastrado</div>
      ) : (
        <div className="space-y-3 stagger">
          {numeros.map((num) => (
            <div key={num.id} className="card card-interactive animate-fadeIn p-4">
              {editando === num.id ? (
                /* Form de edicao inline */
                <form onSubmit={handleSalvarEdicao} className="bg-[var(--surface-sunken)] rounded-xl border border-[var(--border)] p-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="label">Numero</label>
                      <input
                        value={editForm.numero}
                        onChange={(e) => setEditForm({ ...editForm, numero: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Nome</label>
                      <input
                        value={editForm.nome}
                        onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                        placeholder="Nome do contato"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">LID</label>
                      <input
                        value={editForm.lid}
                        onChange={(e) => setEditForm({ ...editForm, lid: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setEditando(null)} className="btn btn-ghost btn-sm">Cancelar</button>
                    <button type="submit" className="btn btn-primary btn-md">Salvar</button>
                  </div>
                </form>
              ) : (
                /* Visualizacao normal */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-sunken)] text-[var(--text-muted)] font-semibold text-sm flex items-center justify-center shrink-0">
                      {getAvatar(num)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-primary)] font-mono text-sm font-medium">{formatarNumero(num.numero)}</span>
                        {num.nome && <span className="text-[var(--text-muted)] text-sm">({num.nome})</span>}
                        <span className={num.ativo ? 'badge badge-success' : 'badge badge-neutral'}>
                          {num.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      {num.lid && <p className="text-xs text-[var(--text-faint)] mt-0.5">LID: {num.lid}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => iniciarEdicao(num)}
                      className="btn btn-ghost btn-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggle(num)}
                      className="btn btn-ghost btn-sm"
                    >
                      {num.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleDeletar(num.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
