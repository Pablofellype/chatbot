import { useState } from 'react';
import { authService } from '../services/api';

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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
      {/* LEFT PANE: Premium Corporate Brand Pane (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[42%] bg-gradient-to-br from-[#F40009] via-[#D10007] to-[#800003] p-12 flex-col justify-between text-white relative overflow-hidden shrink-0">
        {/* Soft elegant grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        {/* Soft radial overlay (pure branding, no high-intensity neon glow) */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-black/[0.15] blur-3xl pointer-events-none" />

        {/* Top Header Logo */}
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-white/20 shadow-md transition-transform duration-300 hover:scale-105">
            <img src="/logo-brasal.png" alt="Brasal Logo" className="w-8 h-8 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight uppercase leading-none font-display text-white">Brasal</span>
            <span className="text-[10px] font-bold text-white/95 tracking-[0.18em] uppercase mt-0.5">Refrigerantes</span>
          </div>
        </div>

        {/* Simulated Chat Interface in the center */}
        <div className="z-10 my-auto space-y-8 max-w-sm">
          <div className="space-y-3">
            <span className="bg-white/10 text-white/90 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/10">
              Painel de Comunicação
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight font-display text-white">
              Automatize seus contatos com inteligência.
            </h2>
            <p className="text-white/80 text-sm leading-relaxed font-medium">
              Agende mensagens, crie fluxos interativos de atendimento e conecte canais do WhatsApp de maneira integrada.
            </p>
          </div>

          {/* Interactive Chat Simulator Widget */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl w-full">
            {/* Header of simulator */}
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-3.5 mb-3.5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                <img src="/logo-brasal.png" alt="Brasal Bot" className="w-5.5 h-5.5 object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Brasal Atendimento</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] text-white/70 font-semibold uppercase tracking-wider">Agente Virtual</span>
                </div>
              </div>
            </div>

            {/* Simulated Messages */}
            <div className="space-y-3">
              {/* Bot message */}
              <div className="flex gap-2 max-w-[85%]">
                <div className="bg-white/15 text-white text-xs px-3.5 py-2.5 rounded-2xl rounded-tl-none font-medium leading-relaxed border border-white/5">
                  Olá! Seja bem-vindo ao suporte Brasal. Como posso ajudar você hoje? 🥤
                </div>
              </div>

              {/* User message */}
              <div className="flex gap-2 max-w-[85%] ml-auto justify-end">
                <div className="bg-white text-[#9D0004] text-xs px-3.5 py-2.5 rounded-2xl rounded-tr-none font-semibold leading-relaxed shadow-md">
                  Quero consultar meus agendamentos.
                </div>
              </div>

              {/* Bot response */}
              <div className="flex gap-2 max-w-[85%]">
                <div className="bg-white/15 text-white text-xs px-3.5 py-2.5 rounded-2xl rounded-tl-none font-medium leading-relaxed border border-white/5">
                  Processando dados... Suas mensagens automáticas já estão prontas no painel! 📊
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info on left */}
        <div className="text-[10px] text-white/60 font-bold uppercase tracking-wider z-10 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Canal Autorizado Brasal
        </div>
      </div>

      {/* RIGHT PANE: Modern Minimalist Login Form */}
      <div className="w-full lg:w-[58%] flex flex-col justify-between p-6 sm:p-12 md:p-16 bg-[#F8FAFC]">
        {/* Header container for top mobile logo */}
        <div className="flex items-center justify-between lg:justify-end">
          {/* Mobile Brasal Logo Header (Shown only on lg screens hidden) */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-[#E2E8F0] shadow-sm">
              <img src="/logo-brasal.png" alt="Brasal Logo" className="w-6.5 h-6.5 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight uppercase leading-none font-display text-[#0F172A]">Brasal</span>
              <span className="text-[8px] font-bold text-[#F40009] tracking-widest uppercase mt-0.5">Refrigerantes</span>
            </div>
          </div>

          <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
            Portal Administrativo
          </span>
        </div>

        {/* Main Card Container */}
        <div className="w-full max-w-[420px] mx-auto my-auto py-10">
          <div className="mb-8 text-left">
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight font-display">
              Acesse sua conta
            </h1>
            <p className="text-[#64748B] text-sm mt-1.5 font-medium leading-relaxed">
              Entre com suas credenciais de usuário para acessar e gerenciar o chatbot e os agendamentos.
            </p>
          </div>

          {/* Error Message banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-3 animate-fadeIn">
              <svg className="w-4.5 h-4.5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] text-sm focus:outline-none focus:border-[#F40009] focus:ring-4 focus:ring-[#F40009]/5 focus:bg-white placeholder-[#94A3B8] transition-all font-medium"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569]" htmlFor="password">
                  Senha
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] text-sm focus:outline-none focus:border-[#F40009] focus:ring-4 focus:ring-[#F40009]/5 focus:bg-white placeholder-[#94A3B8] transition-all font-medium"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] p-1.5 rounded-lg transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.754C3.223 8.847 7.244 4.5 12 4.5c4.756 0 8.773 4.347 9.965 7.068a1.012 1.012 0 010 .754C20.777 15.153 16.756 19.5 12 19.5c-4.756 0-8.773-4.347-9.965-7.068z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Extra Controls */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-[#CBD5E1] text-[#F40009] focus:ring-[#F40009] cursor-pointer"
                />
                <span className="text-xs text-[#475569] font-medium">Lembrar de mim</span>
              </label>
              <a href="mailto:suporte@brasal.com.br" className="text-xs text-[#F40009] hover:text-[#D10007] font-semibold transition-colors">
                Esqueceu a senha?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#F40009] hover:bg-[#D10007] active:bg-[#9D0004] text-white text-sm font-bold cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none mt-4 flex items-center justify-center shadow-md shadow-[#F40009]/10 hover:shadow-lg hover:shadow-[#F40009]/15"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Entrando no painel...
                </span>
              ) : (
                'Entrar no Painel'
              )}
            </button>
          </form>
        </div>

        {/* Footer copyright */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] font-bold text-[#94A3B8] border-t border-[#E2E8F0] pt-6 mt-6">
          <span>Brasal Refrigerantes © {new Date().getFullYear()}</span>
          <span className="flex gap-4">
            <a href="mailto:suporte@brasal.com.br" className="hover:text-[#475569] transition-colors">Suporte TI</a>
            <span>•</span>
            <span className="text-emerald-500">Servidores Conectados</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
