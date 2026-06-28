import React from 'react';
import { Shield, LogOut, Terminal, Lock, Database } from 'lucide-react';

interface HeaderProps {
  user: {
    username: string;
    role: 'admin' | 'user';
    email: string;
    secretCode: string;
  };
  activeTab: 'vault' | 'playground' | 'logs';
  setActiveTab: (tab: 'vault' | 'playground' | 'logs') => void;
  onLogout: () => void;
}

export default function Header({ user, activeTab, setActiveTab, onLogout }: HeaderProps) {
  return (
    <header className="glass-card border-b border-white/10 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4" id="securevault-header">
      {/* Branding */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shadow-md">
          <Shield className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h1 className="text-lg font-display font-bold tracking-wide text-white">SECUREVAULT</h1>
          <p className="text-[10px] font-mono text-sky-400 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Cryptographic Security Lab
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 font-mono text-xs">
        <button
          id="tab-vault"
          onClick={() => setActiveTab('vault')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'vault'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold'
              : 'text-gray-400 hover:text-white border border-transparent'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Secure Vault
        </button>

        <button
          id="tab-playground"
          onClick={() => setActiveTab('playground')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'playground'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold'
              : 'text-gray-400 hover:text-white border border-transparent'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          SQLi Playground
        </button>

        {user.role === 'admin' && (
          <button
            id="tab-logs"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            WAF Audit Logs
          </button>
        )}
      </nav>

      {/* User Status / Action */}
      <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 py-1.5 px-3 rounded-xl">
        <div className="text-right font-mono">
          <div className="text-xs text-white font-semibold flex items-center justify-end gap-1.5">
            {user.username}
            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
              user.role === 'admin' 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {user.role}
            </span>
          </div>
          <div className="text-[9px] text-gray-500">Code: {user.secretCode}</div>
        </div>

        <button
          id="header-logout-btn"
          onClick={onLogout}
          className="p-2 bg-white/5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/25 text-gray-400 hover:text-rose-400 rounded-lg cursor-pointer transition-all"
          title="Logout Session"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
