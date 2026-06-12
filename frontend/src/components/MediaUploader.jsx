import { useState } from 'react';
import api from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function MediaUploader({ mediaUrl, type, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setErro('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.url) {
        onChange(res.data.url);
      } else {
        throw new Error('Retorno do servidor invalido');
      }
    } catch (err) {
      setErro('Erro no upload: ' + (err.response?.data?.erro || err.message));
    } finally {
      setUploading(false);
    }
  };

  const clearMedia = () => {
    onChange('');
  };

  const isImage = type === 'imagem' || type === 'imageNode';
  const isVideo = type === 'video' || type === 'videoNode';

  const getMediaSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) {
      if (API_URL === '/api') return url;
      const baseUrl = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
      return `${baseUrl}${url}`;
    }
    return url;
  };

  return (
    <div className="space-y-2 border border-dashed border-[var(--border)] hover:border-[var(--brand)] rounded-xl p-3 bg-[var(--surface-sunken)] transition-colors">
      <div className="flex flex-col items-center justify-center min-h-[90px] relative">
        {mediaUrl ? (
          <div className="w-full flex flex-col items-center gap-2">
            {isImage && (
              <img
                src={getMediaSrc(mediaUrl)}
                alt="Preview"
                className="max-h-24 rounded-lg object-contain border border-slate-100 shadow-sm"
              />
            )}
            {isVideo && (
              <video
                src={getMediaSrc(mediaUrl)}
                controls
                className="max-h-24 rounded-lg object-contain border border-slate-100 shadow-sm"
              />
            )}
            {!isImage && !isVideo && (
              <span className="text-xs text-slate-500 truncate max-w-full font-medium">{mediaUrl}</span>
            )}
            
            <button
              type="button"
              onClick={clearMedia}
              className="text-[10px] text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer transition-colors bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md"
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="3" x2="11" y2="11"/>
                <line x1="11" y1="3" x2="3" y2="11"/>
              </svg>
              Remover midia
            </button>
          </div>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-[var(--brand)] animate-spin" />
            <span className="text-[11px] text-slate-500 font-medium">Fazendo upload...</span>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-1 cursor-pointer w-full py-4 text-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-[11px] font-semibold text-slate-600">
              Clique para fazer upload de {isImage ? 'Imagem' : 'Video'}
            </span>
            <span className="text-[9px] text-slate-400">
              {isImage ? 'PNG, JPG, GIF ou WEBP' : 'MP4 ou WEBM'}
            </span>
            <input
              type="file"
              accept={isImage ? "image/*" : "video/*"}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
      {erro && (
        <p className="text-[10px] text-red-500 bg-red-50 rounded-lg px-2.5 py-1 text-center font-medium">{erro}</p>
      )}
    </div>
  );
}
