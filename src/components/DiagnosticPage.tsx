import React, { useState, useEffect, useRef } from 'react';
// NEW IMPORTS:
import { auth, db, signInWithGoogle, doc, getDoc, collection } from '../lib/firebase';
const DiagnosticPage: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Helper to add timestamped logs
  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString('en-GB'); // HH:MM:SS
    setLogs(prev => [`[${time}] ${message}`, ...prev]);
  };

  // Safe Env Checker
  const checkEnv = (key: string) => {
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return true;
    } catch(e) {
      // ignored
    }
    try {
      if (typeof process !== 'undefined' && process.env && process.env[key]) return true;
    } catch(e) {
      // ignored
    }
    return false;
  };

  // Define env status 
  const envStatus = [
    { key: 'VITE_FIREBASE_API_KEY', exists: checkEnv('VITE_FIREBASE_API_KEY') },
    { key: 'VITE_FIREBASE_AUTH_DOMAIN', exists: checkEnv('VITE_FIREBASE_AUTH_DOMAIN') },
    { key: 'VITE_FIREBASE_PROJECT_ID', exists: checkEnv('VITE_FIREBASE_PROJECT_ID') },
    { key: 'VITE_FIREBASE_STORAGE_BUCKET', exists: checkEnv('VITE_FIREBASE_STORAGE_BUCKET') },
    { key: 'VITE_FIREBASE_MESSAGING_SENDER_ID', exists: checkEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') },
    { key: 'VITE_FIREBASE_APP_ID', exists: checkEnv('VITE_FIREBASE_APP_ID') },
    { key: 'VITE_GEMINI_API_KEY', exists: checkEnv('VITE_GEMINI_API_KEY') },
  ];

  // 1. Monitor Auth State
  useEffect(() => {
    addLog('System initialization...');
    // Namespaced SDK usage
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        addLog(`Auth Event: User identified as ${user.email}`);
        setCurrentUser(user);
      } else {
        addLog('Auth Event: No active session detected');
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Run Diagnostics
  const runConnectionTest = async () => {
    if (isRunning) return;
    setIsRunning(true);
    addLog('>>> INITIATING DIAGNOSTIC SEQUENCE <<<');

    try {
      // Step A: App Check
      addLog('Step 1: Checking Firebase App initialization...');
      if (db && auth) {
        addLog('Result: Firebase App Instance [ VALID ]');
      } else {
        throw new Error('Firebase App not initialized');
      }

      // Step B: Firestore Connectivity (განახლებული)
      addLog('Step 2: Pinging Firestore Database...');
      const startTime = Date.now();
      try {
         // NEW SYNTAX:
         await getDoc(doc(db, 'system_diagnostics', 'ping'));
         const latency = Date.now() - startTime;
         addLog(`Result: Firestore Connection Established (${latency}ms) [ OK ]`);
      }catch (err: any) {
         addLog(`Result: Firestore Error - ${err.message} [ FAILED ]`);
      }

      // Step C: Auth Handshake
      addLog('Step 3: Triggering Google Auth Provider...');
      try {
        await signInWithGoogle();
        addLog('Result: Auth Provider Handshake [ SUCCESS ]');
      } catch (err: any) {
        if (err.code === 'auth/popup-closed-by-user') {
          addLog('Result: Auth Popup Closed by User [ ABORTED ]');
        } else if (err.code === 'auth/configuration-not-found') {
          addLog('Result: Auth Config Not Found. Check Console > Authentication [ FAILED ]');
        } else if (err.code === 'auth/unauthorized-domain') {
          addLog(`[CRITICAL] Domain Unauthorized. Add "${window.location.hostname}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
        } else if (err.code === 'auth/invalid-credential') {
          addLog('[CRITICAL] Invalid API Key or Credentials. Check .env configuration.');
        } else {
          addLog(`Result: Auth Error - ${err.message} [ FAILED ]`);
        }
      }

    } catch (error: any) {
      addLog(`CRITICAL SYSTEM FAILURE: ${error.message}`);
    } finally {
      addLog('>>> DIAGNOSTIC SEQUENCE COMPLETE <<<');
      setIsRunning(false);
    }
  };

  const handleLogout = async () => {
    addLog('Action: Terminating session...');
    await auth.signOut();
    addLog('Result: Session terminated.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-sky-400 font-mono p-4 md:p-10 selection:bg-sky-500/30 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-white mb-2">
              System Diagnostics
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em]">
              Dronehub Control Terminal v2.4
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></div>
            <span className="text-[10px] font-bold text-slate-400">
              {isRunning ? 'RUNNING TESTS...' : 'SYSTEM READY'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Status Indicators */}
          <div className="space-y-8">
            
            {/* Environment Variables */}
            <section className="bg-slate-900/50 border border-white/10 p-6 rounded-2xl">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">
                Environment Configuration
              </h3>
              <div className="space-y-3">
                {envStatus.map(({ key, exists }) => (
                  <div key={key} className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 truncate pr-4">{key}</span>
                    <span className={`font-bold uppercase tracking-wider ${exists ? 'text-emerald-500' : 'text-rose-500'}`}>
                      [{exists ? ' OK ' : ' MISSING '}]
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Auth Status */}
            <section className="bg-slate-900/50 border border-white/10 p-6 rounded-2xl">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">
                Authentication Node
              </h3>
              {currentUser ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">UID:</span>
                    <span className="text-white font-bold">{currentUser.uid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">EMAIL:</span>
                    <span className="text-sky-300">{currentUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">DISPLAY NAME:</span>
                    <span className="text-white">{currentUser.displayName || 'N/A'}</span>
                  </div>
                  <div className="pt-4">
                     <button 
                       onClick={handleLogout}
                       className="w-full py-2 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-[10px] font-black uppercase tracking-widest transition-all"
                     >
                       [ TERMINATE SESSION ]
                     </button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <div className="text-amber-500 font-bold tracking-widest mb-2">[ STATUS: UNAUTHORIZED ]</div>
                  <p className="text-[10px] text-slate-400">Run connection test to attempt login.</p>
                </div>
              )}
            </section>

            {/* Control Deck */}
            <section className="bg-slate-900/50 border border-white/10 p-6 rounded-2xl">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">
                Control Deck
              </h3>
              <button
                onClick={runConnectionTest}
                disabled={isRunning}
                className={`w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] border transition-all relative overflow-hidden group ${
                  isRunning 
                    ? 'border-amber-500/30 text-amber-500 bg-amber-500/5 cursor-wait' 
                    : 'border-sky-500/30 text-sky-400 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                }`}
              >
                {isRunning && <span className="absolute inset-0 bg-amber-500/10 animate-pulse"></span>}
                [ {isRunning ? 'EXECUTING...' : 'RUN CONNECTION TEST'} ]
              </button>
            </section>
          </div>

          {/* Right Column: Real-time Logs */}
          <div className="bg-[#020617] border border-white/10 rounded-2xl p-6 flex flex-col h-[500px] lg:h-auto font-mono text-xs">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex justify-between items-center">
              <span>System Log</span>
              <span className="text-emerald-500 animate-pulse">● LIVE</span>
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 font-medium">
              {logs.length === 0 && (
                <div className="text-slate-700 italic text-[10px] pt-4 text-center">
                  Waiting for system events...
                </div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="border-l-2 border-white/5 pl-3 py-0.5 hover:bg-white/[0.02] hover:border-sky-500/50 transition-colors break-all">
                  <span className="opacity-60">{log}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 text-right">
              <button 
                onClick={() => setLogs([])}
                className="text-[9px] font-bold text-slate-400 hover:text-white uppercase tracking-widest"
              >
                [ CLEAR LOGS ]
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;
