import { Handle, Position } from '@xyflow/react';

export default function MenuNode({ data, selected }) {
  const opcoes = data?.opcoes || [];

  // Header height (34px) + padding top (10px) + text "Escolha" (~24px) + gap
  const baseOffset = 68;
  const rowHeight = 36;

  return (
    <div className={`bg-white border rounded-xl shadow-[var(--shadow-sm)] min-w-[220px] max-w-[300px] border-l-[3px] transition-all ${selected ? 'border-l-amber-500 border-amber-200 shadow-[var(--shadow-md)]' : 'border-l-amber-400 border-slate-200'}`}>
      <Handle type="target" position={Position.Top} id="top" className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-white !shadow-sm" />
      <Handle type="target" position={Position.Left} id="left" className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-white !shadow-sm" />

      <div className="px-3.5 py-2 border-b border-slate-100">
        <span className="text-xs font-semibold text-amber-600">Menu</span>
      </div>
      <div className="px-3.5 py-2.5">
        <p className="text-xs text-slate-500 mb-2">{data?.text || 'Escolha:'}</p>
        <div className="space-y-1">
          {opcoes.map((op) => (
            <div key={op.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2.5 py-1.5 pr-6">
              <span className="text-xs font-bold text-amber-600 w-5 text-center">{op.numero}</span>
              <span className="text-xs text-slate-600 flex-1">{op.label || '...'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Handles por opção — posicionados no nível raiz com offset calculado */}
      {opcoes.map((op, i) => (
        <Handle
          key={op.id}
          type="source"
          position={Position.Right}
          id={op.id}
          className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-white !shadow-sm"
          style={{ top: baseOffset + i * rowHeight }}
        />
      ))}

      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3.5 !h-3.5 !bg-amber-500 !border-2 !border-white !shadow-sm" />
    </div>
  );
}
