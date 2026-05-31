import { useState, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function AudioRecorder({ onRecorded }) {
  const [gravando, setGravando] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [erro, setErro] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Detecta melhor mimeType disponível
  const getMimeType = () => {
    const tipos = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    for (const t of tipos) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  };

  const iniciar = async () => {
    setErro('');

    if (typeof MediaRecorder === 'undefined') {
      setErro('Navegador nao suporta gravacao. Use Chrome ou Firefox.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErro('Microfone nao disponivel. Acesse via localhost ou HTTPS.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getMimeType();
      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        await enviarAudio(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setGravando(true);
      setTempo(0);
      timerRef.current = setInterval(() => setTempo(t => t + 1), 1000);
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        setErro('Permissao do microfone negada. Permita no navegador.');
      } else if (e.name === 'NotFoundError') {
        setErro('Nenhum microfone encontrado.');
      } else {
        setErro('Erro: ' + e.message);
      }
    }
  };

  const parar = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setGravando(false);
    clearInterval(timerRef.current);
  };

  const enviarAudio = async (blob) => {
    setUploading(true);
    setErro('');
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'gravacao.webm');
      const res = await fetch(`${API_URL}/upload/audio`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Erro no servidor');
      const data = await res.json();
      if (data.url) {
        onRecorded(data.url);
      } else {
        setErro('Erro ao processar audio');
      }
    } catch (e) {
      setErro('Erro ao enviar: ' + e.message);
    }
    setUploading(false);
  };

  const formatTempo = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {gravando ? (
          <>
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold text-red-600">{formatTempo(tempo)}</span>
              <span className="text-[10px] text-red-400 ml-auto">gravando...</span>
            </div>
            <button type="button" onClick={parar} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2.5 rounded-xl cursor-pointer transition-colors shrink-0">
              Parar
            </button>
          </>
        ) : uploading ? (
          <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2.5 flex-1">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-xs text-teal-600">Convertendo e enviando...</span>
          </div>
        ) : (
          <button type="button" onClick={iniciar} className="flex items-center gap-2.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-600 hover:text-red-600 cursor-pointer transition-all w-full group">
            <svg className="w-4.5 h-4.5 text-slate-400 group-hover:text-red-500 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            Clique para gravar audio
          </button>
        )}
      </div>
      {erro && (
        <p className="text-[11px] text-red-500 bg-red-50 rounded-lg px-3 py-1.5">{erro}</p>
      )}
    </div>
  );
}
