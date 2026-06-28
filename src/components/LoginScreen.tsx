import React, { useState } from 'react';
import { Shield, Key, AlertTriangle, HelpCircle, Terminal } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: { id: string; username: string; role: 'admin' | 'user'; email: string; secretCode: string }) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [wafBlock, setWafBlock] = useState<{ blocked: boolean; patterns: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick select accounts for demo
  const demoAccounts = [
    { name: 'alice', label: 'Alice (Standard User)', pass: 'alice' },
    { name: 'bob', label: 'Bob (Standard User)', pass: 'bob' },
    { name: 'admin', label: 'Admin (System Administrator)', pass: 'admin' },
  ];

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setWafBlock(null);
    setLoading(true);

    const targetUser = customUser || username;
    const targetPass = customPass || password;

    if (!targetUser) {
      setError('Username cannot be empty');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUser, password: targetPass }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err: any) {
      if (err.status === 403 || err.message?.includes('blocked') || err.name === 'AbortError') {
        // Handled below in catch block or handled in response parsing
      }
      
      // Check if server returned a 403 status (WAF blocks are 403)
      try {
        // Try parsing error as WAF block if we can capture it
        const checkRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: targetUser, password: targetPass }),
        });
        if (checkRes.status === 403) {
          const checkData = await checkRes.json();
          setWafBlock({
            blocked: true,
            patterns: checkData.patterns || ['WAF Rules violation: Input matches signature SQLi Tautologies']
          });
          setError('WAF Intercept Event: Malicious payload terminated before evaluation.');
          setLoading(false);
          return;
        }
      } catch (inner) {}

      setError('Connection refused or authentication blocked.');
    } finally {
      setLoading(false);
    }
  };

  const tryInjection = (payload: string) => {
    setUsername(payload);
    setPassword('any_password');
    // Auto-fire login with payload
    setTimeout(() => {
      handleLogin(undefined, payload, 'any_password');
    }, 100);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4" id="login-container">
      <div className="w-full max-w-md glass-card rounded-2xl border border-sky-500/20 shadow-sky-500/5 shadow-2xl overflow-hidden">
        {/* Banner */}
        <div className="cyber-gradient px-6 py-6 text-center border-b border-white/5 flex flex-col items-center relative">
          <div className="absolute top-2 right-3 flex items-center gap-1 text-[10px] text-sky-200/70 font-mono tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Node WAF Active
          </div>
          
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-3 shadow-lg cyber-glow">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">SECUREVAULT</h1>
          <p className="text-sky-100/80 text-xs mt-1 font-mono">CRYPTOGRAPHIC LAB & SECURE STORAGE</p>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Username / Identity</label>
              <div className="relative">
                <input
                  id="login-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-xl glass-input text-sm font-mono placeholder:text-gray-600"
                  placeholder="e.g. alice, admin, or SQLi vector..."
                  disabled={loading}
                />
                <Key className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  id="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-xl glass-input text-sm font-mono placeholder:text-gray-600"
                  placeholder="Password matches username for demo..."
                  disabled={loading}
                />
                <Shield className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-500" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex gap-2.5 items-start">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">ALERT: </span> {error}
                </div>
              </div>
            )}

            {wafBlock && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs space-y-1.5 font-mono">
                <div className="flex gap-2 items-center text-amber-200 font-bold">
                  <Terminal className="w-4 h-4" />
                  WAF SYSTEM INTERCEPT: DETECTED ATTACK
                </div>
                <p className="text-[11px] text-amber-200/80">
                  Input matched active SQL Injection (SQLi) defense rules. Connection terminated before compiling dynamic queries.
                </p>
                <div className="pt-1.5 border-t border-amber-500/20">
                  <div className="text-[10px] uppercase text-gray-400 tracking-wider">Matched Pattern Alerts:</div>
                  {wafBlock.patterns.map((p, idx) => (
                    <div key={idx} className="text-[10px] text-amber-400/95 mt-0.5 leading-relaxed">
                      ▶ {p}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl cyber-gradient hover:opacity-90 active:scale-[0.98] transition-all text-white font-medium text-sm flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Authenticate Identity'
              )}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[11px] font-mono text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
              Simulated Identities
            </h3>
            <div className="grid grid-cols-1 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.name}
                  id={`demo-acc-${acc.name}`}
                  type="button"
                  onClick={() => {
                    setUsername(acc.name);
                    setPassword(acc.pass);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 text-left font-mono text-xs text-gray-300 flex justify-between items-center transition-colors cursor-pointer"
                >
                  <span>{acc.label}</span>
                  <span className="text-[10px] text-sky-400 uppercase tracking-widest font-bold">Use</span>
                </button>
              ))}
            </div>
          </div>

          {/* SQLi Laboratory shortcuts */}
          <div className="pt-3 border-t border-white/5">
            <h4 className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">SQL Injection Tests (WAF Demo)</h4>
            <div className="flex flex-wrap gap-1.5">
              <button
                id="test-sqli-tautology"
                onClick={() => tryInjection("' OR '1'='1")}
                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 text-[10px] font-mono rounded cursor-pointer transition-colors"
              >
                Tautology Payload
              </button>
              <button
                id="test-sqli-union"
                onClick={() => tryInjection("' UNION SELECT null, username, secretCode FROM users --")}
                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 text-[10px] font-mono rounded cursor-pointer transition-colors"
              >
                Union Select Payload
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
