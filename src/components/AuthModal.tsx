import React, { useState } from 'react';
import { signInWithGoogle, signInWithDemo, registerWithEmail, loginWithEmail } from '../lib/firebase';
import { isDemoAuthEnabled } from '../utils/authUtils';
import { Mail, Lock, User as UserIcon, LogIn, Chrome } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../contexts/useLanguage';

/**
 * Firebase surfaces its auth failures as `FirebaseError`, whose `message` is
 * prefixed with "Firebase:". Narrow through `Error` rather than reaching into
 * an `any` — a rejection is not guaranteed to be an Error at all, and the old
 * `err.message.replace(...)` threw a second time when it was not.
 */
const authErrorMessage = (err: unknown, fallback: string): string => {
  if (!(err instanceof Error) || !err.message) return fallback;
  return err.message.replace('Firebase:', '').trim() || fallback;
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(name, email, password);
      }
      onClose();
    } catch (err) {
      setError(authErrorMessage(err, t('auth_failed')));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setGoogleError(authErrorMessage(err, t('auth_google_failed')));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!isDemoAuthEnabled()) {
      setError('Demo mode is disabled in production.');
      return;
    }
    try {
      await signInWithDemo();
      onClose();
    } catch (err) {
      // Previously logged only to the console, so a failed demo sign-in looked
      // to the user like a button that does nothing.
      setError(authErrorMessage(err, t('auth_failed')));
      console.error(err);
    }
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isLogin ? t('auth_sign_in_title') : t('auth_register')}
      size="max-w-md"
      busy={loading}
    >
            <div className="p-6 space-y-6">
              {/* Social Login */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 p-3 rounded-xl font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <Chrome className="w-5 h-5" />
                  )}
                  Google-ით შესვლა
                </button>
                {isDemoAuthEnabled() && (
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-slate-800 text-slate-200 border border-white/10 p-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  <UserIcon className="w-5 h-5" />
                  დემო режимი
                </button>
                )}
              </div>

              {googleError && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                  {googleError}
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-400">{t('auth_or_email')}</span></div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <label htmlFor="auth-name" className="text-xs font-medium text-slate-400 ml-1">{t('field_username')}</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="fullName"        // შესწორება: name
                        id="auth-name"         // შესწორება: id
                        autoComplete="name"    // შესწორება: autocomplete
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:border-sky-500 focus:outline-none transition-colors"
                        placeholder={t('field_your_name')}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="auth-email" className="text-xs font-medium text-slate-400 ml-1">{t('field_email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"            // შესწორება: name
                      id="auth-email"         // შესწორება: id
                      autoComplete="email"    // შესწორება: autocomplete
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:border-sky-500 focus:outline-none transition-colors"
                      placeholder="hello@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="auth-password" className="text-xs font-medium text-slate-400 ml-1">{t('field_password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      name="password"             // შესწორება: name
                      id="auth-password"          // შესწორება: id
                      autoComplete={isLogin ? "current-password" : "new-password"} // შესწორება: autocomplete
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:border-sky-500 focus:outline-none transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-rose-500 text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white p-3 rounded-xl font-bold shadow-lg shadow-sky-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      {isLogin ? t('auth_sign_in') : t('auth_register')}
                    </>
                  )}
                </button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-slate-400 hover:text-sky-400 transition-colors"
                >
                  {isLogin ? t('auth_switch_to_register') : t('auth_switch_to_login')}
                </button>
              </div>
            </div>
    </Modal>
  );
};

export default AuthModal;