import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithGoogle, signInWithDemo, registerWithEmail, loginWithEmail } from '../lib/firebase';
import { X, Mail, Lock, User as UserIcon, LogIn, Chrome } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: (user: any) => void; // ✅ Optional
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
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
      let user;
      if (isLogin) {
        user = await loginWithEmail(email, password);
      } else {
        user = await registerWithEmail(name, email, password);
      }
      if (onLogin) onLogin(user);
      onClose();
    } catch (err: any) {
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleError('');
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (onLogin) onLogin(user);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      setGoogleError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      const user = await signInWithDemo();
      if (onLogin) onLogin(user);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-xl font-bold text-white font-mtavruli">
                {isLogin ? 'სისტემაში შესვლა' : 'რეგისტრაცია'}
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Social Login */}
              <div className="space-y-3">
                <button
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
                <button
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-slate-800 text-slate-200 border border-white/10 p-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  <UserIcon className="w-5 h-5" />
                  დემო режимი
                </button>
              </div>

              {googleError && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                  {googleError}
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-400">ან ელ-ფოსტით</span></div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 ml-1">მომხმარებლის სახელი</label>
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
                        placeholder="თქვენი სახელი"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 ml-1">ელ-ფოსტა</label>
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
                  <label className="text-xs font-medium text-slate-400 ml-1">პაროლი</label>
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
                      {isLogin ? 'შესვლა' : 'რეგისტრაცია'}
                    </>
                  )}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-slate-400 hover:text-sky-400 transition-colors"
                >
                  {isLogin ? "არ გაქვთ ანგარიში? დარეგისტრირდით" : "უკვე გაქვთ ანგარიში? შედით"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;