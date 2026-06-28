import React, { useState } from 'react';
import { Terminal, Database, ShieldAlert, Sparkles, AlertTriangle, Play, CheckCircle } from 'lucide-react';
import { SqliTestResult } from '../types';

export default function SqlPlayground() {
  const [inputVal, setInputVal] = useState('');
  const [isSecureMode, setIsSecureMode] = useState(false);
  const [testResult, setTestResult] = useState<SqliTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const presets = [
    { label: 'Normal Input: "alice"', value: 'alice' },
    { label: 'Normal Input: "bob"', value: 'bob' },
    { label: 'SQLi: Tautology Payload', value: "alice' OR '1'='1" },
    { label: 'SQLi: Union Select Exploit', value: "' UNION SELECT null, username, secretCode FROM users --" },
  ];

  const handleRunQuery = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/playground/test-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputVal, isSecureMode })
      });
      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="sql-playground-root">
      {/* Intro Banner */}
      <div className="glass-card rounded-2xl p-6 border-sky-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Terminal className="text-sky-400 w-5 h-5 animate-pulse-soft" />
            SQL Injection (SQLi) Laboratory
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed font-sans max-w-2xl">
            Experiment with SQL injection vulnerabilities. Contrast how dynamic string composition exposes the entire database against how prepared statements block injection vectors automatically.
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-xs">
          <span className="text-gray-500">Protection Layer:</span>
          <button
            id="toggle-sec-mode"
            onClick={() => setIsSecureMode(!isSecureMode)}
            className={`px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
              isSecureMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}
          >
            {isSecureMode ? '🛡️ WAF & Prepared (SECURE)' : '⚠️ Unprepared (VULNERABLE)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lab Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2">
              Query Construction Parameters
            </h3>

            <div>
              <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">SQL Search input</label>
              <input
                id="sqli-search-input"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg glass-input font-mono"
                placeholder="Type query or exploit string..."
              />
            </div>

            {/* Exploit Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Educational Payloads</span>
              <div className="grid grid-cols-1 gap-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    id={`preset-${idx}`}
                    type="button"
                    onClick={() => setInputVal(p.value)}
                    className="w-full text-left p-2 rounded bg-white/[0.02] hover:bg-sky-500/10 border border-white/5 hover:border-sky-500/25 text-[11px] font-mono text-gray-400 hover:text-sky-300 transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="btn-run-sqli"
              onClick={handleRunQuery}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-500/10 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 hover:text-white text-xs font-mono font-semibold tracking-wider transition-all flex justify-center items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              {loading ? 'Evaluating security state...' : 'Run Lab SQL Query'}
            </button>
          </div>

          <div className="p-5 glass-card rounded-2xl space-y-3 text-xs leading-relaxed">
            <h3 className="text-white font-semibold font-display">Cybersecurity Insights</h3>
            <p className="text-gray-400">
              When dynamic SQL string queries are created using plain text values:
              <br />
              <code className="text-rose-400 bg-black/30 px-1 py-0.5 rounded text-[11px]">username = '{inputVal || "..."}'</code>
              <br />
              Characters like <code className="text-rose-400">'</code> allow an attacker to breakout of the string literal and inject arbitrary statements (like <code className="text-sky-400">OR 1=1</code>).
            </p>
            <p className="text-gray-400">
              In <span className="text-emerald-400">Secure Mode</span>, queries are compiled with parameter place-holders (<code className="text-emerald-400 font-mono">?</code>). SQL compilers treat parameters strictly as data values, preventing injection attacks entirely.
            </p>
          </div>
        </div>

        {/* Lab Outputs & Visualizers */}
        <div className="lg:col-span-7 space-y-6">
          {testResult ? (
            <div className="glass-card rounded-2xl p-6 border-white/5 space-y-6">
              {/* Query Preview */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-gray-500 uppercase tracking-widest">Active Query Compilation</h4>
                
                <div className="p-3 bg-gray-950/40 rounded-xl space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] uppercase font-bold block text-rose-400">Dynamic Dynamic query (Vulnerable)</span>
                    <p className="text-gray-400 break-all select-all">{testResult.vulnerableQuery}</p>
                  </div>
                  <div className="border-t border-white/5 pt-2">
                    <span className="text-[10px] uppercase font-bold block text-emerald-400">Prepared parameterized query (Secure)</span>
                    <p className="text-gray-400 break-all select-all">{testResult.secureQuery}</p>
                  </div>
                </div>
              </div>

              {/* Status Header */}
              {testResult.isSqliPattern ? (
                <div className={`p-4 rounded-xl border flex gap-3 items-start ${
                  testResult.isBlocked
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}>
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <div className="space-y-1">
                    <div className="font-mono text-xs font-bold uppercase">
                      {testResult.isBlocked ? 'WAF Success: SQLi Blocked' : 'Vulnerable Execution: Exploit Successful'}
                    </div>
                    <p className="text-xs text-gray-400">
                      {testResult.isBlocked 
                        ? 'The SecureVault Web Application Firewall successfully parsed this statement, matched a malicious signature, and terminated execution safely.' 
                        : 'Malicious parameters bypassed server security checks and successfully modified the query logic. Database tables were compromised!'}
                    </p>
                    
                    {testResult.detectedPatterns.length > 0 && (
                      <div className="mt-2 pt-1 border-t border-white/5">
                        <span className="text-[10px] font-mono text-gray-500 uppercase font-bold">WAF Alert Signatures Match:</span>
                        {testResult.detectedPatterns.map((p, idx) => (
                          <div key={idx} className="text-[10px] text-amber-300/90 mt-0.5">
                            ▶ {p}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-500/10 border border-slate-500/20 text-sky-300 rounded-xl text-xs flex gap-2.5 items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono">Normal harmless input pattern detected. No WAF alerts raised.</span>
                </div>
              )}

              {/* Results Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vulnerable Result */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-rose-400 font-semibold block">Vulnerable Output:</span>
                  <div className="p-3 bg-black/20 border border-rose-500/10 rounded-xl min-h-[140px] max-h-[300px] overflow-auto">
                    {typeof testResult.vulnerableResult === 'string' ? (
                      <div className="text-xs font-mono text-gray-400">{testResult.vulnerableResult}</div>
                    ) : Array.isArray(testResult.vulnerableResult) && testResult.vulnerableResult.length > 0 ? (
                      <table className="w-full text-[11px] font-mono">
                        <thead>
                          <tr className="border-b border-white/5 text-gray-500 text-left">
                            <th className="pb-1">Username</th>
                            <th className="pb-1">Secret Code</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testResult.vulnerableResult.map((u: any, idx: number) => (
                            <tr key={idx} className="border-b border-white/5 text-gray-300 last:border-0">
                              <td className="py-1">{u.username}</td>
                              <td className="py-1 text-sky-400">{u.secretCode || '---'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-xs font-mono text-gray-500 text-center pt-8">No matching database records found.</div>
                    )}
                  </div>
                </div>

                {/* Secure Result */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-emerald-400 font-semibold block">Secure Output:</span>
                  <div className="p-3 bg-black/20 border border-emerald-500/10 rounded-xl min-h-[140px] max-h-[300px] overflow-auto">
                    {testResult.secureResult === 'BLOCKED BY WAF' ? (
                      <div className="text-xs font-mono text-emerald-400 flex flex-col items-center justify-center h-24 gap-1">
                        <span className="font-bold">❌ CONNECTION TERMINATED</span>
                        <span className="text-[10px] text-gray-500">Execution Blocked safely</span>
                      </div>
                    ) : Array.isArray(testResult.secureResult) && testResult.secureResult.length > 0 ? (
                      <table className="w-full text-[11px] font-mono">
                        <thead>
                          <tr className="border-b border-white/5 text-gray-500 text-left">
                            <th className="pb-1">Username</th>
                            <th className="pb-1">Secret Code</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testResult.secureResult.map((u: any, idx: number) => (
                            <tr key={idx} className="border-b border-white/5 text-gray-300 last:border-0">
                              <td className="py-1">{u.username}</td>
                              <td className="py-1 text-emerald-400">{u.secretCode || '---'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-xs font-mono text-gray-500 text-center pt-8">No matching database records found.</div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card rounded-2xl py-24 flex flex-col items-center justify-center text-center">
              <Database className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-xs font-mono text-gray-400">Configure parameters on the left and trigger run query.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
