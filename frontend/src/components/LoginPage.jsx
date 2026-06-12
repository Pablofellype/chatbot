import { useState, useMemo } from 'react';
import { authService } from '../services/api';

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(username, password);
      const { token, usuario } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      
      onLoginSuccess(usuario);
    } catch (err) {
      console.error('[LOGIN_ERROR]', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Erro ao conectar com o servidor. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate bubbles for carbonation background effect (persists across renders)
  const bubbles = useMemo(() => {
    return Array.from({ length: 35 }).map((_, idx) => ({
      id: idx,
      size: Math.random() * 8 + 3, // 3px to 11px
      left: Math.random() * 100, // 0% to 100%
      delay: Math.random() * 12, // 0s to 12s
      duration: Math.random() * 10 + 8, // 8s to 18s
    }));
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0505] select-none font-['Inter']">
      {/* Carbonated Bubbles animation styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes riseUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.45;
          }
          90% {
            opacity: 0.45;
          }
          100% {
            transform: translateY(-108vh) scale(1.3);
            opacity: 0;
          }
        }
        .bubble-element {
          animation-name: riseUp;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
      `}} />

      {/* Deep Red Radial Glowing blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] md:w-[800px] h-[500px] md:h-[800px] rounded-full pointer-events-none filter blur-[100px] opacity-[0.25] select-none"
           style={{ background: 'radial-gradient(circle, #F40009 0%, rgba(10,5,5,0) 70%)' }} />
      <div className="absolute bottom-[-20%] left-[-20%] w-[600px] md:w-[900px] h-[600px] md:h-[900px] rounded-full pointer-events-none filter blur-[120px] opacity-[0.15] select-none"
           style={{ background: 'radial-gradient(circle, #9d0004 0%, rgba(10,5,5,0) 70%)' }} />

      {/* Carbonation Effect (Bubbles) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {bubbles.map(b => (
          <div
            key={b.id}
            className="absolute bottom-[-20px] rounded-full bg-white/20 bubble-element"
            style={{
              width: `${b.size}px`,
              height: `${b.size}px`,
              left: `${b.left}%`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
              boxShadow: '0 0 6px rgba(255, 255, 255, 0.2)',
            }}
          />
        ))}
      </div>

      {/* Main Glassmorphic Login Card */}
      <div 
        className="w-full max-w-[420px] rounded-2xl p-8 relative z-10 animate-fadeInScale border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.6)]"
        style={{ 
          background: 'rgba(20, 10, 11, 0.55)', 
          backdropFilter: 'blur(28px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.06), 0 0 40px rgba(244,0,9,0.08)'
        }}
      >
        
        {/* Header/Logo section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-[0_8px_32px_rgba(244,0,9,0.15)] mb-4 transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_rgba(244,0,9,0.3)]">
            <img src="/logo-brasal.png" alt="Brasal Logo" className="w-11 h-11 object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase font-display leading-none">
            Brasal
          </h1>
          <span className="text-[10px] font-bold text-[#F40009] tracking-[0.2em] uppercase mt-1">
            Refrigerantes
          </span>
          <div className="h-[1px] w-12 bg-white/10 my-4" />
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Painel do Chatbot
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-400 text-xs font-semibold flex items-center gap-3 animate-fadeIn">
            <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2" htmlFor="username">
              Usuário
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              <input
                id="username"
                type="text"
                required
                disabled={loading}
                placeholder="Nome do usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.04)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm focus:outline-none focus:border-[#F40009] focus:ring-4 focus:ring-[#F40009]/20 placeholder-gray-600 transition-all font-medium"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400" htmlFor="password">
                Senha
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>
              <input
                id="password"
                type="password"
                required
                disabled={loading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.04)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm focus:outline-none focus:border-[#F40009] focus:ring-4 focus:ring-[#F40009]/20 placeholder-gray-600 transition-all font-medium"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #F40009 0%, #aa0006 100%)',
              boxShadow: '0 8px 24px rgba(244, 0, 9, 0.35)'
            }}
            className="w-full py-3 rounded-xl text-white text-sm font-bold cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(244,0,9,0.55)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-8 flex items-center justify-center"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Entrando...
              </span>
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>
      </div>

      <div className="absolute bottom-4 text-center w-full text-[10px] font-bold text-gray-500 tracking-wide pointer-events-none z-10">
        Brasal Refrigerantes © {new Date().getFullYear()}. Todos os direitos reservados.
      </div>
    </div>
  );
}

export default LoginPage;
