import { Handle, Position } from '@xyflow/react';

export default function ImageNode({ data, selected }) {
  return (
    <div className={`bg-white border rounded-xl shadow-[var(--shadow-sm)] min-w-[200px] max-w-[280px] border-l-[3px] transition-all ${selected ? 'border-l-violet-500 border-violet-200 shadow-[var(--shadow-md)]' : 'border-l-violet-400 border-slate-200'}`}>
      <Handle type="target" position={Position.Top} id="top" className="!w-3.5 !h-3.5 !bg-violet-500 !border-2 !border-white !shadow-sm" />
      <Handle type="target" position={Position.Left} id="left" className="!w-3.5 !h-3.5 !bg-violet-500 !border-2 !border-white !shadow-sm" />

      <div className="px-3.5 py-2 border-b border-slate-100">
        <span className="text-xs font-semibold text-violet-600">Imagem</span>
      </div>
      <div className="px-3.5 py-3">
        <p className="text-xs text-slate-500 truncate">{data.url || 'URL da imagem'}</p>
        {data.caption && <p className="text-xs text-slate-400 mt-1 truncate">{data.caption}</p>}
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3.5 !h-3.5 !bg-violet-500 !border-2 !border-white !shadow-sm" />
      <Handle type="source" position={Position.Right} id="right" className="!w-3.5 !h-3.5 !bg-violet-500 !border-2 !border-white !shadow-sm" />
    </div>
  );
}
