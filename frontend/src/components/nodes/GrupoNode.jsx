import { Handle, Position } from '@xyflow/react';

export default function GrupoNode({ data }) {
  return (
    <div className="bg-indigo-600 text-white px-6 py-4 rounded-xl shadow-lg shadow-indigo-500/20 border-2 border-indigo-400 min-w-[180px] text-center">
      <div className="text-[10px] uppercase tracking-wider text-indigo-200 mb-1">Grupo</div>
      <div className="text-sm font-bold truncate max-w-[200px]">{data.nome || 'Selecione um grupo'}</div>
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3 !h-3 !bg-indigo-300 !border-2 !border-white" />
      <Handle type="source" position={Position.Right} id="right" className="!w-3 !h-3 !bg-indigo-300 !border-2 !border-white" />
      <Handle type="source" position={Position.Left} id="left" className="!w-3 !h-3 !bg-indigo-300 !border-2 !border-white" />
    </div>
  );
}
