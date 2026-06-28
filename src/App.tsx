import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import VaultDashboard from './components/VaultDashboard';
import SqlPlayground from './components/SqlPlayground';
import AuditLogs from './components/AuditLogs';

interface AuthState {
  token: string;
  user: {
    id: string;
    username: string;
    role: 'admin' | 'user';
    email: string;
    secretCode: string;
  };
}

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const saved = localStorage.getItem('securevault_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<'vault' | 'playground' | 'logs'>('vault');

  useEffect(() => {
    if (auth) {
      localStorage.setItem('securevault_session', JSON.stringify(auth));
    } else {
      localStorage.removeItem('securevault_session');
    }
  }, [auth]);

  const handleLoginSuccess = (token: string, user: AuthState['user']) => {
    setAuth({ token, user });
    // Reset to Vault view on fresh logins
    setActiveTab('vault');
  };

  const handleLogout = () => {
    setAuth(null);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans antialiased pb-12 selection:bg-sky-500/30 selection:text-white" id="securevault-root">
      {/* Decorative Grid Overlay Background */}
      <div className="fixed inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-20"></div>

      <div className="max-w-7xl mx-auto px-4 pt-6 relative z-10">
        {!auth ? (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        ) : (
          <div className="space-y-6">
            <Header 
              user={auth.user} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              onLogout={handleLogout} 
            />

            <main className="animate-fade-in">
              {activeTab === 'vault' && (
                <VaultDashboard token={auth.token} userRole={auth.user.role} />
              )}
              {activeTab === 'playground' && (
                <SqlPlayground />
              )}
              {activeTab === 'logs' && auth.user.role === 'admin' && (
                <AuditLogs token={auth.token} />
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
