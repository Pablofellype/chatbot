import { Handle, Position } from '@xyflow/react';

export default function DelayNode({ data, selected }) {
  return (
    <div className={`bg-white border rounded-xl shadow-[var(--shadow-sm)] min-w-[160px] border-l-[3px] transition-all ${selected ? 'border-l-orange-500 border-orange-200 shadow-[var(--shadow-md)]' : 'border-l-orange-400 border-slate-200'}`}>
      <Handle type="target" position={Position.Top} id="top" className="!w-3.5 !h-3.5 !bg-orange-500 !border-2 !border-white !shadow-sm" />
      <Handle type="target" position={Position.Left} id="left" className="!w-3.5 !h-3.5 !bg-orange-500 !border-2 !border-white !shadow-sm" />

      <div className="px-3.5 py-2 border-b border-slate-100">
        <span className="text-xs font-semibold text-orange-600">Espera</span>
      </div>
      <div className="px-3.5 py-3 text-center">
        <p className="text-2xl font-bold text-orange-500">{data.seconds || 2}s</p>
        <p className="text-[11px] text-slate-400 mt-0.5">pausa</p>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3.5 !h-3.5 !bg-orange-500 !border-2 !border-white !shadow-sm" />
      <Handle type="source" position={Position.Right} id="right" className="!w-3.5 !h-3.5 !bg-orange-500 !border-2 !border-white !shadow-sm" />
    </div>
  );
}
