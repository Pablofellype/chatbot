import { Handle, Position } from '@xyflow/react';

const freqLabels = { uma_vez: 'Uma vez', diario: 'Diario', semanal: 'Semanal' };

export default function AutoMensagemNode({ data, selected }) {
  return (
    <div className={`bg-gray-800 border-2 rounded-xl shadow-lg min-w-[220px] max-w-[300px] ${selected ? 'border-indigo-400 shadow-indigo-500/20' : 'border-gray-700'}`}>
      <Handle type="target" position={Position.Top} id="top" className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-gray-800" />
      <Handle type="target" position={Position.Left} id="left" className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-gray-800" />

      <div className="bg-indigo-500/10 border-b border-gray-700 px-3 py-1.5 rounded-t-xl flex items-center justify-between">
        <span className="text-xs font-medium text-indigo-400">Mensagem Automatica</span>
        {data.ativo !== false && (
          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Ativo</span>
        )}
      </div>

      <div className="px-3 py-2.5">
        <p className="text-sm text-gray-300 whitespace-pre-wrap break-words mb-2">
          {data.mensagem || 'Mensagem vazia'}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          {data.horario && <span className="bg-gray-900 px-1.5 py-0.5 rounded">{data.horario}</span>}
          {data.frequencia && <span className="bg-gray-900 px-1.5 py-0.5 rounded">{freqLabels[data.frequencia] || data.frequencia}</span>}
          {data.diasSemana && <span className="bg-gray-900 px-1.5 py-0.5 rounded">{data.diasSemana}</span>}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-gray-800" />
      <Handle type="source" position={Position.Right} id="right" className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-gray-800" />
    </div>
  );
}
