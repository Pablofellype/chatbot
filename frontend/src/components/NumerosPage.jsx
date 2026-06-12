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

// Lista de países com seus DDIs, bandeiras e metadados para validação
const COUNTRIES = [
  { code: 'BR', name: 'Brasil', ddi: '55', flag: '🇧🇷', dddLen: 2, placeholderDdd: '61', placeholderTel: '99999-9999' },
  { code: 'PT', name: 'Portugal', ddi: '351', flag: '🇵🇹', dddLen: 3, placeholderDdd: '219', placeholderTel: '912345678' },
  { code: 'US', name: 'Estados Unidos', ddi: '1', flag: '🇺🇸', dddLen: 3, placeholderDdd: '202', placeholderTel: '5550199' },
  { code: 'ES', name: 'Espanha', ddi: '34', flag: '🇪🇸', dddLen: 2, placeholderDdd: '91', placeholderTel: '123456789' },
  { code: 'AR', name: 'Argentina', ddi: '54', flag: '🇦🇷', dddLen: 3, placeholderDdd: '11', placeholderTel: '1543218765' },
  { code: 'AO', name: 'Angola', ddi: '244', flag: '🇦🇴', dddLen: 2, placeholderDdd: '22', placeholderTel: '923456789' },
  { code: 'MZ', name: 'Moçambique', ddi: '258', flag: '🇲🇿', dddLen: 2, placeholderDdd: '21', placeholderTel: '841234567' },
  { code: 'CV', name: 'Cabo Verde', ddi: '238', flag: '🇨🇻', dddLen: 2, placeholderDdd: '21', placeholderTel: '9123456' },
  { code: 'GW', name: 'Guiné-Bissau', ddi: '245', flag: '🇬🇼', dddLen: 2, placeholderDdd: '3', placeholderTel: '955000000' },
  { code: 'ST', name: 'São Tomé e Príncipe', ddi: '239', flag: '🇸🇹', dddLen: 2, placeholderDdd: '22', placeholderTel: '9012345' },
  { code: 'TL', name: 'Timor-Leste', ddi: '670', flag: '🇹🇱', dddLen: 2, placeholderDdd: '33', placeholderTel: '7712345' },
  { code: 'GB', name: 'Reino Unido', ddi: '44', flag: '🇬🇧', dddLen: 3, placeholderDdd: '20', placeholderTel: '7911123456' },
  { code: 'DE', name: 'Alemanha', ddi: '49', flag: '🇩🇪', dddLen: 3, placeholderDdd: '30', placeholderTel: '12345678' },
  { code: 'FR', name: 'França', ddi: '33', flag: '🇫🇷', dddLen: 1, placeholderDdd: '1', placeholderTel: '612345678' },
  { code: 'IT', name: 'Itália', ddi: '39', flag: '🇮🇹', dddLen: 3, placeholderDdd: '06', placeholderTel: '3123456789' },
  { code: 'CA', name: 'Canadá', ddi: '1', flag: '🇨🇦', dddLen: 3, placeholderDdd: '416', placeholderTel: '5550199' },
  { code: 'MX', name: 'México', ddi: '52', flag: '🇲🇽', dddLen: 3, placeholderDdd: '55', placeholderTel: '12345678' },
  { code: 'CO', name: 'Colômbia', ddi: '57', flag: '🇨🇴', dddLen: 3, placeholderDdd: '601', placeholderTel: '3001234567' },
  { code: 'CL', name: 'Chile', ddi: '56', flag: '🇨🇱', dddLen: 2, placeholderDdd: '2', placeholderTel: '912345678' },
  { code: 'PE', name: 'Peru', ddi: '51', flag: '🇵🇪', dddLen: 2, placeholderDdd: '1', placeholderTel: '912345678' },
  { code: 'UY', name: 'Uruguai', ddi: '598', flag: '🇺🇾', dddLen: 2, placeholderDdd: '2', placeholderTel: '99123456' },
  { code: 'PY', name: 'Paraguai', ddi: '595', flag: '🇵🇾', dddLen: 3, placeholderDdd: '21', placeholderTel: '912345678' },
  { code: 'BO', name: 'Bolívia', ddi: '591', flag: '🇧🇴', dddLen: 2, placeholderDdd: '2', placeholderTel: '71234567' },
  { code: 'EC', name: 'Equador', ddi: '593', flag: '🇪🇨', dddLen: 2, placeholderDdd: '2', placeholderTel: '991234567' },
  { code: 'VE', name: 'Venezuela', ddi: '58', flag: '🇻🇪', dddLen: 3, placeholderDdd: '212', placeholderTel: '4121234567' },
  { code: 'CN', name: 'China', ddi: '86', flag: '🇨🇳', dddLen: 3, placeholderDdd: '10', placeholderTel: '12345678901' },
  { code: 'JP', name: 'Japão', ddi: '81', flag: '🇯🇵', dddLen: 2, placeholderDdd: '3', placeholderTel: '9012345678' },
  { code: 'KR', name: 'Coreia do Sul', ddi: '82', flag: '🇰🇷', dddLen: 2, placeholderDdd: '2', placeholderTel: '1012345678' },
  { code: 'IN', name: 'Índia', ddi: '91', flag: '🇮🇳', dddLen: 3, placeholderDdd: '22', placeholderTel: '9876543210' },
  { code: 'AU', name: 'Austrália', ddi: '61', flag: '🇦🇺', dddLen: 2, placeholderDdd: '2', placeholderTel: '412345678' }
];

export default function NumerosPage() {
  const [numeros, setNumeros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  
  // Estados para DDI, DDD e Telefone separados
  const [novoDdi, setNovoDdi] = useState('55');
  const [novoDdd, setNovoDdd] = useState('');
  const [novoTel, setNovoTel] = useState('');
  
  // Estados para dropdown customizado de DDI
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [novoNome, setNovoNome] = useState('');
  const [novoLid, setNovoLid] = useState('');
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ numero: '', nome: '', lid: '' });
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

  const selectedCountry = COUNTRIES.find(c => c.ddi === novoDdi) || COUNTRIES[0];
  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.ddi.includes(searchQuery)
  );

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
    if (!novoDdd.trim() || !novoTel.trim()) {
      mostrarAlerta('Campos Obrigatórios', 'Por favor, preencha o DDD e o Número.');
      return;
    }
    
    // Combina DDI, DDD e o número de telefone local
    const numeroCompleto = `${novoDdi}${novoDdd}${novoTel}`.replace(/\D/g, '');
    
    try {
      await numeroService.criar({ numero: numeroCompleto, nome: novoNome, lid: novoLid || undefined });
      setNovoDdd(''); setNovoTel(''); setNovoNome(''); setNovoLid('');
      setMostrarForm(false);
      carregar();
    } catch (error) {
      mostrarAlerta('Erro', error.response?.data?.erro || 'Erro ao adicionar');
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
      mostrarAlerta('Erro', error.response?.data?.erro || 'Erro ao salvar');
    }
  };

  const handleToggle = async (num) => {
    await numeroService.atualizar(num.id, { ativo: !num.ativo });
    carregar();
  };

  const handleDeletar = async (id) => {
    mostrarConfirmacao('Remover Número', 'Tem certeza que deseja remover este número autorizado?', async () => {
      try {
        await numeroService.deletar(id);
        carregar();
      } catch (err) {
        mostrarAlerta('Erro', err.response?.data?.erro || 'Erro ao remover número');
      }
    });
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
        <form onSubmit={handleAdicionar} className="card p-6 mb-6 shadow-md border border-[var(--border)] animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            
            {/* Linha do Telefone Agrupada */}
            <div className="grid grid-cols-12 gap-2 relative">
              <div className="col-span-4 relative">
                <label className="label">País / DDI *</label>
                
                {/* Botão de Trigger do Dropdown */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="input flex items-center justify-between !py-2.5 cursor-pointer text-left focus:outline-none"
                >
                  <span className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-base shrink-0">{selectedCountry.flag}</span>
                    <span className="font-semibold text-xs">+{selectedCountry.ddi}</span>
                  </span>
                  <svg className={`w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Overlay transparente para fechar dropdown ao clicar fora */}
                {dropdownOpen && (
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => { setDropdownOpen(false); setSearchQuery(''); }}
                  />
                )}

                {/* Lista Suspensa Customizada */}
                {dropdownOpen && (
                  <div className="absolute left-0 mt-1 w-[260px] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-50 max-h-64 overflow-hidden flex flex-col animate-fadeInScale">
                    {/* Campo de Busca */}
                    <div className="p-2 border-b border-[var(--border-light)] bg-[var(--surface-sunken)]">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar país ou código..."
                        className="input !py-1.5 !px-3 text-xs w-full"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                    {/* Lista de Países */}
                    <div className="overflow-y-auto flex-1 py-1">
                      {filteredCountries.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-[var(--text-faint)] text-center">Nenhum país encontrado</div>
                      ) : (
                        filteredCountries.map((c) => (
                          <button
                            key={`${c.code}-${c.ddi}`}
                            type="button"
                            onClick={() => {
                              setNovoDdi(c.ddi);
                              setDropdownOpen(false);
                              setSearchQuery('');
                              // Se o DDD atual passar do tamanho permitido no novo país, corta
                              if (novoDdd.length > c.dddLen) {
                                setNovoDdd(novoDdd.slice(0, c.dddLen));
                              }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-colors ${
                              novoDdi === c.ddi ? 'bg-[var(--brand-light)] text-[var(--brand)] font-semibold' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span className="text-sm shrink-0">{c.flag}</span>
                              <span className="truncate">{c.name}</span>
                            </span>
                            <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0">(+{c.ddi})</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="col-span-3">
                <label className="label">DDD *</label>
                <input
                  type="text"
                  value={novoDdd}
                  onChange={(e) => setNovoDdd(e.target.value.replace(/\D/g, '').slice(0, selectedCountry.dddLen))}
                  placeholder={selectedCountry.placeholderDdd}
                  maxLength={selectedCountry.dddLen}
                  className="input !py-2.5 text-center font-mono font-medium"
                />
              </div>
              
              <div className="col-span-5">
                <label className="label">Número *</label>
                <input
                  type="text"
                  value={novoTel}
                  onChange={(e) => setNovoTel(e.target.value.replace(/\D/g, ''))}
                  placeholder={selectedCountry.placeholderTel}
                  className="input !py-2.5 font-mono font-medium"
                />
              </div>

              {/* Indicador Dinâmico do País e DDD identificado */}
              <div className="col-span-12 mt-1.5 px-1 flex items-center gap-2 text-[11px] text-[var(--text-secondary)] animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-pulse shrink-0"></span>
                <span>
                  País: <strong className="text-[var(--text-primary)] font-semibold">{selectedCountry.flag} {selectedCountry.name} (+{selectedCountry.ddi})</strong>
                  <span className="mx-2 text-[var(--border)]">|</span>
                  DDD sugerido: <strong className="text-[var(--text-primary)] font-semibold">{selectedCountry.dddLen} dígitos</strong>
                </span>
              </div>
            </div>

            {/* Linha de Nome */}
            <div>
              <label className="label">Nome do Contato</label>
              <input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex: João (opcional)"
                className="input !py-2.5"
              />
            </div>
            
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-[var(--border-light)]">
            <button type="button" onClick={() => setMostrarForm(false)} className="btn btn-ghost btn-sm">Cancelar</button>
            <button type="submit" className="btn btn-primary btn-md">Adicionar Número</button>
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
                    {num.fotoUrl ? (
                      <img 
                        src={num.fotoUrl} 
                        alt={num.nome || 'Avatar'} 
                        className="w-10 h-10 rounded-full object-cover border border-[var(--border)] shrink-0 shadow-sm transition-transform hover:scale-105 duration-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[var(--surface-sunken)] text-[var(--text-muted)] font-semibold text-sm flex items-center justify-center shrink-0 border border-[var(--border)] shadow-sm">
                        {getAvatar(num)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-primary)] font-mono text-sm font-medium">{formatarNumero(num.numero)}</span>
                        {num.nome && <span className="text-[var(--text-muted)] text-sm">({num.nome})</span>}
                        <span className={num.ativo ? 'badge badge-success' : 'badge badge-neutral'}>
                          {num.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="mt-1">
                        {num.lid ? (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 font-semibold inline-block">WhatsApp Sincronizado</span>
                        ) : (
                          <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 font-semibold inline-block">Aguardando primeira mensagem para sincronizar</span>
                        )}
                      </div>
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
