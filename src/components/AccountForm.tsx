import React, { useState, useMemo } from 'react';
import { Plus, Clock } from 'lucide-react';

interface AccountFormProps {
  onAdd: (email: string, days: number, hours: number, minutes: number, link?: string, customTargetDate?: string) => void;
}

export default function AccountForm({ onAdd }: AccountFormProps) {
  const [email, setEmail] = useState('');
  const [days, setDays] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [mode, setMode] = useState<'duration' | 'exact'>('duration');
  const [exactDateTime, setExactDateTime] = useState('');

  const parseVal = (v: string) => {
    const n = parseInt(v, 10);
    return isNaN(n) || n < 0 ? 0 : Math.min(n, 500);
  };

  // Cálculo da data e horário alvo em tempo real para feedback visual
  const calculatedDate = useMemo(() => {
    if (mode === 'exact') {
      return exactDateTime ? new Date(exactDateTime) : null;
    }
    const d = parseVal(days);
    const h = parseVal(hours);
    const m = parseVal(minutes);
    if (d === 0 && h === 0 && m === 0) return null;

    const target = new Date();
    target.setDate(target.getDate() + d);
    target.setHours(target.getHours() + h);
    target.setMinutes(target.getMinutes() + m);
    return target;
  }, [mode, exactDateTime, days, hours, minutes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (mode === 'exact' && exactDateTime) {
      onAdd(email, 0, 0, 0, undefined, new Date(exactDateTime).toISOString());
    } else {
      onAdd(email, parseVal(days), parseVal(hours), parseVal(minutes));
    }

    setEmail('');
    setDays('');
    setHours('');
    setMinutes('');
    setExactDateTime('');
  };

  const inputClass =
    'w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-zinc-100 text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-2">E-mail da Conta</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ex. usuario@exemplo.com"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-zinc-400">Data e Horário de Recarga</label>
          <div className="flex gap-1 text-xs bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setMode('duration')}
              className={`px-2 py-1 rounded-md transition-colors ${
                mode === 'duration' ? 'bg-blue-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Duração
            </button>
            <button
              type="button"
              onClick={() => setMode('exact')}
              className={`px-2 py-1 rounded-md transition-colors ${
                mode === 'exact' ? 'bg-blue-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Data Exata
            </button>
          </div>
        </div>

        {mode === 'duration' ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1">
              <input
                type="number"
                min="0"
                max="500"
                placeholder="0"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className={inputClass}
              />
              <span className="text-xs text-zinc-500 font-medium">DIAS</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <input
                type="number"
                min="0"
                max="500"
                placeholder="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className={inputClass}
              />
              <span className="text-xs text-zinc-500 font-medium">HORAS</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <input
                type="number"
                min="0"
                max="500"
                placeholder="0"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className={inputClass}
              />
              <span className="text-xs text-zinc-500 font-medium">MINUTOS</span>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="datetime-local"
              required={mode === 'exact'}
              value={exactDateTime}
              onChange={(e) => setExactDateTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
            />
          </div>
        )}

        {calculatedDate && (
          <div className="mt-2.5 px-3 py-2 bg-blue-950/30 border border-blue-900/50 rounded-lg flex items-center gap-2 text-xs text-blue-300">
            <Clock size={14} className="shrink-0 text-blue-400" />
            <span>
              Previsão:{' '}
              <strong className="text-blue-200 font-mono">
                {calculatedDate.toLocaleDateString('pt-BR')} às {calculatedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </span>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 cursor-pointer shadow-lg shadow-blue-600/20"
      >
        <Plus size={20} />
        Adicionar ao Supabase
      </button>
    </form>
  );
}
