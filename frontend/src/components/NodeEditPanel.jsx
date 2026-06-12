import MediaUploader from './MediaUploader';

export default function NodeEditPanel({ node, onChange, onClose, onAddFrom }) {
  if (!node) return null;

  const updateData = (key, value) => {
    onChange({ ...node, data: { ...node.data, [key]: value } });
  };

  const inputClass = "input";
  const labelClass = "label";
  const btnAddFrom = "btn btn-ghost btn-sm !text-[11px] !font-bold border border-[var(--border)] py-1.5 px-2.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)]";
 
  const renderCloseBtn = () => (
    <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-[var(--border-light)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg>
    </button>
  );
 
  const renderHeader = (title, dotColor) => (
    <div className="px-5 py-4 border-b border-[var(--border-light)] flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor, boxShadow: `0 0 8px ${dotColor}30` }} />
        <h3 className="text-[13px] font-bold text-[var(--text-primary)] font-display">{title}</h3>
      </div>
      {renderCloseBtn()}
    </div>
  );
 
  const renderAddButtons = () => (
    <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
      <p className="text-xs font-bold text-[var(--text-muted)] mb-2.5 uppercase tracking-wider text-[10px]">Criar a partir deste node:</p>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => onAddFrom(node, 'messageNode')} className={btnAddFrom}>+ Mensagem</button>
        <button onClick={() => onAddFrom(node, 'menuNode')} className={btnAddFrom}>+ Menu</button>
        <button onClick={() => onAddFrom(node, 'imageNode')} className={btnAddFrom}>+ Imagem</button>
        <button onClick={() => onAddFrom(node, 'videoNode')} className={btnAddFrom}>+ Vídeo</button>
        <button onClick={() => onAddFrom(node, 'linkNode')} className={btnAddFrom}>+ Link</button>
        <button onClick={() => onAddFrom(node, 'transferNode')} className={btnAddFrom}>+ Transferir</button>
        <button onClick={() => onAddFrom(node, 'delayNode')} className={btnAddFrom}>+ Espera</button>
      </div>
    </div>
  );
 
  const panelClass = "w-[340px] bg-[var(--surface)] border-l border-[var(--border)] overflow-y-auto shrink-0 animate-slideIn" + " shadow-[-8px_0_24px_rgba(10,15,26,0.04)]";

  if (node.type === 'messageNode') {
    return (
      <div className={panelClass}>
        {renderHeader('Editar Mensagem', '#3b82f6')}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={labelClass}>Texto da mensagem</label>
            <textarea
              value={node.data.text || ''}
              onChange={(e) => updateData('text', e.target.value)}
              placeholder="Digite a mensagem..."
              rows={4}
              className={inputClass + " resize-none"}
            />
          </div>
          {renderAddButtons()}
        </div>
      </div>
    );
  }

  if (node.type === 'imageNode') {
    return (
      <div className={panelClass}>
        {renderHeader('Editar Imagem', '#8b5cf6')}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={labelClass}>Arquivo da imagem</label>
            <MediaUploader mediaUrl={node.data.url || ''} type="imageNode" onChange={(url) => updateData('url', url)} />
          </div>
          <div>
            <label className={labelClass}>Legenda (opcional)</label>
            <input type="text" value={node.data.caption || ''} onChange={(e) => updateData('caption', e.target.value)} placeholder="Legenda (opcional)" className={inputClass} />
          </div>
          {renderAddButtons()}
        </div>
      </div>
    );
  }

  if (node.type === 'videoNode') {
    return (
      <div className={panelClass}>
        {renderHeader('Editar Video', '#ec4899')}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={labelClass}>Arquivo do video</label>
            <MediaUploader mediaUrl={node.data.url || ''} type="videoNode" onChange={(url) => updateData('url', url)} />
          </div>
          <div>
            <label className={labelClass}>Legenda (opcional)</label>
            <input type="text" value={node.data.caption || ''} onChange={(e) => updateData('caption', e.target.value)} placeholder="Legenda (opcional)" className={inputClass} />
          </div>
          {renderAddButtons()}
        </div>
      </div>
    );
  }

  if (node.type === 'linkNode') {
    return (
      <div className={panelClass}>
        {renderHeader('Editar Link', '#06b6d4')}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={labelClass}>Texto da mensagem</label>
            <input type="text" value={node.data.text || ''} onChange={(e) => updateData('text', e.target.value)} placeholder="Texto da mensagem" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>URL</label>
            <input type="text" value={node.data.url || ''} onChange={(e) => updateData('url', e.target.value)} placeholder="https://..." className={inputClass} />
          </div>
          {renderAddButtons()}
        </div>
      </div>
    );
  }

  if (node.type === 'transferNode') {
    return (
      <div className={panelClass}>
        {renderHeader('Transferir para ADM', '#22c55e')}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={labelClass}>Mensagem antes de transferir</label>
            <input type="text" value={node.data.text || ''} onChange={(e) => updateData('text', e.target.value)} placeholder="Mensagem antes de transferir" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Numero WhatsApp ADM</label>
            <input type="text" value={node.data.numero || ''} onChange={(e) => updateData('numero', e.target.value)} placeholder="Ex: 556199999999" className={inputClass} />
          </div>
          {renderAddButtons()}
        </div>
      </div>
    );
  }

  if (node.type === 'delayNode') {
    return (
      <div className={panelClass}>
        {renderHeader('Editar Espera', '#f97316')}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={labelClass}>Segundos de espera</label>
            <input type="number" min="1" max="30" value={node.data.seconds || 2} onChange={(e) => updateData('seconds', parseInt(e.target.value) || 2)} className={inputClass} />
            <p className="text-[10px] text-slate-400 mt-1">Pausa entre 1 e 30 segundos antes do proximo node</p>
          </div>
          {renderAddButtons()}
        </div>
      </div>
    );
  }

  if (node.type === 'menuNode') {
    const opcoes = node.data.opcoes || [];
    const updateOpcao = (i, campo, valor) => {
      const novas = [...opcoes]; novas[i] = { ...novas[i], [campo]: valor }; updateData('opcoes', novas);
    };
    const addOpcao = () => {
      updateData('opcoes', [...opcoes, { id: 'opt_' + Date.now(), numero: String(opcoes.length + 1), label: '' }]);
    };
    const removeOpcao = (i) => { updateData('opcoes', opcoes.filter((_, idx) => idx !== i)); };

    return (
      <div className={panelClass}>
        {renderHeader('Editar Menu', '#f59e0b')}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={labelClass}>Texto do menu</label>
            <input type="text" value={node.data.text || ''} onChange={(e) => updateData('text', e.target.value)} placeholder="Texto do menu" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Opcoes</label>
            <div className="space-y-2">
              {opcoes.map((op, i) => (
                <div key={op.id} className="bg-slate-50 rounded-xl px-3 py-2 flex gap-2 items-center">
                  <input type="text" value={op.numero} onChange={(e) => updateOpcao(i, 'numero', e.target.value)} className="w-10 bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-slate-900 text-xs text-center focus:outline-none focus:border-[#e41e26] transition-colors" />
                  <input type="text" value={op.label} onChange={(e) => updateOpcao(i, 'label', e.target.value)} placeholder="Nome da opcao" className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-[#e41e26] transition-colors" />
                  {opcoes.length > 1 && (
                    <button onClick={() => removeOpcao(i)} className="w-6 h-6 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-red-400 cursor-pointer transition-colors">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button onClick={addOpcao} className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer">+ Opcao</button>
        </div>
      </div>
    );
  }

  return null;
}
