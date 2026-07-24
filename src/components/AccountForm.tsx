import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface AccountFormProps {
  onAdd: (email: string, days: number, hours: number, minutes: number) => void;
}

export default function AccountForm({ onAdd }: AccountFormProps) {
  const [email, setEmail] = useState('');
  const [days, setDays] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  const parseVal = (v: string) => {
    const n = parseInt(v, 10);
    return isNaN(n) || n < 0 ? 0 : Math.min(n, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onAdd(email, parseVal(days), parseVal(hours), parseVal(minutes));
    setEmail('');
    setDays('');
    setHours('');
    setMinutes('');
  };

  const inputClass =
    'w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-zinc-100 text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
        <label className="block text-sm font-medium text-zinc-400 mb-3">Tempo até a recarga</label>
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
      </div>

      <button
        type="submit"
        className="mt-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
      >
        <Plus size={20} />
        Adicionar Rastreador
      </button>
    </form>
  );
}
