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
    <div className="min-h-screen w-full flex select-none font-['Inter'] bg-white">
      {/* LEFT PANE: Corporate Brand Banner (Hidden on mobile) */}
      <div className="hidden md:flex md:w-[42%] lg:w-[38%] bg-gradient-to-br from-[#F40009] via-[#E10008] to-[#9D0004] p-12 flex-col justify-between text-white relative overflow-hidden shrink-0 border-r border-[#E2E8F0]/10">
        {/* Soft corporate grid pattern */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        {/* Subtle diagonal highlight */}
        <div className="absolute -top-1/2 -right-1/4 w-[150%] h-[150%] rounded-full bg-white/[0.03] blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md border border-white/20 transition-transform duration-300 hover:scale-105">
            <img src="/logo-brasal.png" alt="Brasal Logo" className="w-7 h-7 object-contain brightness-0 invert" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight uppercase leading-none font-display text-white">Brasal</span>
            <span className="text-[9px] font-bold text-white/80 tracking-[0.15em] uppercase mt-0.5">Refrigerantes</span>
          </div>
        </div>

        {/* Content / Value Prop */}
        <div className="space-y-6 max-w-sm z-10 my-auto">
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight font-display">
            Painel de Comunicação Inteligente
          </h2>
          <p className="text-white/80 text-sm leading-relaxed font-medium">
            Gerencie fluxos conversacionais, automatize o envio de mensagens e acompanhe as conexões de WhatsApp em tempo real.
          </p>
          <div className="pt-4 flex flex-wrap gap-2.5">
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl text-xs font-semibold border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sincronização Ativa
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl text-xs font-semibold border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Agendamentos
            </div>
          </div>
        </div>

        {/* Left Pane Footer */}
        <div className="text-[11px] text-white/60 font-semibold z-10 uppercase tracking-wider">
          Brasal Refrigerantes © {new Date().getFullYear()}
        </div>
      </div>

      {/* RIGHT PANE: Clean Login Form */}
      <div className="w-full md:w-[58%] lg:w-[62%] flex items-center justify-center p-6 sm:p-12 bg-[#F8FAFC]">
        {/* Main Card */}
        <div className="w-full max-w-[420px] bg-white rounded-2xl border border-[#E2E8F0] p-8 sm:p-10 shadow-[0_8px_30px_rgba(15,23,42,0.03)] animate-fadeInScale relative">
          {/* Mobile Logo Header */}
          <div className="flex flex-col items-center text-center mb-8 md:hidden">
            <div className="w-14 h-14 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-center mb-3">
              <img src="/logo-brasal.png" alt="Brasal Logo" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight uppercase font-display leading-none">
              Brasal
            </h1>
            <span className="text-[10px] font-bold text-[#F40009] tracking-[0.2em] uppercase mt-1">
              Refrigerantes
            </span>
          </div>

          {/* Desktop Form Header */}
          <div className="hidden md:block mb-8">
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight font-display">
              Acessar Painel
            </h1>
            <p className="text-[#64748B] text-sm mt-1.5 font-medium">
              Entre com suas credenciais de usuário para gerenciar o sistema.
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-3 animate-fadeIn">
              <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-2" htmlFor="username">
                Usuário
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  disabled={loading}
                  placeholder="Seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] text-sm focus:outline-none focus:border-[#F40009] focus:ring-4 focus:ring-[#F40009]/5 focus:bg-white placeholder-[#94A3B8] transition-all font-medium"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-2" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] text-sm focus:outline-none focus:border-[#F40009] focus:ring-4 focus:ring-[#F40009]/5 focus:bg-white placeholder-[#94A3B8] transition-all font-medium"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#F40009] hover:bg-[#D10007] active:bg-[#9D0004] text-white text-sm font-bold cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none mt-8 flex items-center justify-center shadow-md shadow-[#F40009]/10 hover:shadow-lg hover:shadow-[#F40009]/15"
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

        {/* Mobile footer copyright */}
        <div className="absolute bottom-4 text-center w-full text-[10px] font-bold text-[#94A3B8] tracking-wide pointer-events-none md:hidden px-4">
          Brasal Refrigerantes © {new Date().getFullYear()}. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
