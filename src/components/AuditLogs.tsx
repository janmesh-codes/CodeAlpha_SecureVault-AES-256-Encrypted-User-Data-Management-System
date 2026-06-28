import React, { useState, useEffect } from 'react';
import { Terminal, Shield, AlertTriangle, Cpu, Trash2, ShieldAlert, Sparkles, X } from 'lucide-react';
import { SecurityLog } from '../types';

interface AuditLogsProps {
  token: string;
}

export default function AuditLogs({ token }: AuditLogsProps) {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(false);
  
  // AI Advisor state
  const [analyzingLog, setAnalyzingLog] = useState<SecurityLog | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear and rotate all firewall logs?')) return;
    try {
      const response = await fetch('/api/logs/clear', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        fetchLogs();
        setAnalyzingLog(null);
        setAiAnalysis(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiAnalysis = async (log: SecurityLog) => {
    setAnalyzingLog(log);
    setAiAnalysis(null);
    setAnalysisLoading(true);

    try {
      const response = await fetch('/api/security-advisor/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ logRecord: log })
      });
      const data = await response.json();
      if (data.success) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis(`Error: ${data.error || 'Failed to retrieve assessment from AI Advisor.'}`);
      }
    } catch (err: any) {
      setAiAnalysis(`Connection Error: ${err.message || 'Check connection to Gemini API.'}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Severity style helper
  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'warning': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default: return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    }
  };

  return (
    <div className="space-y-6" id="audit-logs-root">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border-white/5 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Total Monitored Events</span>
            <div className="text-xl font-mono text-white font-bold">{logs.length}</div>
          </div>
          <Terminal className="text-sky-400 w-5 h-5 opacity-40" />
        </div>

        <div className="glass-card rounded-2xl p-4 border-white/5 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">WAF Block Count</span>
            <div className="text-xl font-mono text-amber-400 font-bold">
              {logs.filter(l => l.isBlocked).length}
            </div>
          </div>
          <ShieldAlert className="text-amber-400 w-5 h-5 opacity-40" />
        </div>

        <div className="glass-card rounded-2xl p-4 border-white/5 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Critical Escalations</span>
            <div className="text-xl font-mono text-rose-400 font-bold">
              {logs.filter(l => l.severity === 'critical').length}
            </div>
          </div>
          <AlertTriangle className="text-rose-400 w-5 h-5 opacity-40" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Log Stream */}
        <div className={`${analyzingLog ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-4 transition-all duration-300`}>
          <div className="glass-card rounded-2xl p-5 border-white/5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-400" />
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Live Firewall Intrusion Stream</h2>
              </div>

              <div className="flex gap-2">
                <button
                  id="btn-refresh-logs"
                  onClick={fetchLogs}
                  className="px-2.5 py-1 text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 rounded cursor-pointer transition-colors"
                >
                  Refresh Feed
                </button>
                <button
                  id="btn-clear-logs"
                  onClick={handleClearLogs}
                  className="px-2.5 py-1 text-xs font-mono bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-300 hover:text-white rounded flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Rotate Logs
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-rose-500/30 border-t-rose-400 rounded-full animate-spin"></div>
                <span className="text-xs font-mono text-gray-400">Loading log databases...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-xl">
                <Shield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-xs font-mono text-gray-500">No events logged. SecureVault audit logs are clear.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-auto pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    id={`log-card-${log.id}`}
                    onClick={() => handleAiAnalysis(log)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left flex flex-col gap-2 ${
                      analyzingLog?.id === log.id
                        ? 'bg-sky-500/5 border-sky-500/30 shadow-sky-500/5'
                        : 'bg-white/[0.01] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide border ${getSeverityStyle(log.severity)}`}>
                          {log.severity}
                        </span>
                        
                        <span className="text-xs font-mono font-bold text-gray-300">
                          {log.eventType.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-gray-400 bg-black/25 p-2 rounded break-all">
                      {log.payload}
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-gray-500 gap-2">
                      <div>IP: <span className="text-gray-400">{log.ipAddress}</span></div>
                      <div>User: <span className="text-gray-400 font-semibold">{log.username}</span></div>
                      {log.isBlocked && (
                        <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
                          ✓ WAF INTERCEPTED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Security Advisor Section */}
        {analyzingLog && (
          <div className="lg:col-span-6 space-y-4 animate-fade-in" id="ai-advisor-panel">
            <div className="glass-card rounded-2xl p-5 border-sky-500/20 shadow-2xl relative">
              <button
                id="close-advisor"
                onClick={() => setAnalyzingLog(null)}
                className="absolute top-4 right-4 p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                  <Cpu className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">AI Incident Specialist</h3>
                  <p className="text-[10px] text-sky-400 font-mono">Gemini Threat Intelligence Agent</p>
                </div>
              </div>

              {analysisLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-sky-500/25 border-t-sky-400 rounded-full animate-spin"></div>
                  <span className="text-xs font-mono text-gray-400 animate-pulse">Consulting Threat Signature Models...</span>
                </div>
              ) : aiAnalysis ? (
                <div className="prose prose-invert max-w-none text-xs font-mono leading-relaxed text-gray-300 space-y-4 max-h-[500px] overflow-auto pr-1">
                  {/* Clean formatting wrapper for raw markdown */}
                  <div className="whitespace-pre-line text-xs font-sans text-gray-300 space-y-4 font-normal">
                    {aiAnalysis}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-gray-500 font-mono">
                  Select a log from the list to trigger Gemini AI investigation.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
