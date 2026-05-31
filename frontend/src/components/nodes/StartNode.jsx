import { Handle, Position } from '@xyflow/react';

export default function StartNode({ selected }) {
  return (
    <div className={`bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 min-w-[100px] transition-shadow ${selected ? 'shadow-emerald-500/40 ring-2 ring-emerald-300' : ''}`}>
      <div className="px-5 py-3 text-center">
        <span className="text-sm font-bold text-white tracking-wide">INICIO</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3.5 !h-3.5 !bg-white !border-2 !border-emerald-500 !shadow-sm" />
      <Handle type="source" position={Position.Right} id="right" className="!w-3.5 !h-3.5 !bg-white !border-2 !border-emerald-500 !shadow-sm" />
      <Handle type="source" position={Position.Left} id="left" className="!w-3.5 !h-3.5 !bg-white !border-2 !border-emerald-500 !shadow-sm" />
    </div>
  );
}
