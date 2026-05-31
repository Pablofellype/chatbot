import { Handle, Position } from '@xyflow/react';

export default function AudioNode({ data, selected }) {
  return (
    <div className={`bg-white border rounded-xl shadow-[var(--shadow-sm)] min-w-[200px] max-w-[280px] border-l-[3px] transition-all ${selected ? 'border-l-teal-500 border-teal-200 shadow-[var(--shadow-md)]' : 'border-l-teal-400 border-slate-200'}`}>
      <Handle type="target" position={Position.Top} id="top" className="!w-3.5 !h-3.5 !bg-teal-500 !border-2 !border-white !shadow-sm" />
      <Handle type="target" position={Position.Left} id="left" className="!w-3.5 !h-3.5 !bg-teal-500 !border-2 !border-white !shadow-sm" />

      <div className="px-3.5 py-2 border-b border-slate-100">
        <span className="text-xs font-semibold text-teal-600">Audio</span>
      </div>
      <div className="px-3.5 py-3">
        <p className="text-xs text-slate-500 truncate">{data.url || 'URL do audio'}</p>
        {data.ptt && <span className="text-[11px] text-teal-500 mt-1 inline-block">gravacao de voz</span>}
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3.5 !h-3.5 !bg-teal-500 !border-2 !border-white !shadow-sm" />
      <Handle type="source" position={Position.Right} id="right" className="!w-3.5 !h-3.5 !bg-teal-500 !border-2 !border-white !shadow-sm" />
    </div>
  );
}
