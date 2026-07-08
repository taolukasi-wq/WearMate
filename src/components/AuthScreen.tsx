import React, { useState } from 'react';
import { AuthResponse, UserProfile } from '../types';

interface AuthScreenProps {
  onLogin: (user: UserProfile, token: string) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('style@digitalatelier.com');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('Julian');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'signup' ? '/api/register' : '/api/login';
      const body =
        mode === 'signup'
          ? { name: fullName, email, password }
          : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      const auth = data as AuthResponse;
      onLogin(auth.user, auth.token);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f8f9fc] text-[#191c1e] font-sans flex flex-col lg:flex-row overflow-x-hidden">
      {/* Background Ambient Blur Blobs */}
      <div className="fixed -top-[10%] -right-[10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="fixed -bottom-[10%] -left-[10%] w-[400px] h-[400px] bg-tertiary-fixed/20 rounded-full blur-[100px] z-0 pointer-events-none" />

      {/* Left Column: Hero/Visual (Desktop only priority) */}
      <section className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center p-16 z-10">
        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl min-h-[600px]">
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-primary/60 via-primary/10 to-transparent" />
          <img
            className="absolute inset-0 w-full h-full object-cover"
            alt="Fashion model curation banner"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBWJOndnMmhVChTv70-x-0PVbuoiQuIiLcmZhrGcZyhJ9NlfdaYJ0VYaaqnjeyXCp5uol5BCzsbvI4N7DMRI3xuRBk5bwkFkirCTbNkGZmrzLyBNp5W6M4tnoqLhXC92f0hPhHI6T9VmnbkNpDPbRFSUoTWSbfT-yDlRFjI1X4d8n42q0HFvEAmpVuxCYdHwuYNiKo-CWZGH-_kcIHKG5e6nzNTlW6mZ4JDRYuAZ72Tr--9USuiX0"
          />
          <div className="absolute bottom-16 left-16 right-16 z-30 text-white">
            <h1 className="font-display text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              Curating Your Digital Identity.
            </h1>
            <p className="font-sans text-lg text-white/90 max-w-md leading-relaxed">
              Experience the fusion of high-fashion editorial aesthetics and cutting-edge computational intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* Right Column: Auth Form */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 py-12 z-10 relative">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl font-extrabold tracking-tighter text-primary mb-2">
              DigitalAtelier
            </h2>
            <p className="font-sans text-sm font-medium text-on-surface-variant">
              Elevate your style with AI-powered curation
            </p>
          </div>

          {/* Form Container */}
          <div className="glass-card p-8 rounded-2xl shadow-sm">
            {/* Toggle */}
            <div className="flex p-1 bg-surface-container rounded-xl mb-8">
              <button
                type="button"
                className={`flex-1 py-2.5 font-sans text-sm font-semibold rounded-lg transition-all duration-300 ${
                  mode === 'signin'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
                onClick={() => setMode('signin')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 font-sans text-sm font-semibold rounded-lg transition-all duration-300 ${
                  mode === 'signup'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
                onClick={() => setMode('signup')}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 ml-1 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans text-sm"
                    placeholder="Alexander McQueen"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 ml-1 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans text-sm"
                  placeholder="style@digitalatelier.com"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 ml-1">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <a href="#forgot" className="text-[11px] font-bold text-primary-container hover:underline">
                      Forgot?
                    </a>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-6 bg-primary text-white rounded-xl font-display font-semibold text-sm hover:bg-primary-container active:scale-[0.98] transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-white">sync</span>
                    <span>Processing...</span>
                  </>
                ) : mode === 'signin' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#fbfcff]/90 px-3 text-on-surface-variant font-medium">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => onLogin({ name: 'Julian', email: 'guest@apple.com', avatar: '', skinTone: 'Cool Ivory', bodyType: 'Hourglass' }, 'guest-token')}
                className="flex items-center justify-center gap-2 py-3 border border-outline-variant/60 rounded-xl hover:bg-white transition-all active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M17.05,20.28c-0.96,0-2.04-0.68-3.32-0.68c-1.27,0-2.12,0.66-3.21,0.66c-1.39,0-3.32-1.92-4.22-3.52 c-1.57-2.77-0.99-6.49,1.44-8.08C8.59,8.09,9.7,7.66,10.74,7.66c1.01,0,1.96,0.39,2.83,0.39c0.8,0,1.99-0.45,3.28-0.45 c1.1,0,2.5,0.4,3.48,1.38c-0.1,0.08-2.12,1.21-2.12,3.7c0,3.01,2.58,4.06,2.62,4.08C20.84,16.82,20,18.73,18.73,19.55 C18.17,19.92,17.58,20.28,17.05,20.28L17.05,20.28z M14.38,5.92c-0.62,0.78-1.56,1.42-2.58,1.41c-0.14-1.2,0.44-2.38,1.11-3.13 c0.67-0.76,1.75-1.42,2.7-1.42C15.75,4.06,15.08,5.03,14.38,5.92L14.38,5.92z"
                    fill="currentColor"
                  />
                </svg>
                <span className="font-sans text-xs font-semibold">Apple</span>
              </button>
              <button
                type="button"
                onClick={() => onLogin({ name: 'Julian', email: 'guest@google.com', avatar: '', skinTone: 'Cool Ivory', bodyType: 'Hourglass' }, 'guest-token')}
                className="flex items-center justify-center gap-2 py-3 border border-outline-variant/60 rounded-xl hover:bg-white transition-all active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="font-sans text-xs font-semibold">Google</span>
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <p className="mt-8 text-center font-sans text-xs text-on-surface-variant max-w-[300px] mx-auto leading-relaxed">
            By continuing, you agree to our{' '}
            <a className="text-primary font-semibold hover:underline" href="#terms">
              Terms of Service
            </a>{' '}
            and{' '}
            <a className="text-primary font-semibold hover:underline" href="#privacy">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </section>

      {/* Decorative floating widgets on desktop */}
      <div className="hidden lg:block absolute top-[15%] left-[5%] p-4 glass-card rounded-2xl shadow-xl animate-bounce z-20 pointer-events-none" style={{ animationDuration: '6s' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined filled text-white text-lg">auto_awesome</span>
          </div>
          <div>
            <p className="text-xs font-bold text-primary">AI Stylist Active</p>
            <p className="text-[10px] text-on-surface-variant font-medium">Ready to scan closet</p>
          </div>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-[20%] left-[40%] p-4 glass-card rounded-2xl shadow-xl animate-bounce z-20 pointer-events-none" style={{ animationDuration: '8s', animationDelay: '1.5s' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-white text-lg">trending_up</span>
          </div>
          <div>
            <p className="text-xs font-bold text-on-tertiary-container">Daily Trends</p>
            <p className="text-[10px] text-on-surface-variant font-medium">Updated just now</p>
          </div>
        </div>
      </div>
    </div>
  );
}
