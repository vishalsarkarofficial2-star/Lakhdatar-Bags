import { useState, type FormEvent } from 'react';
import { ShoppingBag, Lock, User, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { validateUserLogin, isSupabaseConfigured } from '../services/supabase';
import { AuthSession } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isConnected = isSupabaseConfigured();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await validateUserLogin(username, password);
      if (result.success && result.user) {
        const session: AuthSession = {
          isAuthenticated: true,
          username: result.user.username,
          name: result.user.name || 'Lakhdatar Admin',
          role: result.user.role || 'admin',
          loginTime: new Date().toISOString(),
        };
        localStorage.setItem('lakhdatar_auth_session', JSON.stringify(session));
        onLoginSuccess(session);
      } else {
        setError(result.error || 'Invalid username or password');
      }
    } catch (err: any) {
      setError('Connection error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoCredentials = () => {
    setUsername('lakhdatarbags');
    setPassword('lakhdatarbags@#2026');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] text-[#2D2A26] flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans">
      {/* Top Header Badge */}
      <div className="w-full max-w-md mx-auto pt-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFE9DD] border border-[#DDD4C5] text-[#5C4D3C] text-xs font-medium tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2E6B4F]" />
          <span>Internal Wholesale Management Portal</span>
        </div>
      </div>

      {/* Main Login Card (Mobile-First 100% full-width up to max-w-md) */}
      <div className="w-full max-w-md mx-auto my-auto bg-white rounded-2xl shadow-sm border border-[#E8E0D2] p-6 sm:p-8">
        {/* Brand Icon & Name */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#2D6A4F] text-[#FAF7F2] flex items-center justify-center shadow-md mb-3">
            <ShoppingBag className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1E3A2B] tracking-tight">
            Lakhdatar Bags
          </h1>
          <p className="text-sm text-[#7A6E5F] mt-1">
            Premium Bags & Corporate Gifting • Delhi
          </p>
        </div>

        {/* Database Status Pill */}
        <div className="mb-5 flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-[#F7F4EE] border border-[#E6DEC $\rightarrow$ E6DEC] border-[#E8DFC9] text-[#6B5E4E]">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-600'
              }`}
            />
            <span>DB Engine: {isConnected ? 'Supabase Cloud' : 'Supabase Table Engine'}</span>
          </span>
          <span className="text-[11px] font-mono text-[#8C7A63]">app_users row</span>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            id="login-error-alert"
            className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-[#5A5043] mb-1.5"
            >
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A7C6B]">
                <User className="w-5 h-5" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="lakhdatarbags"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#FAF8F5] border border-[#DED3C1] text-base text-[#1E1C1A] placeholder-[#A09382] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5A5043]"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-[#2D6A4F] hover:underline font-medium"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A7C6B]">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#FAF8F5] border border-[#DED3C1] text-base text-[#1E1C1A] placeholder-[#A09382] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit-button"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-5 rounded-xl bg-[#2D6A4F] hover:bg-[#23553E] active:scale-[0.99] text-[#FAF7F2] font-semibold text-base flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-70 disabled:pointer-events-none min-h-[48px]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Validating against Supabase...
              </span>
            ) : (
              <>
                <span>Log In to CRM</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Autofill Pill */}
        <div className="mt-6 pt-5 border-t border-[#EDE5D6] text-center">
          <p className="text-xs text-[#7A6E5F] mb-2 font-medium">
            Single Authorized User Account:
          </p>
          <button
            type="button"
            onClick={handleFillDemoCredentials}
            className="w-full py-2.5 px-3 rounded-lg bg-[#F5EFE4] hover:bg-[#EFE5D4] border border-[#DECDB7] text-xs text-[#524434] font-mono flex items-center justify-center gap-2 transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>Auto-fill: lakhdatarbags</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-md mx-auto text-center pb-4 text-xs text-[#8C7D6B]">
        <p>Lakhdatar Bags • Okhla Industrial Area, New Delhi</p>
        <p className="mt-1 text-[11px] text-[#A69784]">
          Canvas • Cotton Tote • Jute • Potli • Jewellery Pouches
        </p>
      </div>
    </div>
  );
}
