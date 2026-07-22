import React, { useEffect, useState } from 'react';
import { Bell, BellRing, Activity, Info, Clock, List, Search, Filter, ChevronDown, ChevronUp, MoreVertical, Upload, Download, Trash2 } from 'lucide-react';
import AccountForm from './components/AccountForm';
import AccountCard from './components/AccountCard';
import { subscribeUserToPush, isPushSubscribed } from './lib/push';
import type { Account } from './types';

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'pending'>('all');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    const dataStr = JSON.stringify(accounts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `backup-antigravity-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    setIsMenuOpen(false);
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          setLoading(true);
          const res = await fetch('/api/accounts/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accounts: json }),
          });
          if (res.ok) {
            await fetchAccounts();
          } else {
            alert('Erro ao restaurar backup.');
          }
        }
      } catch (err) {
        alert('Arquivo de backup inválido.');
      } finally {
        setLoading(false);
        setIsMenuOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (window.confirm('Tem certeza que deseja limpar tudo? Esta ação não pode ser desfeita.')) {
      setLoading(true);
      const res = await fetch('/api/accounts', { method: 'DELETE' });
      if (res.ok) {
        setAccounts([]);
      }
      setLoading(false);
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (e) {
      console.error('Failed to load accounts', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();

    const checkPushStatus = async () => {
      if ('Notification' in window && Notification.permission === 'granted') {
        const isSubbed = await isPushSubscribed();
        if (isSubbed) setPushEnabled(true);
      }
    };
    
    checkPushStatus();
  }, []);

  const handleAddAccount = async (email: string, days: number, hours: number, minutes: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    targetDate.setHours(targetDate.getHours() + hours);
    targetDate.setMinutes(targetDate.getMinutes() + minutes);

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          targetDate: targetDate.toISOString(),
        }),
      });

      if (res.ok) {
        const newAccount = await res.json();
        setAccounts([...accounts, newAccount]);
      }
    } catch (e) {
      console.error('Failed to add account', e);
    }
  };

  const handleUpdateAccount = async (id: string, days: number, hours: number, minutes: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    targetDate.setHours(targetDate.getHours() + hours);
    targetDate.setMinutes(targetDate.getMinutes() + minutes);

    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetDate: targetDate.toISOString(),
        }),
      });

      if (res.ok) {
        const updatedAccount = await res.json();
        setAccounts(accounts.map(a => a.id === id ? updatedAccount : a));
      }
    } catch (e) {
      console.error('Failed to update account', e);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      setAccounts(accounts.filter(a => a.id !== id));
    } catch (e) {
      console.error('Failed to delete account', e);
    }
  };

  const handleEnablePush = async () => {
    setPushError(null);
    try {
      if (window !== window.top) {
        setPushError('Por favor, abra o aplicativo em uma nova guia para ativar as notificações.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribeUserToPush();
        setPushEnabled(true);
      } else {
        setPushError('A permissão para notificações push foi negada.');
      }
    } catch (error) {
      console.error('Push setup failed', error);
      setPushError('Falha ao ativar notificações. Tente novamente.');
    }
  };

  const filteredAccounts = accounts.filter(a => {
    const matchesSearch = a.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const isReady = new Date(a.targetDate).getTime() <= currentTime;
    if (filterStatus === 'ready') return matchesSearch && isReady;
    if (filterStatus === 'pending') return matchesSearch && !isReady;
    
    return matchesSearch;
  });
  const displayedAccounts = [...filteredAccounts].sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 relative">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                  <Activity size={24} />
                </div>
                Rastreador Antigravity
              </h1>
            </div>
            <p className="text-zinc-400 mt-2">Gerencie seus limites de IA e receba alertas push quando recarregar.</p>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex flex-col items-start md:items-end gap-2">
              <button
                onClick={handleEnablePush}
                disabled={pushEnabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pushEnabled 
                    ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-default' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {pushEnabled ? <BellRing size={16} className="text-blue-500" /> : <Bell size={16} />}
                {pushEnabled ? 'Notificações Ativas' : 'Ativar Alertas Push'}
              </button>
              {pushError && (
                <p className="text-red-400 text-sm max-w-xs text-right animate-pulse">{pushError}</p>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100 focus:outline-none"
              >
                <MoreVertical size={24} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden text-sm">
                  <button 
                    onClick={handleBackup}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-left transition-colors"
                  >
                    <Download size={16} /> Backup
                  </button>
                  <label className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-left transition-colors cursor-pointer">
                    <Upload size={16} /> Restaurar
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleRestore}
                    />
                  </label>
                  <div className="h-px bg-zinc-800 w-full" />
                  <button 
                    onClick={handleClearAll}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-red-400 text-left transition-colors"
                  >
                    <Trash2 size={16} /> Limpar Tudo
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-[350px_1fr] gap-8 items-start">
          <aside className="md:sticky md:top-6 z-10">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="w-full flex items-center justify-between p-4 text-zinc-100 hover:bg-zinc-800/50 transition-colors"
              >
                <h2 className="text-lg font-medium">Adicionar Rastreador</h2>
                {isFormOpen ? <ChevronUp size={20} className="text-zinc-400" /> : <ChevronDown size={20} className="text-zinc-400" />}
              </button>
              
              {isFormOpen && (
                <div className="p-4 pt-0">
                  <AccountForm onAdd={(email, days, hours, minutes) => {
                    handleAddAccount(email, days, hours, minutes);
                    // Keeping the form open so the user can see it clears and they can add more
                  }} />
                </div>
              )}
            </div>
          </aside>

          <main>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 mb-6 pb-2 gap-4">
              <div className="flex gap-6">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-transparent text-zinc-100">
                  <List size={18} />
                  <span>Listas</span>
                  <span className="bg-zinc-800 text-zinc-400 text-xs py-0.5 px-2 rounded-full ml-1">
                    {displayedAccounts.length}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="appearance-none bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="all">Status: Todos</option>
                    <option value="ready">Recarregadas (Prontas)</option>
                    <option value="pending">Aguardando</option>
                  </select>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Buscar por e-mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full sm:w-64"
                  />
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="animate-pulse flex flex-col gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 bg-zinc-900/50 rounded-2xl border border-zinc-800/50" />
                ))}
              </div>
            ) : displayedAccounts.length === 0 ? (
              <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-600 mb-4">
                  <List size={24} />
                </div>
                <h3 className="text-zinc-200 font-medium mb-1">
                  Nenhum rastreador encontrado
                </h3>
                <p className="text-zinc-500 text-sm max-w-xs">
                  Adicione um e-mail e o tempo restante para começar a rastrear as recargas de sua IA, ou tente ajustar os filtros.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {displayedAccounts.map(account => (
                  <AccountCard 
                    key={account.id} 
                    account={account} 
                    onDelete={handleDeleteAccount}
                    onUpdate={handleUpdateAccount}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
