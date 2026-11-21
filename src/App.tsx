import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellRing,
  Activity,
  Clock,
  List,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Upload,
  Download,
  Trash2,
  Database,
  ExternalLink,
} from 'lucide-react';
import AccountForm from './components/AccountForm';
import AccountCard from './components/AccountCard';
import { subscribeUserToPush, isPushSubscribed } from './lib/push';
import { accountService } from './lib/accountService';
import { isSupabaseClientConfigured } from './lib/supabaseClient';
import type { Account } from './types';

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'pending'>('all');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    const dataStr = JSON.stringify(accounts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
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
          await accountService.restore(json);
          await fetchAccounts();
        }
      } catch (err) {
        alert('Arquivo de backup inválido ou erro ao restaurar.');
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
      try {
        await accountService.clearAll();
        setAccounts([]);
      } catch (err) {
        alert('Erro ao limpar contas.');
      } finally {
        setLoading(false);
        setIsMenuOpen(false);
      }
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
      setLoading(true);
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (e) {
      console.error('Falha ao carregar contas do Supabase / API', e);
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

  const handleAddAccount = async (
    email: string,
    days: number,
    hours: number,
    minutes: number,
    link?: string,
    customTargetDate?: string
  ) => {
    let targetIso: string;
    if (customTargetDate) {
      targetIso = customTargetDate;
    } else {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      targetDate.setHours(targetDate.getHours() + hours);
      targetDate.setMinutes(targetDate.getMinutes() + minutes);
      targetIso = targetDate.toISOString();
    }

    try {
      const newAccount = await accountService.create(email, targetIso, link);
      setAccounts((prev) => [...prev, newAccount]);
    } catch (e) {
      console.error('Falha ao adicionar rastreador', e);
      alert('Erro ao salvar no Supabase. Verifique a conexão e as credenciais.');
    }
  };

  const handleUpdateAccount = async (
    id: string,
    days: number,
    hours: number,
    minutes: number,
    link?: string,
    customTargetDate?: string
  ) => {
    let targetIso: string;
    if (customTargetDate) {
      targetIso = customTargetDate;
    } else {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      targetDate.setHours(targetDate.getHours() + hours);
      targetDate.setMinutes(targetDate.getMinutes() + minutes);
      targetIso = targetDate.toISOString();
    }

    try {
      const updatedAccount = await accountService.update(id, {
        targetDate: targetIso,
        link,
      });
      setAccounts((prev) => prev.map((a) => (a.id === id ? updatedAccount : a)));
    } catch (e) {
      console.error('Falha ao atualizar rastreador', e);
      alert('Erro ao atualizar no Supabase.');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await accountService.delete(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error('Falha ao deletar conta', e);
      alert('Erro ao remover rastreador do Supabase.');
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

  const filteredAccounts = accounts.filter((a) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      a.email.toLowerCase().includes(query) ||
      (a.link && a.link.toLowerCase().includes(query));

    if (filterStatus === 'all') return matchesSearch;

    const isReady = new Date(a.targetDate).getTime() <= currentTime;
    if (filterStatus === 'ready') return matchesSearch && isReady;
    if (filterStatus === 'pending') return matchesSearch && !isReady;

    return matchesSearch;
  });

  const displayedAccounts = [...filteredAccounts].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans p-4 sm:p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-12 gap-6 relative">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                  <Activity size={24} />
                </div>
                Rastreador Antigravity
              </h1>
            </div>
            <p className="text-zinc-400 mt-2 text-sm sm:text-base">
              Rastreie horários e recargas de IA salvos diretamente no seu Supabase.
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                <Database size={12} className={isSupabaseClientConfigured ? 'text-emerald-400' : 'text-blue-400'} />
                Supabase: <strong className="text-zinc-200">piyzjodvmejqxvpwzohp</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex flex-col items-start md:items-end gap-2">
              <button
                onClick={handleEnablePush}
                disabled={pushEnabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pushEnabled
                    ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
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
                className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100 focus:outline-none cursor-pointer"
              >
                <MoreVertical size={24} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden text-sm">
                  <button
                    onClick={handleBackup}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-left transition-colors cursor-pointer"
                  >
                    <Download size={16} /> Fazer Backup JSON
                  </button>
                  <label className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-left transition-colors cursor-pointer">
                    <Upload size={16} /> Restaurar Backup
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
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-red-400 text-left transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} /> Limpar Tudo
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-[360px_1fr] gap-8 items-start">
          <aside className="md:sticky md:top-6 z-10">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="w-full flex items-center justify-between p-4 text-zinc-100 hover:bg-zinc-800/50 transition-colors cursor-pointer"
              >
                <h2 className="text-lg font-medium">Novo Rastreador</h2>
                {isFormOpen ? (
                  <ChevronUp size={20} className="text-zinc-400" />
                ) : (
                  <ChevronDown size={20} className="text-zinc-400" />
                )}
              </button>

              {isFormOpen && (
                <div className="p-4 pt-0">
                  <AccountForm
                    onAdd={(email, days, hours, minutes, link, customTargetDate) => {
                      handleAddAccount(email, days, hours, minutes, link, customTargetDate);
                    }}
                  />
                </div>
              )}
            </div>
          </aside>

          <main>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 mb-6 pb-2 gap-4">
              <div className="flex gap-6">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-transparent text-zinc-100">
                  <List size={18} />
                  <span>Rastreadores</span>
                  <span className="bg-zinc-800 text-zinc-400 text-xs py-0.5 px-2 rounded-full ml-1">
                    {displayedAccounts.length}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="appearance-none bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer w-full sm:w-auto"
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
                    className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full sm:w-60"
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
                  Adicione um e-mail e o tempo de recarga para começar a salvar e monitorar suas IAs no Supabase.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {displayedAccounts.map((account) => (
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
