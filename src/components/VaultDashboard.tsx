import React, { useState, useEffect } from 'react';
import { Key, Lock, Unlock, Eye, EyeOff, Plus, ShieldAlert, CheckCircle, Database, Server } from 'lucide-react';
import { VaultItem } from '../types';

interface VaultDashboardProps {
  token: string;
  userRole: 'admin' | 'user';
}

export default function VaultDashboard({ token, userRole }: VaultDashboardProps) {
  const [items, setItems] = useState<any[]>([]);
  const [decryptedValues, setDecryptedValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  // New Item states
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'credential' | 'api_key' | 'secure_note'>('secure_note');
  const [newRawText, setNewRawText] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [wafBlock, setWafBlock] = useState<{ blocked: boolean; patterns: string[] } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // For inspection of selected record's cryptographic parameters
  const [selectedInspectItem, setSelectedInspectItem] = useState<any | null>(null);

  const fetchVaultItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vault', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaultItems();
  }, [token]);

  const handleDecrypt = async (itemId: string) => {
    // If already decrypted, toggle it off
    if (decryptedValues[itemId]) {
      const copy = { ...decryptedValues };
      delete copy[itemId];
      setDecryptedValues(copy);
      return;
    }

    try {
      const response = await fetch('/api/vault/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itemId })
      });
      const data = await response.json();
      if (data.success) {
        setDecryptedValues(prev => ({
          ...prev,
          [itemId]: data.decrypted
        }));
      } else {
        alert(data.error || 'Decryption failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddVaultItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setWafBlock(null);
    setSuccessMsg(null);

    if (!newTitle.trim() || !newRawText.trim()) {
      setErrorMsg('Title and Secret raw content cannot be empty.');
      return;
    }

    setSubmitLoading(true);

    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          rawText: newRawText
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg(`"${newTitle}" successfully AES-256-GCM encrypted and stored!`);
        setNewTitle('');
        setNewRawText('');
        fetchVaultItems();
      } else if (response.status === 403 || data.blocked) {
        setWafBlock({
          blocked: true,
          patterns: data.patterns || ['SQLi signature found in request parameter body']
        });
        setErrorMsg('WAF INTERCEPT: Request aborted due to query injection signature.');
      } else {
        setErrorMsg(data.error || 'Failed to persist item.');
      }
    } catch (err) {
      setErrorMsg('Network error.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="vault-dashboard-root">
      {/* Encryption & Entry Panel */}
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-card rounded-2xl p-6 border-sky-500/10 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Create Cryptographic Record</h2>
          </div>
          
          <p className="text-xs text-gray-400 mb-4 font-sans leading-relaxed">
            Data typed below undergoes real-time server-side encryption using high-security 
            <span className="text-sky-300 font-mono"> AES-256-GCM</span> before persisting. The plaintext is discarded instantly.
          </p>

          <form onSubmit={handleAddVaultItem} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">Record Identifier / Title</label>
              <input
                id="vault-title-input"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg glass-input font-mono"
                placeholder="e.g. AWS Root Access Key"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">Secret Classification</label>
              <select
                id="vault-category-select"
                value={newCategory}
                onChange={(e: any) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg glass-input font-mono cursor-pointer"
              >
                <option value="secure_note">Secure Memo / Note</option>
                <option value="api_key">API Key Token</option>
                <option value="credential">Systems Credentials</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">Plaintext Secret Content</label>
              <textarea
                id="vault-rawtext-input"
                value={newRawText}
                onChange={(e) => setNewRawText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-lg glass-input font-mono resize-none"
                placeholder="Type passwords, SSH keys, or access parameters to encrypt..."
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex gap-2.5 items-start">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">ALERT:</span> {errorMsg}
                </div>
              </div>
            )}

            {wafBlock && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-xl text-xs space-y-1.5 font-mono">
                <div className="flex gap-1.5 items-center font-bold text-amber-200">
                  <span>⚠️ WAF BLOCK IN OPERATION</span>
                </div>
                <p className="text-[11px] text-amber-300/80">
                  SQL injection attempt intercepted. Our web application firewall scanned the raw payload and flagged database escape characters.
                </p>
                <div className="border-t border-amber-500/20 pt-1.5">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Identified Vectors:</span>
                  {wafBlock.patterns.map((p, i) => (
                    <div key={i} className="text-[10px] text-amber-400/90 mt-0.5 font-mono">
                      ▶ {p}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex gap-2.5 items-start font-mono">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <div>{successMsg}</div>
              </div>
            )}

            <button
              id="vault-submit-button"
              type="submit"
              disabled={submitLoading}
              className="w-full py-2.5 px-4 rounded-xl cyber-gradient text-white text-xs font-mono font-semibold tracking-wider hover:opacity-95 active:scale-[0.98] transition-all flex justify-center items-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
            >
              {submitLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Run Server-Side AES Encryption'
              )}
            </button>
          </form>
        </div>

        {/* Live Lab Diagnostics */}
        <div className="glass-card rounded-2xl p-5 border-white/5 text-[11px] font-mono text-gray-400 space-y-3">
          <div className="text-gray-300 uppercase font-bold border-b border-white/5 pb-2 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-sky-400" />
            Cryptography Blueprint
          </div>
          <div className="space-y-2 leading-relaxed">
            <p>
              🔐 <span className="text-sky-300 font-bold">AES-256-GCM</span> provides both <span className="text-white">confidentiality</span> (encryption) and <span className="text-white">integrity</span> (authenticity verification).
            </p>
            <p>
              ⚡ If an attacker attempts to modify ciphertext, the tag check fails during decryption and Node.js throws an error immediately, protecting against tampering.
            </p>
          </div>
        </div>
      </div>

      {/* Vault List Panel */}
      <div className="lg:col-span-8 space-y-6">
        <div className="glass-card rounded-2xl p-6 border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Active Cryptographic Vault</h2>
            </div>
            
            <span className="text-[10px] font-mono text-gray-500 bg-white/[0.03] border border-white/5 px-2.5 py-1 rounded-lg">
              Authorized Items: {items.length}
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-400 rounded-full animate-spin"></div>
              <p className="text-xs font-mono text-gray-400">Querying cryptographic indices...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-white/5 rounded-xl">
              <Lock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-xs font-mono text-gray-500">Vault is empty. Create a secure cryptographic record.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const isDecrypted = !!decryptedValues[item.id];
                const cleanValue = decryptedValues[item.id] || '';

                return (
                  <div
                    key={item.id}
                    id={`vault-item-${item.id}`}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-sky-500/20 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          item.category === 'api_key' ? 'bg-indigo-500/10 text-indigo-300' :
                          item.category === 'credential' ? 'bg-emerald-500/10 text-emerald-300' :
                          'bg-sky-500/10 text-sky-300'
                        }`}>
                          {item.category.replace('_', ' ')}
                        </span>
                        <h3 className="text-xs font-mono font-bold text-gray-200">{item.title}</h3>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          id={`btn-decrypt-${item.id}`}
                          onClick={() => handleDecrypt(item.id)}
                          className="px-2.5 py-1 rounded bg-white/5 hover:bg-sky-500/15 border border-white/5 hover:border-sky-500/20 text-[11px] font-mono text-gray-300 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {isDecrypted ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {isDecrypted ? 'Lock Secret' : 'Decrypt Secret'}
                        </button>

                        <button
                          id={`btn-inspect-${item.id}`}
                          onClick={() => setSelectedInspectItem(item)}
                          className="px-2 py-1 rounded bg-white/5 hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-500/20 text-[11px] font-mono text-gray-300 hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          Crypto Logs
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* Plaintext display or Ciphertext placeholder */}
                      {isDecrypted ? (
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/25 rounded-lg text-xs font-mono text-emerald-300 break-all select-all flex items-center justify-between">
                          <span>{cleanValue}</span>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-950/40 rounded-lg text-xs font-mono text-gray-500 flex flex-col gap-1 select-none">
                          <span className="text-[10px] uppercase text-gray-600 font-bold tracking-wider">AES Ciphertext (Encrypted Base64)</span>
                          <span className="break-all text-[11px] text-gray-400">{item.encryptedData}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-gray-500 gap-2">
                        <div>Owner: <span className="text-gray-400 font-semibold">{item.ownerUsername}</span></div>
                        <div>Encrypted at: <span className="text-gray-400">{new Date(item.createdAt).toLocaleString()}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Cryptographic Diagnostic Metadata */}
        {selectedInspectItem && (
          <div className="glass-card rounded-2xl p-6 border-emerald-500/20 shadow-xl" id="crypto-inspector">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Advanced Cryptographic Audit Inspector</h3>
              </div>
              <button
                id="close-inspector-btn"
                onClick={() => setSelectedInspectItem(null)}
                className="text-xs font-mono text-gray-500 hover:text-rose-400 cursor-pointer"
              >
                [Close]
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <span className="text-sky-300 font-bold block mb-1">Vault Record Identifier:</span>
                <span className="text-gray-400 bg-white/[0.02] px-2 py-1 rounded block select-all">{selectedInspectItem.id}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-indigo-300 font-bold block mb-1">IV (Initialization Vector) [12-Bytes Hex]:</span>
                  <p className="text-[11px] text-gray-400 bg-white/[0.02] p-2 rounded break-all select-all">{selectedInspectItem.iv}</p>
                </div>
                <div>
                  <span className="text-amber-300 font-bold block mb-1">GCM Auth Tag [16-Bytes Hex]:</span>
                  <p className="text-[11px] text-gray-400 bg-white/[0.02] p-2 rounded break-all select-all">{selectedInspectItem.tag || 'Not configured in old versions'}</p>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-lg text-[11px] text-gray-400 leading-relaxed">
                <span className="text-white font-semibold block mb-1">How Decryption executes:</span>
                The server retrieves the stored <span className="text-indigo-300">IV</span> and <span className="text-amber-300">Auth Tag</span>. Using the server-side <span className="text-emerald-300">Master Secret Key</span>, Node.js initializes a <code className="text-white">crypto.createDecipheriv("aes-256-gcm")</code> process. It validates the Auth Tag. If authentication is successful, the plaintext is emitted.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
