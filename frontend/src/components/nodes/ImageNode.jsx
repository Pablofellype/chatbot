import { Handle, Position } from '@xyflow/react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getMediaSrc = (url) => {
  if (!url) return '';
  let cleanUrl = url.replace(/\\/g, '/');
  if (!cleanUrl.startsWith('/') && !cleanUrl.startsWith('http')) {
    cleanUrl = '/' + cleanUrl;
  }
  if (cleanUrl.startsWith('/uploads/')) {
    if (API_URL === '/api') return cleanUrl;
    const baseUrl = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
    return `${baseUrl}${cleanUrl}`;
  }
  return url;
};

export default function ImageNode({ data, selected }) {
  return (
    <div className={`bg-white border rounded-xl shadow-[var(--shadow-sm)] min-w-[200px] max-w-[280px] border-l-[3px] transition-all ${selected ? 'border-l-violet-500 border-violet-200 shadow-[var(--shadow-md)]' : 'border-l-violet-400 border-slate-200'}`}>
      <Handle type="target" position={Position.Top} id="top" className="!w-3.5 !h-3.5 !bg-violet-500 !border-2 !border-white !shadow-sm" />
      <Handle type="target" position={Position.Left} id="left" className="!w-3.5 !h-3.5 !bg-violet-500 !border-2 !border-white !shadow-sm" />

      <div className="px-3.5 py-2 border-b border-slate-100">
        <span className="text-xs font-semibold text-violet-600">Imagem</span>
      </div>
      <div className="px-3.5 py-3">
        {data.url ? (
          <div className="mb-2 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center max-h-[140px] select-none">
            <img
              src={getMediaSrc(data.url)}
              alt="Preview"
              className="max-h-[130px] w-auto object-contain p-1"
            />
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic mb-1">Nenhuma imagem selecionada</p>
        )}
        <p className="text-[10px] text-slate-500 truncate font-mono">{data.url ? data.url.split('/').pop() : 'Sem arquivo'}</p>
        {data.caption && <p className="text-xs text-slate-400 mt-1 truncate">{data.caption}</p>}
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3.5 !h-3.5 !bg-violet-500 !border-2 !border-white !shadow-sm" />
      <Handle type="source" position={Position.Right} id="right" className="!w-3.5 !h-3.5 !bg-violet-500 !border-2 !border-white !shadow-sm" />
    </div>
  );
}
