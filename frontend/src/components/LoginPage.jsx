import { useState } from 'react';
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200" style={{ background: 'var(--bg)' }}>
      {/* Red/Blue background glow effects (matching Brasal brand and style) */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full pointer-events-none filter blur-[80px] opacity-[0.07] select-none"
           style={{ background: 'radial-gradient(circle, var(--brand) 0%, rgba(255,255,255,0) 70%)' }} />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] md:w-[700px] h-[500px] md:h-[700px] rounded-full pointer-events-none filter blur-[90px] opacity-[0.04] select-none"
           style={{ background: 'radial-gradient(circle, #3b82f6 0%, rgba(255,255,255,0) 70%)' }} />

      {/* Main card */}
      <div className="w-full max-w-[420px] card p-8 relative z-10 animate-fadeInScale shadow-xl border border-[var(--border)]" style={{ background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(16px)' }}>
        
        {/* Header/Logo section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-white border border-[var(--border)] rounded-2xl flex items-center justify-center shadow-md mb-4 transition-transform hover:scale-105 duration-300">
            <img src="/logo-brasal.png" alt="Brasal Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight uppercase font-display leading-tight">
            Brasal
          </h1>
          <span className="text-[10px] font-bold text-[#F40009] tracking-[0.15em] uppercase mt-0.5">
            Refrigerantes
          </span>
          <p className="text-[var(--text-muted)] text-sm mt-3 font-medium">
            Painel Administrativo do Chatbot
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl border border-rose-100 bg-rose-50/50 text-rose-600 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label" htmlFor="username">Usuário</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              <input
                id="username"
                type="text"
                required
                disabled={loading}
                placeholder="Ex: admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input !pl-10 !py-2.5"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="label !mb-0" htmlFor="password">Senha</label>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
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
                className="input !pl-10 !py-2.5"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary btn-lg !mt-8 relative overflow-hidden"
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

        {/* Brasal Wave design snippet under */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-[0.03] select-none h-8 rounded-b-lg">
          <svg className="absolute bottom-0 left-0 w-[120%] text-[#F40009]" viewBox="0 0 220 60" fill="currentColor">
            <path d="M0,25 Q60,45 120,20 T240,25 L240,60 L0,60 Z" />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-4 text-center w-full text-[10px] font-semibold text-[var(--text-muted)] tracking-wide pointer-events-none z-10">
        Brasal Refrigerantes © {new Date().getFullYear()}. Todos os direitos reservados.
      </div>
    </div>
  );
}

export default LoginPage;
